import type { DB } from "./db";
import type { QuizQuestion, QuizSessionConfig, QuizResults } from "./types";
import { CCRN_CATEGORIES, NCLEX_CATEGORIES } from "./types";
import { getQuestionBank, getQuestionById } from "./content-bank";
import { questions, quizSessions, quizAnswers } from "@chapai/db/schema";
import { eq, and, inArray, sql } from "drizzle-orm";

/**
 * Select questions weighted by blueprint percentages.
 * If category is specified, selects from that category only.
 * Otherwise, distributes questions proportionally to exam blueprint.
 */
export async function selectQuestions(
  db: DB,
  config: QuizSessionConfig
): Promise<QuizQuestion[]> {
  const { exam, category, count } = config;
  const dbRows = category
    ? await db
        .select({ id: questions.id })
        .from(questions)
        .where(and(eq(questions.exam, exam), eq(questions.category, category)))
    : await db
        .select({ id: questions.id })
        .from(questions)
        .where(eq(questions.exam, exam));
  const availableIds = new Set(dbRows.map((row) => row.id));
  const canonicalBank = getQuestionBank(exam).filter((question) => availableIds.has(question.id));

  if (category) {
    return canonicalBank
      .filter((question) => question.category === category)
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

    const rows = canonicalBank
      .filter((question) => question.category === cat && !selectedIds.has(question.id))
      .sort(() => Math.random() - 0.5)
      .slice(0, catCount);

    for (const row of rows) {
      selectedIds.add(row.id);
    }
    selected.push(...rows);
  }

  if (selected.length < count) {
    const remainder = canonicalBank
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
