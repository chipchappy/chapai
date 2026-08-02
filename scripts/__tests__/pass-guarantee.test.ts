import assert from "node:assert/strict";
import test from "node:test";
import {
  PASS_GUARANTEE_REQUIREMENTS,
  derivePassGuaranteeProgress,
  emptyPassGuaranteeProgress,
} from "../../apps/web/src/lib/pass-guarantee";

// The refund promise is a financial commitment, so the completion maths is
// locked down here: thresholds, saturation, and the expiry boundary.

const base = { enrolled: true, readinessExamsCompleted: 0, uniqueQuestionsAnswered: 0 };

test("published thresholds match the advertised fine print", () => {
  assert.equal(PASS_GUARANTEE_REQUIREMENTS.readinessExams, 5);
  assert.equal(PASS_GUARANTEE_REQUIREMENTS.uniqueQuestions, 2000);
});

test("an unenrolled account reports nothing complete", () => {
  const empty = emptyPassGuaranteeProgress();
  assert.equal(empty.enrolled, false);
  assert.equal(empty.completionMet, false);
  assert.equal(empty.percentComplete, 0);
});

test("completion requires BOTH criteria, not either", () => {
  assert.equal(derivePassGuaranteeProgress({ ...base, readinessExamsCompleted: 5, uniqueQuestionsAnswered: 1999 }).completionMet, false);
  assert.equal(derivePassGuaranteeProgress({ ...base, readinessExamsCompleted: 4, uniqueQuestionsAnswered: 2000 }).completionMet, false);
  assert.equal(derivePassGuaranteeProgress({ ...base, readinessExamsCompleted: 5, uniqueQuestionsAnswered: 2000 }).completionMet, true);
});

test("exceeding a threshold does not push the percentage past 100", () => {
  const over = derivePassGuaranteeProgress({ ...base, readinessExamsCompleted: 40, uniqueQuestionsAnswered: 99_999 });
  assert.equal(over.percentComplete, 100);
  assert.equal(over.completionMet, true);
});

test("one criterion maxed out is only half the progress", () => {
  const halfway = derivePassGuaranteeProgress({ ...base, readinessExamsCompleted: 5, uniqueQuestionsAnswered: 0 });
  assert.equal(halfway.percentComplete, 50);
  assert.equal(halfway.completionMet, false);
});

test("progress is weighted evenly across the two criteria", () => {
  const quarter = derivePassGuaranteeProgress({ ...base, readinessExamsCompleted: 0, uniqueQuestionsAnswered: 1000 });
  assert.equal(quarter.percentComplete, 25);
});

test("negative or fractional counts cannot inflate progress", () => {
  const odd = derivePassGuaranteeProgress({ ...base, readinessExamsCompleted: -3, uniqueQuestionsAnswered: 10.9 });
  assert.equal(odd.readinessExamsCompleted, 0);
  assert.equal(odd.uniqueQuestionsAnswered, 10);
  assert.equal(odd.percentComplete, 0);
});

test("access expiry is evaluated against the supplied clock", () => {
  const now = 1_800_000_000;
  const live = derivePassGuaranteeProgress({ ...base, accessExpiresAt: now + 60, now });
  const done = derivePassGuaranteeProgress({ ...base, accessExpiresAt: now - 60, now });
  assert.equal(live.accessExpired, false);
  assert.equal(done.accessExpired, true);
  // No expiry recorded is not the same as expired.
  assert.equal(derivePassGuaranteeProgress({ ...base, accessExpiresAt: null, now }).accessExpired, false);
});

test("meeting the criteria never depends on the access window", () => {
  const now = 1_800_000_000;
  const expiredButComplete = derivePassGuaranteeProgress({
    ...base,
    readinessExamsCompleted: 5,
    uniqueQuestionsAnswered: 2000,
    accessExpiresAt: now - 1,
    now,
  });
  // A student who did the work keeps their claim after access lapses.
  assert.equal(expiredButComplete.completionMet, true);
  assert.equal(expiredButComplete.accessExpired, true);
});
