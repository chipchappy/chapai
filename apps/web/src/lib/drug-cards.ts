import rawDrugCards from "../../../../packages/content/staging/drug-cards/nclex-high-yield.json";

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
  nclexHighYield: boolean;
}

export interface DrugCardTerm {
  term: string;
  card: DrugCard;
}

export const DRUG_CARDS = (rawDrugCards as DrugCard[])
  .map((card) => ({
    ...card,
    brandNames: card.brandNames ?? [],
    priorityLabs: card.priorityLabs ?? [],
    nursingAssessments: card.nursingAssessments ?? [],
    contraindications: card.contraindications ?? [],
    nclexHighYield: card.nclexHighYield !== false,
  }))
  .sort((left, right) => left.genericName.localeCompare(right.genericName));

export function getDrugCardById(id: string) {
  return DRUG_CARDS.find((card) => card.id === id) ?? null;
}

export function getDrugCardTerms(): DrugCardTerm[] {
  const terms = new Map<string, DrugCardTerm>();
  for (const card of DRUG_CARDS) {
    for (const term of [card.genericName, ...card.brandNames]) {
      const normalized = term.trim();
      if (!normalized) continue;
      const key = normalized.toLowerCase();
      if (!terms.has(key)) {
        terms.set(key, { term: normalized, card });
      }
    }
  }

  return [...terms.values()].sort((left, right) => right.term.length - left.term.length);
}

export function searchDrugCards(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return DRUG_CARDS;
  }

  return DRUG_CARDS.filter((card) => {
    const haystack = [
      card.genericName,
      ...card.brandNames,
      card.class,
      card.mechanism,
      ...card.priorityLabs,
      ...card.nursingAssessments,
      ...card.contraindications,
      card.blackBoxWarning,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalized);
  });
}
