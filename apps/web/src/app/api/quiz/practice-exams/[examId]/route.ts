import { getQuestionBank } from "@/lib/content-bank";
import { questions } from "@chapai/db/schema";
import { getDB, hasDatabase, resolveEnv } from "@/lib/db";
import { mapQuestionRowToQuizQuestion } from "@/lib/quiz-engine";
import { ensureHostedUser } from "@/lib/billing-store";
import { isLaunchPlanCode } from "@/lib/launch-offers";
import { canUnlockPracticeExam, recordPracticeExamUnlock } from "@/lib/practice-exam-access";
import { CCRN_CATEGORIES, NCLEX_CATEGORIES, type Exam, type QuizQuestion } from "@/lib/types";
import { getPracticeExamDefinitions, getStandardPreviewDeck, mapLiveQuestionBank } from "@/lib/practice-data";
import type { PracticeExamDefinition, PracticeQuestion } from "@/lib/practice-types";
import { getServerAccessContext } from "@/lib/server-access";
import { getQuestionIntegrityIssues } from "@/lib/question-renderability";
import { eq } from "drizzle-orm";
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

function mapLiveQuestion(question: QuizQuestion): PracticeQuestion {
  const correctAnswer = (() => {
    if (Array.isArray(question.answer)) {
      return question.answer;
    }
    if (question.answer && typeof question.answer === "object") {
      return question.answer;
    }
    const raw = String(question.answer ?? "").trim();
    if (!raw) {
      return "";
    }
    if ((raw.startsWith("[") && raw.endsWith("]")) || (raw.startsWith("{") && raw.endsWith("}"))) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) || (parsed && typeof parsed === "object")) {
          return parsed;
        }
      } catch {
        // keep raw fallback
      }
    }
    return raw;
  })();
  const kind =
    question.type === "sata"
      ? "multi-select"
      : question.type === "matrix"
        ? "matrix"
        : question.type === "ordering"
          ? "ordering"
          : question.type === "bow_tie"
            ? "bow-tie"
            : question.type === "case_study"
              ? "case-study"
              : question.type === "scenario_mcq"
                ? "scenario-mcq"
                : question.type === "decision_map_mcq"
                  ? "decision-map-mcq"
                  : "mcq";

  return {
    id: question.id,
    exam: question.exam,
    category: question.category,
    difficulty: question.difficulty,
    mode: "practice-exam",
    kind,
    questionType: question.type,
    stem: question.stem,
    scenarioTitle: question.scenarioTitle,
    scenario: question.scenario,
    additionalInfo: question.additionalInfo,
    matrixColumns: question.matrixColumns,
    matrixRows: question.matrixRows,
    options: question.options.map((option) => ({ id: option.id, text: option.text })),
    correctAnswer,
    rationale: question.rationale,
    structuredRationale: question.structuredRationale,
    distractorRationales: question.distractorRationales,
    takeaway: question.takeaway,
    references: question.references,
    coachingFrame: question.coachingFrame,
    tutorReady: question.tutorReady,
    diagramBlueprint: question.diagramBlueprint,
    speedCue: question.speedCue,
    source: "live",
    visualRationale: question.visualRationale,
  };
}

function hashSeed(seed: string) {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed: string) {
  let state = hashSeed(seed) || 1;
  return () => {
    state = Math.imul(state ^ (state >>> 15), state | 1);
    state ^= state + Math.imul(state ^ (state >>> 7), state | 61);
    return ((state ^ (state >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(items: T[], seed: string) {
  const random = seededRandom(seed);
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

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
    ? Object.fromEntries(Object.entries(CCRN_CATEGORIES).map(([, value]) => [value.label, value.pct]))
    : Object.fromEntries(Object.entries(NCLEX_CATEGORIES).map(([, value]) => [value.label, value.pct]));
}

function selectByBlueprint(
  questions: PracticeQuestion[],
  blueprint: Record<string, number>,
  count: number,
  seed: string,
  reservedIds: Set<string> = new Set(),
) {
  const buckets = new Map<string, PracticeQuestion[]>();

  for (const question of questions) {
    const category = question.exam === "nclex" ? question.nclexClientNeed ?? question.category : question.category;
    const bucket = buckets.get(category) ?? [];
    bucket.push(question);
    buckets.set(category, bucket);
  }

  const selected: PracticeQuestion[] = [];
  const usedInManifest = new Set<string>();
  const usedSignatures = new Set<string>();

  for (const [category, pct] of Object.entries(blueprint)) {
    const target = Math.max(1, Math.round((pct / 100) * count));
    const bucket = seededShuffle(buckets.get(category) ?? [], `${seed}:${category}`);
    selected.push(...takeUniqueQuestions(bucket, target, reservedIds, usedInManifest, usedSignatures));
  }

  if (selected.length < count) {
    const remainder = seededShuffle(questions, `${seed}:remainder`);
    selected.push(...takeUniqueQuestions(remainder, count - selected.length, reservedIds, usedInManifest, usedSignatures));
  }

  if (selected.length < count) {
    const overflow = seededShuffle(questions, `${seed}:overflow`);
    selected.push(...takeUniqueQuestions(overflow, count - selected.length, new Set<string>(), usedInManifest, usedSignatures));
  }

  return seededShuffle(selected, `${seed}:final`).slice(0, count);
}

async function loadLivePracticeQuestions(exam: Exam) {
  const liveQuestions = getQuestionBank(exam);
  if (liveQuestions.length > 0) {
    return mapLiveQuestionBank(
      liveQuestions.filter((question) => {
        const issues = getQuestionIntegrityIssues(question);
        return issues.length === 0 || (question.type !== "matrix" && question.type !== "ordering" && question.type !== "case_study" && question.type !== "bow_tie");
      }),
      "practice-exam",
    );
  }

  const env = resolveEnv();
  if (!hasDatabase(env)) {
    return [];
  }

  const db = getDB(env);
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
    .where(eq(questions.exam, exam));

  return mapLiveQuestionBank(rows.map((row) => mapQuestionRowToQuizQuestion(row)), "practice-exam").filter((question) => {
    const issues = getQuestionIntegrityIssues(question);
    return issues.length === 0 || (question.kind !== "matrix" && question.kind !== "ordering" && question.kind !== "case-study" && question.kind !== "bow-tie");
  });
}

async function buildManifestIndex(exam: Exam) {
  const livePracticeQuestions = await loadLivePracticeQuestions(exam);
  const practiceQuestions = livePracticeQuestions.length > 0
    ? livePracticeQuestions
    : getStandardPreviewDeck().filter((q) => q.exam === exam).map((q) => ({ ...q, mode: "practice-exam" as const }));
  const definitions = getPracticeExamDefinitions({
    [exam]: practiceQuestions.length,
  });
  const blueprint = getBlueprint(exam);
  const manifestIndex = new Map<string, { definition: PracticeExamDefinition; questions: PracticeQuestion[] }>();
  const reservedIds = new Set<string>();

  for (const definition of definitions.filter((item) => item.exam === exam)) {
    const selectedQuestions = selectByBlueprint(practiceQuestions, blueprint, definition.length, definition.seed, reservedIds);
    selectedQuestions.forEach((question) => reservedIds.add(question.id));
    manifestIndex.set(definition.id, {
      definition,
      questions: selectedQuestions,
    });
  }

  return manifestIndex;
}

async function buildManifest(examId: string) {
  const exam = examId.startsWith("ccrn") ? "ccrn" : examId.startsWith("nclex") ? "nclex" : null;
  if (!exam) {
    return null;
  }

  const manifestIndex = await buildManifestIndex(exam);
  return manifestIndex.get(examId) ?? null;
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

  if (!access.canUsePracticeExams || !access.planCode || !isLaunchPlanCode(access.planCode)) {
    return Response.json({
      success: false,
      error: "This account does not have practice exam access yet.",
      code: "PREMIUM_REQUIRED",
    }, { status: 403 });
  }

  const manifest = await buildManifest(parsed.data);
  if (!manifest) {
    return Response.json({ success: false, error: "Practice exam unavailable" }, { status: 404 });
  }

  if (previewAccess && !user?.id) {
    return Response.json({
      success: true,
      data: manifest,
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

  return Response.json({
    success: true,
    data: manifest,
  });
}
