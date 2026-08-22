import assert from "node:assert/strict";
import test from "node:test";
import { WEAK_AREA_MIN_SAMPLE, findWeakAreaPrompt, type AnsweredRow } from "../../apps/web/src/lib/weak-area-prompt";

function rows(category: string, correctCount: number, wrongCount: number): AnsweredRow[] {
  return [
    ...Array.from({ length: correctCount }, () => ({ category, isCorrect: true })),
    ...Array.from({ length: wrongCount }, () => ({ category, isCorrect: false })),
  ];
}

test("no answers at all reports null", () => {
  assert.equal(findWeakAreaPrompt([]), null);
});

test("below the minimum sample reports null even at a bad rate", () => {
  // 1 of 3 correct is 33%, well under the at-risk bar, but 3 attempts is noise.
  assert.ok(WEAK_AREA_MIN_SAMPLE > 3);
  assert.equal(findWeakAreaPrompt(rows("Pharmacological & Parenteral", 1, 2)), null);
});

test("a genuine weak area fires once the sample floor is met", () => {
  // 3 of 8 correct = 38%, under AT_RISK_ACCURACY (58), at exactly the floor.
  const result = findWeakAreaPrompt(rows("Physiological Adaptation", 3, 5));
  assert.ok(result);
  assert.equal(result?.category, "Physiological Adaptation");
  assert.equal(result?.accuracy, 38);
  assert.equal(result?.correct, 3);
  assert.equal(result?.attempts, 8);
  assert.match(result!.message, /Physiological Adaptation/);
  assert.match(result!.message, /3 of 8/);
  assert.match(result!.message, /38%/);
});

test("strong accuracy never fires, no matter the sample size", () => {
  // 40 of 50 correct = 80%, comfortably on-track.
  assert.equal(findWeakAreaPrompt(rows("Safety & Infection Control", 40, 10)), null);
});

test("exactly at the at-risk boundary does not count as weak", () => {
  // 7 of 12 correct = 58.33% -> rounds to 58, equal to AT_RISK_ACCURACY, not below it.
  assert.equal(findWeakAreaPrompt(rows("Basic Care & Comfort", 7, 5)), null);
  // One fewer correct answer (6 of 12 = 50%) clears the bar.
  const result = findWeakAreaPrompt(rows("Basic Care & Comfort", 6, 6));
  assert.equal(result?.accuracy, 50);
});

test("picks the single weakest category when several qualify", () => {
  const combined = [
    ...rows("Management of Care", 7, 3),        // 70%, not weak
    ...rows("Reduction of Risk Potential", 2, 8), // 20%, weak
    ...rows("Psychosocial Integrity", 4, 5),      // 44%, weak but less severe
  ];
  const result = findWeakAreaPrompt(combined);
  assert.equal(result?.category, "Reduction of Risk Potential");
  assert.equal(result?.accuracy, 20);
});

test("rows with an empty category are ignored rather than crashing", () => {
  const combined: AnsweredRow[] = [
    { category: "", isCorrect: false },
    { category: "", isCorrect: false },
    ...rows("Health Promotion & Maintenance", 1, 7),
  ];
  const result = findWeakAreaPrompt(combined);
  assert.equal(result?.category, "Health Promotion & Maintenance");
  assert.equal(result?.attempts, 8);
});
