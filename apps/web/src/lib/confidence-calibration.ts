// ─────────────────────────────────────────────────────────────────────────────
// Confidence calibration.
//
// A student marks how sure they were on each answer: sure, unsure, or guess.
// Crossed with correctness that gives six quadrants, and one of them is the
// whole point of this feature — SURE + WRONG. A student never opens that
// item's rationale on their own, because as far as they know they already
// have it; it doesn't feel broken. Confident-and-wrong is what predicts an
// exam-day surprise, not "unsure and wrong," which the student already
// suspects and is more likely to review unprompted.
//
// Rates follow the same null-when-no-data rule as quiz-accuracy.ts: a rate
// with a zero denominator is missing information, not "0% overconfident."
// Reporting 0 there would read as "perfectly calibrated," which is the one
// claim that cannot be made without a single sure answer to back it up.
// ─────────────────────────────────────────────────────────────────────────────

import { clampPercent } from "./quiz-accuracy";

export type Confidence = "sure" | "unsure" | "guess";

export interface ConfidenceAnswer {
  confidence: Confidence | null | undefined;
  isCorrect: boolean;
}

export interface ConfidenceQuadrants {
  sureCorrect: number;
  sureWrong: number;
  unsureCorrect: number;
  unsureWrong: number;
  guessCorrect: number;
  guessWrong: number;
}

export interface ConfidenceCalibration {
  quadrants: ConfidenceQuadrants;
  /** sure+wrong / all sure answers, as a whole percent. Null with no sure answers. */
  overconfidenceRate: number | null;
  /** guess+correct / all guess answers, as a whole percent. Null with no guesses. */
  luckRate: number | null;
  verdict: string;
}

/**
 * Bucket answered rows into the six confidence x correctness quadrants. Rows
 * with no confidence recorded (pre-feature history, or a student who skipped
 * the rating) don't belong to any quadrant — there's nothing to calibrate
 * without a self-rating to check against the outcome.
 */
export function confidenceQuadrants(rows: readonly ConfidenceAnswer[]): ConfidenceQuadrants {
  const counts: ConfidenceQuadrants = {
    sureCorrect: 0,
    sureWrong: 0,
    unsureCorrect: 0,
    unsureWrong: 0,
    guessCorrect: 0,
    guessWrong: 0,
  };

  for (const row of rows) {
    if (row.confidence === "sure") {
      if (row.isCorrect) counts.sureCorrect += 1; else counts.sureWrong += 1;
    } else if (row.confidence === "unsure") {
      if (row.isCorrect) counts.unsureCorrect += 1; else counts.unsureWrong += 1;
    } else if (row.confidence === "guess") {
      if (row.isCorrect) counts.guessCorrect += 1; else counts.guessWrong += 1;
    }
  }

  return counts;
}

/**
 * Share of "sure" answers that were actually wrong — the failure-predicting
 * quadrant. Null rather than 0 when there are no sure answers to judge.
 */
export function overconfidenceRate(counts: ConfidenceQuadrants): number | null {
  const sureTotal = counts.sureCorrect + counts.sureWrong;
  if (sureTotal === 0) return null;
  return clampPercent((counts.sureWrong / sureTotal) * 100);
}

/**
 * Share of "guess" answers that landed correct anyway. High luck means raw
 * accuracy on those items overstates what the student actually knows.
 */
export function luckRate(counts: ConfidenceQuadrants): number | null {
  const guessTotal = counts.guessCorrect + counts.guessWrong;
  if (guessTotal === 0) return null;
  return clampPercent((counts.guessCorrect / guessTotal) * 100);
}

function verdictFor(counts: ConfidenceQuadrants, overconfidence: number | null): string {
  if (overconfidence == null) {
    return "Mark how sure you are on a few more answers to unlock this insight.";
  }
  if (counts.sureWrong === 0) {
    return "Fully calibrated so far — every question you were sure about, you got right.";
  }
  const item = counts.sureWrong === 1 ? "question" : "questions";
  return `${counts.sureWrong} ${item} you were confident on turned out wrong (${overconfidence}% of your sure answers) — review those first, since you won't flag them yourself.`;
}

/** Given a student's answer history, summarize their confidence calibration. */
export function summarizeConfidenceCalibration(rows: readonly ConfidenceAnswer[]): ConfidenceCalibration {
  const quadrants = confidenceQuadrants(rows);
  const overconfidence = overconfidenceRate(quadrants);
  const luck = luckRate(quadrants);
  return {
    quadrants,
    overconfidenceRate: overconfidence,
    luckRate: luck,
    verdict: verdictFor(quadrants, overconfidence),
  };
}
