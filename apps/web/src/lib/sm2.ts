import type { SM2Quality, SM2Result } from "./types";

/**
 * SM-2 Spaced Repetition Algorithm
 * https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-obtained-in-working-with-the-supermemo-method
 *
 * Quality scale:
 *   5 - perfect recall, instant
 *   4 - correct, minor hesitation
 *   3 - correct, significant difficulty
 *   2 - incorrect, but felt easy after seeing answer
 *   1 - incorrect, had some memory
 *   0 - complete blackout
 */
export function calculateSM2(
  quality: SM2Quality,
  repetitions: number,
  easeFactor: number,
  intervalDays: number
): SM2Result {
  let newRepetitions: number;
  let newIntervalDays: number;
  let newEaseFactor: number;

  if (quality >= 3) {
    // Correct response
    if (repetitions === 0) {
      newIntervalDays = 1;
    } else if (repetitions === 1) {
      newIntervalDays = 6;
    } else {
      newIntervalDays = Math.round(intervalDays * easeFactor);
    }
    newRepetitions = repetitions + 1;
  } else {
    // Incorrect — reset
    newRepetitions = 0;
    newIntervalDays = 1;
  }

  // Update ease factor (EF)
  newEaseFactor = Math.max(
    1.3, // minimum EF
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  return {
    nextIntervalDays: newIntervalDays,
    newEaseFactor: newEaseFactor,
    newRepetitions: newRepetitions,
  };
}

/** Map correctness to SM-2 quality for quiz answers */
export function answerToQuality(isCorrect: boolean, timeSpentMs?: number): SM2Quality {
  if (!isCorrect) {
    // If incorrect: 1 (had some memory) vs 0 (blackout) based on time
    // Quick incorrect = probably guessed (blackout)
    return timeSpentMs && timeSpentMs < 10000 ? 0 : 1;
  }
  // Correct: scale by speed
  if (!timeSpentMs) return 3;
  if (timeSpentMs < 15000) return 5; // < 15s = perfect
  if (timeSpentMs < 30000) return 4; // < 30s = good
  if (timeSpentMs < 60000) return 3; // < 60s = correct with effort
  return 3;
}

/** Returns unix timestamp for next review */
export function nextReviewTimestamp(intervalDays: number): number {
  const now = Math.floor(Date.now() / 1000);
  return now + intervalDays * 24 * 60 * 60;
}
