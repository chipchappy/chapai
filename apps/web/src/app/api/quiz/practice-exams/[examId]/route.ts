import { getQuestionBank } from "@/lib/content-bank";
import { allocateBlueprintDeficits } from "@/lib/blueprint-allocation";
import {
  getCaseStudyEligibleQuestions,
  qualityFirstCaseGroups,
  shuffleQuestionBlocks,
} from "@/lib/clinical-case-study";
import { questions } from "@chapai/db/schema";
import { getDB, hasDatabase, resolveEnv } from "@/lib/db";
import { mapQuestionRowToQuizQuestion } from "@/lib/quiz-engine";
import { ensureHostedUser } from "@/lib/billing-store";
import { isLaunchPlanCode } from "@/lib/launch-offers";
import { canUnlockPracticeExam, FREE_PRACTICE_EXAM_ID, recordPracticeExamUnlock } from "@/lib/practice-exam-access";
import { qualityFirstDiverseOrder } from "@/lib/question-quality";
import { CCRN_CATEGORIES, NCLEX_CATEGORIES, type Exam } from "@/lib/types";
import { getPracticeExamDefinitions, getRichDeck, getStandardPreviewDeck, mapLiveQuestionBank } from "@/lib/practice-data";
import type { PracticeExamDefinition, PracticeQuestion } from "@/lib/practice-types";
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

function takeUniqueQuestions(
  candidates: PracticeQuestion[],
  limit: number,
  reservedIds: Set<string>,
  usedIds: Set<string>,
  usedSignatures: Set<string>,
) {
  const picked: PracticeQuestion[] = [];

  for (const question of candidates) {
    const signature = questionSignature(question);
    if (reservedIds.has(question.id) || usedIds.has(question.id) || usedSignatures.has(signature)) {
      continue;
    }
    usedIds.add(question.id);
    usedSignatures.add(signature);
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
    : Object.fromEntries(Object.entries(NCLEX_CATEGORIES).map(([key, value]) => [key, value.pct]));
}

function selectByBlueprint(
  questions: PracticeQuestion[],
  blueprint: Record<string, number>,
  count: number,
  seed: string,
  reservedIds: Set<string> = new Set(),
  initialQuestions: PracticeQuestion[] = [],
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
    selected.push(...takeUniqueQuestions(bucket, target, reservedIds, usedInManifest, usedSignatures));
  }

  if (selected.length < count) {
    const remainder = qualityFirstDiverseOrder(questions, `${seed}:remainder`);
    selected.push(...takeUniqueQuestions(remainder, count - selected.length, reservedIds, usedInManifest, usedSignatures));
  }

  if (selected.length < count) {
    const overflow = qualityFirstDiverseOrder(questions, `${seed}:overflow`);
    selected.push(...takeUniqueQuestions(overflow, count - selected.length, new Set<string>(), usedInManifest, usedSignatures));
  }

  return shuffleQuestionBlocks(selected.slice(0, count), `${seed}:final`);
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
  const candidateLimit = exam === "nclex" ? 700 : 500;
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
      sql`${questions.distractorRationales} IS NULL`,
      sql`${questions.referencesJson} IS NULL`,
      sql`${questions.visualRationale} IS NULL`,
      sql`random()`,
    )
    .limit(candidateLimit);

  return mapLiveQuestionBank(rows.map((row) => mapQuestionRowToQuizQuestion(row)), "practice-exam").filter((question) => {
    const issues = getQuestionIntegrityIssues(question);
    return issues.length === 0 || (question.kind !== "matrix" && question.kind !== "ordering" && question.kind !== "case-study" && question.kind !== "bow-tie");
  });
}

async function buildManifestIndex(exam: Exam) {
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
  const standaloneQuestions = practiceQuestions.filter((question) => !question.caseStudyId);
  const definitions = getPracticeExamDefinitions({
    [exam]: practiceQuestions.length,
  });
  const blueprint = getBlueprint(exam);
  const manifestIndex = new Map<string, { definition: PracticeExamDefinition; questions: PracticeQuestion[] }>();
  const reservedIds = new Set<string>();

  for (const definition of definitions.filter((item) => item.exam === exam)) {
    const caseGroup = exam === "nclex"
      ? qualityFirstCaseGroups(practiceQuestions, definition.seed)
        .find((group) => group.questions.every((question) => !reservedIds.has(question.id)))
        ?.questions ?? []
      : [];
    const selectedQuestions = selectByBlueprint(
      standaloneQuestions,
      blueprint,
      definition.length,
      definition.seed,
      reservedIds,
      caseGroup,
    );
    selectedQuestions.forEach((question) => reservedIds.add(question.id));
    manifestIndex.set(definition.id, {
      definition,
      questions: selectedQuestions,
    });
  }

  return manifestIndex;
}

type ManifestIndex = Awaited<ReturnType<typeof buildManifestIndex>>;

const MANIFEST_CACHE_TTL_MS = 10 * 60 * 1000;
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

async function buildManifest(examId: string) {
  const exam = examId.startsWith("ccrn") ? "ccrn" : examId.startsWith("nclex") ? "nclex" : null;
  if (!exam) {
    return null;
  }

  const manifestIndex = await getManifestIndex(exam);
  return manifestIndex.get(examId) ?? null;
}

function personalizeManifest(
  manifest: { definition: PracticeExamDefinition; questions: PracticeQuestion[] },
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
      error: "This readiness exam is part of the paid plans — your first one (NCLEX Full Simulation 1) is free.",
      code: "PREMIUM_REQUIRED",
    }, { status: 403 });
  }

  const manifest = await buildManifest(parsed.data);
  if (!manifest) {
    return Response.json({ success: false, error: "Practice exam unavailable" }, { status: 404 });
  }

  const personalizedManifest = personalizeManifest(
    manifest,
    `${parsed.data}:${user?.id ?? request.headers.get("cf-ray") ?? crypto.randomUUID()}`,
  );

  if (previewAccess && !user?.id) {
    return Response.json({
      success: true,
      data: personalizedManifest,
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

  return Response.json({
    success: true,
    data: personalizedManifest,
  });
}
