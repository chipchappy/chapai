import "server-only";
import { and, gte, inArray, isNotNull, sql } from "drizzle-orm";
import { quizAnswers, quizSessions, users } from "@chapai/db/schema";
import { hasDatabase, resolveEnv, type DB, type Env } from "@/lib/db";
import {
  LOW_CONFIDENCE_ATTEMPTS,
  accuracyBand,
  accuracyPercent,
  pooledAccuracy,
  type AccuracyBand,
} from "@/lib/quiz-accuracy";

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

// D1 caps how many parameters one statement may bind. Every roster query below
// binds one parameter per student, which was harmless while a roster meant a
// single cohort of ~16 but breaks the moment the platform-admin `all` scope
// passes the whole user base in. Chunking keeps each statement well under the
// cap and keeps the queries O(users) instead of failing outright as we grow.
const D1_BIND_CHUNK = 60;

function chunk<T>(items: T[], size = D1_BIND_CHUNK): T[][] {
  if (items.length <= size) return items.length ? [items] : [];
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** Run `query` once per chunk and flatten, so no single statement exceeds the cap. */
async function gather<In, Out>(items: In[], query: (batch: In[]) => Promise<Out[]>): Promise<Out[]> {
  const results: Out[] = [];
  for (const batch of chunk(items)) results.push(...await query(batch));
  return results;
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
  /** free | plus | pro — lets a platform-wide view separate organic free
   *  signups from paying subscribers. Defaults to "free" for any user row
   *  without an explicit tier. */
  tier: "free" | "plus" | "pro";
  /** Cohort slug when the student holds an institutional grant, null for an
   *  organic signup who belongs to no school. */
  cohort: string | null;
  /** Unix seconds from users.created_at. Null only if the roster email holds
   *  a grant but never actually completed signup (no hosted user row yet). */
  signedUpAt: number | null;
  /** Sum of quiz_answers.time_spent_ms across every answer the student has
   *  made, in milliseconds. Null when the student has no timed answers at
   *  all — most rows fall here, since time_spent_ms is only populated on a
   *  fraction of answers. Never coerced to 0: that would misreport "never
   *  measured" as "measured and spent no time". */
  timeOnSiteMs: number | null;
  /** Questions actually answered (attempts). Denominator for accuracy. */
  answered: number;
  correct: number;
  /** Distinct questions seen — coverage, as opposed to raw volume. */
  uniqueQuestions: number;
  /** null when nothing has been attempted; never a percentage above 100. */
  accuracy: number | null;
  band: AccuracyBand;
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

function readinessVerdict(accuracy: number | null, answered: number): StudentRow["readiness"] {
  if (answered === 0 || accuracy == null) return { label: "Not started", tone: "blue" };
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

export type CohortAggregate = {
  count: number;
  active7: number;
  notStarted: number;
  everActive: number;
  onTrack: number;
  atRisk: number;
  totalAnswered: number;
  /** Pooled across the cohort; null when nobody has answered anything. */
  avgAccuracy: number | null;
  /** True when the cohort has answered too little for the figure to mean much. */
  lowConfidence: boolean;
  /** Automation/smoke accounts excluded from the `all` scope. 0 for a cohort. */
  hiddenAutomationAccounts: number;
};

export const EMPTY_COHORT_AGGREGATE: CohortAggregate = {
  count: 0, active7: 0, notStarted: 0, everActive: 0, onTrack: 0, atRisk: 0,
  totalAnswered: 0, avgAccuracy: null, lowConfidence: true, hiddenAutomationAccounts: 0,
};

/**
 * Which students a roster covers.
 *
 * `cohort` is the instructor-facing scope and remains strictly limited to one
 * cohort's grant holders — that is the isolation guarantee faculty rely on.
 * `all` is the platform-admin scope: every registered user, including organic
 * free signups who hold no institutional grant and are therefore invisible to
 * every cohort query. Only callers that have already passed a platform-admin
 * check may pass `all`; see lib/platform-admin.ts.
 */
export type RosterScope = { kind: "cohort"; cohort: string } | { kind: "all" };

export async function getCohortRoster(
  db: DB,
  scope: string | RosterScope,
): Promise<{ students: StudentRow[]; aggregate: CohortAggregate }> {
  const resolved: RosterScope = typeof scope === "string" ? { kind: "cohort", cohort: scope } : scope;
  const binding = raw(resolveEnv());
  if (!binding) return { students: [], aggregate: { ...EMPTY_COHORT_AGGREGATE } };

  // 1. Which emails are in scope.
  let emails: string[];
  let hiddenAutomationAccounts = 0;
  if (resolved.kind === "all") {
    // Smoke, checkout and codex runs each create a throwaway account, and they
    // outnumbered the real students badly enough to make the roster unreadable
    // (42 of 115, only 2 of which ever answered a question). Matched on the
    // automation prefixes rather than the @chapaisolutions.com domain, so real
    // staff accounts on that domain are kept. The count is reported rather than
    // silently dropped.
    const AUTOMATION = `(email LIKE 'clarity.smoke+%' OR email LIKE 'codex.%'
        OR email LIKE 'checkout-smoke-%' OR email LIKE 'checkout-tail-%'
        OR email LIKE 'launch-smoke-%')`;
    const everyone = (await binding
      .prepare(`SELECT email FROM users WHERE email IS NOT NULL AND NOT ${AUTOMATION}
                ORDER BY created_at DESC LIMIT 1000`)
      .all<{ email: string }>()).results ?? [];
    emails = everyone.map((u) => u.email).filter(Boolean);
    hiddenAutomationAccounts = Number((await binding
      .prepare(`SELECT COUNT(*) AS n FROM users WHERE email IS NOT NULL AND ${AUTOMATION}`)
      .all<{ n: number }>()).results?.[0]?.n ?? 0);
  } else {
    // Grant holders in THIS cohort only — the scoping guarantee.
    const grantRows = (await binding
      .prepare(`SELECT DISTINCT email FROM access_key_grants WHERE cohort = ? AND role = 'student' AND email IS NOT NULL LIMIT 200`)
      .bind(resolved.cohort)
      .all<{ email: string }>()).results ?? [];
    emails = grantRows.map((g) => g.email).filter(Boolean);
  }
  if (!emails.length) return { students: [], aggregate: { ...EMPTY_COHORT_AGGREGATE } };

  // 2. Map emails -> hosted user ids, tier and cohort membership.
  const hosted = await gather(emails, (batch) => db
    .select({ id: users.id, email: users.email, name: users.name, tier: users.tier, createdAt: users.createdAt })
    .from(users)
    .where(inArray(users.email, batch)));
  const idByEmail = new Map(hosted.map((h) => [h.email, h.id]));
  const nameByEmail = new Map(hosted.map((h) => [h.email, h.name]));
  const tierByEmail = new Map(hosted.map((h) => [h.email, (h.tier ?? "free") as StudentRow["tier"]]));
  const createdAtByEmail = new Map(hosted.map((h) => [h.email, h.createdAt]));
  const ids = hosted.map((h) => h.id);

  // Cohort label per student. In the `all` scope most users have none.
  const cohortByEmail = new Map<string, string>();
  {
    const rows = await gather(emails, async (batch) => (await binding
      .prepare(`SELECT email, cohort FROM access_key_grants
                WHERE role = 'student' AND cohort IS NOT NULL AND email IN (${batch.map(() => "?").join(",")})`)
      .bind(...batch)
      .all<{ email: string; cohort: string }>()).results ?? []);
    for (const r of rows) cohortByEmail.set(r.email, r.cohort);
  }

  // 3. All-time + 7-day aggregates.
  //
  // These read `quiz_answers`, NOT the `quiz_sessions` counters. `total_questions`
  // is the deck size chosen when a session is created and never grows, while
  // `correct_count` increments for every correct answer actually recorded — so a
  // student practising past the deck produced accuracy above 100% (observed live:
  // a 25-question deck with 47 answers and 32 correct rendered as 128%).
  const sevenDaysAgo = Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60;
  const allTime = await gather(ids, (batch) => db.select({
    userId: quizAnswers.userId,
    attempts: sql<number>`count(*)`,
    correct: sql<number>`sum(case when ${quizAnswers.isCorrect} = 1 then 1 else 0 end)`,
    uniqueQuestions: sql<number>`count(distinct ${quizAnswers.questionId})`,
    lastAt: sql<number>`max(${quizAnswers.answeredAt})`,
    avgTimeMs: sql<number>`avg(${quizAnswers.timeSpentMs})`,
    // SQL SUM ignores NULL rows, and itself returns NULL (not 0) when every
    // row in the group is NULL — exactly the null-vs-zero split the roster
    // needs (a student with no timed answers gets `null` here for free, with
    // no second query, instead of a manufactured 0).
    totalTimeMs: sql<number>`sum(${quizAnswers.timeSpentMs})`,
  }).from(quizAnswers).where(inArray(quizAnswers.userId, batch)).groupBy(quizAnswers.userId));
  const recent = await gather(ids, (batch) => db
    .select({ userId: quizAnswers.userId, attempts: sql<number>`count(*)` })
    .from(quizAnswers).where(and(inArray(quizAnswers.userId, batch), gte(quizAnswers.answeredAt, sevenDaysAgo))).groupBy(quizAnswers.userId));
  // Session count stays on quiz_sessions — it is a count, not a ratio, so it was
  // never affected by the denominator problem.
  const sessionCounts = await gather(ids, (batch) => db
    .select({ userId: quizSessions.userId, sessions: sql<number>`count(*)` })
    .from(quizSessions).where(and(inArray(quizSessions.userId, batch), isNotNull(quizSessions.completedAt))).groupBy(quizSessions.userId));
  const allById = new Map(allTime.map((r) => [r.userId, r]));
  const recentById = new Map(recent.map((r) => [r.userId, Number(r.attempts)]));
  const sessionCountById = new Map(sessionCounts.map((r) => [r.userId, Number(r.sessions)]));

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
    answered: number;
    correct: number;
    started_at: number;
  };

  const categoryRows = await gather(ids, async (batch) => (await binding.prepare(`
        SELECT qa.user_id, q.category, COUNT(*) AS answered,
          SUM(CASE WHEN qa.is_correct = 1 THEN 1 ELSE 0 END) AS correct,
          AVG(qa.time_spent_ms) AS avg_time_ms
        FROM quiz_answers qa
        JOIN questions q ON q.id = qa.question_id
        WHERE qa.user_id IN (${batch.map(() => "?").join(",")})
        GROUP BY qa.user_id, q.category
        ORDER BY answered DESC
      `).bind(...batch).all<CategoryAggregate>()).results ?? []);
  // Per-session totals also come from the answer rows. `total_questions` is the
  // planned deck and `correct_count` is the live tally, so dividing one by the
  // other was the source of the >100% figures on the roster and in the session
  // history alike.
  const recentSessionRows = await gather(ids, async (batch) => (await binding.prepare(`
        SELECT s.id, s.user_id, s.exam, s.category, s.started_at,
          COUNT(a.id) AS answered,
          COALESCE(SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END), 0) AS correct
        FROM quiz_sessions s
        LEFT JOIN quiz_answers a ON a.session_id = s.id
        WHERE s.user_id IN (${batch.map(() => "?").join(",")}) AND s.completed_at IS NOT NULL
        GROUP BY s.id
        HAVING answered > 0
        ORDER BY s.started_at DESC
        LIMIT 1000
      `).bind(...batch).all<RecentSession>()).results ?? []);

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
    const answered = Number(row.answered ?? 0);
    const correct = Number(row.correct ?? 0);
    const sessions = sessionsById.get(row.user_id) ?? [];
    if (sessions.length < 8) {
      sessions.push({
        id: row.id,
        exam: row.exam,
        category: row.category,
        answered,
        correct,
        accuracy: accuracyPercent(correct, answered) ?? 0,
        startedAt: Number(row.started_at),
      });
      sessionsById.set(row.user_id, sessions);
    }
  }

  const students: StudentRow[] = emails.map((email) => {
    const uid = idByEmail.get(email);
    const a = uid ? allById.get(uid) : undefined;
    const answered = Number(a?.attempts ?? 0);
    const correct = Number(a?.correct ?? 0);
    // null when nothing has been attempted — "no data" must not render as 0%.
    const accuracy = accuracyPercent(correct, answered);
    const band = accuracyBand(accuracy, answered);
    const prediction = predictPass(accuracy ?? 0, answered);
    const sessionHistory = uid ? sessionsById.get(uid) ?? [] : [];
    const timing = uid ? timeById.get(uid) : undefined;
    const trend = sessionHistory.length >= 2
      ? sessionHistory[0].accuracy - sessionHistory[1].accuracy
      : null;
    return {
      name: nameByEmail.get(email) ?? null,
      email,
      tier: tierByEmail.get(email) ?? "free",
      cohort: cohortByEmail.get(email) ?? null,
      signedUpAt: createdAtByEmail.get(email) ?? null,
      // `!= null`, not truthy — a real 0ms sum must stay 0, not fall back to null.
      timeOnSiteMs: a?.totalTimeMs != null ? Number(a.totalTimeMs) : null,
      answered,
      correct,
      uniqueQuestions: Number(a?.uniqueQuestions ?? 0),
      accuracy,
      band,
      recentAnswered: uid ? recentById.get(uid) ?? 0 : 0,
      sessions: uid ? sessionCountById.get(uid) ?? 0 : 0,
      lastActive: a?.lastAt ? Number(a.lastAt) : null,
      averageTimeSeconds: timing?.answered
        ? Math.round(timing.weightedMs / timing.answered / 1000)
        : a?.avgTimeMs
          ? Math.round(Number(a.avgTimeMs) / 1000)
          : null,
      trend,
      categories: uid ? categoriesById.get(uid) ?? [] : [],
      recentSessions: sessionHistory,
      readiness: readinessVerdict(accuracy, answered),
      prediction,
      recommendation: recommend(prediction, accuracy ?? 0, answered),
    };
  }).sort((x, y) => {
    // Never-started students sort first: with a cohort where most seats are
    // unused, activation is the action, not accuracy. Then at-risk, then the
    // rest by accuracy ascending.
    const rank = (s: StudentRow) => {
      if (s.answered === 0) return 0;
      if (s.band === "at-risk") return 1;
      if (s.band === "insufficient") return 2;
      if (s.band === "borderline") return 3;
      return 4;
    };
    return rank(x) - rank(y) || (x.accuracy ?? 0) - (y.accuracy ?? 0);
  });

  const withData = students.filter((s) => s.answered > 0);
  const aggregate = {
    count: students.length,
    active7: students.filter((s) => s.recentAnswered > 0).length,
    // Seats redeemed but never used — the number that decides a pilot.
    notStarted: students.filter((s) => s.answered === 0).length,
    everActive: withData.length,
    onTrack: students.filter((s) => s.band === "on-track" || s.band === "strong").length,
    atRisk: students.filter((s) => s.band === "at-risk").length,
    totalAnswered: withData.reduce((sum, s) => sum + s.answered, 0),
    // Pooled, not the mean of per-student percentages: otherwise a student with
    // three answers moves the cohort figure as much as one with three hundred.
    avgAccuracy: pooledAccuracy(withData.map((s) => ({ correct: s.correct, attempts: s.answered }))),
    lowConfidence: withData.reduce((sum, s) => sum + s.answered, 0) < LOW_CONFIDENCE_ATTEMPTS * 3,
    hiddenAutomationAccounts,
  };
  return { students, aggregate };
}
