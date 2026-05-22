import { getDB, hasDatabase, resolveEnv } from "@/lib/db";
import { getHostedUserByAccount } from "@/lib/billing-store";
import { allowLocalFallbacks } from "@/lib/env";
import { quizSessions } from "@chapai/db/schema";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { createRequestContext } from "@/lib/logger";
import { handleRouteError, jsonError, jsonSuccess } from "@/lib/http";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function emptyHistory() {
  return {
    sessions: [],
    stats: {
      totalSessions: 0,
      totalQuestions: 0,
      totalCorrect: 0,
      overallAccuracy: 0,
    },
  };
}

export async function GET(request: Request) {
  const requestContext = createRequestContext(request, { route: "/api/quiz/history" });
  const env = resolveEnv();
  const user = await getAuthenticatedUser();
  const userId = user?.id ?? null;

  if (!userId) {
    return jsonSuccess({
      ...emptyHistory(),
      requiresAuth: true,
    }, 200, { requestId: requestContext.requestId });
  }

  try {
    if (!hasDatabase(env)) {
      if (!allowLocalFallbacks(env)) {
        return jsonError(503, "QUIZ_HISTORY_UNAVAILABLE", "Quiz history storage is not configured for production.", requestContext, {
          requestId: requestContext.requestId,
        });
      }
      return jsonSuccess(emptyHistory(), 200, { requestId: requestContext.requestId });
    }

    const db = getDB(env);
    const hostedUser = await getHostedUserByAccount(db, {
      userId,
      email: user?.email ?? null,
    });
    if (!hostedUser) {
      return jsonSuccess(emptyHistory(), 200, { requestId: requestContext.requestId });
    }

    const sessions = await db
      .select()
      .from(quizSessions)
      .where(and(eq(quizSessions.userId, hostedUser.id), isNotNull(quizSessions.completedAt)))
      .orderBy(desc(quizSessions.startedAt))
      .limit(10);

    const allSessions = await db
      .select()
      .from(quizSessions)
      .where(and(eq(quizSessions.userId, hostedUser.id), isNotNull(quizSessions.completedAt)));

    const totalQuestions = allSessions.reduce((sum, s) => sum + s.totalQuestions, 0);
    const totalCorrect = allSessions.reduce((sum, s) => sum + s.correctCount, 0);

    return jsonSuccess({
      sessions: sessions.map((s) => ({
        id: s.id,
        exam: s.exam,
        startedAt: s.startedAt,
        completedAt: s.completedAt,
        totalQuestions: s.totalQuestions,
        correctAnswers: s.correctCount,
        scorePct: s.totalQuestions > 0
          ? Math.round((s.correctCount / s.totalQuestions) * 100)
          : 0,
      })),
      stats: {
        totalSessions: allSessions.length,
        totalQuestions,
        totalCorrect,
        overallAccuracy: totalQuestions > 0
          ? Math.round((totalCorrect / totalQuestions) * 100)
          : 0,
      },
    }, 200, { requestId: requestContext.requestId });
  } catch (err) {
    return handleRouteError(err, {
      requestId: requestContext.requestId,
      route: "/api/quiz/history",
    });
  }
}
