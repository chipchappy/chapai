import { desc, eq } from "drizzle-orm";
import { practiceExamUnlocks } from "@chapai/db/schema";
import type { DB } from "@/lib/db";
import { examIdMatchesTrack, getLaunchOffer, type LaunchPlanCode } from "@/lib/launch-offers";

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
