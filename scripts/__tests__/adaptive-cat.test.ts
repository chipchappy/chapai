import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_ITEMS,
  MIN_ITEMS,
  candidateProgress,
  difficultyToLogit,
  estimateAbility,
  evaluateCat,
  nextDifficulty,
  type CatResponse,
} from "../../apps/web/src/lib/adaptive-cat";

const run = (n: number, correct: boolean, difficulty = 3): CatResponse[] =>
  Array.from({ length: n }, () => ({ difficulty, correct }));

/** Alternating right/wrong at the standard — a candidate exactly on the line. */
const borderline = (n: number): CatResponse[] =>
  Array.from({ length: n }, (_, i) => ({ difficulty: 3, correct: i % 2 === 0 }));

test("authored difficulty 3 sits exactly at the passing standard", () => {
  assert.equal(difficultyToLogit(3), 0);
  assert.ok(difficultyToLogit(5) > 0);
  assert.ok(difficultyToLogit(1) < 0);
});

test("out-of-range difficulty is clamped rather than trusted", () => {
  assert.equal(difficultyToLogit(99), difficultyToLogit(5));
  assert.equal(difficultyToLogit(0), difficultyToLogit(1));
  assert.equal(difficultyToLogit(Number.NaN), 0);
});

test("no responses means no estimate, not an estimate of zero ability", () => {
  const { standardError } = estimateAbility([]);
  assert.equal(standardError, Infinity);
});

test("more correct answers raise the ability estimate", () => {
  const weak = estimateAbility(run(40, false)).ability;
  const strong = estimateAbility(run(40, true)).ability;
  assert.ok(strong > weak);
});

test("an all-correct string is bounded instead of diverging", () => {
  // The MLE is infinite here; an unbounded estimate would end the exam on
  // certainty the data cannot support.
  const { ability } = estimateAbility(run(120, true));
  assert.ok(Number.isFinite(ability));
  assert.ok(ability <= 4);
});

test("standard error falls as evidence accumulates", () => {
  const few = estimateAbility(borderline(20)).standardError;
  const many = estimateAbility(borderline(120)).standardError;
  assert.ok(many < few, "more answers means a tighter estimate");
});

test("the exam never ends before the minimum, however lopsided", () => {
  const state = evaluateCat(run(MIN_ITEMS - 1, true, 5));
  assert.equal(state.done, false);
  assert.equal(state.decision, null);
});

test("a clearly strong candidate stops at the minimum with a pass", () => {
  const state = evaluateCat(run(MIN_ITEMS, true, 4));
  assert.equal(state.done, true);
  assert.equal(state.decision, "pass");
  assert.equal(state.reason, "confident");
});

test("a clearly weak candidate stops at the minimum with a fail", () => {
  const state = evaluateCat(run(MIN_ITEMS, false, 2));
  assert.equal(state.done, true);
  assert.equal(state.decision, "fail");
  assert.equal(state.reason, "confident");
});

test("a borderline candidate is carried past the minimum", () => {
  const state = evaluateCat(borderline(MIN_ITEMS + 10));
  assert.equal(state.done, false, "too close to the standard to call");
});

test("a borderline candidate is resolved at the cap, flagged as max-length", () => {
  const state = evaluateCat(borderline(MAX_ITEMS));
  assert.equal(state.done, true);
  assert.equal(state.reason, "max-length");
  assert.ok(state.decision === "pass" || state.decision === "fail");
});

test("the exam never runs past the maximum", () => {
  const state = evaluateCat(borderline(MAX_ITEMS + 25));
  assert.equal(state.done, true);
});

test("the first item is served at the standard, not at an extreme", () => {
  assert.equal(nextDifficulty({ ability: 0, answered: 0 }), 3);
});

test("item selection follows the ability estimate", () => {
  assert.ok(nextDifficulty({ ability: 1.6, answered: 30 }) > 3);
  assert.ok(nextDifficulty({ ability: -1.6, answered: 30 }) < 3);
});

test("selected difficulty stays inside the authored 1..5 range", () => {
  assert.equal(nextDifficulty({ ability: 99, answered: 30 }), 5);
  assert.equal(nextDifficulty({ ability: -99, answered: 30 }), 1);
});

test("the candidate is never told how many items remain", () => {
  const progress = candidateProgress(evaluateCat(borderline(90)));
  assert.deepEqual(Object.keys(progress).sort(), ["answered", "maximum", "minimum"]);
  assert.equal(progress.answered, 90);
  // No "total", no "remaining" — not knowing when it ends is the simulation.
  assert.ok(!("total" in progress) && !("remaining" in progress));
});

test("bounds can be narrowed for a shorter assembled form", () => {
  // A practice form of 40 items cannot reproduce the live 85-150 range. The
  // rule still applies; only where it may stop changes.
  const short = { minItems: 20, maxItems: 40 };
  assert.equal(evaluateCat(run(19, true, 4), short).done, false, "still respects its own floor");
  assert.equal(evaluateCat(run(20, true, 4), short).done, true, "can stop at the narrowed floor");
  const capped = evaluateCat(borderline(40), short);
  assert.equal(capped.done, true);
  assert.equal(capped.reason, "max-length");
});

test("narrowed bounds are reported to the candidate, not the real-exam ones", () => {
  const progress = candidateProgress(evaluateCat(borderline(30), { minItems: 20, maxItems: 40 }), { minItems: 20, maxItems: 40 });
  assert.equal(progress.minimum, 20);
  assert.equal(progress.maximum, 40);
});
