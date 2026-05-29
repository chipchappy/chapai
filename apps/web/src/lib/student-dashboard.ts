import "server-only";

import { and, desc, eq, gte, inArray, isNotNull, sql as drizzleSql } from "drizzle-orm";
import type { DB } from "@/lib/db";
import {
  dailyUsage,
  questions,
  quizAnswers,
  quizSessions,
  reviewSchedule,
} from "@chapai/db/schema";

export type StudentCategoryStat = {
  category: string;
  exam: "nclex" | "ccrn";
  answered: number;
  correct: number;
  accuracy: number;
  lastAnsweredAt: string | null;
};

export type StudentRecentSession = {
  id: string;
  exam: "nclex" | "ccrn";
  category: string | null;
  totalQuestions: number;
  correctCount: number;
  accuracy: number;
  startedAt: string;
  completedAt: string | null;
};

export type StudentDayActivity = {
  date: string;
  count: number;
};

export type ReadinessAttemptRecord = {
  examId: string;
  accuracy: number;
  correctAnswers: number;
  totalQuestions: number;
  takenAtMs: number;
};

/**
 * Cross-device readiness exam history. Reads completed quiz_sessions rows
 * tagged with a practice_exam_id and returns the latest attempt per exam id.
 */
export async function getReadinessAttempts(
  db: DB | null,
  userId: string | null | undefined,
): Promise<Record<string, ReadinessAttemptRecord>> {
  if (!db || !userId) return {};
  try {
    const rows = await db
      .select({
        practiceExamId: quizSessions.practiceExamId,
        totalQuestions: quizSessions.totalQuestions,
        correctCount: quizSessions.correctCount,
        completedAt: quizSessions.completedAt,
      })
      .from(quizSessions)
      .where(
        and(
          eq(quizSessions.userId, userId),
          isNotNull(quizSessions.practiceExamId),
          isNotNull(quizSessions.completedAt),
        ),
      )
      .orderBy(desc(quizSessions.completedAt))
      .limit(50);

    const latest: Record<string, ReadinessAttemptRecord> = {};
    for (const row of rows) {
      const examId = row.practiceExamId ?? "";
      if (!examId || latest[examId]) continue;
      const total = row.totalQuestions ?? 0;
      const correct = row.correctCount ?? 0;
      latest[examId] = {
        examId,
        accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
        correctAnswers: correct,
        totalQuestions: total,
        takenAtMs: (row.completedAt ?? 0) * 1000,
      };
    }
    return latest;
  } catch {
    return {};
  }
}

/**
 * Compute the correctCount and total for each in-progress practice-exam session
 * by joining quiz_answers. Updates quiz_sessions.correct_count + completed_at
 * when the session is fully answered. Best-effort — safe to call on every
 * page render.
 */
export async function finalizeReadinessSession(
  db: DB | null,
  input: { sessionId: string; userId: string },
): Promise<void> {
  if (!db) return;
  try {
    const session = await db
      .select({
        id: quizSessions.id,
        totalQuestions: quizSessions.totalQuestions,
        completedAt: quizSessions.completedAt,
        userId: quizSessions.userId,
      })
      .from(quizSessions)
      .where(eq(quizSessions.id, input.sessionId))
      .get();
    if (!session || session.userId !== input.userId) return;
    if (session.completedAt) return;

    const answerRows = await db
      .select({
        isCorrect: quizAnswers.isCorrect,
      })
      .from(quizAnswers)
      .where(eq(quizAnswers.sessionId, input.sessionId));
    const correctCount = answerRows.reduce((sum, r) => sum + (r.isCorrect ? 1 : 0), 0);
    if (answerRows.length >= session.totalQuestions) {
      await db
        .update(quizSessions)
        .set({
          correctCount,
          completedAt: Math.floor(Date.now() / 1000),
        })
        .where(eq(quizSessions.id, input.sessionId));
    } else {
      await db
        .update(quizSessions)
        .set({ correctCount })
        .where(eq(quizSessions.id, input.sessionId));
    }
  } catch {
    // best-effort
  }
}

void drizzleSql; // reserved for future joins

export type TutorFollowupItem = {
  questionId: string;
  category: string;
  exam: "nclex" | "ccrn";
  stemPreview: string;
  answeredAtMs: number;
};

/**
 * Last-7-days missed questions for tutor follow-up. Returns up to `limit` items
 * keyed off the most recent miss, deduped by question id (we don't surface the
 * same miss twice even if it was attempted multiple times).
 */
export async function getRecentMissesForTutor(
  db: DB | null,
  userId: string | null | undefined,
  limit = 4,
): Promise<TutorFollowupItem[]> {
  if (!db || !userId) return [];
  try {
    const nowSec = Math.floor(Date.now() / 1000);
    const since7Sec = nowSec - 7 * SECONDS_PER_DAY;

    const missed = await db
      .select({
        questionId: quizAnswers.questionId,
        answeredAt: quizAnswers.answeredAt,
        isCorrect: quizAnswers.isCorrect,
      })
      .from(quizAnswers)
      .where(and(eq(quizAnswers.userId, userId), gte(quizAnswers.answeredAt, since7Sec)))
      .orderBy(desc(quizAnswers.answeredAt))
      .limit(300);

    const seen = new Set<string>();
    const recentMisses: Array<{ questionId: string; answeredAt: number }> = [];
    for (const row of missed) {
      if (row.isCorrect) continue;
      if (seen.has(row.questionId)) continue;
      seen.add(row.questionId);
      recentMisses.push({ questionId: row.questionId, answeredAt: row.answeredAt });
      if (recentMisses.length >= limit) break;
    }
    if (recentMisses.length === 0) return [];

    const ids = recentMisses.map((r) => r.questionId);
    const metaRows = await db
      .select({
        id: questions.id,
        category: questions.category,
        exam: questions.exam,
        stem: questions.stem,
      })
      .from(questions)
      .where(inArray(questions.id, ids));
    const metaMap = new Map(metaRows.map((row) => [row.id, row]));

    return recentMisses
      .map((m) => {
        const meta = metaMap.get(m.questionId);
        if (!meta) return null;
        const stem = meta.stem ?? "";
        const stemPreview =
          stem.length > 140 ? `${stem.slice(0, 137).trimEnd()}…` : stem;
        return {
          questionId: m.questionId,
          category: meta.category,
          exam: meta.exam,
          stemPreview,
          answeredAtMs: m.answeredAt * 1000,
        } satisfies TutorFollowupItem;
      })
      .filter((item): item is TutorFollowupItem => item !== null);
  } catch {
    return [];
  }
}

export type ReadinessCategoryDelta = {
  category: string;
  attempts: number;       // number of distinct attempts compared
  earliest: number;       // accuracy %
  latest: number;         // accuracy %
  delta: number;          // latest - earliest
  latestTakenAtMs: number;
};

/**
 * Compare per-category accuracy across the user's most recent practice-exam attempts.
 * Returns up to `topN` categories with the largest movement (positive or negative).
 */
export async function getReadinessCategoryDeltas(
  db: DB | null,
  userId: string | null | undefined,
  topN = 4,
): Promise<ReadinessCategoryDelta[]> {
  if (!db || !userId) return [];
  try {
    // Pull last 3 completed practice-exam sessions for this user.
    const sessions = await db
      .select({
        id: quizSessions.id,
        completedAt: quizSessions.completedAt,
      })
      .from(quizSessions)
      .where(
        and(
          eq(quizSessions.userId, userId),
          isNotNull(quizSessions.practiceExamId),
          isNotNull(quizSessions.completedAt),
        ),
      )
      .orderBy(desc(quizSessions.completedAt))
      .limit(3);
    if (sessions.length < 2) return [];

    // Fetch all answers for these sessions in one shot.
    const sessionIds = sessions.map((s) => s.id);
    const answerRows = await db
      .select({
        sessionId: quizAnswers.sessionId,
        questionId: quizAnswers.questionId,
        isCorrect: quizAnswers.isCorrect,
      })
      .from(quizAnswers)
      .where(inArray(quizAnswers.sessionId, sessionIds));
    if (answerRows.length === 0) return [];

    // Join in question metadata for category.
    const uniqueQuestionIds = Array.from(new Set(answerRows.map((r) => r.questionId)));
    const questionMeta = new Map<string, { category: string }>();
    for (let i = 0; i < uniqueQuestionIds.length; i += 100) {
      const chunk = uniqueQuestionIds.slice(i, i + 100);
      const rows = await db
        .select({ id: questions.id, category: questions.category })
        .from(questions)
        .where(inArray(questions.id, chunk));
      for (const row of rows) {
        questionMeta.set(row.id, { category: row.category });
      }
    }

    // Per session, per category: correct / total
    type Bucket = { correct: number; total: number };
    const perSession = new Map<string, Map<string, Bucket>>();
    for (const sessionId of sessionIds) perSession.set(sessionId, new Map());
    for (const row of answerRows) {
      const meta = questionMeta.get(row.questionId);
      if (!meta) continue;
      const map = perSession.get(row.sessionId);
      if (!map) continue;
      const bucket = map.get(meta.category) ?? { correct: 0, total: 0 };
      bucket.total += 1;
      if (row.isCorrect) bucket.correct += 1;
      map.set(meta.category, bucket);
    }

    // Sessions are sorted desc by completedAt → reverse for chronological order
    const orderedSessions = [...sessions].reverse();
    const categoryUnion = new Set<string>();
    for (const sessionId of sessionIds) {
      for (const cat of perSession.get(sessionId)?.keys() ?? []) {
        categoryUnion.add(cat);
      }
    }

    const deltas: ReadinessCategoryDelta[] = [];
    for (const category of categoryUnion) {
      const samples: Array<{ accuracy: number; completedAt: number }> = [];
      for (const sess of orderedSessions) {
        const bucket = perSession.get(sess.id)?.get(category);
        if (!bucket || bucket.total < 3) continue; // need a meaningful sample
        samples.push({
          accuracy: Math.round((bucket.correct / bucket.total) * 100),
          completedAt: sess.completedAt ?? 0,
        });
      }
      if (samples.length < 2) continue;
      const earliest = samples[0].accuracy;
      const latest = samples[samples.length - 1].accuracy;
      deltas.push({
        category,
        attempts: samples.length,
        earliest,
        latest,
        delta: latest - earliest,
        latestTakenAtMs: samples[samples.length - 1].completedAt * 1000,
      });
    }

    deltas.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
    return deltas.slice(0, topN);
  } catch {
    return [];
  }
}

export type StudentDashboardData = {
  hasData: boolean;
  totalAnswered: number;
  totalCorrect: number;
  overallAccuracy: number;
  last7DayAnswered: number;
  last7DayAccuracy: number;
  last30DayAnswered: number;
  streakDays: number;
  longestStreakDays: number;
  weeklyActivity: StudentDayActivity[]; // 7 days
  categoryStats: StudentCategoryStat[]; // sorted by accuracy desc
  weakAreas: StudentCategoryStat[];      // worst categories with volume
  strengths: StudentCategoryStat[];      // top categories
  suggestedCategory: StudentCategoryStat | null;
  recentSessions: StudentRecentSession[];
  reviewQueueSize: number;
  baselineTakenAt: string | null;       // ISO date of earliest completed readiness exam
  daysSinceBaseline: number | null;
  todayAnswered: number;                 // questions answered today (local day key)
  tutorCallsThisWeek: number;            // AI tutor invocations in last 7 days
  readinessScore: number; // 0-100, blends accuracy + coverage
  estimatedDaysToReady: number | null;
  examFocus: "nclex" | "ccrn" | "mixed" | "none";
};

const SECONDS_PER_DAY = 24 * 60 * 60;

function fmtDate(unix: number) {
  return new Date(unix * 1000).toISOString();
}

function fmtDay(unix: number) {
  return new Date(unix * 1000).toISOString().slice(0, 10);
}

function clamp(value: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, value));
}

function computeStreak(daysWithActivity: Set<string>): { current: number; longest: number } {
  if (daysWithActivity.size === 0) return { current: 0, longest: 0 };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let current = 0;
  for (let i = 0; i < 365; i += 1) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);
    const key = day.toISOString().slice(0, 10);
    if (daysWithActivity.has(key)) {
      current += 1;
    } else if (i === 0) {
      // missed today — current streak ends if yesterday is missed too
      continue;
    } else {
      break;
    }
  }

  // Longest streak: scan sorted day list
  const sortedDays = Array.from(daysWithActivity).sort();
  let longest = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const dayKey of sortedDays) {
    const day = new Date(`${dayKey}T00:00:00Z`);
    if (prev) {
      const gap = Math.round((day.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
      run = gap === 1 ? run + 1 : 1;
    } else {
      run = 1;
    }
    longest = Math.max(longest, run);
    prev = day;
  }
  return { current, longest };
}

const NCLEX_TOTAL_CATEGORIES = 8;
const CCRN_TOTAL_CATEGORIES = 8;
const READINESS_ACCURACY_TARGET = 70;
const READINESS_VOLUME_TARGET = 750;

function computeReadinessScore(opts: {
  totalAnswered: number;
  overallAccuracy: number;
  categoriesCovered: number;
  examFocus: "nclex" | "ccrn" | "mixed" | "none";
}) {
  if (opts.totalAnswered < 5) return 0;
  const accuracyPart = clamp(opts.overallAccuracy / READINESS_ACCURACY_TARGET, 0, 1) * 55;
  const volumePart = clamp(opts.totalAnswered / READINESS_VOLUME_TARGET, 0, 1) * 30;
  const totalCats = opts.examFocus === "ccrn" ? CCRN_TOTAL_CATEGORIES : NCLEX_TOTAL_CATEGORIES;
  const coveragePart = clamp(opts.categoriesCovered / totalCats, 0, 1) * 15;
  return Math.round(accuracyPart + volumePart + coveragePart);
}

export async function getStudentDashboardData(
  db: DB | null,
  input: { userId?: string | null; email?: string | null },
): Promise<StudentDashboardData> {
  const userId = input.userId ?? null;
  if (!userId || !db) {
    return emptyDashboard();
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const since30Sec = nowSec - 30 * SECONDS_PER_DAY;

  // ── Sessions ──
  const sessions = await db
    .select()
    .from(quizSessions)
    .where(eq(quizSessions.userId, userId))
    .orderBy(desc(quizSessions.startedAt))
    .limit(40);

  // ── Answers (last 90 days) ──
  const since90Sec = nowSec - 90 * SECONDS_PER_DAY;
  const answers = await db
    .select({
      id: quizAnswers.id,
      questionId: quizAnswers.questionId,
      isCorrect: quizAnswers.isCorrect,
      answeredAt: quizAnswers.answeredAt,
    })
    .from(quizAnswers)
    .where(and(eq(quizAnswers.userId, userId), gte(quizAnswers.answeredAt, since90Sec)))
    .orderBy(desc(quizAnswers.answeredAt))
    .limit(4000);

  // ── Question category map (only for questions actually answered) ──
  const questionIds = Array.from(new Set(answers.map((row) => row.questionId)));
  const questionMeta = new Map<string, { category: string; exam: "nclex" | "ccrn" }>();
  for (let i = 0; i < questionIds.length; i += 100) {
    const chunk = questionIds.slice(i, i + 100);
    const rows = await db
      .select({ id: questions.id, category: questions.category, exam: questions.exam })
      .from(questions)
      .where(inArray(questions.id, chunk));
    for (const row of rows) {
      questionMeta.set(row.id, { category: row.category, exam: row.exam });
    }
  }

  // ── Aggregations ──
  let totalAnswered = 0;
  let totalCorrect = 0;
  let last7Answered = 0;
  let last7Correct = 0;
  let last30Answered = 0;
  const categoryAgg = new Map<
    string,
    { exam: "nclex" | "ccrn"; answered: number; correct: number; lastAnsweredAt: number | null }
  >();
  const daysWithActivity = new Set<string>();
  const last7DaysCount = new Map<string, number>();

  const since7Sec = nowSec - 7 * SECONDS_PER_DAY;

  for (const row of answers) {
    totalAnswered += 1;
    if (row.isCorrect) totalCorrect += 1;

    const dayKey = fmtDay(row.answeredAt);
    daysWithActivity.add(dayKey);

    if (row.answeredAt >= since7Sec) {
      last7Answered += 1;
      if (row.isCorrect) last7Correct += 1;
      last7DaysCount.set(dayKey, (last7DaysCount.get(dayKey) ?? 0) + 1);
    }
    if (row.answeredAt >= since30Sec) {
      last30Answered += 1;
    }
    // todayAnswered handled outside this branch — see todayKey accumulation below

    const meta = questionMeta.get(row.questionId);
    if (meta) {
      const key = `${meta.exam}::${meta.category}`;
      const existing = categoryAgg.get(key) ?? {
        exam: meta.exam,
        answered: 0,
        correct: 0,
        lastAnsweredAt: null as number | null,
      };
      existing.answered += 1;
      if (row.isCorrect) existing.correct += 1;
      existing.lastAnsweredAt = Math.max(existing.lastAnsweredAt ?? 0, row.answeredAt);
      categoryAgg.set(key, existing);
    }
  }

  // ── 7-day activity series (Mon..Sun in user's locale equivalent — use last 7 calendar days) ──
  const weeklyActivity: StudentDayActivity[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - i);
    const key = day.toISOString().slice(0, 10);
    weeklyActivity.push({ date: key, count: last7DaysCount.get(key) ?? 0 });
  }

  // ── Category stats ──
  const categoryStats: StudentCategoryStat[] = Array.from(categoryAgg.entries())
    .map(([key, value]) => {
      const [, category] = key.split("::");
      return {
        category,
        exam: value.exam,
        answered: value.answered,
        correct: value.correct,
        accuracy: value.answered > 0 ? Math.round((value.correct / value.answered) * 100) : 0,
        lastAnsweredAt: value.lastAnsweredAt ? fmtDate(value.lastAnsweredAt) : null,
      };
    })
    .sort((a, b) => b.accuracy - a.accuracy || b.answered - a.answered);

  // Weak areas: categories with at least 8 attempts, lowest accuracy
  const VOLUME_THRESHOLD = 5;
  const weakCandidates = categoryStats
    .filter((c) => c.answered >= VOLUME_THRESHOLD)
    .sort((a, b) => a.accuracy - b.accuracy || b.answered - a.answered);
  const weakAreas = weakCandidates.slice(0, 5);
  const strengths = [...categoryStats]
    .filter((c) => c.answered >= VOLUME_THRESHOLD)
    .sort((a, b) => b.accuracy - a.accuracy)
    .slice(0, 3);

  const suggestedCategory =
    weakCandidates[0] ??
    // Else categories under VOLUME_THRESHOLD that exist
    categoryStats.find((c) => c.accuracy < 70) ??
    categoryStats[0] ??
    null;

  // Exam focus
  const examCounts = { nclex: 0, ccrn: 0 } as Record<"nclex" | "ccrn", number>;
  for (const s of sessions) examCounts[s.exam] = (examCounts[s.exam] ?? 0) + 1;
  let examFocus: "nclex" | "ccrn" | "mixed" | "none" = "none";
  if (examCounts.nclex === 0 && examCounts.ccrn === 0) examFocus = "none";
  else if (examCounts.nclex > 0 && examCounts.ccrn > 0) examFocus = "mixed";
  else if (examCounts.nclex > examCounts.ccrn) examFocus = "nclex";
  else examFocus = "ccrn";

  const { current: streakDays, longest: longestStreakDays } = computeStreak(daysWithActivity);

  const recentSessions: StudentRecentSession[] = sessions.slice(0, 6).map((row) => ({
    id: row.id,
    exam: row.exam,
    category: row.category,
    totalQuestions: row.totalQuestions,
    correctCount: row.correctCount,
    accuracy:
      row.totalQuestions > 0 ? Math.round((row.correctCount / row.totalQuestions) * 100) : 0,
    startedAt: fmtDate(row.startedAt),
    completedAt: row.completedAt ? fmtDate(row.completedAt) : null,
  }));

  // ── Review queue: cards due now ──
  const dueRows = await db
    .select({ questionId: reviewSchedule.questionId })
    .from(reviewSchedule)
    .where(and(eq(reviewSchedule.userId, userId), gte(reviewSchedule.nextReviewAt, nowSec)))
    .limit(2000);
  const reviewQueueSize = dueRows.length;

  // ── Baseline: earliest completed readiness exam (practice-exam mode session) ──
  const baselineSessions = sessions
    .filter((s) => s.completedAt !== null && /sim|exam|practice/i.test(JSON.stringify(s).slice(0, 200)))
    .sort((a, b) => (a.completedAt ?? 0) - (b.completedAt ?? 0));
  // Fallback heuristic: any completed session with totalQuestions >= 50 counts as a readiness-grade attempt
  const baselineSession =
    baselineSessions.find((s) => s.totalQuestions >= 50) ??
    sessions.filter((s) => s.completedAt !== null && s.totalQuestions >= 50).sort((a, b) => (a.completedAt ?? 0) - (b.completedAt ?? 0))[0] ??
    null;
  const baselineTakenAt = baselineSession?.completedAt ? fmtDate(baselineSession.completedAt) : null;
  const daysSinceBaseline = baselineSession?.completedAt
    ? Math.floor((nowSec - baselineSession.completedAt) / SECONDS_PER_DAY)
    : null;

  // ── Today's count ──
  const todayKey = new Date();
  todayKey.setHours(0, 0, 0, 0);
  const todayKeyStr = todayKey.toISOString().slice(0, 10);
  const todayAnswered = answers.filter((row) => fmtDay(row.answeredAt) === todayKeyStr).length;

  // ── Tutor usage (last 7 days, summed from daily_usage) ──
  let tutorCallsThisWeek = 0;
  try {
    const since7Date = new Date();
    since7Date.setDate(since7Date.getDate() - 7);
    const since7Str = since7Date.toISOString().slice(0, 10);
    const tutorRows = await db
      .select({ tutorCallsUsed: dailyUsage.tutorCallsUsed })
      .from(dailyUsage)
      .where(and(eq(dailyUsage.userId, userId), gte(dailyUsage.date, since7Str)));
    tutorCallsThisWeek = tutorRows.reduce((sum, r) => sum + (r.tutorCallsUsed ?? 0), 0);
  } catch {
    tutorCallsThisWeek = 0;
  }

  const overallAccuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
  const last7Accuracy = last7Answered > 0 ? Math.round((last7Correct / last7Answered) * 100) : 0;

  const readinessScore = computeReadinessScore({
    totalAnswered,
    overallAccuracy,
    categoriesCovered: categoryStats.length,
    examFocus,
  });

  // Estimated days to ready: if at 30 q/day pace, how many days to hit 750 q + 70% accuracy
  const pacePerDay =
    last30Answered > 0 ? Math.max(5, Math.round(last30Answered / 30)) : null;
  const questionsToTarget = Math.max(0, READINESS_VOLUME_TARGET - totalAnswered);
  const estimatedDaysToReady = pacePerDay && questionsToTarget > 0
    ? Math.ceil(questionsToTarget / pacePerDay)
    : (totalAnswered >= READINESS_VOLUME_TARGET && overallAccuracy >= READINESS_ACCURACY_TARGET ? 0 : null);

  return {
    hasData: totalAnswered > 0,
    totalAnswered,
    totalCorrect,
    overallAccuracy,
    last7DayAnswered: last7Answered,
    last7DayAccuracy: last7Accuracy,
    last30DayAnswered: last30Answered,
    streakDays,
    longestStreakDays,
    weeklyActivity,
    categoryStats,
    weakAreas,
    strengths,
    suggestedCategory,
    recentSessions,
    reviewQueueSize,
    baselineTakenAt,
    daysSinceBaseline,
    todayAnswered,
    tutorCallsThisWeek,
    readinessScore,
    estimatedDaysToReady,
    examFocus,
  };
}

function emptyDashboard(): StudentDashboardData {
  const weeklyActivity: StudentDayActivity[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - i);
    weeklyActivity.push({ date: day.toISOString().slice(0, 10), count: 0 });
  }
  return {
    hasData: false,
    totalAnswered: 0,
    totalCorrect: 0,
    overallAccuracy: 0,
    last7DayAnswered: 0,
    last7DayAccuracy: 0,
    last30DayAnswered: 0,
    streakDays: 0,
    longestStreakDays: 0,
    weeklyActivity,
    categoryStats: [],
    weakAreas: [],
    strengths: [],
    suggestedCategory: null,
    recentSessions: [],
    reviewQueueSize: 0,
    baselineTakenAt: null,
    daysSinceBaseline: null,
    todayAnswered: 0,
    tutorCallsThisWeek: 0,
    readinessScore: 0,
    estimatedDaysToReady: null,
    examFocus: "none",
  };
}
