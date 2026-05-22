import { NextRequest } from "next/server";
import { getDB, hasDatabase, resolveEnv } from "@/lib/db";
import { allowLocalFallbacks } from "@/lib/env";
import { resultsForLocalSession } from "@/lib/local-quiz-store";
import { getResults } from "@/lib/quiz-engine";
import { quizSessions } from "@chapai/db/schema";
import { eq } from "drizzle-orm";
import type { ApiResponse, QuizResults } from "@/lib/types";
import { createRequestContext } from "@/lib/logger";
import { handleRouteError, jsonError, jsonSuccess } from "@/lib/http";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";


export async function GET(req: NextRequest) {
  const requestContext = createRequestContext(req, { route: "/api/quiz/results" });
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return jsonError(
        400,
        "VALIDATION_ERROR",
        "sessionId is required",
        requestContext,
        { requestId: requestContext.requestId },
      );
    }

    const env = resolveEnv();

    if (!hasDatabase(env)) {
      if (!allowLocalFallbacks(env)) {
        return jsonError(503, "QUIZ_STORAGE_UNAVAILABLE", "Quiz results storage is not configured for production.", requestContext, {
          requestId: requestContext.requestId,
        });
      }
      const results = resultsForLocalSession(sessionId);
      if (!results) {
        return jsonError(404, "SESSION_NOT_FOUND", "Session not found", requestContext, {
          requestId: requestContext.requestId,
        });
      }
      return jsonSuccess(results satisfies QuizResults, 200, { requestId: requestContext.requestId });
    }

    const db = getDB(env);
    const user = await getAuthenticatedUser();
    const session = await db
      .select({ id: quizSessions.id, userId: quizSessions.userId })
      .from(quizSessions)
      .where(eq(quizSessions.id, sessionId))
      .get();

    if (!session) {
      return jsonError(404, "SESSION_NOT_FOUND", "Session not found", requestContext, {
        requestId: requestContext.requestId,
      });
    }

    if (session.userId && session.userId !== user?.id) {
      return jsonError(403, "SESSION_OWNERSHIP_MISMATCH", "This session belongs to a different account.", requestContext, {
        requestId: requestContext.requestId,
      });
    }

    const results = await getResults(db, sessionId);

    return jsonSuccess(results satisfies QuizResults, 200, { requestId: requestContext.requestId });

  } catch (err) {
    return handleRouteError(err, {
      requestId: requestContext.requestId,
      route: "/api/quiz/results",
    });
  }
}
