import { getDB, hasDatabase, resolveEnv } from "@/lib/db";
import { getHostedUserByAccount } from "@/lib/billing-store";
import { allowLocalFallbacks } from "@/lib/env";
import { questions, reviewSchedule } from "@chapai/db/schema";
import { and, asc, eq, lte, sql } from "drizzle-orm";
import { createRequestContext } from "@/lib/logger";
import { handleRouteError, jsonError, jsonSuccess } from "@/lib/http";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function emptyQueue() {
  return {
    items: [],
    meta: {
      dueNow: 0,
      totalInQueue: 0,
      checkedAt: new Date().toISOString(),
    },
  };
}

export async function GET(request: Request) {
  const requestContext = createRequestContext(request, { route: "/api/quiz/review-queue" });
  const env = resolveEnv();
  const user = await getAuthenticatedUser();
  const userId = user?.id ?? null;

  if (!userId) {
    return jsonSuccess({
      ...emptyQueue(),
      requiresAuth: true,
    }, 200, { requestId: requestContext.requestId });
  }

  try {
    if (!hasDatabase(env)) {
      if (!allowLocalFallbacks(env)) {
        return jsonError(503, "REVIEW_QUEUE_UNAVAILABLE", "Review queue storage is not configured for production.", requestContext, {
          requestId: requestContext.requestId,
        });
      }
      return jsonSuccess(emptyQueue(), 200, { requestId: requestContext.requestId });
    }

    const db = getDB(env);
    const hostedUser = await getHostedUserByAccount(db, {
      userId,
      email: user?.email ?? null,
    });
    if (!hostedUser) {
      return jsonSuccess(emptyQueue(), 200, { requestId: requestContext.requestId });
    }

    const now = Math.floor(Date.now() / 1000);

    // Questions due for review (most overdue first)
    const due = await db
      .select({
        questionId: reviewSchedule.questionId,
        nextReviewAt: reviewSchedule.nextReviewAt,
        intervalDays: reviewSchedule.intervalDays,
        easeFactor: reviewSchedule.easeFactor,
        repetitions: reviewSchedule.repetitions,
        stem: questions.stem,
        exam: questions.exam,
        category: questions.category,
      })
      .from(reviewSchedule)
      .innerJoin(questions, eq(reviewSchedule.questionId, questions.id))
      .where(and(eq(reviewSchedule.userId, hostedUser.id), lte(reviewSchedule.nextReviewAt, now)))
      .orderBy(asc(reviewSchedule.nextReviewAt))
      .limit(20);

    const totalRows = await db
      .select({ count: sql<number>`count(*)` })
      .from(reviewSchedule)
      .where(eq(reviewSchedule.userId, hostedUser.id));

    const total = totalRows[0]?.count ?? 0;

    return jsonSuccess({
      items: due.map((rs) => ({
        questionId: rs.questionId,
        nextReviewAt: rs.nextReviewAt ? new Date(rs.nextReviewAt * 1000).toISOString() : null,
        intervalDays: rs.intervalDays,
        easeFactor: rs.easeFactor,
        repetitions: rs.repetitions,
        stem: rs.stem,
        exam: rs.exam,
        category: rs.category,
      })),
      meta: {
        dueNow: due.length,
        totalInQueue: total,
        checkedAt: new Date(now * 1000).toISOString(),
      },
    }, 200, { requestId: requestContext.requestId });
  } catch (err) {
    return handleRouteError(err, {
      requestId: requestContext.requestId,
      route: "/api/quiz/review-queue",
    });
  }
}
