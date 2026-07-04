import { and, eq, isNotNull } from "drizzle-orm";
import { quizSessions } from "@chapai/db/schema";
import { getDB, hasDatabase, resolveEnv } from "@/lib/db";
import { getHostedUserByAccount } from "@/lib/billing-store";
import { createRequestContext, logError } from "@/lib/logger";
import { jsonSuccess } from "@/lib/http";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Personalized AI study evaluation for the dashboard. Derives the student's real
// aggregate stats server-side and asks Gemini for a short coach-style read.
// Fails soft: any missing key, thin data, or model error returns { evaluation: null }
// and the dashboard keeps its rule-based coach note. Evaluations are memoized
// per user for 6h so a dashboard refresh doesn't re-bill the model.

const MEMO_TTL_MS = 6 * 60 * 60 * 1000;
const MEMO_MAX = 500;
const memo = new Map<string, { at: number; text: string }>();

function memoGet(key: string) {
  const hit = memo.get(key);
  if (hit && Date.now() - hit.at < MEMO_TTL_MS) {
    return hit.text;
  }
  return null;
}

function memoSet(key: string, text: string) {
  if (memo.size >= MEMO_MAX) {
    const oldest = memo.keys().next().value;
    if (oldest) memo.delete(oldest);
  }
  memo.set(key, { at: Date.now(), text });
}

async function generateEvaluation(apiKey: string, prompt: string): Promise<string | null> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 640, temperature: 0.5 },
      }),
    },
  );
  if (!response.ok) {
    return null;
  }
  const payload = await response.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
  return text && text.length > 40 ? text : null;
}

export async function GET(request: Request) {
  const requestContext = createRequestContext(request, { route: "/api/study/evaluation" });
  const respond = (evaluation: string | null) =>
    jsonSuccess({ evaluation }, 200, { requestId: requestContext.requestId });

  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return respond(null);
    }

    const env = resolveEnv();
    const apiKey = (env as Record<string, unknown>).GEMINI_API_KEY as string | undefined;
    if (!hasDatabase(env) || !apiKey) {
      return respond(null);
    }

    const cached = memoGet(user.id);
    if (cached) {
      return respond(cached);
    }

    const db = getDB(env);
    const hostedUser = await getHostedUserByAccount(db, { userId: user.id, email: user.email ?? null });
    if (!hostedUser) {
      return respond(null);
    }

    const sessions = await db
      .select({
        exam: quizSessions.exam,
        totalQuestions: quizSessions.totalQuestions,
        correctCount: quizSessions.correctCount,
        startedAt: quizSessions.startedAt,
      })
      .from(quizSessions)
      .where(and(eq(quizSessions.userId, hostedUser.id), isNotNull(quizSessions.completedAt)));

    const totalAnswered = sessions.reduce((sum, s) => sum + s.totalQuestions, 0);
    const totalCorrect = sessions.reduce((sum, s) => sum + s.correctCount, 0);
    if (totalAnswered < 25) {
      return respond(null);
    }

    const sevenDaysAgo = Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60;
    const recent = sessions.filter((s) => s.startedAt >= sevenDaysAgo);
    const recentAnswered = recent.reduce((sum, s) => sum + s.totalQuestions, 0);
    const recentCorrect = recent.reduce((sum, s) => sum + s.correctCount, 0);
    const overallAccuracy = Math.round((totalCorrect / totalAnswered) * 100);
    const recentAccuracy = recentAnswered > 0 ? Math.round((recentCorrect / recentAnswered) * 100) : null;

    const prompt = [
      "You are a warm, direct NCLEX study coach writing a short personalized evaluation for a nursing student's dashboard.",
      "Hard rules: never invent statistics or pass rates; only use the numbers given; no greetings, no sign-off; 3-4 sentences of plain prose; second person.",
      "Frame against the widely used practice-bank on-track line of 65% accuracy.",
      "",
      `Student data: ${totalAnswered} questions answered overall at ${overallAccuracy}% accuracy across ${sessions.length} completed sessions.`,
      recentAccuracy !== null
        ? `Last 7 days: ${recentAnswered} answered at ${recentAccuracy}% accuracy.`
        : "No completed sessions in the last 7 days.",
      "",
      "Write the evaluation: how they're trending vs the 65% line, what that means for readiness, and the single most useful next move.",
    ].join("\n");

    const evaluation = await generateEvaluation(apiKey, prompt);
    if (evaluation) {
      memoSet(user.id, evaluation);
    }
    return respond(evaluation);
  } catch (error) {
    logError("study evaluation failed; serving null", error, requestContext);
    return respond(null);
  }
}
