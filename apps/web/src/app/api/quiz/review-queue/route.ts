import { getDB, hasDatabase, resolveEnv } from "@/lib/db";
import { questions, reviewSchedule } from "@chapai/db/schema";
import { and, asc, eq, lte, sql } from "drizzle-orm";


export async function GET(request: Request) {
  const env = resolveEnv();
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (!hasDatabase(env)) {
      return Response.json({
        items: [],
        meta: {
          dueNow: 0,
          totalInQueue: 0,
          checkedAt: new Date().toISOString(),
        },
      });
    }

    const db = getDB(env);
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
      .where(and(eq(reviewSchedule.userId, userId), lte(reviewSchedule.nextReviewAt, now)))
      .orderBy(asc(reviewSchedule.nextReviewAt))
      .limit(20);

    const totalRows = await db
      .select({ count: sql<number>`count(*)` })
      .from(reviewSchedule)
      .where(eq(reviewSchedule.userId, userId));

    const total = totalRows[0]?.count ?? 0;

    return Response.json({
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
    });
  } catch (err) {
    console.error("quiz/review-queue error:", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
