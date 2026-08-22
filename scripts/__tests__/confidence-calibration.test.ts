import assert from "node:assert/strict";
import test from "node:test";
import {
  confidenceQuadrants,
  luckRate,
  overconfidenceRate,
  summarizeConfidenceCalibration,
} from "../../apps/web/src/lib/confidence-calibration";

// Regression guard for the confident-and-wrong feature: this is the quadrant
// a student never reviews on their own, so the counting and rates around it
// have to be exactly right.

test("rows bucket into the six quadrants and unrated rows are ignored", () => {
  const rows = [
    { confidence: "sure" as const, isCorrect: true },
    { confidence: "sure" as const, isCorrect: true },
    { confidence: "sure" as const, isCorrect: true },
    { confidence: "sure" as const, isCorrect: false },
    { confidence: "sure" as const, isCorrect: false },
    { confidence: "unsure" as const, isCorrect: true },
    { confidence: "unsure" as const, isCorrect: false },
    { confidence: "unsure" as const, isCorrect: false },
    { confidence: "unsure" as const, isCorrect: false },
    { confidence: "unsure" as const, isCorrect: false },
    { confidence: "guess" as const, isCorrect: true },
    { confidence: "guess" as const, isCorrect: true },
    { confidence: "guess" as const, isCorrect: true },
    { confidence: "guess" as const, isCorrect: true },
    { confidence: "guess" as const, isCorrect: true },
    { confidence: "guess" as const, isCorrect: false },
    { confidence: null, isCorrect: true },   // pre-feature history
    { confidence: undefined, isCorrect: false }, // student skipped the rating
  ];

  assert.deepEqual(confidenceQuadrants(rows), {
    sureCorrect: 3,
    sureWrong: 2,
    unsureCorrect: 1,
    unsureWrong: 4,
    guessCorrect: 5,
    guessWrong: 1,
  });
});

test("an empty history reports every quadrant at zero", () => {
  assert.deepEqual(confidenceQuadrants([]), {
    sureCorrect: 0,
    sureWrong: 0,
    unsureCorrect: 0,
    unsureWrong: 0,
    guessCorrect: 0,
    guessWrong: 0,
  });
});

test("overconfidenceRate is null with no sure answers, not 0", () => {
  // Null must not read as "perfectly calibrated" when it means "no data yet."
  const counts = confidenceQuadrants([
    { confidence: "unsure", isCorrect: true },
    { confidence: "guess", isCorrect: false },
  ]);
  assert.equal(overconfidenceRate(counts), null);
});

test("overconfidenceRate is the share of sure answers that were wrong", () => {
  const counts = confidenceQuadrants([
    { confidence: "sure", isCorrect: true },
    { confidence: "sure", isCorrect: true },
    { confidence: "sure", isCorrect: true },
    { confidence: "sure", isCorrect: false },
    { confidence: "sure", isCorrect: false },
  ]);
  assert.equal(overconfidenceRate(counts), 40); // 2 of 5 sure answers were wrong
});

test("overconfidenceRate is 0, not null, when every sure answer was right", () => {
  // A real zero (denominator present) must stay distinguishable from no-data.
  const counts = confidenceQuadrants([
    { confidence: "sure", isCorrect: true },
    { confidence: "sure", isCorrect: true },
  ]);
  assert.equal(overconfidenceRate(counts), 0);
});

test("luckRate is null with no guesses, not 0", () => {
  const counts = confidenceQuadrants([
    { confidence: "sure", isCorrect: true },
    { confidence: "unsure", isCorrect: false },
  ]);
  assert.equal(luckRate(counts), null);
});

test("luckRate is the share of guesses that landed correct", () => {
  const counts = confidenceQuadrants([
    { confidence: "guess", isCorrect: true },
    { confidence: "guess", isCorrect: true },
    { confidence: "guess", isCorrect: true },
    { confidence: "guess", isCorrect: true },
    { confidence: "guess", isCorrect: true },
    { confidence: "guess", isCorrect: false },
  ]);
  assert.equal(luckRate(counts), 83); // 5 of 6 guesses were correct, rounded
});

test("verdict prompts for data when there are no sure answers", () => {
  const summary = summarizeConfidenceCalibration([
    { confidence: "guess", isCorrect: true },
  ]);
  assert.equal(summary.verdict, "Mark how sure you are on a few more answers to unlock this insight.");
});

test("verdict celebrates full calibration when no sure answer was wrong", () => {
  const summary = summarizeConfidenceCalibration([
    { confidence: "sure", isCorrect: true },
    { confidence: "sure", isCorrect: true },
  ]);
  assert.equal(summary.verdict, "Fully calibrated so far — every question you were sure about, you got right.");
});

test("verdict names the confident-and-wrong count and rate, singular vs plural", () => {
  const singular = summarizeConfidenceCalibration([
    { confidence: "sure", isCorrect: true },
    { confidence: "sure", isCorrect: true },
    { confidence: "sure", isCorrect: true },
    { confidence: "sure", isCorrect: true },
    { confidence: "sure", isCorrect: false },
  ]);
  assert.equal(
    singular.verdict,
    "1 question you were confident on turned out wrong (20% of your sure answers) — review those first, since you won't flag them yourself."
  );

  const plural = summarizeConfidenceCalibration([
    { confidence: "sure", isCorrect: true },
    { confidence: "sure", isCorrect: true },
    { confidence: "sure", isCorrect: true },
    { confidence: "sure", isCorrect: false },
    { confidence: "sure", isCorrect: false },
  ]);
  assert.equal(
    plural.verdict,
    "2 questions you were confident on turned out wrong (40% of your sure answers) — review those first, since you won't flag them yourself."
  );
});

test("summarizeConfidenceCalibration composes quadrants, both rates, and the verdict", () => {
  const summary = summarizeConfidenceCalibration([
    { confidence: "sure", isCorrect: true },
    { confidence: "sure", isCorrect: false },
    { confidence: "guess", isCorrect: true },
    { confidence: "guess", isCorrect: false },
  ]);

  assert.deepEqual(summary.quadrants, {
    sureCorrect: 1,
    sureWrong: 1,
    unsureCorrect: 0,
    unsureWrong: 0,
    guessCorrect: 1,
    guessWrong: 1,
  });
  assert.equal(summary.overconfidenceRate, 50);
  assert.equal(summary.luckRate, 50);
  assert.equal(
    summary.verdict,
    "1 question you were confident on turned out wrong (50% of your sure answers) — review those first, since you won't flag them yourself."
  );
});
