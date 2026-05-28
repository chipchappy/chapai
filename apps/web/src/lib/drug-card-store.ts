import { asc, eq } from "drizzle-orm";
import { drugCards } from "@chapai/db/schema";
import { getDB, hasDatabase, type Env } from "@/lib/db";
import { DRUG_CARDS, type DrugCard } from "@/lib/drug-cards";

type DrugCardRow = typeof drugCards.$inferSelect;

function parseJsonArray(value: string | null | undefined) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function normalizeDrugCardRow(row: DrugCardRow): DrugCard {
  return {
    id: row.id,
    genericName: row.genericName,
    brandNames: parseJsonArray(row.brandNames),
    class: row.drugClass,
    mechanism: row.mechanism ?? "",
    priorityLabs: parseJsonArray(row.priorityLabs),
    nursingAssessments: parseJsonArray(row.nursingAssessments),
    contraindications: parseJsonArray(row.contraindications),
    blackBoxWarning: row.blackBoxWarning ?? undefined,
    sourceName: row.sourceName ?? undefined,
    sourceHref: row.sourceHref ?? undefined,
    nclexHighYield: true,
  };
}

export async function getDrugCardsFromD1(env: Env) {
  if (!hasDatabase(env)) return null;
  const db = getDB(env);
  const rows = await db
    .select()
    .from(drugCards)
    .where(eq(drugCards.publishState, "published"))
    .orderBy(asc(drugCards.genericName));
  return rows.map(normalizeDrugCardRow);
}

export async function getDrugCardFromD1(env: Env, id: string) {
  if (!hasDatabase(env)) return null;
  const db = getDB(env);
  const rows = await db
    .select()
    .from(drugCards)
    .where(eq(drugCards.id, id))
    .limit(1);
  const row = rows[0];
  if (!row || row.publishState !== "published") return null;
  return normalizeDrugCardRow(row);
}

export function getStaticDrugCardById(id: string) {
  return DRUG_CARDS.find((card) => card.id === id) ?? null;
}
