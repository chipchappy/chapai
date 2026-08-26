import { and, count, desc, eq } from "drizzle-orm";
import { practiceExamUnlocks, readinessExamAttempts } from "@chapai/db/schema";
import type { DB } from "@/lib/db";
import { examIdMatchesTrack, getLaunchOffer, type LaunchPlanCode } from "@/lib/launch-offers";
import { FREE_PRACTICE_EXAM_ID, FREE_PRACTICE_EXAM_LIMIT } from "@/lib/free-plan-limits";

// Exactly one readiness exam is free (with an account); the other four are paid.
// The constant lives in free-plan-limits so the paywall copy reads the same value.
export { FREE_PRACTICE_EXAM_ID, FREE_PRACTICE_EXAM_LIMIT };

/**
 * How many times a free account has *finished* the free readiness exam.
 *
 * Only `completed` attempts count: a student who abandons at item 3 (closed the
 * tab, lost signal) can start over, but once they have sat one full exam the
 * free allowance is spent. Counting launches instead would burn the allowance
 * on an accidental refresh, since the client mints a fresh launchId per launch.
 */
export async function countCompletedFreeExamAttempts(db: DB, userId: string) {
  const row = await db
    .select({ total: count() })
    .from(readinessExamAttempts)
    .where(and(
      eq(readinessExamAttempts.userId, userId),
      eq(readinessExamAttempts.examId, FREE_PRACTICE_EXAM_ID),
      eq(readinessExamAttempts.status, "completed"),
    ))
    .get();

  return Number(row?.total ?? 0);
}

function getTrackFromExamId(examId: string) {
  return examId.startsWith("ccrn-") ? "ccrn" : "nclex";
}

export async function listUnlockedPracticeExamIds(db: DB, userId: string) {
  const rows = await db
    .select({ examId: practiceExamUnlocks.examId })
    .from(practiceExamUnlocks)
    .where(eq(practiceExamUnlocks.userId, userId))
    .orderBy(desc(practiceExamUnlocks.firstOpenedAt));

  return rows.map((row) => row.examId);
}

export async function recordPracticeExamUnlock(db: DB, input: {
  userId: string;
  examId: string;
  planCode: LaunchPlanCode;
}) {
  const timestamp = Math.floor(Date.now() / 1000);

  await db.insert(practiceExamUnlocks).values({
    userId: input.userId,
    examId: input.examId,
    examTrack: getTrackFromExamId(input.examId),
    sourcePlanCode: input.planCode,
    firstOpenedAt: timestamp,
    lastOpenedAt: timestamp,
  }).onConflictDoUpdate({
    target: [practiceExamUnlocks.userId, practiceExamUnlocks.examId],
    set: {
      lastOpenedAt: timestamp,
      sourcePlanCode: input.planCode,
    },
  });
}

export async function canUnlockPracticeExam(db: DB, input: {
  userId: string;
  examId: string;
  planCode: LaunchPlanCode;
}) {
  const offer = getLaunchOffer(input.planCode);
  if (!offer) {
    return {
      allowed: false,
      reason: "Practice exams require an active paid plan.",
      unlockedExamIds: [] as string[],
    };
  }

  if (!examIdMatchesTrack(input.examId, offer.examTrackScope)) {
    return {
      allowed: false,
      reason: `This plan only includes ${offer.examTrackScope.toUpperCase()} simulations.`,
      unlockedExamIds: await listUnlockedPracticeExamIds(db, input.userId),
    };
  }

  const unlockedExamIds = await listUnlockedPracticeExamIds(db, input.userId);
  if (unlockedExamIds.includes(input.examId)) {
    return { allowed: true, reason: null, unlockedExamIds };
  }

  if (unlockedExamIds.length >= offer.practiceExamLimit) {
    return {
      allowed: false,
      reason: `This plan includes ${offer.practiceExamLimit} practice exam${offer.practiceExamLimit === 1 ? "" : "s"}. Upgrade to unlock more simulations.`,
      unlockedExamIds,
    };
  }

  return { allowed: true, reason: null, unlockedExamIds };
}
