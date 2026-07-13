import "server-only";
import { and, gte, inArray, isNotNull, sql } from "drizzle-orm";
import { quizSessions, users } from "@chapai/db/schema";
import { hasDatabase, resolveEnv, type DB, type Env } from "@/lib/db";

// ─────────────────────────────────────────────────────────────────────────────
// Instructor / cohort access. A cohort = all grants sharing one cohort slug
// (derived from the institution label). Instructors are strictly scoped to their
// own cohort — every roster/student query filters on the instructor's cohort, so
// one faculty account can never read another program's students.
// ─────────────────────────────────────────────────────────────────────────────

type RawBinding = {
  prepare: (sql: string) => {
    bind: (...v: Array<string | number | null>) => { all: <T = Record<string, unknown>>() => Promise<{ results?: T[] }> };
    all: <T = Record<string, unknown>>() => Promise<{ results?: T[] }>;
  };
};
function raw(env: Partial<Env>): RawBinding | null {
  if (!hasDatabase(env) || !env.DB) return null;
  return env.DB as unknown as RawBinding;
}

export type InstructorContext = { isInstructor: true; cohort: string; institution: string | null; expiresAt: number } | { isInstructor: false };

export async function getInstructorContext(input: { userId?: string | null; email?: string | null }): Promise<InstructorContext> {
  const binding = raw(resolveEnv());
  if (!binding || (!input.userId && !input.email)) return { isInstructor: false };
  try {
    const now = Math.floor(Date.now() / 1000);
    const row = (await binding
      .prepare(`SELECT cohort, institution, expires_at FROM access_key_grants
                WHERE role='instructor' AND cohort IS NOT NULL AND expires_at > ?
                  AND (user_id = ? OR email = ?)
                ORDER BY granted_at DESC LIMIT 1`)
      .bind(now, input.userId ?? "", input.email ?? "")
      .all<{ cohort: string; institution: string | null; expires_at: number }>()).results?.[0];
    if (!row?.cohort) return { isInstructor: false };
    return { isInstructor: true, cohort: row.cohort, institution: row.institution ?? null, expiresAt: row.expires_at };
  } catch {
    return { isInstructor: false };
  }
}

export type StudentRow = {
  name: string | null;
  email: string;
  answered: number;
  accuracy: number;
  recentAnswered: number;
  sessions: number;
  lastActive: number | null;
  averageTimeSeconds: number | null;
  trend: number | null;
  categories: Array<{ category: string; answered: number; correct: number; accuracy: number }>;
  recentSessions: Array<{
    id: string;
    exam: string;
    category: string | null;
    answered: number;
    correct: number;
    accuracy: number;
    startedAt: number;
  }>;
  readiness: { label: string; tone: "sage" | "gold" | "clay" | "blue" };
  prediction: { band: string; midpoint: number | null; label: string; sufficient: boolean };
  recommendation: string;
};

const ON_TRACK = 65;
const MIN_FOR_PREDICTION = 50;

function readinessVerdict(accuracy: number, answered: number): StudentRow["readiness"] {
  if (answered < 25) return { label: "Warming up", tone: "blue" };
  if (accuracy >= ON_TRACK) return { label: "On Track", tone: "sage" };
  if (accuracy >= 55) return { label: "On the cusp", tone: "gold" };
  return { label: "Needs support", tone: "clay" };
}

// Conservative, banded pass-probability estimate — never a guarantee, withheld
// until there is enough data to be meaningful.
function predictPass(accuracy: number, answered: number): StudentRow["prediction"] {
  if (answered < MIN_FOR_PREDICTION) return { band: "—", midpoint: null, label: "Insufficient data", sufficient: false };
  const early = answered < 120;
  let band: string, mid: number, label: string;
  if (accuracy >= 72) { band = "85–92%"; mid = 88; label = "Strong"; }
  else if (accuracy >= ON_TRACK) { band = "72–84%"; mid = 78; label = "On track"; }
  else if (accuracy >= 58) { band = "55–71%"; mid = 63; label = "Borderline"; }
  else if (accuracy >= 50) { band = "40–54%"; mid = 47; label = "At risk"; }
  else { band = "25–39%"; mid = 32; label = "High risk"; }
  return { band: early ? `${band} (early)` : band, midpoint: mid, label, sufficient: true };
}

function recommend(r: StudentRow["prediction"], accuracy: number, answered: number): string {
  if (!r.sufficient) return `Encourage more practice — ${Math.max(0, MIN_FOR_PREDICTION - answered)} more questions unlock a readiness read.`;
  if (accuracy < 58) return "At-risk: prioritize remediation in weakest categories and schedule a 1:1 check-in.";
  if (accuracy < ON_TRACK) return "Borderline: focus review on weak lanes and add a timed readiness exam this week.";
  if (accuracy < 72) return "On track: maintain volume and stretch with NGN case studies + timed exams.";
  return "Strong: keep momentum; use as a peer mentor and target the last weak subcategory.";
}

export async function getCohortRoster(db: DB, cohort: string): Promise<{ students: StudentRow[]; aggregate: { count: number; active7: number; onTrack: number; atRisk: number; avgAccuracy: number } }> {
  const binding = raw(resolveEnv());
  if (!binding) return { students: [], aggregate: { count: 0, active7: 0, onTrack: 0, atRisk: 0, avgAccuracy: 0 } };

  // 1. Student emails in THIS cohort only (the scoping guarantee).
  const grantRows = (await binding
    .prepare(`SELECT DISTINCT email FROM access_key_grants WHERE cohort = ? AND role = 'student' AND email IS NOT NULL LIMIT 200`)
    .bind(cohort)
    .all<{ email: string }>()).results ?? [];
  const emails = grantRows.map((g) => g.email).filter(Boolean);
  if (!emails.length) return { students: [], aggregate: { count: 0, active7: 0, onTrack: 0, atRisk: 0, avgAccuracy: 0 } };

  // 2. Map emails -> hosted user ids.
  const hosted = await db.select({ id: users.id, email: users.email, name: users.name }).from(users).where(inArray(users.email, emails));
  const idByEmail = new Map(hosted.map((h) => [h.email, h.id]));
  const nameByEmail = new Map(hosted.map((h) => [h.email, h.name]));
  const ids = hosted.map((h) => h.id);

  // 3. All-time + 7-day aggregates over completed sessions for those students.
  const sevenDaysAgo = Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60;
  const allTime = ids.length
    ? await db.select({
        userId: quizSessions.userId,
        answered: sql<number>`sum(${quizSessions.totalQuestions})`,
        correct: sql<number>`sum(${quizSessions.correctCount})`,
        sessions: sql<number>`count(*)`,
        lastAt: sql<number>`max(${quizSessions.startedAt})`,
      }).from(quizSessions).where(and(inArray(quizSessions.userId, ids), isNotNull(quizSessions.completedAt))).groupBy(quizSessions.userId)
    : [];
  const recent = ids.length
    ? await db.select({ userId: quizSessions.userId, answered: sql<number>`sum(${quizSessions.totalQuestions})` })
        .from(quizSessions).where(and(inArray(quizSessions.userId, ids), isNotNull(quizSessions.completedAt), gte(quizSessions.startedAt, sevenDaysAgo))).groupBy(quizSessions.userId)
    : [];
  const allById = new Map(allTime.map((r) => [r.userId, r]));
  const recentById = new Map(recent.map((r) => [r.userId, Number(r.answered)]));

  type CategoryAggregate = {
    user_id: string;
    category: string;
    answered: number;
    correct: number;
    avg_time_ms: number | null;
  };
  type RecentSession = {
    id: string;
    user_id: string;
    exam: string;
    category: string | null;
    total_questions: number;
    correct_count: number;
    started_at: number;
  };

  const placeholders = ids.map(() => "?").join(",");
  const categoryRows = ids.length
    ? (await binding.prepare(`
        SELECT qa.user_id, q.category, COUNT(*) AS answered,
          SUM(CASE WHEN qa.is_correct = 1 THEN 1 ELSE 0 END) AS correct,
          AVG(qa.time_spent_ms) AS avg_time_ms
        FROM quiz_answers qa
        JOIN questions q ON q.id = qa.question_id
        WHERE qa.user_id IN (${placeholders})
        GROUP BY qa.user_id, q.category
        ORDER BY answered DESC
      `).bind(...ids).all<CategoryAggregate>()).results ?? []
    : [];
  const recentSessionRows = ids.length
    ? (await binding.prepare(`
        SELECT id, user_id, exam, category, total_questions, correct_count, started_at
        FROM quiz_sessions
        WHERE user_id IN (${placeholders}) AND completed_at IS NOT NULL
        ORDER BY started_at DESC
        LIMIT 1000
      `).bind(...ids).all<RecentSession>()).results ?? []
    : [];

  const categoriesById = new Map<string, StudentRow["categories"]>();
  const timeById = new Map<string, { weightedMs: number; answered: number }>();
  for (const row of categoryRows) {
    const answered = Number(row.answered ?? 0);
    const correct = Number(row.correct ?? 0);
    const categories = categoriesById.get(row.user_id) ?? [];
    categories.push({
      category: row.category || "Uncategorized",
      answered,
      correct,
      accuracy: answered > 0 ? Math.round((correct / answered) * 100) : 0,
    });
    categoriesById.set(row.user_id, categories);
    if (row.avg_time_ms != null && answered > 0) {
      const timing = timeById.get(row.user_id) ?? { weightedMs: 0, answered: 0 };
      timing.weightedMs += Number(row.avg_time_ms) * answered;
      timing.answered += answered;
      timeById.set(row.user_id, timing);
    }
  }

  const sessionsById = new Map<string, StudentRow["recentSessions"]>();
  for (const row of recentSessionRows) {
    const answered = Number(row.total_questions ?? 0);
    const correct = Number(row.correct_count ?? 0);
    const sessions = sessionsById.get(row.user_id) ?? [];
    if (sessions.length < 8) {
      sessions.push({
        id: row.id,
        exam: row.exam,
        category: row.category,
        answered,
        correct,
        accuracy: answered > 0 ? Math.round((correct / answered) * 100) : 0,
        startedAt: Number(row.started_at),
      });
      sessionsById.set(row.user_id, sessions);
    }
  }

  const students: StudentRow[] = emails.map((email) => {
    const uid = idByEmail.get(email);
    const a = uid ? allById.get(uid) : undefined;
    const answered = Number(a?.answered ?? 0);
    const correct = Number(a?.correct ?? 0);
    const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;
    const prediction = predictPass(accuracy, answered);
    const sessionHistory = uid ? sessionsById.get(uid) ?? [] : [];
    const timing = uid ? timeById.get(uid) : undefined;
    const trend = sessionHistory.length >= 2
      ? sessionHistory[0].accuracy - sessionHistory[1].accuracy
      : null;
    return {
      name: nameByEmail.get(email) ?? null,
      email,
      answered,
      accuracy,
      recentAnswered: uid ? recentById.get(uid) ?? 0 : 0,
      sessions: Number(a?.sessions ?? 0),
      lastActive: a?.lastAt ? Number(a.lastAt) : null,
      averageTimeSeconds: timing?.answered ? Math.round(timing.weightedMs / timing.answered / 1000) : null,
      trend,
      categories: uid ? categoriesById.get(uid) ?? [] : [],
      recentSessions: sessionHistory,
      readiness: readinessVerdict(accuracy, answered),
      prediction,
      recommendation: recommend(prediction, accuracy, answered),
    };
  }).sort((x, y) => {
    // At-risk students float to the top so faculty see who needs help first.
    const rank = (s: StudentRow) => (s.answered < MIN_FOR_PREDICTION ? 1 : s.accuracy < 58 ? 0 : s.accuracy < ON_TRACK ? 2 : 3);
    return rank(x) - rank(y) || x.accuracy - y.accuracy;
  });

  const withData = students.filter((s) => s.answered > 0);
  const aggregate = {
    count: students.length,
    active7: students.filter((s) => s.recentAnswered > 0).length,
    onTrack: students.filter((s) => s.accuracy >= ON_TRACK && s.answered >= 25).length,
    atRisk: students.filter((s) => s.answered >= MIN_FOR_PREDICTION && s.accuracy < 58).length,
    avgAccuracy: withData.length ? Math.round(withData.reduce((sum, s) => sum + s.accuracy, 0) / withData.length) : 0,
  };
  return { students, aggregate };
}
