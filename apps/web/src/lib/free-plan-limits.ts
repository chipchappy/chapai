/**
 * Free-plan allowances, shared by the API routes that enforce them and the UI
 * that explains them. Keep this module client-safe (no "server-only", no db
 * imports) so the paywall copy and the gate can never drift apart — a mismatch
 * here is what let the pricing page advertise "10/day" while the route enforced
 * a 200-question lifetime cap.
 */

/** Lifetime practice questions a free signed-in account may answer. */
export const FREE_QUESTION_LIMIT = 300;

/** Completed readiness ("dynamic competency") exams included on the free plan. */
export const FREE_PRACTICE_EXAM_LIMIT = 1;

/** The single readiness exam a free account may sit. */
export const FREE_PRACTICE_EXAM_ID = "nclex-sim-1";

/** Error codes the client maps to the upgrade paywall. */
export const FREE_LIMIT_CODES = {
  questions: "FREE_LIMIT_REACHED",
  exam: "FREE_EXAM_USED",
  premium: "PREMIUM_REQUIRED",
} as const;

export type FreeLimitCode = (typeof FREE_LIMIT_CODES)[keyof typeof FREE_LIMIT_CODES];

const PAYWALL_CODES = new Set<string>(Object.values(FREE_LIMIT_CODES));

/** True when a failed response should open the upgrade paywall rather than an inline error. */
export function isPaywallCode(code: unknown): code is FreeLimitCode {
  return typeof code === "string" && PAYWALL_CODES.has(code);
}
