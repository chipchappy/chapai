// ─────────────────────────────────────────────────────────────────────────────
// Quiz accuracy.
//
// The instructor dashboard used to read `quiz_sessions.correct_count` over
// `quiz_sessions.total_questions`. Those two fields do not describe the same
// thing:
//
//   total_questions  the deck size chosen when the session was CREATED
//   correct_count    incremented for every correct answer ACTUALLY recorded
//
// A student who continues past the deck (adaptive/endless practice) keeps
// incrementing the numerator while the denominator stays frozen, so accuracy
// climbs past 100%. Observed in production: a 25-question deck with 47 answers
// and 32 correct rendered as 128%.
//
// Accuracy is therefore always derived from `quiz_answers`, which is the record
// of what the student actually did. Attempts are the denominator, so the value
// is bounded by construction and matches the per-category bars, which were
// already computed this way and were always correct.
//
// `clampPercent` is belt-and-braces: even with unexpected data no percentage
// escapes 0-100, because a nonsense number on a faculty dashboard destroys
// trust in every other number next to it.
// ─────────────────────────────────────────────────────────────────────────────

/** Below this many attempts an accuracy figure is too noisy to act on. */
export const LOW_CONFIDENCE_ATTEMPTS = 20;

/** Accuracy at or above this is "on track". */
export const ON_TRACK_ACCURACY = 65;

/** Accuracy below this is "needs support". */
export const AT_RISK_ACCURACY = 58;

export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

/**
 * Accuracy as a whole percentage. Returns null rather than 0 when nothing has
 * been attempted — "no data" and "got everything wrong" must not look alike.
 */
export function accuracyPercent(correct: number, attempts: number): number | null {
  const total = Math.max(0, Math.floor(attempts));
  if (total === 0) return null;
  return clampPercent((Math.max(0, Math.floor(correct)) / total) * 100);
}

export type AccuracyBand = "strong" | "on-track" | "borderline" | "at-risk" | "insufficient";

export function accuracyBand(accuracy: number | null, attempts: number): AccuracyBand {
  if (accuracy == null || attempts < LOW_CONFIDENCE_ATTEMPTS) return "insufficient";
  if (accuracy >= 75) return "strong";
  if (accuracy >= ON_TRACK_ACCURACY) return "on-track";
  if (accuracy >= AT_RISK_ACCURACY) return "borderline";
  return "at-risk";
}

/**
 * Pooled cohort accuracy: total correct over total attempts. Preferred over the
 * mean of per-student percentages, which lets a student who answered three
 * questions swing the cohort figure as hard as one who answered three hundred.
 */
export function pooledAccuracy(students: ReadonlyArray<{ correct: number; attempts: number }>): number | null {
  let correct = 0;
  let attempts = 0;
  for (const student of students) {
    correct += Math.max(0, Math.floor(student.correct));
    attempts += Math.max(0, Math.floor(student.attempts));
  }
  return accuracyPercent(correct, attempts);
}
