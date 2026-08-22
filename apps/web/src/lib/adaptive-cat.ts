// ─────────────────────────────────────────────────────────────────────────────
// Variable-length adaptive testing, modelled on how the real NCLEX-RN ends.
//
// The live exam is not a fixed 85 questions. It runs between a minimum and a
// maximum and stops the moment it is confident enough that the candidate is
// above or below the passing standard. Two things follow that a fixed-length
// mock cannot reproduce:
//
//   - the exam can end at item 91, or run to the cap
//   - you do not know which, while you are sitting it
//
// That uncertainty is a real part of test-day psychology, and simulating it is
// the point. A progress bar reading "42 of 85" trains the wrong instinct.
//
// The model is one-parameter logistic (Rasch): each item has a difficulty, the
// candidate has an ability, and the chance of a correct answer is a logistic
// function of the gap. Ability is re-estimated after every answer by
// Newton-Raphson on the likelihood, and the standard error comes from the test
// information. This is deliberately the simplest defensible model — a 3PL would
// need item discrimination and guessing parameters calibrated from real
// response data, which this bank does not have. Claiming more precision than
// the data supports would be worse than claiming less.
// ─────────────────────────────────────────────────────────────────────────────

export type CatResponse = {
  /** Authored difficulty 1..5. Converted to logits internally. */
  difficulty: number;
  correct: boolean;
};

export type CatState = {
  /** Ability estimate in logits. 0 is the passing standard. */
  ability: number;
  /** Standard error of that estimate. Falls as evidence accumulates. */
  standardError: number;
  answered: number;
  /** null until the exam ends. */
  decision: "pass" | "fail" | null;
  reason: "confident" | "max-length" | null;
  done: boolean;
};

/** Real NCLEX-RN minimum and maximum. */
export const MIN_ITEMS = 85;
export const MAX_ITEMS = 150;

/**
 * The passing standard, in logits. Zero by construction: authored difficulty 3
 * maps to 0, so "consistently answers average items correctly" sits exactly at
 * the standard.
 */
export const PASSING_STANDARD = 0;

/**
 * 95% confidence, matching the rule the live exam uses. The estimate must be
 * this many standard errors clear of the standard before the exam will stop.
 */
export const CONFIDENCE_Z = 1.96;

/** Guards the Newton step so a run of identical answers cannot diverge. */
const ABILITY_BOUND = 4;

/**
 * Authored 1..5 difficulty onto a logit scale, with 3 at the passing standard.
 * 0.8 logits per step spreads the five levels across roughly the range a real
 * item pool covers.
 */
export function difficultyToLogit(difficulty: number): number {
  // Number.isFinite, not `|| 3`: zero is falsy, so `Number(0) || 3` silently
  // turned an out-of-range 0 into an average item instead of clamping it to 1.
  const value = Number(difficulty);
  const safe = Number.isFinite(value) ? value : 3;
  return (Math.min(5, Math.max(1, safe)) - 3) * 0.8;
}

/** Rasch probability of a correct response. */
function probability(ability: number, itemLogit: number): number {
  return 1 / (1 + Math.exp(-(ability - itemLogit)));
}

/**
 * Maximum-likelihood ability estimate by Newton-Raphson.
 *
 * All-correct or all-incorrect response strings have no finite MLE — the
 * likelihood rises forever — so the estimate is bounded rather than allowed to
 * run away. That is why an exam cannot terminate on the first handful of items
 * no matter how lopsided they are.
 */
export function estimateAbility(responses: CatResponse[]): { ability: number; standardError: number } {
  if (!responses.length) return { ability: 0, standardError: Infinity };

  let ability = 0;
  for (let iteration = 0; iteration < 24; iteration += 1) {
    let firstDerivative = 0;
    let information = 0;
    for (const response of responses) {
      const p = probability(ability, difficultyToLogit(response.difficulty));
      firstDerivative += (response.correct ? 1 : 0) - p;
      information += p * (1 - p);
    }
    if (information < 1e-9) break;
    const step = firstDerivative / information;
    ability += Math.max(-1, Math.min(1, step));      // damped
    if (Math.abs(step) < 1e-6) break;
  }
  ability = Math.max(-ABILITY_BOUND, Math.min(ABILITY_BOUND, ability));

  let information = 0;
  for (const response of responses) {
    const p = probability(ability, difficultyToLogit(response.difficulty));
    information += p * (1 - p);
  }
  const standardError = information > 0 ? 1 / Math.sqrt(information) : Infinity;
  return { ability, standardError };
}

/**
 * Apply the stopping rule.
 *
 * Below MIN_ITEMS the exam never stops, however lopsided the responses — the
 * real exam does the same, and it is what stops a run of luck ending a test.
 */
export type CatBounds = { minItems?: number; maxItems?: number };

export function evaluateCat(responses: CatResponse[], bounds: CatBounds = {}): CatState {
  // Bounds are injectable because the live exam runs 85-150 while an assembled
  // practice form may be shorter. The rule is the same either way; only where
  // it is allowed to stop changes, and a caller must not silently get the real
  // exam range from a form that cannot supply it.
  const minItems = Math.max(1, bounds.minItems ?? MIN_ITEMS);
  const maxItems = Math.max(minItems, bounds.maxItems ?? MAX_ITEMS);
  const answered = responses.length;
  const { ability, standardError } = estimateAbility(responses);
  const base: CatState = { ability, standardError, answered, decision: null, reason: null, done: false };

  if (answered < minItems) return base;

  const margin = CONFIDENCE_Z * standardError;
  if (ability - margin > PASSING_STANDARD) {
    return { ...base, decision: "pass", reason: "confident", done: true };
  }
  if (ability + margin < PASSING_STANDARD) {
    return { ...base, decision: "fail", reason: "confident", done: true };
  }
  if (answered >= maxItems) {
    // Out of items. The live exam decides on the final ability estimate alone,
    // which is the one case where a near-standard candidate is resolved by a
    // coin-flip-thin margin — so it is reported as max-length, not confident.
    return {
      ...base,
      decision: ability >= PASSING_STANDARD ? "pass" : "fail",
      reason: "max-length",
      done: true,
    };
  }
  return base;
}

/**
 * Which difficulty to serve next: the one that yields most information about
 * this candidate, which under Rasch is the item closest to their current
 * ability. Returns an authored 1..5 level, since that is what the bank stores.
 */
export function nextDifficulty(state: Pick<CatState, "ability" | "answered">): number {
  // Before there is any evidence, start at the standard rather than at an
  // extreme. Opening on a level-5 item is discouraging and uninformative.
  if (state.answered === 0) return 3;
  const level = Math.round(state.ability / 0.8 + 3);
  return Math.min(5, Math.max(1, level));
}

/**
 * What the candidate is allowed to see. Deliberately omits how many items
 * remain: concealing that is the feature, not an oversight.
 */
export function candidateProgress(state: CatState, bounds: CatBounds = {}): { answered: number; minimum: number; maximum: number } {
  return {
    answered: state.answered,
    minimum: bounds.minItems ?? MIN_ITEMS,
    maximum: bounds.maxItems ?? MAX_ITEMS,
  };
}
