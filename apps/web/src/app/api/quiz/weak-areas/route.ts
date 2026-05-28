import { getDB, hasDatabase, resolveEnv } from "@/lib/db";
import { getHostedUserByAccount } from "@/lib/billing-store";
import { allowLocalFallbacks } from "@/lib/env";
import { questions, quizAnswers, quizSessions } from "@chapai/db/schema";
import { and, eq, isNotNull, sql } from "drizzle-orm";
import { createRequestContext } from "@/lib/logger";
import { handleRouteError, jsonError, jsonSuccess } from "@/lib/http";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function emptyWeakAreas() {
  return {
    areas: [],
    difficultyAreas: [],
    cjmmSteps: [],
    recommendation: null,
    weakestCategory: null,
    meta: {
      totalAnswered: 0,
      premiumAnswered: 0,
      legacyAnswered: 0,
      checkedAt: new Date().toISOString(),
    },
  };
}

function displayCategory(category: string) {
  return category
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function displayCjmmStep(step: string) {
  return displayCategory(step);
}

export async function GET(request: Request) {
  const requestContext = createRequestContext(request, { route: "/api/quiz/weak-areas" });
  const env = resolveEnv();
  const user = await getAuthenticatedUser();
  const userId = user?.id ?? null;

  if (!userId) {
    return jsonSuccess({
      ...emptyWeakAreas(),
      requiresAuth: true,
    }, 200, { requestId: requestContext.requestId });
  }

  try {
    if (!hasDatabase(env)) {
      if (!allowLocalFallbacks(env)) {
        return jsonError(503, "WEAK_AREAS_UNAVAILABLE", "Quiz analytics storage is not configured for production.", requestContext, {
          requestId: requestContext.requestId,
        });
      }
      return jsonSuccess(emptyWeakAreas(), 200, { requestId: requestContext.requestId });
    }

    const db = getDB(env);
    const hostedUser = await getHostedUserByAccount(db, {
      userId,
      email: user?.email ?? null,
    });
    if (!hostedUser) {
      return jsonSuccess(emptyWeakAreas(), 200, { requestId: requestContext.requestId });
    }

    const rows = await db
      .select({
        exam: questions.exam,
        category: questions.category,
        totalAnswered: sql<number>`count(${quizAnswers.id})`,
        correctAnswered: sql<number>`sum(case when ${quizAnswers.isCorrect} then 1 else 0 end)`,
      })
      .from(quizAnswers)
      .innerJoin(quizSessions, eq(quizAnswers.sessionId, quizSessions.id))
      .innerJoin(questions, eq(quizAnswers.questionId, questions.id))
      .where(and(eq(quizSessions.userId, hostedUser.id), isNotNull(quizSessions.completedAt)))
      .groupBy(questions.exam, questions.category);

    const difficultyRows = await db
      .select({
        difficulty: questions.difficulty,
        totalAnswered: sql<number>`count(${quizAnswers.id})`,
        correctAnswered: sql<number>`sum(case when ${quizAnswers.isCorrect} then 1 else 0 end)`,
      })
      .from(quizAnswers)
      .innerJoin(quizSessions, eq(quizAnswers.sessionId, quizSessions.id))
      .innerJoin(questions, eq(quizAnswers.questionId, questions.id))
      .where(and(eq(quizSessions.userId, hostedUser.id), isNotNull(quizSessions.completedAt), isNotNull(questions.difficulty)))
      .groupBy(questions.difficulty);

    const cjmmRows = await db
      .select({
        step: questions.cjmmStep,
        totalAnswered: sql<number>`count(${quizAnswers.id})`,
        correctAnswered: sql<number>`sum(case when ${quizAnswers.isCorrect} then 1 else 0 end)`,
      })
      .from(quizAnswers)
      .innerJoin(quizSessions, eq(quizAnswers.sessionId, quizSessions.id))
      .innerJoin(questions, eq(quizAnswers.questionId, questions.id))
      .where(and(eq(quizSessions.userId, hostedUser.id), isNotNull(quizSessions.completedAt), isNotNull(questions.cjmmStep)))
      .groupBy(questions.cjmmStep);

    const coverageRows = await db
      .select({
        totalAnswered: sql<number>`count(${quizAnswers.id})`,
        premiumAnswered: sql<number>`sum(case when ${questions.structuredRationale} is not null and ${questions.structuredRationale} <> '' then 1 else 0 end)`,
      })
      .from(quizAnswers)
      .innerJoin(quizSessions, eq(quizAnswers.sessionId, quizSessions.id))
      .innerJoin(questions, eq(quizAnswers.questionId, questions.id))
      .where(and(eq(quizSessions.userId, hostedUser.id), isNotNull(quizSessions.completedAt)));

    const areas = rows
      .map((row) => {
        const total = Number(row.totalAnswered ?? 0);
        const correct = Number(row.correctAnswered ?? 0);
        return {
          exam: row.exam,
          category: row.category,
          label: displayCategory(row.category),
          totalAnswered: total,
          correctAnswered: correct,
          accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
        };
      })
      .filter((row) => row.totalAnswered > 0)
      .sort((left, right) => left.accuracy - right.accuracy || right.totalAnswered - left.totalAnswered);
    const difficultyAreas = difficultyRows
      .map((row) => {
        const total = Number(row.totalAnswered ?? 0);
        const correct = Number(row.correctAnswered ?? 0);
        const difficulty = Number(row.difficulty ?? 3);
        return {
          difficulty,
          label: `Level ${difficulty}`,
          totalAnswered: total,
          correctAnswered: correct,
          accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
        };
      })
      .filter((row) => row.totalAnswered > 0)
      .sort((left, right) => left.accuracy - right.accuracy || right.difficulty - left.difficulty);
    const cjmmSteps = cjmmRows
      .map((row) => {
        const total = Number(row.totalAnswered ?? 0);
        const correct = Number(row.correctAnswered ?? 0);
        const step = row.step ?? "unknown";
        return {
          step,
          label: displayCjmmStep(step),
          totalAnswered: total,
          correctAnswered: correct,
          accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
        };
      })
      .filter((row) => row.totalAnswered > 0)
      .sort((left, right) => left.accuracy - right.accuracy || right.totalAnswered - left.totalAnswered);
    const totalAnswered = Number(coverageRows[0]?.totalAnswered ?? 0);
    const premiumAnswered = Number(coverageRows[0]?.premiumAnswered ?? 0);
    const weakestCategory = areas[0] ?? null;
    const weakestDifficulty = difficultyAreas[0] ?? null;
    const weakestCjmm = cjmmSteps[0] ?? null;

    return jsonSuccess({
      areas,
      difficultyAreas,
      cjmmSteps,
      weakestCategory: weakestCategory?.category ?? null,
      recommendation: weakestCategory || weakestDifficulty || weakestCjmm
        ? {
            category: weakestCategory?.category ?? null,
            categoryLabel: weakestCategory?.label ?? null,
            difficulty: weakestDifficulty?.difficulty ?? null,
            difficultyLabel: weakestDifficulty?.label ?? null,
            cjmmStep: weakestCjmm?.step ?? null,
            cjmmLabel: weakestCjmm?.label ?? null,
            href: weakestCategory ? `/quiz?category=${encodeURIComponent(weakestCategory.category)}` : "/quiz?exam=nclex&mode=ngn",
          }
        : null,
      meta: {
        totalAnswered,
        premiumAnswered,
        legacyAnswered: Math.max(0, totalAnswered - premiumAnswered),
        checkedAt: new Date().toISOString(),
      },
    }, 200, { requestId: requestContext.requestId });
  } catch (err) {
    return handleRouteError(err, {
      requestId: requestContext.requestId,
      route: "/api/quiz/weak-areas",
    });
  }
}
