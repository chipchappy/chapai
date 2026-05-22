import { and, eq, sql } from "drizzle-orm";
import { dailyUsage } from "@chapai/db/schema";
import type { DB } from "@/lib/db";

export async function recordTutorUsage(db: DB, userId: string) {
  const date = new Date().toISOString().slice(0, 10);

  const existing = await db
    .select()
    .from(dailyUsage)
    .where(and(eq(dailyUsage.userId, userId), eq(dailyUsage.date, date)))
    .get();

  if (existing) {
    await db
      .update(dailyUsage)
      .set({ tutorCallsUsed: sql`${dailyUsage.tutorCallsUsed} + 1` })
      .where(and(eq(dailyUsage.userId, userId), eq(dailyUsage.date, date)));
    return;
  }

  await db.insert(dailyUsage).values({
    userId,
    date,
    questionsAnswered: 0,
    tutorCallsUsed: 1,
  });
}
