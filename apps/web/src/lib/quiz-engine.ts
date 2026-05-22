import type { DB } from "./db";
import type { QuizQuestion, QuizSessionConfig, QuizResults } from "./types";
import { CCRN_CATEGORIES, NCLEX_CATEGORIES } from "./types";
import { getQuestionBank, getQuestionById } from "./content-bank";
import { matchesQuestionCategory, isNclexClientNeed, resolveNclexClientNeed } from "./nclex-client-needs";
import { getQuestionIntegrityIssues } from "./question-renderability";
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
  distractorRationales: string | null;
  tags: string | null;
  blueprintPct: number | null;
  conceptNotes: string | null;
  provenance: string | null;
  reviewStatus: string | null;
  revision: number | null;
  publishState: string | null;
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

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function applyQuestionBankAccessLimit<T extends { id: string }>(bank: T[], accessPercent = 100) {
  const clampedPercent = Math.max(1, Math.min(100, Math.round(accessPercent)));
  if (clampedPercent >= 100 || bank.length <= 1) {
    return bank;
  }

  const limited = bank.filter((question) => (hashString(`${question.id}:access-scope`) % 100) < clampedPercent);
  if (limited.length > 0) {
    return limited;
  }

  return [...bank]
    .sort((left, right) => hashString(left.id) - hashString(right.id))
    .slice(0, 1);
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

export function mapQuestionRowToQuizQuestion(row: QuestionRow): QuizQuestion {
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
    options: toQuestionOptions(row.options),
    answer: toQuestionAnswer(row.answer),
    rationale: row.rationale,
    distractorRationales: parseJsonValue<Record<string, string> | undefined>(row.distractorRationales, undefined),
    tags: parseJsonValue<string[] | undefined>(row.tags, undefined),
    blueprintPct: row.blueprintPct ?? undefined,
    conceptNotes: parseJsonValue<string[] | undefined>(row.conceptNotes, undefined),
    provenance: row.provenance ?? undefined,
    reviewStatus: (row.reviewStatus as QuizQuestion["reviewStatus"]) ?? undefined,
    revision: row.revision ?? undefined,
    publishState: (row.publishState as QuizQuestion["publishState"]) ?? undefined,
    tutorReady: true,
  };
}

/**
 * Select questions weighted by blueprint percentages.
 * If category is specified, selects from that category only.
 * Otherwise, distributes questions proportionally to exam blueprint.
 */
export async function selectQuestions(
  db: DB,
  config: QuizSessionConfig,
  access?: {
    questionBankAccessPercent?: number;
  },
): Promise<QuizQuestion[]> {
  const { exam, count } = config;
  const questionType = config.questionType ?? config.type;
  const conditions = [eq(questions.exam, exam)];

  const dbRows = await db
    .select({
      id: questions.id,
    })
    .from(questions)
    .where(and(...conditions));
  const availableIds = new Set(dbRows.map((row) => row.id));
  const canonicalBank = getQuestionBank(exam);
  const eligibleCanonicalBank = availableIds.size > 0
    ? canonicalBank.filter((question) => availableIds.has(question.id))
    : canonicalBank;
  const filteredBank = eligibleCanonicalBank.filter((question) => matchesQuizFilters(question, config));
  const { eligible, skipped } = filterRenderableQuestions(filteredBank);
  const bank = applyQuestionBankAccessLimit(
    eligible,
    access?.questionBankAccessPercent ?? 100,
  );

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

  if (config.category || questionType || config.ngnOnly) {
    return bank
      .sort(() => Math.random() - 0.5)
      .slice(0, count);
  }

  // Weighted multi-category selection
  const blueprintMap = exam === "ccrn"
    ? Object.entries(CCRN_CATEGORIES)
    : Object.entries(NCLEX_CATEGORIES);

  const selected: QuizQuestion[] = [];
  const selectedIds = new Set<string>();

  for (const [cat, meta] of blueprintMap) {
    const catCount = Math.round((meta.pct / 100) * count);
    if (catCount === 0) continue;

    const categoryRows = bank
      .filter((question) => {
        const bucket = exam === "nclex"
          ? (question.nclexClientNeed ?? resolveNclexClientNeed(question) ?? question.category)
          : question.category;
        return bucket === cat && !selectedIds.has(question.id);
      })
      .sort(() => Math.random() - 0.5)
      .slice(0, catCount);

    for (const row of categoryRows) {
      selectedIds.add(row.id);
    }
    selected.push(...categoryRows);
  }

  if (selected.length < count) {
    const remainder = bank
      .filter((question) => !selectedIds.has(question.id))
      .sort(() => Math.random() - 0.5)
      .slice(0, count - selected.length);
    selected.push(...remainder);
  }

  // Shuffle the final selection
  return selected.sort(() => Math.random() - 0.5).slice(0, count);
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
    timeSpentMs?: number;
  }
): Promise<void> {
  await db.insert(quizAnswers).values({
    sessionId: params.sessionId,
    questionId: params.questionId,
    userId: params.userId ?? null,
    selectedAnswer: params.selectedAnswer,
    isCorrect: params.isCorrect,
    timeSpentMs: params.timeSpentMs ?? null,
  });

  // Update session correct count
  if (params.isCorrect) {
    await db
      .update(quizSessions)
      .set({ correctCount: sql`correct_count + 1` })
      .where(eq(quizSessions.id, params.sessionId));
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

  const byCategory: Record<string, { correct: number; total: number }> = {};
  for (const q of questionRows) {
    const cat = q.category;
    if (!byCategory[cat]) byCategory[cat] = { correct: 0, total: 0 };
    byCategory[cat].total++;
    const answer = answers.find((a) => a.questionId === q.id);
    if (answer?.isCorrect) byCategory[cat].correct++;
  }

  const weakCategories = Object.entries(byCategory)
    .filter(([, v]) => v.total > 0 && v.correct / v.total < 0.6)
    .map(([k]) => k);

  const timeSpentMs = session.completedAt
    ? (session.completedAt - session.startedAt) * 1000
    : 0;

  return {
    sessionId,
    score: session.totalQuestions > 0
      ? Math.round((session.correctCount / session.totalQuestions) * 100)
      : 0,
    totalQuestions: session.totalQuestions,
    correctCount: session.correctCount,
    byCategory,
    timeSpentMs,
    weakCategories,
  };
}

// ─── Internal helpers ─────────────────────────────────────────────────────────
