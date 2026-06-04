import "server-only";

import { and, eq, like, or, sql } from "drizzle-orm";
import type { DB } from "@/lib/db";
import { drugCards } from "@chapai/db/schema";

export type DrugCardRecommendation = {
  id: string;
  genericName: string;
  brandNames: string | null;
  drugClass: string;
  mechanism: string | null;
  blackBoxWarning: string | null;
  priorityLabs: string | null;
  patientTeaching: string | null;
  nursingImplications: string | null;
  relatedTags: string | null;
};

const FULL_COLUMNS = {
  id: drugCards.id,
  genericName: drugCards.genericName,
  brandNames: drugCards.brandNames,
  drugClass: drugCards.drugClass,
  mechanism: drugCards.mechanism,
  blackBoxWarning: drugCards.blackBoxWarning,
  priorityLabs: drugCards.priorityLabs,
  patientTeaching: drugCards.patientTeaching,
  nursingImplications: drugCards.nursingImplications,
  relatedTags: drugCards.relatedTags,
} as const;

/**
 * Returns the single best drug card to recommend for a missed question.
 * Match strategy:
 *   1. Exact match on any of the question's tags against `related_tags`
 *   2. Fallback: any card whose `drug_class` matches the question category
 *      slug pattern (e.g., "pharmacology" → top class card)
 *   3. Null if no published cards exist or no match found.
 *
 * Until the drug_cards table is seeded this safely returns null — surfaces
 * downstream just skip the recommendation block.
 */
export async function recommendDrugCardForQuestion(
  db: DB | null,
  input: { category: string; tags?: string[] | null },
): Promise<DrugCardRecommendation | null> {
  if (!db) return null;
  const tags = (input.tags ?? []).map((t) => t.toLowerCase().trim()).filter(Boolean);

  try {
    // Try tag match first
    if (tags.length > 0) {
      const tagConditions = tags.slice(0, 8).map((tag) =>
        like(drugCards.relatedTags, `%${tag}%`),
      );
      const tagged = await db
        .select(FULL_COLUMNS)
        .from(drugCards)
        .where(and(eq(drugCards.publishState, "published"), or(...tagConditions)))
        .orderBy(sql`random()`)
        .limit(1)
        .get();
      if (tagged) return tagged;
    }

    // Fallback: pharmacology-flavored category → any published card
    if (/pharm|drug|medication/i.test(input.category)) {
      const fallback = await db
        .select(FULL_COLUMNS)
        .from(drugCards)
        .where(eq(drugCards.publishState, "published"))
        .orderBy(sql`random()`)
        .limit(1)
        .get();
      if (fallback) return fallback;
    }
  } catch {
    // soft-fail
  }
  return null;
}

export async function getDrugCardById(
  db: DB | null,
  id: string,
): Promise<DrugCardRecommendation | null> {
  if (!db) return null;
  try {
    const row = await db
      .select(FULL_COLUMNS)
      .from(drugCards)
      .where(and(eq(drugCards.id, id), eq(drugCards.publishState, "published")))
      .get();
    return row ?? null;
  } catch {
    return null;
  }
}
