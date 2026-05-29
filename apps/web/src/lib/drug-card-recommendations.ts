import type { StudyResource } from "./study-resources";
import { getDrugCardTerms } from "./drug-card-terms";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function getDrugCardStudyResourcesFromText(texts: string[], limit = 3): StudyResource[] {
  const haystack = texts.filter(Boolean).join("\n");
  if (!haystack) return [];

  const resources = new Map<string, StudyResource>();
  for (const entry of getDrugCardTerms()) {
    if (resources.has(entry.card.id)) continue;
    const pattern = new RegExp(`\\b${escapeRegExp(entry.term)}\\b`, "i");
    if (!pattern.test(haystack)) continue;
    resources.set(entry.card.id, {
      kind: "tool",
      title: `${entry.card.genericName} drug card`,
      href: `/study/pharmacology/${entry.card.id}`,
      source: "Clarity NCLEX",
      topic: "Pharmacology",
      free: true,
      why: `Matched ${entry.term} in missed-question history.`,
    });
    if (resources.size >= limit) break;
  }

  return [...resources.values()];
}

export function mergeStudyResources(primary: StudyResource[], fallback: StudyResource[], limit = 4) {
  const merged = new Map<string, StudyResource>();
  for (const resource of [...primary, ...fallback]) {
    if (!merged.has(resource.href)) merged.set(resource.href, resource);
    if (merged.size >= limit) break;
  }
  return [...merged.values()];
}
