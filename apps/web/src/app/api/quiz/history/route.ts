import { getDB, hasDatabase, resolveEnv } from "@/lib/db";
import { quizSessions } from "@chapai/db/schema";
import { and, desc, eq, isNotNull } from "drizzle-orm";


export async function GET(request: Request) {
  const env = resolveEnv();
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");

  if (!userId) {
    return Response.json({ error: "userId required" }, { status: 400 });
  }

  try {
    if (!hasDatabase(env)) {
      return Response.json({
        sessions: [],
        stats: {
          totalSessions: 0,
          totalQuestions: 0,
          totalCorrect: 0,
          overallAccuracy: 0,
        },
      });
    }

    const db = getDB(env);
    const sessions = await db
      .select()
      .from(quizSessions)
      .where(and(eq(quizSessions.userId, userId), isNotNull(quizSessions.completedAt)))
      .orderBy(desc(quizSessions.startedAt))
      .limit(10);

    const allSessions = await db
      .select()
      .from(quizSessions)
      .where(and(eq(quizSessions.userId, userId), isNotNull(quizSessions.completedAt)));

    const totalQuestions = allSessions.reduce((sum, s) => sum + s.totalQuestions, 0);
    const totalCorrect = allSessions.reduce((sum, s) => sum + s.correctCount, 0);

    return Response.json({
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
    });
  } catch (err) {
    console.error("quiz/history error:", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
