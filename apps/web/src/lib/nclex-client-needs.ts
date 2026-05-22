import type { NclexClientNeed } from "@/lib/types";

const NCLEX_CLIENT_NEED_KEYS = [
  "management_of_care",
  "safety_infection_control",
  "health_promotion",
  "psychosocial",
  "basic_care_comfort",
  "pharmacological",
  "risk_reduction",
  "physiological_adaptation",
] as const satisfies readonly NclexClientNeed[];

type NclexClientNeedCandidate = {
  exam?: string | null;
  nclexClientNeed?: string | null;
  category?: string | null;
  subcategory?: string | null;
  tags?: string[] | null;
};

export function isNclexClientNeed(value: string | null | undefined): value is NclexClientNeed {
  return NCLEX_CLIENT_NEED_KEYS.includes(String(value ?? "").trim() as NclexClientNeed);
}

export function inferNclexClientNeedFromText(rawText: string | null | undefined): NclexClientNeed {
  const text = String(rawText ?? "").toLowerCase();
  if (!text) {
    return "physiological_adaptation";
  }

  if (/(deleg|scope|assignment|triage|consent|ethic|abuse|chain[_ ]of[_ ]command|advance[_ ]directive|discharge|reporting|emtala|organ[_ ]donation|leadership|priority[_ ]triage)/.test(text)) return "management_of_care";
  if (/(infection|isolation|precaution|fall|restraint|tb|mrsa|c[_ ]?diff|sharps|airborne|latex|hazmat|timeout|fire[_ ]safety|contact[_ ]precautions|transmission)/.test(text)) return "safety_infection_control";
  if (/(screen|immuniz|well[_ ]child|prenatal|breastfeed|contracept|milestone|health[_ ]promotion|lifestyle|smoking[_ ]cessation|cancer[_ ]screening|gestational[_ ]diabetes[_ ]screening|osteoporosis)/.test(text)) return "health_promotion";
  if (/(psych|suicid|grief|ptsd|assault|autism|depress|schizoph|withdrawal|anorexia|domestic[_ ]violence|crisis[_ ]intervention|opioid[_ ]use[_ ]disorder|acute[_ ]psychosis|de[_ ]escalation)/.test(text)) return "psychosocial";
  if (/(ostomy|feeding|tube|pain|rom|pressure[_ ]inj|sleep|nutrition|comfort|postmortem|wound[_ ]vac|palliative|ng[_ ]tube|enteral|immobility|perioperative[_ ]npo)/.test(text)) return "basic_care_comfort";
  if (/(insulin|heparin|warfarin|digoxin|drug|medication|anticoagul|pharm|toxic|overdose|antidote|aminoglycoside|chemotherapy|lithium|magnesium[_ ]sulfate|nitroglycerin|leucovorin|serotonin[_ ]syndrome|neuroleptic[_ ]malignant)/.test(text)) return "pharmacological";
  if (/(risk|monitor|chest[_ ]tube|abg|ecg|catheter|central[_ ]line|contrast|biopsy|dialysis|procedure|complication|reduction|lumbar[_ ]puncture|cardiac[_ ]catheterization|peritoneal[_ ]dialysis|transfusion|air[_ ]leak|peritonitis|diagnostic)/.test(text)) return "risk_reduction";
  return "physiological_adaptation";
}

export function resolveNclexClientNeed(candidate: NclexClientNeedCandidate): NclexClientNeed | undefined {
  if (candidate.exam && candidate.exam !== "nclex") {
    return undefined;
  }

  if (isNclexClientNeed(candidate.nclexClientNeed)) {
    return candidate.nclexClientNeed;
  }

  return inferNclexClientNeedFromText(
    [candidate.category, candidate.subcategory, ...(candidate.tags ?? [])]
      .filter(Boolean)
      .join(" "),
  );
}

export function matchesQuestionCategory(
  question: Pick<NclexClientNeedCandidate, "exam" | "nclexClientNeed" | "category" | "subcategory" | "tags">,
  categoryFilter: string | undefined,
) {
  if (!categoryFilter) {
    return true;
  }

  if (question.category === categoryFilter) {
    return true;
  }

  if (question.exam === "nclex" && isNclexClientNeed(categoryFilter)) {
    return resolveNclexClientNeed(question) === categoryFilter;
  }

  return false;
}

export function buildNclexClientNeedCountsFromCategoryCounts(categoryCounts: Record<string, number>) {
  const counts = Object.fromEntries(NCLEX_CLIENT_NEED_KEYS.map((key) => [key, 0])) as Record<NclexClientNeed, number>;

  for (const [category, count] of Object.entries(categoryCounts)) {
    const clientNeed = isNclexClientNeed(category)
      ? category
      : resolveNclexClientNeed({ exam: "nclex", category });
    if (clientNeed) {
      counts[clientNeed] += Number(count ?? 0);
    }
  }

  return counts;
}
