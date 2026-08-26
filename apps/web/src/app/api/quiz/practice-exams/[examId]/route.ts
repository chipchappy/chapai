import { getQuestionBank } from "@/lib/content-bank";
import { allocateBlueprintDeficits, getBlueprintCountMismatches } from "@/lib/blueprint-allocation";
import {
  getCaseStudyReleaseIssues,
  getCaseStudyEligibleQuestions,
  qualityFirstCaseGroups,
  shuffleQuestionBlocks,
} from "@/lib/clinical-case-study";
import { questions } from "@chapai/db/schema";
import { getDB, hasDatabase, resolveEnv } from "@/lib/db";
import { mapQuestionRowToQuizQuestion } from "@/lib/quiz-engine";
import { ensureHostedUser } from "@/lib/billing-store";
import { isLaunchPlanCode } from "@/lib/launch-offers";
import {
  canUnlockPracticeExam,
  countCompletedFreeExamAttempts,
  FREE_PRACTICE_EXAM_ID,
  FREE_PRACTICE_EXAM_LIMIT,
  recordPracticeExamUnlock,
} from "@/lib/practice-exam-access";
import { FREE_LIMIT_CODES } from "@/lib/free-plan-limits";
import { getQuestionQualityProfile, qualityFirstDiverseOrder } from "@/lib/question-quality";
import { MAX_ITEMS as CAT_MAX_ITEMS } from "@/lib/adaptive-cat";
import {
  CCRN_CATEGORIES,
  NCLEX_READINESS_BLUEPRINT,
  type Exam,
} from "@/lib/types";
import { getPracticeExamDefinitions, getRichDeck, getStandardPreviewDeck, mapLiveQuestionBank } from "@/lib/practice-data";
import type { PracticeExamDefinition, PracticeQuestion } from "@/lib/practice-types";
import { findOrCreateReadinessAttempt } from "@/lib/readiness-attempt-store";
import {
  concealReadinessAnswer,
  READINESS_ASSEMBLY_VERSION,
} from "@/lib/readiness-delivery";
import { getServerAccessContext } from "@/lib/server-access";
import { getQuestionIntegrityIssues } from "@/lib/question-renderability";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";

type RouteContext = {
  params: Promise<{ examId: string }>;
};

const examIdSchema = z.enum([
  "nclex-sim-1",
  "nclex-sim-2",
  "nclex-sim-3",
  "nclex-sim-4",
  "nclex-sim-5",
  "ccrn-sim-1",
  "ccrn-sim-2",
]);

const NCLEX_CASE_STUDY_SET_COUNT = 3;
const MAX_NCLEX_READINESS_QUALITY_TIER = 2;
const NCLEX_READINESS_CANDIDATE_LIMIT = 1_000;
const launchIdSchema = z.string().uuid();

function normalizeStem(stem: string) {
  return stem
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function questionSignature(question: Pick<PracticeQuestion, "stem">) {
  return normalizeStem(question.stem);
}

function stableFingerprint(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function buildAssemblyMetadata(
  definition: PracticeExamDefinition,
  selectedQuestions: PracticeQuestion[],
  strictExposureControl: boolean,
  // Part of the contract rather than spread on afterwards, so the client can
  // rely on the field existing on every form and read false rather than
  // undefined for the fixed ones.
  adaptive = false,
) {
  const caseGroups = new Map<string, number>();
  const clientNeedCounts: Record<string, number> = {};
  const qualityTierCounts: Record<string, number> = {};
  for (const question of selectedQuestions) {
    if (question.caseStudyId) {
      caseGroups.set(question.caseStudyId, (caseGroups.get(question.caseStudyId) ?? 0) + 1);
    }
    const clientNeed = question.nclexClientNeed ?? question.category;
    clientNeedCounts[clientNeed] = (clientNeedCounts[clientNeed] ?? 0) + 1;
    const tier = String(getQuestionQualityProfile(question).tier);
    qualityTierCounts[tier] = (qualityTierCounts[tier] ?? 0) + 1;
  }
  const contentFingerprint = stableFingerprint([
    READINESS_ASSEMBLY_VERSION,
    definition.id,
    ...selectedQuestions.map((question) => (
      `${question.id}:${question.qualityMetadata?.contentVersion ?? 0}`
    )),
  ].join("|"));

  return {
    assemblyVersion: READINESS_ASSEMBLY_VERSION,
    contentFingerprint,
    strictExposureControl,
    questionCount: selectedQuestions.length,
    caseStudyCount: caseGroups.size,
    caseStudyItemCount: [...caseGroups.values()].reduce((sum, count) => sum + count, 0),
    caseStudyIds: [...caseGroups.keys()],
    clientNeedCounts,
    qualityTierCounts,
    adaptive,
    evidenceNotice: "Source-verified content remains pending independent licensed clinical review and psychometric calibration.",
  };
}

/**
 * Per-form ceiling on how many questions of each quality tier may be taken.
 *
 * The five readiness forms are non-overlapping and were built in order, each
 * reserving what it picked. Because candidates are ordered best-first, form 1
 * drained the premium supply and form 5 got the remainder: measured live, form 1
 * held 62 tier-0 items and form 5 held none.
 *
 * That makes the forms non-comparable, which defeats their purpose — a student's
 * readiness score should not depend on which form they happened to draw. The
 * quota spreads each tier across the forms instead, trading form 1's peak for
 * five forms that measure the same thing. Exhausting a quota is not a failure:
 * selection simply moves to the next tier, and the existing remainder and
 * overflow passes still guarantee a full-length form.
 */
type TierQuota = Map<number, number>;

function quotaAllows(quota: TierQuota | undefined, question: PracticeQuestion) {
  if (!quota) return true;
  const tier = getQuestionQualityProfile(question).tier;
  const left = quota.get(tier);
  return left === undefined || left > 0;
}

function quotaConsume(quota: TierQuota | undefined, question: PracticeQuestion) {
  if (!quota) return;
  const tier = getQuestionQualityProfile(question).tier;
  const left = quota.get(tier);
  if (left !== undefined) quota.set(tier, left - 1);
}

function takeUniqueQuestions(
  candidates: PracticeQuestion[],
  limit: number,
  reservedIds: Set<string>,
  reservedSignatures: Set<string>,
  usedIds: Set<string>,
  usedSignatures: Set<string>,
  tierQuota?: TierQuota,
) {
  const picked: PracticeQuestion[] = [];

  for (const question of candidates) {
    const signature = questionSignature(question);
    if (
      reservedIds.has(question.id)
      || reservedSignatures.has(signature)
      || usedIds.has(question.id)
      || usedSignatures.has(signature)
      || !quotaAllows(tierQuota, question)
    ) {
      continue;
    }
    usedIds.add(question.id);
    usedSignatures.add(signature);
    quotaConsume(tierQuota, question);
    picked.push(question);
    if (picked.length >= limit) {
      break;
    }
  }

  return picked;
}

function getBlueprint(exam: Exam) {
  return exam === "ccrn"
    ? Object.fromEntries(Object.entries(CCRN_CATEGORIES).map(([key, value]) => [key, value.pct]))
    : { ...NCLEX_READINESS_BLUEPRINT };
}

function selectByBlueprint(
  questions: PracticeQuestion[],
  blueprint: Record<string, number>,
  count: number,
  seed: string,
  reservedIds: Set<string> = new Set(),
  reservedSignatures: Set<string> = new Set(),
  initialQuestions: PracticeQuestion[] = [],
  allowReservedReuse = false,
  tierQuota?: TierQuota,
) {
  const buckets = new Map<string, PracticeQuestion[]>();

  for (const question of questions) {
    const category = question.exam === "nclex" ? question.nclexClientNeed ?? question.category : question.category;
    const bucket = buckets.get(category) ?? [];
    bucket.push(question);
    buckets.set(category, bucket);
  }

  const selected = [...initialQuestions];
  const usedInManifest = new Set(initialQuestions.map((question) => question.id));
  const usedSignatures = new Set(initialQuestions.map(questionSignature));
  const initialCounts = Object.fromEntries(Object.keys(blueprint).map((key) => [key, 0]));
  for (const question of initialQuestions) {
    const category = question.exam === "nclex" ? question.nclexClientNeed ?? question.category : question.category;
    if (category in initialCounts) initialCounts[category] += 1;
  }
  const categoryTargets = allocateBlueprintDeficits(blueprint, count, initialCounts);

  for (const category of Object.keys(blueprint)) {
    const target = categoryTargets[category] ?? 0;
    if (target === 0) continue;
    const bucket = qualityFirstDiverseOrder(buckets.get(category) ?? [], `${seed}:${category}`);
    selected.push(...takeUniqueQuestions(
      bucket,
      target,
      reservedIds,
      reservedSignatures,
      usedInManifest,
      usedSignatures,
      tierQuota,
    ));
  }

  if (selected.length < count) {
    const remainder = qualityFirstDiverseOrder(questions, `${seed}:remainder`);
    selected.push(...takeUniqueQuestions(
      remainder,
      count - selected.length,
      reservedIds,
      reservedSignatures,
      usedInManifest,
      usedSignatures,
    ));
  }

  if (selected.length < count && allowReservedReuse) {
    const overflow = qualityFirstDiverseOrder(questions, `${seed}:overflow`);
    selected.push(...takeUniqueQuestions(
      overflow,
      count - selected.length,
      new Set<string>(),
      new Set<string>(),
      usedInManifest,
      usedSignatures,
    ));
  }

  if (selected.length < count && !allowReservedReuse) {
    throw new Error(
      `READINESS_FORM_POOL_INSUFFICIENT: ${seed} assembled ${selected.length} of ${count} unique questions`,
    );
  }

  const manifest = selected.slice(0, count);
  const actualCounts: Record<string, number> = {};
  for (const question of manifest) {
    const category = question.exam === "nclex"
      ? question.nclexClientNeed ?? question.category
      : question.category;
    actualCounts[category] = (actualCounts[category] ?? 0) + 1;
  }
  const mismatches = getBlueprintCountMismatches(blueprint, count, actualCounts);
  if (mismatches.length > 0) {
    throw new Error(
      `READINESS_FORM_BLUEPRINT_MISMATCH: ${seed} ${mismatches
        .map(({ key, target, actual }) => `${key}=${actual}/${target}`)
        .join(",")}`,
    );
  }

  return shuffleQuestionBlocks(manifest, `${seed}:final`);
}

async function loadLivePracticeQuestions(exam: Exam) {
  const env = resolveEnv();
  if (!hasDatabase(env)) {
    const liveQuestions = getQuestionBank(exam);
    return mapLiveQuestionBank(
      liveQuestions.filter((question) => {
        const issues = getQuestionIntegrityIssues(question);
        return issues.length === 0 || (question.type !== "matrix" && question.type !== "ordering" && question.type !== "case_study" && question.type !== "bow_tie");
      }),
      "practice-exam",
    );
  }

  const db = getDB(env);
  const candidateLimit = exam === "nclex" ? NCLEX_READINESS_CANDIDATE_LIMIT : 500;
  const rows = await db
    .select({
      id: questions.id,
      exam: questions.exam,
      type: questions.type,
      category: questions.category,
      subcategory: questions.subcategory,
      difficulty: questions.difficulty,
      stem: questions.stem,
      options: questions.options,
      answer: questions.answer,
      rationale: questions.rationale,
      structuredRationale: questions.structuredRationale,
      distractorRationales: questions.distractorRationales,
      tags: questions.tags,
      blueprintPct: questions.blueprintPct,
      conceptNotes: questions.conceptNotes,
      provenance: questions.provenance,
      reviewStatus: questions.reviewStatus,
      revision: questions.revision,
      publishState: questions.publishState,
      scenarioTitle: questions.scenarioTitle,
      caseStudyId: questions.caseStudyId,
      cjmmStep: questions.cjmmStep,
      scenario: questions.scenario,
      additionalInfo: questions.additionalInfo,
      exhibits: questions.exhibits,
      chartReview: questions.chartReview,
      matrixColumns: questions.matrixColumns,
      matrixRows: questions.matrixRows,
      bowTie: questions.bowTie,
      visualRationale: questions.visualRationale,
      referencesJson: questions.referencesJson,
      correctOrder: questions.correctOrder,
    })
    .from(questions)
    .where(and(
      eq(questions.exam, exam),
      eq(questions.publishState, "published"),
      sql`(${questions.type} <> 'case_study' OR ${questions.caseStudyId} IS NOT NULL)`,
    ))
    .orderBy(
      sql`CASE ${questions.reviewStatus}
        WHEN 'final-curated-live' THEN 0
        WHEN 'curated-live' THEN 1
        WHEN 'approved' THEN 2
        ELSE 3
      END`,
      sql`CASE
        WHEN length(${questions.rationale}) >= 700 THEN 0
        WHEN length(${questions.rationale}) >= 350 THEN 1
        WHEN length(${questions.rationale}) >= 180 THEN 2
        ELSE 3
      END`,
      sql`${questions.structuredRationale} IS NULL`,
      // Distractor and visual rationales only exist for option-based items.
      // matrix / ordering / bow_tie have no distractors by construction, so
      // ranking them on a NULL here pushed every NGN format to the bottom of
      // the candidate pool: measured 10.1% NGN in the top 1,000 against 16.5%
      // in the bank. Scoring those types as "not applicable" rather than
      // "missing" restores NGN representation (measured 16.9%) while leaving
      // mcq/sata ranking identical.
      sql`CASE WHEN ${questions.type} IN ('mcq','sata') AND ${questions.distractorRationales} IS NULL THEN 1 ELSE 0 END`,
      sql`${questions.referencesJson} IS NULL`,
      sql`CASE WHEN ${questions.type} IN ('mcq','sata') AND ${questions.visualRationale} IS NULL THEN 1 ELSE 0 END`,
      questions.id,
    )
    .limit(candidateLimit);

  return mapLiveQuestionBank(rows.map((row) => mapQuestionRowToQuizQuestion(row)), "practice-exam").filter((question) => {
    const issues = getQuestionIntegrityIssues(question);
    return issues.length === 0 || (question.kind !== "matrix" && question.kind !== "ordering" && question.kind !== "case-study" && question.kind !== "bow-tie");
  });
}

async function buildManifestIndex(exam: Exam) {
  const env = resolveEnv();
  const strictExposureControl = hasDatabase(env);
  const livePracticeQuestions = await loadLivePracticeQuestions(exam);
  const baseQuestions = livePracticeQuestions.length > 0
    ? livePracticeQuestions
    : getStandardPreviewDeck().filter((q) => q.exam === exam).map((q) => ({ ...q, mode: "practice-exam" as const }));
  const verifiedCaseFallback = exam === "nclex"
    ? getRichDeck("case-study").filter((question) => question.exam === "nclex")
    : [];
  const seenIds = new Set<string>();
  const practiceQuestions = getCaseStudyEligibleQuestions(
    [...baseQuestions, ...verifiedCaseFallback].filter((question) => {
      if (seenIds.has(question.id)) return false;
      seenIds.add(question.id);
      return true;
    }),
  );
  const standaloneQuestions = practiceQuestions.filter((question) => (
    !question.caseStudyId
    && (
      exam !== "nclex"
      || getQuestionQualityProfile(question).tier <= MAX_NCLEX_READINESS_QUALITY_TIER
    )
  ));
  const definitions = getPracticeExamDefinitions({
    [exam]: practiceQuestions.length,
  });
  const blueprint = getBlueprint(exam);
  const manifestIndex = new Map<string, {
    definition: PracticeExamDefinition;
    questions: PracticeQuestion[];
    assembly: ReturnType<typeof buildAssemblyMetadata>;
  }>();
  const reservedIds = new Set<string>();
  const reservedSignatures = new Set<string>();

  // Share each quality tier across the forms rather than letting the first one
  // drain it. Supply is counted once, up front, from the same standalone pool
  // every form draws from; the +1 slack keeps rounding from stranding the last
  // item of a tier. CCRN has two forms and NCLEX five, so the divisor follows
  // the definition count instead of being hard-coded.
  const formCount = Math.max(1, definitions.filter((item) => item.exam === exam).length);
  const tierSupply = new Map<number, number>();
  for (const question of standaloneQuestions) {
    const tier = getQuestionQualityProfile(question).tier;
    tierSupply.set(tier, (tierSupply.get(tier) ?? 0) + 1);
  }
  const perFormTierCeiling = () => new Map(
    [...tierSupply.entries()].map(([tier, total]) => [tier, Math.ceil(total / formCount) + 1] as const),
  );

  for (const definition of definitions.filter((item) => item.exam === exam)) {
    const caseQuestions = exam === "nclex"
      ? qualityFirstCaseGroups(practiceQuestions, definition.seed)
        .filter((group) => getCaseStudyReleaseIssues(group.questions).length === 0)
        .filter((group) => group.questions.every((question) => !reservedIds.has(question.id)))
        .slice(0, NCLEX_CASE_STUDY_SET_COUNT)
        .flatMap((group) => group.questions)
      : [];
    const selectedQuestions = selectByBlueprint(
      standaloneQuestions,
      blueprint,
      definition.length,
      definition.seed,
      reservedIds,
      reservedSignatures,
      caseQuestions,
      !strictExposureControl,
      perFormTierCeiling(),
    );
    selectedQuestions.forEach((question) => reservedIds.add(question.id));
    selectedQuestions.forEach((question) => reservedSignatures.add(questionSignature(question)));
    manifestIndex.set(definition.id, {
      definition,
      questions: selectedQuestions,
      assembly: buildAssemblyMetadata(definition, selectedQuestions, strictExposureControl),
    });
  }

  // Adaptive variants, keyed "<examId>:adaptive".
  //
  // Assembled at the real CAT ceiling so a variable-length run can actually
  // stop anywhere in the live 85-150 range. A fixed 85-item form cannot: it
  // can never stop later than 85, and advertising the real range on it would
  // misrepresent the exam.
  //
  // Built with its OWN empty reservation sets rather than continuing the
  // fixed forms’ chain. An adaptive run is a separate sitting, so overlapping
  // the fixed forms is correct; inheriting their reservations would instead
  // starve it of the pool’s best items, which is the failure the fixed forms
  // already had before quality was shared across them.
  for (const definition of definitions.filter((item) => item.exam === exam)) {
    const adaptiveDefinition: PracticeExamDefinition = {
      ...definition,
      id: `${definition.id}:adaptive`,
      length: CAT_MAX_ITEMS,
      seed: `${definition.seed}:adaptive`,
    };
    const adaptiveCases = exam === "nclex"
      ? qualityFirstCaseGroups(practiceQuestions, adaptiveDefinition.seed)
        .filter((group) => getCaseStudyReleaseIssues(group.questions).length === 0)
        .slice(0, NCLEX_CASE_STUDY_SET_COUNT)
        .flatMap((group) => group.questions)
      : [];
    // Quota sized for a single form of this length, not shared across five.
    const adaptiveQuota = new Map(
      [...tierSupply.entries()].map(([tier, total]) => [tier, total] as const),
    );
    const adaptiveQuestions = selectByBlueprint(
      standaloneQuestions,
      blueprint,
      adaptiveDefinition.length,
      adaptiveDefinition.seed,
      new Set<string>(),
      new Set<string>(),
      adaptiveCases,
      true,
      adaptiveQuota,
    );
    manifestIndex.set(adaptiveDefinition.id, {
      definition: adaptiveDefinition,
      questions: adaptiveQuestions,
      assembly: buildAssemblyMetadata(adaptiveDefinition, adaptiveQuestions, strictExposureControl, true),
    });
  }

  return manifestIndex;
}

type ManifestIndex = Awaited<ReturnType<typeof buildManifestIndex>>;

const MANIFEST_CACHE_TTL_MS = 30 * 60 * 1000;
const manifestCache = new Map<Exam, {
  expiresAt: number;
  value: Promise<ManifestIndex>;
}>();

async function getManifestIndex(exam: Exam) {
  const cached = manifestCache.get(exam);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const value = buildManifestIndex(exam);
  manifestCache.set(exam, {
    expiresAt: Date.now() + MANIFEST_CACHE_TTL_MS,
    value,
  });

  try {
    return await value;
  } catch (error) {
    if (manifestCache.get(exam)?.value === value) {
      manifestCache.delete(exam);
    }
    throw error;
  }
}

async function buildManifest(examId: string, adaptive = false) {
  const exam = examId.startsWith("ccrn") ? "ccrn" : examId.startsWith("nclex") ? "nclex" : null;
  if (!exam) {
    return null;
  }

  const manifestIndex = await getManifestIndex(exam);
  if (adaptive) {
    // Fall back to the fixed form if an adaptive variant is somehow absent:
    // a student mid-exam should get a working form, not a 404.
    return manifestIndex.get(`${examId}:adaptive`) ?? manifestIndex.get(examId) ?? null;
  }
  return manifestIndex.get(examId) ?? null;
}

function personalizeManifest(
  manifest: {
    definition: PracticeExamDefinition;
    questions: PracticeQuestion[];
    assembly: ReturnType<typeof buildAssemblyMetadata>;
  },
  seed: string,
) {
  return {
    ...manifest,
    questions: shuffleQuestionBlocks(manifest.questions, seed),
  };
}

export async function GET(request: Request, context: RouteContext) {
  const { examId } = await context.params;
  const parsed = examIdSchema.safeParse(examId);

  if (!parsed.success) {
    return Response.json({ success: false, error: "Unknown practice exam" }, { status: 404 });
  }

  const { user, access } = await getServerAccessContext();
  const previewAccess = access.source === "founder-key" || access.source === "preview-key";
  const requestedLaunchId = new URL(request.url).searchParams.get("launchId")?.trim();
  // Adaptive is the DEFAULT for readiness exams: the live NCLEX-RN is
  // variable-length, so a fixed 85-item form is the unrealistic option. ?adaptive=0
  // still returns the fixed form, which keeps a way back without a deploy if a
  // student hits trouble mid-exam.
  const adaptiveRequested = new URL(request.url).searchParams.get("adaptive") !== "0";
  const launchIdResult = launchIdSchema.safeParse(requestedLaunchId);
  const launchId = launchIdResult.success ? launchIdResult.data : crypto.randomUUID();

  if (!user?.id && !previewAccess) {
    return Response.json({
      success: false,
      error: "Sign in before launching a practice exam.",
      code: "AUTH_REQUIRED",
      loginUrl: `/auth/login?next=${encodeURIComponent(`/quiz?mode=practice-exam&practiceExam=${parsed.data}`)}`,
    }, { status: 401 });
  }

  // One readiness exam is free with any account; the other four stay premium.
  const isFreeExam = parsed.data === FREE_PRACTICE_EXAM_ID;

  if (!isFreeExam && (!access.canUsePracticeExams || !access.planCode || !isLaunchPlanCode(access.planCode))) {
    return Response.json({
      success: false,
      error: "This readiness exam is part of the paid plans. Your first one (NCLEX Full Simulation 1) is free.",
      code: "PREMIUM_REQUIRED",
    }, { status: 403 });
  }

  let manifest: Awaited<ReturnType<typeof buildManifest>>;
  try {
    manifest = await buildManifest(parsed.data, adaptiveRequested);
  } catch (error) {
    console.error("Readiness form assembly failed", {
      examId: parsed.data,
      error: error instanceof Error ? error.message : String(error),
    });
    return Response.json({
      success: false,
      error: "This readiness form is temporarily unavailable while its unique-question pool is being validated.",
      code: "READINESS_FORM_ASSEMBLY_FAILED",
    }, { status: 503 });
  }
  if (!manifest) {
    return Response.json({ success: false, error: "Practice exam unavailable" }, { status: 404 });
  }

  const personalizedManifest = personalizeManifest(
    manifest,
    `${parsed.data}:${user?.id ?? request.headers.get("cf-ray") ?? "preview"}:${launchId}`,
  );

  if (previewAccess && !user?.id) {
    return Response.json({
      success: true,
      data: personalizedManifest,
    }, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "X-Clarity-Assembly-Version": personalizedManifest.assembly.assemblyVersion,
        "X-Clarity-Content-Fingerprint": personalizedManifest.assembly.contentFingerprint,
      },
    });
  }

  const env = resolveEnv();
  if (!hasDatabase(env)) {
    return Response.json({ success: false, error: "Practice exam access storage is unavailable." }, { status: 503 });
  }

  const db = getDB(env);
  const hostedUser = user?.email
    ? await ensureHostedUser(db, {
        userId: user.id,
        email: user.email,
        name: typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null,
      })
    : null;

  if (!hostedUser) {
    return Response.json({ success: false, error: "Hosted account lookup failed." }, { status: 503 });
  }

  // Free plan: the included readiness exam may be *finished* once. Abandoned
  // sittings don't count, so a dropped connection never burns the allowance.
  if (isFreeExam && access.tier === "free" && !previewAccess) {
    const completed = await countCompletedFreeExamAttempts(db, hostedUser.id);
    if (completed >= FREE_PRACTICE_EXAM_LIMIT) {
      return Response.json({
        success: false,
        error: "You've finished your free readiness exam. Upgrade to unlock the remaining full-length simulations and your diagnostic breakdown.",
        code: FREE_LIMIT_CODES.exam,
        freeExams: { used: completed, limit: FREE_PRACTICE_EXAM_LIMIT },
      }, { status: 403 });
    }
  }

  // The free exam skips plan-scope checks and unlock accounting entirely.
  if (!isFreeExam && access.planCode && isLaunchPlanCode(access.planCode)) {
    const unlockCheck = await canUnlockPracticeExam(db, {
      userId: hostedUser.id,
      examId: parsed.data,
      planCode: access.planCode,
    });

    if (!unlockCheck.allowed) {
      return Response.json({
        success: false,
        error: unlockCheck.reason,
        code: "PRACTICE_EXAM_LIMIT_REACHED",
        practiceExamLimit: access.practiceExamLimit,
        unlockedExamIds: unlockCheck.unlockedExamIds,
      }, { status: 403 });
    }

    await recordPracticeExamUnlock(db, {
      userId: hostedUser.id,
      examId: parsed.data,
      planCode: access.planCode,
    });
  }

  let attemptId: string;
  try {
    attemptId = await findOrCreateReadinessAttempt(db, {
      userId: hostedUser.id,
      launchId,
      manifest: {
        examId: parsed.data,
        assemblyVersion: personalizedManifest.assembly.assemblyVersion,
        contentFingerprint: personalizedManifest.assembly.contentFingerprint,
        questions: personalizedManifest.questions,
      },
    });
  } catch (error) {
    console.error("Readiness attempt persistence failed", {
      examId: parsed.data,
      userId: hostedUser.id,
      error: error instanceof Error ? error.message : String(error),
    });
    return Response.json({
      success: false,
      error: "This readiness exam could not start with durable progress tracking. Please retry.",
      code: "READINESS_ATTEMPT_PERSISTENCE_FAILED",
    }, { status: 503 });
  }

  return Response.json({
    success: true,
    data: {
      ...personalizedManifest,
      questions: personalizedManifest.questions.map(concealReadinessAnswer),
      attemptId,
    },
  }, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-Clarity-Assembly-Version": personalizedManifest.assembly.assemblyVersion,
      "X-Clarity-Content-Fingerprint": personalizedManifest.assembly.contentFingerprint,
    },
  });
}
