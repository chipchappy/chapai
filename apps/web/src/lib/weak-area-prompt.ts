import { AT_RISK_ACCURACY, accuracyPercent } from "./quiz-accuracy";

// ─────────────────────────────────────────────────────────────────────────────
// Weak-area conversion prompt.
//
// After a free-tier student finishes a practice session, this decides whether
// the result contains one honest, specific claim worth pairing with an upgrade
// nudge: "you are genuinely weak in X." It is deliberately narrow — most
// sessions will not produce a claim, and that is correct. Returning null means
// the caller renders nothing; an absent claim is not padded out with a vague
// one.
//
// Two rules keep the claim honest:
//
//   * Accuracy always comes from accuracyPercent() in quiz-accuracy.ts — the
//     helper that replaced the divide-by-planned-deck-size bug that once
//     shipped 128% accuracy to the instructor dashboard. Only answers actually
//     recorded are ever a denominator here.
//
//   * A category needs WEAK_AREA_MIN_SAMPLE answers before it can be called
//     weak. quiz-accuracy.ts's own LOW_CONFIDENCE_ATTEMPTS (20) is calibrated
//     for accuracy pooled across many sessions on the faculty dashboard; a
//     single practice run rarely puts 20 answers in one category (a 50-item
//     NCLEX deck alone spans 8 client-need categories). 8 is the smallest
//     sample where a binomial proportion stops being dominated by one lucky or
//     unlucky guess: at n=8, flipping a single answer moves the rate by at
//     most 12.5 points, and a category the student has actually mastered
//     landing under AT_RISK_ACCURACY by chance alone at n=8 is already an
//     uncommon draw. Below 8 attempts, three answers at 33% is noise, not a
//     weakness, and this returns null.
// ─────────────────────────────────────────────────────────────────────────────

/** Minimum answered questions in a single category before its accuracy is trusted. */
export const WEAK_AREA_MIN_SAMPLE = 8;

export interface AnsweredRow {
  category: string;
  isCorrect: boolean;
}

export interface WeakAreaPrompt {
  /** The single weakest category that clears the sample-size floor. */
  category: string;
  /** 0-100, from accuracyPercent() — never a raw division. */
  accuracy: number;
  correct: number;
  attempts: number;
  /** Short, specific, honest sentence built only from the fields above. */
  message: string;
}

/**
 * Finds the single weakest category worth surfacing to a free-tier student
 * this session, or null when nothing in `rows` clears both the sample-size
 * floor and the at-risk accuracy bar. Pure — the caller supplies the rows,
 * this makes no request and touches no database.
 */
export function findWeakAreaPrompt(rows: readonly AnsweredRow[]): WeakAreaPrompt | null {
  const byCategory = new Map<string, { correct: number; attempts: number }>();

  for (const row of rows) {
    if (!row.category) continue;
    const bucket = byCategory.get(row.category) ?? { correct: 0, attempts: 0 };
    bucket.attempts += 1;
    if (row.isCorrect) bucket.correct += 1;
    byCategory.set(row.category, bucket);
  }

  let weakest: WeakAreaPrompt | null = null;

  for (const [category, bucket] of byCategory) {
    if (bucket.attempts < WEAK_AREA_MIN_SAMPLE) continue;

    const accuracy = accuracyPercent(bucket.correct, bucket.attempts);
    if (accuracy == null || accuracy >= AT_RISK_ACCURACY) continue;

    // The weakest accuracy wins; ties go to whichever reading has more
    // attempts behind it, since that is the more trustworthy number.
    const isNewWeakest =
      !weakest ||
      accuracy < weakest.accuracy ||
      (accuracy === weakest.accuracy && bucket.attempts > weakest.attempts);

    if (isNewWeakest) {
      weakest = {
        category,
        accuracy,
        correct: bucket.correct,
        attempts: bucket.attempts,
        message: buildWeakAreaMessage(category, accuracy, bucket.correct, bucket.attempts),
      };
    }
  }

  return weakest;
}

function buildWeakAreaMessage(category: string, accuracy: number, correct: number, attempts: number): string {
  return `You answered ${correct} of ${attempts} ${category} questions correctly this session (${accuracy}%) — enough attempts to call it a real pattern, not a rough patch.`;
}
