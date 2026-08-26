/**
 * Competitor list prices shown next to our own on the upgrade paywall.
 *
 * These are claims made on a payment surface, so they carry a verification
 * date and a source URL and must be re-checked before that date goes stale.
 * Compare like with like: every row below is the cheapest entry point that
 * includes a question bank, quoted at its shortest term, so the monthly-
 * equivalent column is honest rather than flattering.
 *
 * Verified 2026-08-26 against each vendor's own pricing page.
 */

export const COMPETITOR_PRICING_VERIFIED_ON = "August 2026";

export type CompetitorPrice = {
  name: string;
  /** Cheapest bank-inclusive plan, at its shortest advertised term. */
  price: number;
  term: string;
  /** What that plan is called on their site, so the comparison is checkable. */
  plan: string;
  source: string;
};

export const COMPETITOR_PRICES: CompetitorPrice[] = [
  {
    name: "UWorld",
    price: 139,
    term: "30 days",
    plan: "NCLEX-RN QBank, 30-day",
    source: "https://nursing.uworld.com/nclex-rn/",
  },
  {
    name: "Archer Review",
    price: 79,
    term: "1 month",
    plan: "Q-Bank + CAT, 1-month",
    source: "https://nurses.archerreview.com/nclex-rn",
  },
];
