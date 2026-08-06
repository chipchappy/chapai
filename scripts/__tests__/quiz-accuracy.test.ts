import assert from "node:assert/strict";
import test from "node:test";
import {
  LOW_CONFIDENCE_ATTEMPTS,
  accuracyBand,
  accuracyPercent,
  clampPercent,
  pooledAccuracy,
} from "../../apps/web/src/lib/quiz-accuracy";

// Regression guard for the 128% bug seen on the live instructor dashboard.

test("the production 128% case now reports the true accuracy", () => {
  // Real session: 25-question deck, student continued to 47 answers, 32 correct.
  // The old maths was correct_count / total_questions = 32 / 25 = 128%.
  assert.equal(accuracyPercent(32, 47), 68);
});

test("accuracy can never exceed 100 even with contradictory counts", () => {
  assert.equal(accuracyPercent(32, 25), 100);
  assert.equal(accuracyPercent(9999, 1), 100);
  assert.equal(clampPercent(128), 100);
  assert.equal(clampPercent(-4), 0);
  assert.equal(clampPercent(Number.NaN), 0);
});

test("no attempts reports null, not zero", () => {
  // "Hasn't started" and "got everything wrong" must not render identically.
  assert.equal(accuracyPercent(0, 0), null);
  assert.equal(accuracyPercent(5, 0), null);
  assert.equal(accuracyPercent(0, 10), 0);
});

test("negative or fractional inputs cannot distort the result", () => {
  assert.equal(accuracyPercent(-5, 10), 0);
  assert.equal(accuracyPercent(7.9, 10), 70);
});

test("small samples are banded as insufficient regardless of the value", () => {
  assert.equal(accuracyBand(100, 3), "insufficient");
  assert.equal(accuracyBand(100, LOW_CONFIDENCE_ATTEMPTS - 1), "insufficient");
  assert.equal(accuracyBand(null, 500), "insufficient");
  assert.equal(accuracyBand(90, LOW_CONFIDENCE_ATTEMPTS), "strong");
});

test("bands map to the documented thresholds", () => {
  assert.equal(accuracyBand(80, 50), "strong");
  assert.equal(accuracyBand(68, 50), "on-track");
  assert.equal(accuracyBand(60, 50), "borderline");
  assert.equal(accuracyBand(40, 50), "at-risk");
});

test("cohort accuracy is pooled, so volume outweighs a tiny perfect sample", () => {
  const cohort = [
    { correct: 50, attempts: 74 },  // the real 68% student
    { correct: 3, attempts: 3 },    // 100% on three questions
  ];
  // Mean-of-percentages would report (68 + 100) / 2 = 84. Pooled is 53/77.
  assert.equal(pooledAccuracy(cohort), 69);
});

test("a cohort with no attempts reports null", () => {
  assert.equal(pooledAccuracy([]), null);
  assert.equal(pooledAccuracy([{ correct: 0, attempts: 0 }]), null);
});
