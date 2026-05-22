import { eq, sql } from "drizzle-orm";
import { questions } from "@chapai/db/schema";
import { getDB, hasDatabase, resolveEnv } from "@/lib/db";
import { getLiveContentSummary } from "@/lib/live-content-summary";

export type LiveBankStats = {
  ccrnLive: number;
  nclexLive: number;
  totalLive: number;
  nclexMcqLive: number;
  nclexNgnLive: number;
  nclexNgnRatio: number;
};

export async function getLiveBankStats(): Promise<LiveBankStats> {
  const summary = getLiveContentSummary();
  const fallback = {
    ccrnLive: summary.ccrn.live,
    nclexLive: summary.nclex.live,
    totalLive: summary.ccrn.live + summary.nclex.live,
    nclexMcqLive: summary.nclex.mcqLive,
    nclexNgnLive: summary.nclex.ngnLive,
    nclexNgnRatio: summary.nclex.ngnRatio,
  } satisfies LiveBankStats;

  const env = resolveEnv();
  if (!hasDatabase(env)) {
    return fallback;
  }

  try {
    const db = getDB(env);
    const examRows = await db
      .select({
        exam: questions.exam,
        count: sql<number>`count(*)`,
      })
      .from(questions)
      .groupBy(questions.exam);

    const nclexTypeRows = await db
      .select({
        type: questions.type,
        count: sql<number>`count(*)`,
      })
      .from(questions)
      .where(eq(questions.exam, "nclex"))
      .groupBy(questions.type);

    const ccrnLive = Number(examRows.find((row) => row.exam === "ccrn")?.count ?? fallback.ccrnLive);
    const nclexLive = Number(examRows.find((row) => row.exam === "nclex")?.count ?? fallback.nclexLive);
    const nclexMcqLive = Number(nclexTypeRows.find((row) => row.type === "mcq")?.count ?? fallback.nclexMcqLive);
    const nclexNgnLive = Math.max(nclexLive - nclexMcqLive, 0);

    return {
      ccrnLive,
      nclexLive,
      totalLive: ccrnLive + nclexLive,
      nclexMcqLive,
      nclexNgnLive,
      nclexNgnRatio: nclexLive > 0 ? Math.round((nclexNgnLive / nclexLive) * 100) : fallback.nclexNgnRatio,
    };
  } catch {
    return fallback;
  }
}
