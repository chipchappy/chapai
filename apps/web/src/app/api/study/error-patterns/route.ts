import { eq, inArray } from "drizzle-orm";
import { questions, quizAnswers } from "@chapai/db/schema";
import { getDB, hasDatabase, resolveEnv } from "@/lib/db";
import { getHostedUserByAccount } from "@/lib/billing-store";
import { createRequestContext, logError } from "@/lib/logger";
import { jsonSuccess } from "@/lib/http";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { detectErrorPatterns, summarizeTopPattern, type AnswerRecord } from "@/lib/error-patterns";

export const dynamic = "force-dynamic";

// Reasoning-error diagnosis for the study dashboard.
//
// Answers the question a topic breakdown cannot: not "which subject is weak"
// but "how are you thinking wrong". See lib/error-patterns.ts for the taxonomy
// and for why it refuses to report anything it cannot support.
//
// Fails soft in every direction — no account, no database, thin data, or a
// query error all return { patterns: [] }, which the dashboard renders as
// nothing. An empty result must never be dressed up as praise: "no detected
// pattern" is not the same as "no problem".

/** Enough answers for the per-pattern thresholds to mean anything at all. */
const MIN_ANSWERS = 20;
/** Recent work only. A habit fixed two months ago should stop being reported. */
const MAX_ANSWERS = 400;

const EMPTY = { patterns: [], summary: null, analyzed: 0 };

function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string" || !value) return fallback;
  try {
    const parsed = JSON.parse(value);
    return (parsed ?? fallback) as T;
  } catch { return fallback; }
}

export async function GET(request: Request) {
  const context = createRequestContext(request);
  try {
    const account = await getAuthenticatedUser();
    if (!account) return jsonSuccess(EMPTY);

    const env = resolveEnv();
    if (!hasDatabase(env)) return jsonSuccess(EMPTY);
    const db = getDB(env);

    const user = await getHostedUserByAccount(db, account);
    if (!user) return jsonSuccess(EMPTY);

    const rows = await db
      .select({
        selectedAnswer: quizAnswers.selectedAnswer,
        isCorrect: quizAnswers.isCorrect,
        timeSpentMs: quizAnswers.timeSpentMs,
        type: questions.type,
        options: questions.options,
        answer: questions.answer,
      })
      .from(quizAnswers)
      .innerJoin(questions, eq(questions.id, quizAnswers.questionId))
      .where(eq(quizAnswers.userId, user.id))
      .orderBy(quizAnswers.answeredAt)
      .limit(MAX_ANSWERS);

    if (rows.length < MIN_ANSWERS) {
      return jsonSuccess({ ...EMPTY, analyzed: rows.length });
    }

    const records: AnswerRecord[] = rows.map((row) => ({
      questionType: String(row.type ?? "mcq"),
      options: parseJson<Array<{ id: string; text: string }>>(row.options, []),
      // Both columns hold either a bare id or a JSON array depending on type,
      // so hand the raw string through when it does not parse as JSON.
      correctAnswer: parseJson<string | string[]>(row.answer, String(row.answer ?? "")),
      selectedAnswer: parseJson<string | string[]>(row.selectedAnswer, String(row.selectedAnswer ?? "")),
      isCorrect: Number(row.isCorrect) === 1,
      timeSpentMs: row.timeSpentMs ?? null,
    }));

    const patterns = detectErrorPatterns(records);
    return jsonSuccess({
      patterns,
      summary: summarizeTopPattern(patterns),
      analyzed: records.length,
    });
  } catch (error) {
    logError("error-patterns failed; returning empty", error, context);
    return jsonSuccess(EMPTY);
  }
}
