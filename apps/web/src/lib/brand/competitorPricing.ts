export const competitorPricing = {
  UWorld_30: 109,
  UWorld_180: 339,
  Bootcamp_6mo: 169,
  ATI_3mo: 199,
  Kaplan_6mo: 349,
} as const;

export function competitorComparisonLine() {
  return `UWorld 30-day: $${competitorPricing.UWorld_30}. Bootcamp 6-month: $${competitorPricing.Bootcamp_6mo}. Clarity 1-month: $9.99.`;
}
