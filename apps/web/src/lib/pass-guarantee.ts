import { and, eq, sql } from "drizzle-orm";
import { quizAnswers, readinessExamAttempts, userEntitlements } from "@chapai/db/schema";
import type { DB } from "@/lib/db";

// ─────────────────────────────────────────────────────────────────────────────
// Pass Guarantee eligibility.
//
// The $50 bundle promises a refund if the student completes the content and
// still does not pass. "Completes the content" has to mean something specific
// and checkable, or the guarantee is unadjudicable — so it is defined here, in
// one place, and the same numbers drive both the student's progress card and
// the support answer when a claim arrives.
//
// Two deliberate decisions:
//
//   * Readiness exams count DISTINCT exam ids, so sitting exam 1 five times is
//     one exam, not five.
//   * Practice questions count DISTINCT question ids, so answering the same
//     item repeatedly does not inflate the total. The published fine print says
//     "unique practice questions" for exactly this reason.
//
// Nothing here decides a refund on its own. It reports whether the completion
// criteria are met; a human still confirms the exam result letter.
// ─────────────────────────────────────────────────────────────────────────────

export const PASS_GUARANTEE_PLAN_CODE = "nclex_pass_guarantee";

/** Completion thresholds, as published in the offer's fine print. */
export const PASS_GUARANTEE_REQUIREMENTS = {
  readinessExams: 5,
  uniqueQuestions: 2000,
} as const;

export type PassGuaranteeProgress = {
  /** True when the account holds (or held) the pass-guarantee bundle. */
  enrolled: boolean;
  /** Distinct readiness exams completed. */
  readinessExamsCompleted: number;
  readinessExamsRequired: number;
  /** Distinct practice questions answered. */
  uniqueQuestionsAnswered: number;
  uniqueQuestionsRequired: number;
  /** Both completion criteria met. Does not by itself authorise a refund. */
  completionMet: boolean;
  /** 0-100, weighted evenly across the two criteria. */
  percentComplete: number;
  /** Unix seconds; the end of the purchased access window, when known. */
  accessExpiresAt: number | null;
  /** True once the access window has closed. */
  accessExpired: boolean;
};

export function emptyPassGuaranteeProgress(): PassGuaranteeProgress {
  return {
    enrolled: false,
    readinessExamsCompleted: 0,
    readinessExamsRequired: PASS_GUARANTEE_REQUIREMENTS.readinessExams,
    uniqueQuestionsAnswered: 0,
    uniqueQuestionsRequired: PASS_GUARANTEE_REQUIREMENTS.uniqueQuestions,
    completionMet: false,
    percentComplete: 0,
    accessExpiresAt: null,
    accessExpired: false,
  };
}

/**
 * Derives progress from raw counts. Pure, so the thresholds and the percentage
 * maths can be tested without a database.
 */
export function derivePassGuaranteeProgress(input: {
  enrolled: boolean;
  readinessExamsCompleted: number;
  uniqueQuestionsAnswered: number;
  accessExpiresAt?: number | null;
  now?: number;
}): PassGuaranteeProgress {
  const required = PASS_GUARANTEE_REQUIREMENTS;
  const exams = Math.max(0, Math.floor(input.readinessExamsCompleted));
  const questions = Math.max(0, Math.floor(input.uniqueQuestionsAnswered));
  const examShare = Math.min(1, exams / required.readinessExams);
  const questionShare = Math.min(1, questions / required.uniqueQuestions);
  const nowSeconds = input.now ?? Math.floor(Date.now() / 1000);
  const expiresAt = input.accessExpiresAt ?? null;

  return {
    enrolled: input.enrolled,
    readinessExamsCompleted: exams,
    readinessExamsRequired: required.readinessExams,
    uniqueQuestionsAnswered: questions,
    uniqueQuestionsRequired: required.uniqueQuestions,
    completionMet: exams >= required.readinessExams && questions >= required.uniqueQuestions,
    percentComplete: Math.round(((examShare + questionShare) / 2) * 100),
    accessExpiresAt: expiresAt,
    accessExpired: expiresAt != null && expiresAt <= nowSeconds,
  };
}

/**
 * Reads the live counts for one account. Returns an unenrolled result rather
 * than throwing when the account never bought the bundle, so callers can render
 * unconditionally.
 */
export async function getPassGuaranteeProgress(db: DB, userId: string): Promise<PassGuaranteeProgress> {
  const entitlement = await db
    .select({ expiresAt: userEntitlements.expiresAt })
    .from(userEntitlements)
    .where(and(eq(userEntitlements.userId, userId), eq(userEntitlements.planCode, PASS_GUARANTEE_PLAN_CODE)))
    .orderBy(sql`coalesce(${userEntitlements.expiresAt}, 0) desc`)
    .limit(1);

  if (entitlement.length === 0) {
    return emptyPassGuaranteeProgress();
  }

  const [examRows, questionRows] = await Promise.all([
    db
      .select({ total: sql<number>`count(distinct ${readinessExamAttempts.examId})` })
      .from(readinessExamAttempts)
      .where(and(eq(readinessExamAttempts.userId, userId), eq(readinessExamAttempts.status, "completed"))),
    db
      .select({ total: sql<number>`count(distinct ${quizAnswers.questionId})` })
      .from(quizAnswers)
      .where(eq(quizAnswers.userId, userId)),
  ]);

  return derivePassGuaranteeProgress({
    enrolled: true,
    readinessExamsCompleted: Number(examRows[0]?.total ?? 0),
    uniqueQuestionsAnswered: Number(questionRows[0]?.total ?? 0),
    accessExpiresAt: entitlement[0]?.expiresAt ?? null,
  });
}
