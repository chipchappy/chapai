import rawDrugCards from "../../../../packages/content/staging/drug-cards/nclex-high-yield.json";
export { getDrugCardTerms } from "./drug-card-terms";
export type { DrugCardTerm } from "./drug-card-terms";

export interface DrugCard {
  id: string;
  genericName: string;
  brandNames: string[];
  class: string;
  mechanism: string;
  priorityLabs: string[];
  nursingAssessments: string[];
  contraindications: string[];
  blackBoxWarning?: string;
  sourceName?: string;
  sourceHref?: string;
  nclexHighYield: boolean;
}

export const DRUG_CARDS = (rawDrugCards as DrugCard[])
  .map((card) => ({
    ...card,
    brandNames: card.brandNames ?? [],
    priorityLabs: card.priorityLabs ?? [],
    nursingAssessments: card.nursingAssessments ?? [],
    contraindications: card.contraindications ?? [],
    sourceName: card.sourceName,
    sourceHref: card.sourceHref,
    nclexHighYield: card.nclexHighYield !== false,
  }))
  .sort((left, right) => left.genericName.localeCompare(right.genericName));

export function getDrugCardById(id: string) {
  return DRUG_CARDS.find((card) => card.id === id) ?? null;
}

export function searchDrugCardList(cards: DrugCard[], query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return cards;
  }

  return cards.filter((card) => {
    const haystack = [
      card.genericName,
      ...card.brandNames,
      card.class,
      card.mechanism,
      ...card.priorityLabs,
      ...card.nursingAssessments,
      ...card.contraindications,
      card.blackBoxWarning,
      card.sourceName,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalized);
  });
}

export function searchDrugCards(query: string) {
  return searchDrugCardList(DRUG_CARDS, query);
}
