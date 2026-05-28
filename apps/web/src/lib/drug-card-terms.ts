import rawDrugCardIndex from "../../../../packages/content/staging/drug-cards/nclex-high-yield-index.json";

export interface DrugCardTerm {
  term: string;
  card: {
    id: string;
    genericName: string;
  };
}

interface DrugCardIndexEntry {
  id: string;
  genericName: string;
  brandNames: string[];
}

const DRUG_CARD_INDEX = (rawDrugCardIndex as DrugCardIndexEntry[])
  .map((card) => ({
    ...card,
    brandNames: card.brandNames ?? [],
  }))
  .sort((left, right) => left.genericName.localeCompare(right.genericName));

export function getDrugCardTerms(): DrugCardTerm[] {
  const terms = new Map<string, DrugCardTerm>();
  for (const card of DRUG_CARD_INDEX) {
    for (const term of [card.genericName, ...card.brandNames]) {
      const normalized = term.trim();
      if (!normalized) continue;
      const key = normalized.toLowerCase();
      if (!terms.has(key)) {
        terms.set(key, { term: normalized, card: { id: card.id, genericName: card.genericName } });
      }
    }
  }

  return [...terms.values()].sort((left, right) => right.term.length - left.term.length);
}
