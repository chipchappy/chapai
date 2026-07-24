import { NextRequest } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { questions } from "@chapai/db/schema";
import { ensureHostedUser } from "@/lib/billing-store";
import { getDB, hasDatabase, resolveEnv } from "@/lib/db";
import { jsonError, jsonSuccess } from "@/lib/http";
import { mapQuestionRowToQuizQuestion } from "@/lib/quiz-engine";
import { getRichDeck, mapLiveQuestionBank } from "@/lib/practice-data";
import { evaluateQuestion } from "@/lib/practice-session";
import type { PracticeAnswer, PracticeQuestion } from "@/lib/practice-types";
import {
  getReadinessScoringSnapshot,
  recordReadinessAttemptAnswer,
} from "@/lib/readiness-attempt-store";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const answerIdSchema = z.string().min(1).max(160);
const answerListSchema = z.array(answerIdSchema).max(30);
const matrixAnswerSchema = z
  .record(answerIdSchema, z.union([answerIdSchema, answerListSchema]))
  .refine((answer) => Object.keys(answer).length <= 30, "Too many matrix rows.");

const answerSchema = z.object({
  attemptId: z.string().min(1).max(100),
  questionId: z.string().min(1).max(160),
  formPosition: z.number().int().min(0).max(149),
  selectedAnswer: z.union([
    answerIdSchema,
    answerListSchema,
    matrixAnswerSchema,
  ]),
  timeSpentMs: z.number().int().positive().max(8 * 60 * 60 * 1000).optional(),
});

function bundledReadinessQuestion(questionId: string) {
  return getRichDeck("case-study").find((question) => question.id === questionId) ?? null;
}

async function resolveReadinessQuestion(
  db: ReturnType<typeof getDB>,
  questionId: string,
): Promise<PracticeQuestion | null> {
  const bundled = bundledReadinessQuestion(questionId);
  if (bundled) return bundled;

  const row = await db
    .select()
    .from(questions)
    .where(and(
      eq(questions.id, questionId),
      eq(questions.publishState, "published"),
    ))
    .get();
  if (!row) return null;

  const mapped = mapQuestionRowToQuizQuestion(row);
  return mapLiveQuestionBank([mapped], "practice-exam")[0] ?? null;
}

export async function POST(request: NextRequest) {
  const payload = answerSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    return jsonError(400, "VALIDATION_ERROR", "A valid readiness answer is required.");
  }

  const user = await getAuthenticatedUser();
  if (!user?.id || !user.email) {
    return jsonError(401, "AUTH_REQUIRED", "Sign in to save readiness exam progress.");
  }

  const env = resolveEnv();
  if (!hasDatabase(env)) {
    return jsonError(503, "READINESS_STORAGE_UNAVAILABLE", "Readiness progress storage is unavailable.");
  }

  const db = getDB(env);
  const hostedUser = await ensureHostedUser(db, {
    userId: user.id,
    email: user.email,
    name: typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null,
  });
  if (!hostedUser) {
    return jsonError(503, "HOSTED_ACCOUNT_UNAVAILABLE", "Could not resolve the hosted account.");
  }

  const scoringContext = await getReadinessScoringSnapshot(db, {
    attemptId: payload.data.attemptId,
    userId: hostedUser.id,
    questionId: payload.data.questionId,
    formPosition: payload.data.formPosition,
  });
  if (!scoringContext.ok) {
    const status = scoringContext.reason === "attempt-not-found" ? 404 : 409;
    return jsonError(status, "READINESS_ATTEMPT_INVALID", "This readiness attempt could not accept the answer.");
  }

  const question = await resolveReadinessQuestion(db, payload.data.questionId);
  if (!question) {
    return jsonError(404, "QUESTION_NOT_FOUND", "The readiness question is unavailable.");
  }

  const scoringQuestion = {
    ...question,
    correctAnswer: scoringContext.snapshot.correctAnswer,
  };
  const evaluation = evaluateQuestion(scoringQuestion, payload.data.selectedAnswer as PracticeAnswer);
  const pointsEarned = evaluation.pointsEarned ?? (evaluation.correct ? 1 : 0);
  const pointsPossible = evaluation.pointsPossible ?? 1;
  const partialCredit = evaluation.partialCredit ?? (evaluation.correct ? 1 : 0);
  const persistence = await recordReadinessAttemptAnswer(db, {
    attemptId: payload.data.attemptId,
    userId: hostedUser.id,
    question,
    formPosition: payload.data.formPosition,
    selectedAnswer: payload.data.selectedAnswer as PracticeAnswer,
    correct: evaluation.correct,
    pointsEarned,
    pointsPossible,
    partialCredit,
    timeSpentMs: payload.data.timeSpentMs,
  });

  if (!persistence.ok) {
    const status = persistence.reason === "attempt-not-found" ? 404 : 409;
    return jsonError(status, "READINESS_ATTEMPT_INVALID", "This readiness attempt could not accept the answer.");
  }

  return jsonSuccess({
    correct: persistence.answer.correct,
    correctAnswer: evaluation.correctAnswer,
    pointsEarned: persistence.answer.pointsEarned,
    pointsPossible: persistence.answer.pointsPossible,
    partialCredit: persistence.answer.partialCredit,
    rationale: question.rationale,
    structuredRationale: question.structuredRationale,
    deepRationale: question.deepRationale ?? question.rationale,
    distractorRationales: question.distractorRationales ?? null,
    takeaway: question.takeaway ?? null,
    visualRationale: question.visualRationale ?? null,
    references: question.references ?? [],
    attempt: {
      completed: persistence.completed,
      answeredItems: persistence.answeredItems,
      totalItems: persistence.totalItems,
    },
  });
}
