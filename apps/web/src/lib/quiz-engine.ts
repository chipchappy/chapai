import { accuracyPercent } from "@/lib/quiz-accuracy";
import type { DB } from "./db";
import type { QuizQuestion, QuizSessionConfig, QuizResults } from "./types";
import { CCRN_CATEGORIES, NCLEX_CATEGORIES } from "./types";
import { allocateBlueprintCounts } from "./blueprint-allocation";
import { getQuestionBank, getQuestionById } from "./content-bank";
import { getCaseStudyEligibleQuestions, selectCompleteCaseStudyGroups } from "./clinical-case-study";
import { matchesQuestionCategory, isNclexClientNeed, resolveNclexClientNeed } from "./nclex-client-needs";
import {
  getQuestionQualityProfile,
  qualityFirstDiverseOrder,
} from "./question-quality";
import { parseQuestionQualityMetadata } from "./question-provenance";
import { getQuestionIntegrityIssues } from "./question-renderability";
import { seededShuffle } from "./seeded-random";
import { log } from "./logger";
import { questions, quizSessions, quizAnswers } from "@chapai/db/schema";
import { eq, and, inArray, sql } from "drizzle-orm";

type QuestionRow = {
  id: string;
  exam: "nclex" | "ccrn";
  type: QuizQuestion["type"];
  category: string;
  subcategory: string | null;
  difficulty: number | null;
  stem: string;
  options: string;
  answer: string;
  rationale: string;
  structuredRationale: string | null;
  distractorRationales: string | null;
  tags: string | null;
  blueprintPct: number | null;
  conceptNotes: string | null;
  provenance: string | null;
  reviewStatus: string | null;
  revision: number | null;
  publishState: string | null;
  scenarioTitle?: string | null;
  caseStudyId?: string | null;
  cjmmStep?: string | null;
  scenario?: string | null;
  additionalInfo?: string | null;
  exhibits?: string | null;
  chartReview?: string | null;
  matrixColumns?: string | null;
  matrixRows?: string | null;
  bowTie?: string | null;
  visualRationale?: string | null;
  referencesJson?: string | null;
  correctOrder?: string | null;
};

function parseJsonValue<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function matchesQuizFilters(question: QuizQuestion, config: QuizSessionConfig) {
  const questionType = config.questionType ?? config.type;

  if (!matchesQuestionCategory(question, config.category)) {
    return false;
  }

  if (questionType && question.type !== questionType) {
    return false;
  }

  if (config.ngnOnly && question.type === "mcq") {
    return false;
  }

  return true;
}

function shouldRequireRenderableShape(question: QuizQuestion) {
  return question.type === "matrix"
    || question.type === "ordering"
    || question.type === "case_study"
    || question.type === "bow_tie";
}

function filterRenderableQuestions(bank: QuizQuestion[]) {
  const eligible: QuizQuestion[] = [];
  const skipped: Array<{ id: string; issues: string[]; type: QuizQuestion["type"] }> = [];

  for (const question of bank) {
    const issues = getQuestionIntegrityIssues(question);
    if (issues.length === 0 || !shouldRequireRenderableShape(question)) {
      eligible.push(question);
      continue;
    }

    skipped.push({
      id: question.id,
      issues,
      type: question.type,
    });
  }

  return {
    eligible,
    skipped,
  };
}

function applyQuestionBankAccessLimit<T extends { id: string }>(bank: T[], accessPercent = 100) {
  const clampedPercent = Math.max(1, Math.min(100, Math.round(accessPercent)));
  if (clampedPercent >= 100 || bank.length <= 1) {
    return bank;
  }

  return bank.slice(0, Math.max(1, Math.ceil((bank.length * clampedPercent) / 100)));
}

function toQuestionOptions(raw: string): QuizQuestion["options"] {
  const parsed = parseJsonValue<Array<{ id?: string; text?: string } | string>>(raw, []);
  return parsed.map((option, index) => {
    if (typeof option === "string") {
      const letter = String.fromCharCode(97 + index);
      return { id: letter, text: option.replace(/^[A-D]\)\s*/i, "") };
    }
    return {
      id: option.id ?? String.fromCharCode(97 + index),
      text: option.text ?? "",
    };
  });
}

function toQuestionAnswer(raw: string): QuizQuestion["answer"] {
  const trimmed = raw.trim();
  if (!trimmed) {
    return "";
  }

  if ((trimmed.startsWith("[") && trimmed.endsWith("]")) || (trimmed.startsWith("{") && trimmed.endsWith("}"))) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) || (parsed && typeof parsed === "object")) {
        return parsed as QuizQuestion["answer"];
      }
    } catch {
      // Keep the raw value when the stored answer is not valid JSON.
    }
  }

  return raw;
}

function buildSyntheticClinicalContext(row: QuestionRow, tags: string[] | undefined, conceptNotes: string[] | undefined) {
  const topic = row.subcategory || row.category;
  const tagLine = (tags ?? []).slice(0, 4).join(", ");
  const notes = (conceptNotes ?? []).filter(Boolean).slice(0, 3);

  return {
    scenarioTitle: `${topic.replace(/[_-]+/g, " ")} clinical judgment`,
    scenario: row.stem,
    exhibits: [
      {
        type: "note" as const,
        title: "Clinical context",
        body: row.stem,
      },
      {
        type: "assessment" as const,
        title: "Decision cues",
        items: [
          row.category.replace(/[_-]+/g, " "),
          ...(tagLine ? [tagLine] : []),
          ...notes,
        ].slice(0, 4),
      },
    ],
  };
}

function buildMatrixFromAnswer(answer: QuizQuestion["answer"], options: QuizQuestion["options"]) {
  if (!answer || Array.isArray(answer) || typeof answer !== "object") {
    return {};
  }

  const answerEntries = Object.entries(answer);
  if (answerEntries.length === 0) {
    return {};
  }

  const optionLabels = options.map((option) => option.text).filter(Boolean);
  const answerLabels = Array.from(new Set(answerEntries.map(([, value]) => String(value))));
  const matrixColumns = optionLabels.length >= answerLabels.length ? optionLabels : answerLabels;
  const matrixRows = answerEntries.map(([label, value]) => ({
    label,
    answer: String(value),
  }));

  return { matrixColumns, matrixRows };
}

export function mapQuestionRowToQuizQuestion(row: QuestionRow): QuizQuestion {
  const options = toQuestionOptions(row.options);
  const answer = toQuestionAnswer(row.answer);
  const tags = parseJsonValue<string[] | undefined>(row.tags, undefined);
  const conceptNotes = parseJsonValue<string[] | undefined>(row.conceptNotes, undefined);
  const clinicalContext = buildSyntheticClinicalContext(row, tags, conceptNotes);
  const storedMatrixColumns = parseJsonValue<QuizQuestion["matrixColumns"] | undefined>(row.matrixColumns, undefined);
  const storedMatrixRows = parseJsonValue<QuizQuestion["matrixRows"] | undefined>(row.matrixRows, undefined);
  const storedBowTie = parseJsonValue<QuizQuestion["bowTie"] | undefined>(row.bowTie, undefined);
  const fallbackMatrix = row.type === "matrix" ? buildMatrixFromAnswer(answer, options) : {};
  const matrix = row.type === "matrix"
    ? {
        ...fallbackMatrix,
        ...(storedMatrixColumns?.length ? { matrixColumns: storedMatrixColumns } : {}),
        ...(storedMatrixRows?.length ? { matrixRows: storedMatrixRows } : {}),
      }
    : {};
  const storedExhibits = parseJsonValue<QuizQuestion["exhibits"] | undefined>(row.exhibits, undefined);
  const storedChartReview = parseJsonValue<QuizQuestion["chartReview"] | undefined>(row.chartReview, undefined);
  const storedVisualRationale = parseJsonValue<QuizQuestion["visualRationale"] | undefined>(row.visualRationale, undefined);
  const storedReferences = parseJsonValue<QuizQuestion["references"] | undefined>(row.referencesJson, undefined);
  const storedStructuredRationale = parseJsonValue<QuizQuestion["structuredRationale"] | undefined>(row.structuredRationale, undefined);
  const needsSyntheticContext = row.type === "case_study" || row.type === "bow_tie";

  return {
    id: row.id,
    exam: row.exam,
    type: row.type,
    nclexClientNeed: row.exam === "nclex"
      ? resolveNclexClientNeed({
          exam: row.exam,
          category: row.category,
          subcategory: row.subcategory,
        })
      : undefined,
    category: row.category,
    subcategory: row.subcategory ?? undefined,
    difficulty: (row.difficulty ?? 3) as QuizQuestion["difficulty"],
    stem: row.stem,
    caseStudyId: row.caseStudyId ?? undefined,
    cjmmStep: (row.cjmmStep as QuizQuestion["cjmmStep"]) ?? undefined,
    scenarioTitle: row.scenarioTitle ?? (needsSyntheticContext ? clinicalContext.scenarioTitle : undefined),
    scenario: row.scenario ?? (needsSyntheticContext ? clinicalContext.scenario : undefined),
    additionalInfo: row.additionalInfo ?? undefined,
    exhibits: storedExhibits ?? (needsSyntheticContext ? clinicalContext.exhibits : undefined),
    chartReview: storedChartReview,
    options,
    answer,
    ...matrix,
    bowTie: storedBowTie,
    rationale: row.rationale,
    structuredRationale: storedStructuredRationale,
    distractorRationales: parseJsonValue<Record<string, string> | undefined>(row.distractorRationales, undefined),
    tags,
    blueprintPct: row.blueprintPct ?? undefined,
    conceptNotes,
    provenance: row.provenance ?? undefined,
    qualityMetadata: parseQuestionQualityMetadata(row.provenance),
    references: storedReferences,
    reviewStatus: (row.reviewStatus as QuizQuestion["reviewStatus"]) ?? undefined,
    revision: row.revision ?? undefined,
    publishState: (row.publishState as QuizQuestion["publishState"]) ?? undefined,
    visualRationale: storedVisualRationale,
    tutorReady: true,
  };
}

/**
 * Per-category accuracy for a hosted user, used to bias adaptive sessions toward
 * the categories where the student is weakest (NCLEX CAT-style focus).
 */
async function getCategoryAccuracy(db: DB, userId: string, exam: QuizSessionConfig["exam"]) {
  const rows = await db
    .select({
      category: questions.category,
      total: sql<number>`count(${quizAnswers.id})`,
      correct: sql<number>`sum(case when ${quizAnswers.isCorrect} then 1 else 0 end)`,
    })
    .from(quizAnswers)
    .innerJoin(quizSessions, eq(quizAnswers.sessionId, quizSessions.id))
    .innerJoin(questions, eq(quizAnswers.questionId, questions.id))
    .where(and(eq(quizSessions.userId, userId), eq(questions.exam, exam)))
    .groupBy(questions.category);
  const map = new Map<string, { total: number; correct: number }>();
  for (const row of rows) {
    map.set(row.category, { total: Number(row.total) || 0, correct: Number(row.correct) || 0 });
  }
  return map;
}

/**
 * Select questions weighted by blueprint percentages.
 * If category is specified, selects from that category only.
 * Otherwise, distributes questions proportionally to exam blueprint.
 * When `adaptive` + `userId` are supplied, biases toward the user's weak
 * categories instead; `excludeIds` drops already-seen items (endless mode).
 */
export async function selectQuestions(
  db: DB,
  config: QuizSessionConfig,
  access?: {
    questionBankAccessPercent?: number;
    userId?: string;
    adaptive?: boolean;
    excludeIds?: string[];
    diversify?: boolean;
    selectionSeed?: string;
  },
): Promise<QuizQuestion[]> {
  const { exam, count } = config;
  const questionType = config.questionType ?? config.type;
  const conditions = [eq(questions.exam, exam), eq(questions.publishState, "published")];
  if (questionType) {
    conditions.push(eq(questions.type, questionType));
  }
  if (exam === "nclex" && questionType !== "case_study") {
    conditions.push(sql`${questions.type} <> 'case_study'`);
  }
  if (config.ngnOnly) {
    conditions.push(sql`${questions.type} <> 'mcq'`);
  }
  const candidateLimit = questionType === "case_study"
    ? 800
    : config.category
    ? Math.min(Math.max(count * 6, 180), 480)
    : Math.min(Math.max(count * 6, 240), 600);
  // Use publication review plus rationale completeness as the database-level
  // shortlist. The in-memory scorer below applies the full quality profile.
  const orderBy = exam === "nclex"
    ? [
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
      ]
    : [sql`${questions.structuredRationale} IS NULL`, sql`random()`];

  const dbRows = await db
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
    .where(and(...conditions))
    .orderBy(...orderBy)
    .limit(candidateLimit);
  const dbBank = dbRows.map(mapQuestionRowToQuizQuestion);
  const filteredBank = dbBank.filter((question) => matchesQuizFilters(question, config));
  const caseEligibleBank = exam === "nclex"
    ? getCaseStudyEligibleQuestions(filteredBank)
    : filteredBank;
  const { eligible, skipped } = filterRenderableQuestions(caseEligibleBank);
  const selectionSeed = access?.selectionSeed ?? crypto.randomUUID();
  const qualityRanked = qualityFirstDiverseOrder(eligible, `${selectionSeed}:eligible`);
  const accessLimited = applyQuestionBankAccessLimit(
    qualityRanked,
    access?.questionBankAccessPercent ?? 100,
  );
  const excludeSet = new Set(access?.excludeIds ?? []);
  const bank = excludeSet.size > 0 ? accessLimited.filter((question) => !excludeSet.has(question.id)) : accessLimited;

  if (skipped.length > 0) {
    log("warn", "quiz/start skipped incomplete rich questions", {
      exam,
      count: skipped.length,
      questionType: questionType ?? null,
      ngnOnly: Boolean(config.ngnOnly),
      skipped: skipped.slice(0, 12),
    });
  }

  if (bank.length === 0) {
    return [];
  }

  if (questionType === "case_study") {
    return selectCompleteCaseStudyGroups(bank, count, selectionSeed);
  }

  // Free-tier diversification: round-robin across categories so the limited
  // free allowance samples the whole exam (all client needs + a natural mix of
  // item types) instead of clustering in one lane. Explicit filters win.
  if (access?.diversify && !config.category && !questionType && !config.ngnOnly) {
    const byCategory = new Map<string, QuizQuestion[]>();
    for (const question of qualityFirstDiverseOrder(bank, `${selectionSeed}:diverse-pool`)) {
      const list = byCategory.get(question.category) ?? [];
      list.push(question);
      byCategory.set(question.category, list);
    }
    const buckets = seededShuffle([...byCategory.values()], `${selectionSeed}:diverse-categories`);
    const picked: QuizQuestion[] = [];
    let cursor = 0;
    while (picked.length < count && buckets.some((bucket) => bucket.length > 0)) {
      const bucket = buckets[cursor % buckets.length];
      const question = bucket.shift();
      if (question) {
        picked.push(question);
      }
      cursor += 1;
    }
    return picked;
  }

  if (config.category || questionType || config.ngnOnly) {
    return qualityFirstDiverseOrder(bank, `${selectionSeed}:filtered`)
      .slice(0, count);
  }

  // Adaptive: bias toward the user's weak categories (NCLEX CAT-style focus on
  // weaknesses). Unseen items are already excluded via excludeIds.
  if (access?.adaptive && access?.userId) {
    const accByCat = await getCategoryAccuracy(db, access.userId, exam);
    const priorityOf = (question: QuizQuestion) => {
      const stat = accByCat.get(question.category);
      const weakness = stat && stat.total >= 3 ? 1 - stat.correct / stat.total : 0.55;
      const quality = getQuestionQualityProfile(question);
      return {
        tier: quality.tier,
        score: quality.score + weakness * 12,
      };
    };
    return seededShuffle(bank, `${selectionSeed}:adaptive`)
      .sort((left, right) => {
        const leftPriority = priorityOf(left);
        const rightPriority = priorityOf(right);
        return leftPriority.tier - rightPriority.tier || rightPriority.score - leftPriority.score;
      })
      .slice(0, count);
  }

  // Weighted multi-category selection
  const blueprintMap = exam === "ccrn"
    ? Object.entries(CCRN_CATEGORIES)
    : Object.entries(NCLEX_CATEGORIES);

  const selected: QuizQuestion[] = [];
  const selectedIds = new Set<string>();
  const categoryTargets = allocateBlueprintCounts(
    Object.fromEntries(blueprintMap.map(([category, metadata]) => [category, metadata.pct])),
    count,
  );

  for (const [cat] of blueprintMap) {
    const catCount = categoryTargets[cat] ?? 0;
    if (catCount === 0) continue;

    const categoryRows = qualityFirstDiverseOrder(
      bank.filter((question) => {
        const bucket = exam === "nclex"
          ? (question.nclexClientNeed ?? resolveNclexClientNeed(question) ?? question.category)
          : question.category;
        return bucket === cat && !selectedIds.has(question.id);
      }),
      `${selectionSeed}:category:${cat}`,
    )
      .slice(0, catCount);

    for (const row of categoryRows) {
      selectedIds.add(row.id);
    }
    selected.push(...categoryRows);
  }

  if (selected.length < count) {
    const remainder = qualityFirstDiverseOrder(
      bank.filter((question) => !selectedIds.has(question.id)),
      `${selectionSeed}:remainder`,
    )
      .slice(0, count - selected.length);
    selected.push(...remainder);
  }

  return seededShuffle(selected, `${selectionSeed}:final`).slice(0, count);
}

/** Create a new quiz session in the database */
export async function createSession(
  db: DB,
  userId: string | undefined,
  config: QuizSessionConfig,
  questionList: QuizQuestion[]
): Promise<string> {
  const sessionId = crypto.randomUUID();

  await db.insert(quizSessions).values({
    id: sessionId,
    userId: userId ?? null,
    exam: config.exam,
    category: config.category ?? null,
    totalQuestions: questionList.length,
    questionIds: JSON.stringify(questionList.map((q) => q.id)),
  });

  return sessionId;
}

/** Record a quiz answer and return correctness */
export async function recordAnswer(
  db: DB,
  params: {
    sessionId: string;
    questionId: string;
    userId?: string;
    selectedAnswer: string;
    isCorrect: boolean;
    confidence?: "sure" | "unsure" | "guess";
    pointsEarned?: number;
    pointsPossible?: number;
    partialCredit?: number;
    timeSpentMs?: number;
  }
): Promise<void> {
  await db.insert(quizAnswers).values({
    sessionId: params.sessionId,
    questionId: params.questionId,
    userId: params.userId ?? null,
    selectedAnswer: params.selectedAnswer,
    isCorrect: params.isCorrect,
    confidence: params.confidence ?? null,
    pointsEarned: params.pointsEarned ?? (params.isCorrect ? 1 : 0),
    pointsPossible: params.pointsPossible ?? 1,
    partialCredit: params.partialCredit ?? (params.isCorrect ? 1 : 0),
    timeSpentMs: params.timeSpentMs ?? null,
  });

  // Update session correct count
  if (params.isCorrect) {
    await db
      .update(quizSessions)
      .set({ correctCount: sql`correct_count + 1` })
      .where(eq(quizSessions.id, params.sessionId));
  }

  const session = await db
    .select({
      totalQuestions: quizSessions.totalQuestions,
      completedAt: quizSessions.completedAt,
    })
    .from(quizSessions)
    .where(eq(quizSessions.id, params.sessionId))
    .get();

  if (session && !session.completedAt) {
    const answeredRows = await db
      .select({ questionId: quizAnswers.questionId })
      .from(quizAnswers)
      .where(eq(quizAnswers.sessionId, params.sessionId));
    const uniqueAnsweredCount = new Set(answeredRows.map((answer) => answer.questionId)).size;

    if (uniqueAnsweredCount >= session.totalQuestions) {
      await db
        .update(quizSessions)
        .set({ completedAt: Math.floor(Date.now() / 1000) })
        .where(eq(quizSessions.id, params.sessionId));
    }
  }
}

/** Calculate and return quiz results */
export async function getResults(db: DB, sessionId: string): Promise<QuizResults> {
  const session = await db
    .select()
    .from(quizSessions)
    .where(eq(quizSessions.id, sessionId))
    .get();

  if (!session) throw new Error("Session not found");

  const answers = await db
    .select()
    .from(quizAnswers)
    .where(eq(quizAnswers.sessionId, sessionId));

  // Category breakdown
  const questionIds = JSON.parse(session.questionIds) as string[];
  const canonicalRows = questionIds
    .map((questionId) => getQuestionById(questionId))
    .filter(Boolean) as QuizQuestion[];
  const canonicalIds = new Set(canonicalRows.map((question) => question.id));
  const unresolvedIds = questionIds.filter((questionId) => !canonicalIds.has(questionId));
  const fallbackRows = unresolvedIds.length > 0
    ? await db
        .select()
        .from(questions)
        .where(inArray(questions.id, unresolvedIds))
    : [];
  const questionRows = [
    ...canonicalRows.map((question) => ({ id: question.id, category: question.category })),
    ...fallbackRows.map((question) => ({ id: question.id, category: question.category })),
  ];

  // Denominator is answers actually recorded, never the planned deck. Counting
  // unanswered questions marked them wrong, so an abandoned session reported
  // categories as weak that the student never saw.
  const byCategory: Record<string, { correct: number; total: number }> = {};
  for (const q of questionRows) {
    const answer = answers.find((a) => a.questionId === q.id);
    if (!answer) continue;
    const cat = q.category;
    if (!byCategory[cat]) byCategory[cat] = { correct: 0, total: 0 };
    byCategory[cat].total++;
    if (answer.isCorrect) byCategory[cat].correct++;
  }

  const WEAK_CATEGORY_MIN_ANSWERS = 4;
  const weakCategories = Object.entries(byCategory)
    .filter(([, v]) => v.total >= WEAK_CATEGORY_MIN_ANSWERS && v.correct / v.total < 0.6)
    .map(([k]) => k);

  const timeSpentMs = session.completedAt
    ? (session.completedAt - session.startedAt) * 1000
    : 0;

  return {
    sessionId,
    // correctCount is a live tally and totalQuestions is the deck size chosen
    // when the session was created and never grows. Dividing one by the other
    // is exactly what rendered 128% on the instructor dashboard; accuracy comes
    // from the recorded answers or not at all.
    score: accuracyPercent(
      answers.filter((a) => a.isCorrect).length,
      answers.length,
    ) ?? 0,
    totalQuestions: session.totalQuestions,
    correctCount: session.correctCount,
    byCategory,
    timeSpentMs,
    weakCategories,
  };
}

// ─── Internal helpers ─────────────────────────────────────────────────────────
