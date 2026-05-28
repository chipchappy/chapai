import fs from "node:fs";
import path from "node:path";
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
  nclexStructuredLive: number;
  nclexLegacyLive: number;
  nclexPremiumCoverageRatio: number;
  nclexDifficultyDistribution: DifficultyDistribution;
  nclexPremiumDifficultyDistribution: DifficultyDistribution;
};

type BankQuestion = {
  exam?: string;
  type?: string;
  difficulty?: number;
  structuredRationale?: unknown;
  scenarioTitle?: string;
  scenario?: string;
  bowTie?: {
    center?: { id?: string; text?: string };
    leftActions?: unknown[];
    rightMonitoring?: unknown[];
  };
};

export type DifficultyDistribution = {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
};

function resolveWorkspaceRoot() {
  let current = process.cwd();
  for (let index = 0; index < 6; index += 1) {
    if (fs.existsSync(path.join(current, "packages", "content"))) {
      return current;
    }
    const next = path.dirname(current);
    if (next === current) {
      break;
    }
    current = next;
  }
  return process.cwd();
}

function normalizeText(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function scenarioKey(question: BankQuestion) {
  const scenarioTitle = normalizeText(question.scenarioTitle);
  const scenario = normalizeText(question.scenario);
  return scenarioTitle && scenario ? `${scenarioTitle}\u0000${scenario}` : "";
}

function hasRealBowTieShape(question: BankQuestion) {
  const bowTie = question.bowTie;
  return Boolean(
    bowTie?.center?.id
      && bowTie.center.text
      && Array.isArray(bowTie.leftActions)
      && bowTie.leftActions.length >= 4
      && Array.isArray(bowTie.rightMonitoring)
      && bowTie.rightMonitoring.length >= 4,
  );
}

function emptyDifficultyDistribution(): DifficultyDistribution {
  return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
}

function countDifficulty(rows: BankQuestion[], structuredOnly = false): DifficultyDistribution {
  const distribution = emptyDifficultyDistribution();
  for (const question of rows) {
    if (structuredOnly && !question.structuredRationale) {
      continue;
    }
    const difficulty = Number(question.difficulty);
    if (difficulty >= 1 && difficulty <= 5) {
      distribution[difficulty as keyof DifficultyDistribution] += 1;
    }
  }
  return distribution;
}

function distributionFromRows(
  rows: Array<{ difficulty: number | null; count: number; structuredCount?: number }>,
  key: "count" | "structuredCount",
): DifficultyDistribution {
  const distribution = emptyDifficultyDistribution();
  for (const row of rows) {
    const difficulty = Number(row.difficulty);
    if (difficulty >= 1 && difficulty <= 5) {
      distribution[difficulty as keyof DifficultyDistribution] = Number(row[key] ?? 0);
    }
  }
  return distribution;
}

function readQuestionsFromDirectory(dir: string) {
  if (!fs.existsSync(dir)) {
    return [] as BankQuestion[];
  }

  const bankQuestions: BankQuestion[] = [];
  for (const file of fs.readdirSync(dir).filter((entry) => entry.endsWith(".json")).sort()) {
    try {
      const payload = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
      if (Array.isArray(payload)) {
        bankQuestions.push(...payload);
      } else if (Array.isArray(payload.questions)) {
        bankQuestions.push(...payload.questions);
      }
    } catch {
      // Keep the landing page renderable if a local content file is malformed.
    }
  }
  return bankQuestions;
}

function getStrictNclexStatsFromFiles() {
  const root = resolveWorkspaceRoot();
  const candidateDirs = [
    path.join(root, "packages", "content", "staging", "promoted-v4"),
    path.join(root, "packages", "content", "staging", "promoted-v3"),
    path.join(root, "packages", "content", "staging", "promoted-v2"),
    path.join(root, "packages", "content", "staging", "promoted"),
    path.join(root, "packages", "content", "questions", "nclex", "live"),
  ];
  const localQuestions = candidateDirs.map(readQuestionsFromDirectory).find((items) => items.length > 0);
  if (!localQuestions?.length) {
    return null;
  }

  const nclexQuestions = localQuestions.filter((question) => !question.exam || question.exam === "nclex");
  const scenarioGroups = new Map<string, number>();
  for (const question of nclexQuestions) {
    const key = scenarioKey(question);
    if (key) {
      scenarioGroups.set(key, (scenarioGroups.get(key) ?? 0) + 1);
    }
  }

  const nclexNgnLive = nclexQuestions.filter((question) => {
    if (question.type === "matrix" || question.type === "sata") {
      return true;
    }
    if (question.type === "case_study") {
      const key = scenarioKey(question);
      return Boolean(key && (scenarioGroups.get(key) ?? 0) >= 3);
    }
    if (question.type === "bow_tie") {
      return hasRealBowTieShape(question);
    }
    return false;
  }).length;
  const nclexMcqLive = nclexQuestions.filter((question) => question.type === "mcq").length;
  const nclexStructuredLive = nclexQuestions.filter((question) => question.structuredRationale).length;
  const nclexLegacyLive = Math.max(0, nclexQuestions.length - nclexStructuredLive);

  return {
    live: nclexQuestions.length,
    mcqLive: nclexMcqLive,
    ngnLive: nclexNgnLive,
    ngnRatio: nclexQuestions.length > 0 ? Math.round((nclexNgnLive / nclexQuestions.length) * 100) : 0,
    structuredLive: nclexStructuredLive,
    legacyLive: nclexLegacyLive,
    premiumCoverageRatio: nclexQuestions.length > 0 ? Math.round((nclexStructuredLive / nclexQuestions.length) * 100) : 0,
    difficultyDistribution: countDifficulty(nclexQuestions),
    premiumDifficultyDistribution: countDifficulty(nclexQuestions, true),
  };
}

function countType(rows: Array<{ type: string | null; count: number }>, type: string) {
  return Number(rows.find((row) => row.type === type)?.count ?? 0);
}

export async function getLiveBankStats(): Promise<LiveBankStats> {
  const summary = getLiveContentSummary();
  const strictFileStats = getStrictNclexStatsFromFiles();
  const fallback = {
    ccrnLive: summary.ccrn.live,
    nclexLive: strictFileStats?.live ?? summary.nclex.live,
    totalLive: summary.ccrn.live + (strictFileStats?.live ?? summary.nclex.live),
    nclexMcqLive: strictFileStats?.mcqLive ?? summary.nclex.mcqLive,
    nclexNgnLive: strictFileStats?.ngnLive ?? summary.nclex.ngnLive,
    nclexNgnRatio: strictFileStats?.ngnRatio ?? summary.nclex.ngnRatio,
    nclexStructuredLive: strictFileStats?.structuredLive ?? summary.nclex.live,
    nclexLegacyLive: strictFileStats?.legacyLive ?? 0,
    nclexPremiumCoverageRatio: strictFileStats?.premiumCoverageRatio ?? 100,
    nclexDifficultyDistribution: strictFileStats?.difficultyDistribution ?? emptyDifficultyDistribution(),
    nclexPremiumDifficultyDistribution: strictFileStats?.premiumDifficultyDistribution ?? emptyDifficultyDistribution(),
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

    const nclexDifficultyRows = await db
      .select({
        difficulty: questions.difficulty,
        count: sql<number>`count(*)`,
        structuredCount: sql<number>`sum(case when ${questions.structuredRationale} is not null and ${questions.structuredRationale} <> '' then 1 else 0 end)`,
      })
      .from(questions)
      .where(eq(questions.exam, "nclex"))
      .groupBy(questions.difficulty);

    const nclexStructuredRows = await db
      .select({
        count: sql<number>`sum(case when ${questions.structuredRationale} is not null and ${questions.structuredRationale} <> '' then 1 else 0 end)`,
      })
      .from(questions)
      .where(eq(questions.exam, "nclex"));

    const ccrnLive = Number(examRows.find((row) => row.exam === "ccrn")?.count ?? fallback.ccrnLive);
    const nclexLive = Number(examRows.find((row) => row.exam === "nclex")?.count ?? fallback.nclexLive);
    const nclexMcqLive = countType(nclexTypeRows, "mcq");
    const nclexStructuredLive = Number(nclexStructuredRows[0]?.count ?? fallback.nclexStructuredLive);
    const nclexLegacyLive = Math.max(0, nclexLive - nclexStructuredLive);
    const nclexNgnLive =
      countType(nclexTypeRows, "sata")
      + countType(nclexTypeRows, "matrix")
      + countType(nclexTypeRows, "case_study")
      + countType(nclexTypeRows, "bow_tie");

    return {
      ccrnLive,
      nclexLive,
      totalLive: ccrnLive + nclexLive,
      nclexMcqLive,
      nclexNgnLive,
      nclexNgnRatio: nclexLive > 0 ? Math.round((nclexNgnLive / nclexLive) * 100) : fallback.nclexNgnRatio,
      nclexStructuredLive,
      nclexLegacyLive,
      nclexPremiumCoverageRatio: nclexLive > 0 ? Math.round((nclexStructuredLive / nclexLive) * 100) : fallback.nclexPremiumCoverageRatio,
      nclexDifficultyDistribution: distributionFromRows(nclexDifficultyRows, "count"),
      nclexPremiumDifficultyDistribution: distributionFromRows(nclexDifficultyRows, "structuredCount"),
    };
  } catch {
    return fallback;
  }
}
