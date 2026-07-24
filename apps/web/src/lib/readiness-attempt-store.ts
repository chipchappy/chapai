import type { DB } from "./db";
import type { PracticeAnswer, PracticeQuestion } from "./practice-types";
import {
  readinessExamAnswers,
  readinessExamAttempts,
} from "@chapai/db/schema";
import { and, eq, sql } from "drizzle-orm";

export type ReadinessAttemptManifest = {
  examId: string;
  assemblyVersion: string;
  contentFingerprint: string;
  questions: PracticeQuestion[];
};

type ReadinessScoringSnapshot = {
  id: string;
  correctAnswer: PracticeAnswer;
  contentVersion: number | null;
};

export function serializePracticeAnswer(answer: PracticeAnswer) {
  return typeof answer === "string" ? answer : JSON.stringify(answer);
}

export async function findOrCreateReadinessAttempt(
  db: DB,
  input: {
    userId: string;
    launchId: string;
    manifest: ReadinessAttemptManifest;
  },
) {
  const existing = await db
    .select({ id: readinessExamAttempts.id })
    .from(readinessExamAttempts)
    .where(and(
      eq(readinessExamAttempts.userId, input.userId),
      eq(readinessExamAttempts.launchId, input.launchId),
    ))
    .get();
  if (existing) return existing.id;

  const attemptId = crypto.randomUUID();
  try {
    await db.insert(readinessExamAttempts).values({
      id: attemptId,
      userId: input.userId,
      launchId: input.launchId,
      examId: input.manifest.examId,
      assemblyVersion: input.manifest.assemblyVersion,
      contentFingerprint: input.manifest.contentFingerprint,
      questionIds: JSON.stringify(input.manifest.questions.map((question) => question.id)),
      scoringManifest: JSON.stringify(input.manifest.questions.map((question) => ({
        id: question.id,
        correctAnswer: question.correctAnswer,
        contentVersion: question.qualityMetadata?.contentVersion ?? null,
      } satisfies ReadinessScoringSnapshot))),
      totalItems: input.manifest.questions.length,
    });
  } catch {
    const racedAttempt = await db
      .select({ id: readinessExamAttempts.id })
      .from(readinessExamAttempts)
      .where(and(
        eq(readinessExamAttempts.userId, input.userId),
        eq(readinessExamAttempts.launchId, input.launchId),
      ))
      .get();
    if (racedAttempt) return racedAttempt.id;
    throw new Error("Readiness attempt creation failed");
  }
  return attemptId;
}

export async function getReadinessScoringSnapshot(
  db: DB,
  input: {
    attemptId: string;
    userId: string;
    questionId: string;
    formPosition: number;
  },
) {
  const attempt = await db
    .select({
      userId: readinessExamAttempts.userId,
      questionIds: readinessExamAttempts.questionIds,
      scoringManifest: readinessExamAttempts.scoringManifest,
      status: readinessExamAttempts.status,
    })
    .from(readinessExamAttempts)
    .where(eq(readinessExamAttempts.id, input.attemptId))
    .get();

  if (!attempt || attempt.userId !== input.userId) {
    return { ok: false as const, reason: "attempt-not-found" as const };
  }
  if (attempt.status === "abandoned") {
    return { ok: false as const, reason: "attempt-closed" as const };
  }

  try {
    const questionIds = JSON.parse(attempt.questionIds) as string[];
    const scoringManifest = JSON.parse(attempt.scoringManifest) as ReadinessScoringSnapshot[];
    if (questionIds[input.formPosition] !== input.questionId) {
      return { ok: false as const, reason: "question-not-in-attempt" as const };
    }
    const snapshot = scoringManifest.find((item) => item.id === input.questionId);
    if (!snapshot) {
      return { ok: false as const, reason: "scoring-snapshot-missing" as const };
    }
    return { ok: true as const, snapshot };
  } catch {
    return { ok: false as const, reason: "scoring-snapshot-invalid" as const };
  }
}

export async function recordReadinessAttemptAnswer(
  db: DB,
  input: {
    attemptId: string;
    userId: string;
    question: PracticeQuestion;
    formPosition: number;
    selectedAnswer: PracticeAnswer;
    correct: boolean;
    pointsEarned: number;
    pointsPossible: number;
    partialCredit: number;
    timeSpentMs?: number;
  },
) {
  const attempt = await db
    .select({
      id: readinessExamAttempts.id,
      userId: readinessExamAttempts.userId,
      questionIds: readinessExamAttempts.questionIds,
      totalItems: readinessExamAttempts.totalItems,
      status: readinessExamAttempts.status,
    })
    .from(readinessExamAttempts)
    .where(eq(readinessExamAttempts.id, input.attemptId))
    .get();

  if (!attempt || attempt.userId !== input.userId) {
    return { ok: false as const, reason: "attempt-not-found" as const };
  }
  if (attempt.status === "abandoned") {
    return { ok: false as const, reason: "attempt-closed" as const };
  }

  const questionIds = JSON.parse(attempt.questionIds) as string[];
  const expectedPosition = questionIds.indexOf(input.question.id);
  if (expectedPosition < 0 || expectedPosition !== input.formPosition) {
    return { ok: false as const, reason: "question-not-in-attempt" as const };
  }

  const existing = await db
    .select()
    .from(readinessExamAnswers)
    .where(and(
      eq(readinessExamAnswers.attemptId, input.attemptId),
      eq(readinessExamAnswers.questionId, input.question.id),
    ))
    .get();

  if (!existing) {
    const questionSnapshot = {
      exam: input.question.exam,
      category: input.question.category,
      nclexClientNeed: input.question.nclexClientNeed ?? null,
      difficulty: input.question.difficulty,
      kind: input.question.kind,
      caseStudyId: input.question.caseStudyId ?? null,
      cjmmStep: input.question.cjmmStep ?? null,
      contentVersion: input.question.qualityMetadata?.contentVersion ?? null,
      evidenceStatus: input.question.qualityMetadata?.evidenceStatus ?? null,
      psychometricStatus: input.question.qualityMetadata?.psychometricStatus ?? "precalibration",
    };

    try {
      await db.insert(readinessExamAnswers).values({
        id: crypto.randomUUID(),
        attemptId: input.attemptId,
        questionId: input.question.id,
        questionSnapshot: JSON.stringify(questionSnapshot),
        formPosition: input.formPosition,
        selectedAnswer: serializePracticeAnswer(input.selectedAnswer),
        isCorrect: input.correct,
        pointsEarned: input.pointsEarned,
        pointsPossible: input.pointsPossible,
        partialCredit: input.partialCredit,
        timeSpentMs: input.timeSpentMs ?? null,
      });
    } catch {
      const racedAnswer = await db
        .select({ id: readinessExamAnswers.id })
        .from(readinessExamAnswers)
        .where(and(
          eq(readinessExamAnswers.attemptId, input.attemptId),
          eq(readinessExamAnswers.questionId, input.question.id),
        ))
        .get();
      if (!racedAnswer) throw new Error("Readiness answer persistence failed");
    }
  }

  const aggregate = await db
    .select({
      answeredItems: sql<number>`count(*)`,
      pointsEarned: sql<number>`coalesce(sum(${readinessExamAnswers.pointsEarned}), 0)`,
      pointsPossible: sql<number>`coalesce(sum(${readinessExamAnswers.pointsPossible}), 0)`,
    })
    .from(readinessExamAnswers)
    .where(eq(readinessExamAnswers.attemptId, input.attemptId))
    .get();

  const answeredItems = Number(aggregate?.answeredItems ?? 0);
  const completed = answeredItems >= attempt.totalItems;
  await db
    .update(readinessExamAttempts)
    .set({
      answeredItems,
      pointsEarned: Number(aggregate?.pointsEarned ?? 0),
      pointsPossible: Number(aggregate?.pointsPossible ?? 0),
      status: completed ? "completed" : "in_progress",
      completedAt: completed ? Math.floor(Date.now() / 1000) : null,
      updatedAt: Math.floor(Date.now() / 1000),
    })
    .where(eq(readinessExamAttempts.id, input.attemptId));

  return {
    ok: true as const,
    completed,
    answeredItems,
    totalItems: attempt.totalItems,
    answer: {
      correct: Boolean(existing?.isCorrect ?? input.correct),
      pointsEarned: Number(existing?.pointsEarned ?? input.pointsEarned),
      pointsPossible: Number(existing?.pointsPossible ?? input.pointsPossible),
      partialCredit: Number(existing?.partialCredit ?? input.partialCredit),
    },
  };
}
