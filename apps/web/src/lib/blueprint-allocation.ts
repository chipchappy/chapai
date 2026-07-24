export function allocateBlueprintCounts(
  blueprint: Record<string, number>,
  total: number,
) {
  const entries = Object.entries(blueprint);
  const safeTotal = Math.max(0, Math.floor(total));
  const weightTotal = entries.reduce((sum, [, weight]) => sum + Math.max(0, weight), 0);
  if (entries.length === 0 || weightTotal <= 0 || safeTotal === 0) {
    return Object.fromEntries(entries.map(([key]) => [key, 0]));
  }

  const allocations = entries.map(([key, weight], index) => {
    const exact = (Math.max(0, weight) / weightTotal) * safeTotal;
    return {
      key,
      index,
      count: Math.floor(exact),
      remainder: exact - Math.floor(exact),
    };
  });
  let unassigned = safeTotal - allocations.reduce((sum, item) => sum + item.count, 0);

  for (const allocation of [...allocations].sort(
    (left, right) => right.remainder - left.remainder || left.index - right.index,
  )) {
    if (unassigned <= 0) break;
    allocation.count += 1;
    unassigned -= 1;
  }

  return Object.fromEntries(allocations.map(({ key, count }) => [key, count]));
}

export function allocateBlueprintDeficits(
  blueprint: Record<string, number>,
  total: number,
  existingCounts: Record<string, number>,
) {
  const totalTargets = allocateBlueprintCounts(blueprint, total);
  const existingTotal = Object.values(existingCounts).reduce(
    (sum, count) => sum + Math.max(0, Math.floor(count)),
    0,
  );
  const remainingTotal = Math.max(0, Math.floor(total) - existingTotal);
  const deficits = Object.fromEntries(
    Object.keys(blueprint).map((key) => [
      key,
      Math.max(0, (totalTargets[key] ?? 0) - Math.max(0, Math.floor(existingCounts[key] ?? 0))),
    ]),
  );
  const deficitTotal = Object.values(deficits).reduce((sum, count) => sum + count, 0);

  if (deficitTotal === remainingTotal) return deficits;
  return allocateBlueprintCounts(deficits, remainingTotal);
}

export function getBlueprintCountMismatches(
  blueprint: Record<string, number>,
  total: number,
  actualCounts: Record<string, number>,
) {
  const targets = allocateBlueprintCounts(blueprint, total);

  return Object.keys(targets).flatMap((key) => {
    const target = targets[key] ?? 0;
    const actual = Math.max(0, Math.floor(actualCounts[key] ?? 0));
    return actual === target ? [] : [{ key, target, actual }];
  });
}
