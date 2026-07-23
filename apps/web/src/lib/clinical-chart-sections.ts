function normalizedClinicalText(value: string) {
  return value
    .toLowerCase()
    .replace(/^\s*(?:\d{4}:|hpi:|history:|entry \d+:)\s*/i, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function clinicalTokens(value: string) {
  return new Set(
    normalizedClinicalText(value)
      .split(" ")
      .filter((token) => token.length > 2),
  );
}

export function isClinicalEntryDuplicate(left: string, right: string) {
  const normalizedLeft = normalizedClinicalText(left);
  const normalizedRight = normalizedClinicalText(right);
  if (!normalizedLeft || !normalizedRight) return false;
  if (normalizedLeft === normalizedRight) return true;

  const shorter = normalizedLeft.length <= normalizedRight.length ? normalizedLeft : normalizedRight;
  const longer = shorter === normalizedLeft ? normalizedRight : normalizedLeft;
  if (shorter.length >= 80 && longer.includes(shorter) && shorter.length / longer.length >= 0.72) {
    return true;
  }

  const leftTokens = clinicalTokens(left);
  const rightTokens = clinicalTokens(right);
  if (leftTokens.size < 6 || rightTokens.size < 6) return false;
  const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  const union = new Set([...leftTokens, ...rightTokens]).size;
  return union > 0 && intersection / union >= 0.82;
}

export function uniqueClinicalEntries(values: readonly string[]) {
  const output: string[] = [];
  for (const value of values) {
    const text = String(value ?? "").replace(/\s+/g, " ").trim();
    if (!text || output.some((existing) => isClinicalEntryDuplicate(existing, text))) continue;
    output.push(text);
  }
  return output;
}

export function excludeClinicalOverlap(values: readonly string[], comparison: readonly string[]) {
  return uniqueClinicalEntries(values).filter(
    (value) => !comparison.some((existing) => isClinicalEntryDuplicate(value, existing)),
  );
}

export function buildDistinctClinicalSections(input: {
  hpi: readonly string[];
  notes: readonly string[];
}) {
  const hpi = uniqueClinicalEntries(input.hpi);
  const notes = excludeClinicalOverlap(input.notes, hpi);
  return { hpi, notes };
}
