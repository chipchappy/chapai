import assert from "node:assert/strict";
import test from "node:test";
import {
  MIN_OCCURRENCES,
  classifyAction,
  detectErrorPatterns,
  patternsForAnswer,
  summarizeTopPattern,
  type AnswerRecord,
} from "../../apps/web/src/lib/error-patterns";

const OPTS = [
  { id: "a", text: "Administer aspirin for potential myocardial infarction" },
  { id: "b", text: "Monitor for respiratory failure due to diaphragmatic weakness" },
  { id: "c", text: "Notify the healthcare provider of the findings" },
  { id: "d", text: "Document the findings and continue to monitor" },
];

function mcq(selected: string, correct: string, isCorrect = false): AnswerRecord {
  return { questionType: "mcq", options: OPTS, correctAnswer: correct, selectedAnswer: selected, isCorrect };
}

function sata(selected: string[], correct: string[]): AnswerRecord {
  return {
    questionType: "sata",
    options: [
      { id: "a", text: "Ataxia and slurred speech" },
      { id: "b", text: "Fine hand tremors" },
      { id: "c", text: "Hyperreflexia and coarse tremors" },
      { id: "d", text: "Polyuria and polydipsia" },
    ],
    correctAnswer: correct,
    selectedAnswer: selected,
    isCorrect: false,
  };
}

test("action classes are read from the leading verb", () => {
  assert.equal(classifyAction("Administer aspirin now"), "act");
  assert.equal(classifyAction("Monitor for respiratory failure"), "assess");
  assert.equal(classifyAction("Notify the healthcare provider"), "defer");
  assert.equal(classifyAction("Document the findings"), "document");
});

test("'continue to monitor' is passive documentation, not assessment", () => {
  // It reads like assessment but functions as doing nothing, and NCLEX uses it
  // as exactly that distractor.
  assert.equal(classifyAction("Continue to monitor the client"), "document");
});

test("an unrecognised verb is unknown rather than guessed", () => {
  assert.equal(classifyAction("Hemodynamic instability is expected here"), null);
  assert.equal(classifyAction(""), null);
});

test("choosing an intervention when the key assesses is acting-before-assessing", () => {
  assert.deepEqual(patternsForAnswer(mcq("a", "b")), ["acted-before-assessing"]);
});

test("choosing assessment when the key acts is the inverse pattern", () => {
  assert.deepEqual(patternsForAnswer(mcq("b", "a")), ["assessed-when-action-needed"]);
});

test("notifying instead of acting is a hand-off", () => {
  assert.deepEqual(patternsForAnswer(mcq("c", "a")), ["deferred-instead-of-acting"]);
});

test("documenting instead of intervening is its own failure", () => {
  assert.deepEqual(patternsForAnswer(mcq("d", "a")), ["documented-instead-of-intervening"]);
});

test("a correct answer yields no pattern", () => {
  assert.deepEqual(patternsForAnswer(mcq("b", "b", true)), []);
});

test("one SATA answer can be both over- and under-selected", () => {
  const found = patternsForAnswer(sata(["a", "b"], ["a", "c"]));
  assert.ok(found.includes("sata-under-select"), "missed c");
  assert.ok(found.includes("sata-over-select"), "wrongly picked b");
});

test("a pattern below the occurrence floor is not reported", () => {
  // Three instances is bad luck, not a habit — reporting it would be a
  // confidently wrong diagnosis.
  const records = Array.from({ length: MIN_OCCURRENCES - 1 }, () => mcq("a", "b"));
  assert.deepEqual(detectErrorPatterns(records), []);
});

test("a genuine habit clears both bars and is reported", () => {
  const records = Array.from({ length: 6 }, () => mcq("a", "b"));
  const patterns = detectErrorPatterns(records);
  assert.equal(patterns.length, 1);
  assert.equal(patterns[0].id, "acted-before-assessing");
  assert.equal(patterns[0].count, 6);
  assert.equal(patterns[0].opportunities, 6);
  assert.equal(patterns[0].share, 1);
});

test("share is measured against opportunities, not against every answer", () => {
  // 5 wrong of 5 items that offered the substitution, plus 40 SATA answers that
  // never could have. The habit must still read as frequent.
  const records: AnswerRecord[] = [
    ...Array.from({ length: 5 }, () => mcq("a", "b")),
    ...Array.from({ length: 40 }, () => sata(["a", "c"], ["a", "c"])),
  ];
  const acted = detectErrorPatterns(records).find((p) => p.id === "acted-before-assessing");
  assert.ok(acted, "pattern survives being outnumbered by unrelated answers");
  assert.equal(acted.opportunities, 5);
  assert.equal(acted.share, 1);
});

test("no answers produces no patterns and no summary", () => {
  assert.deepEqual(detectErrorPatterns([]), []);
  assert.equal(summarizeTopPattern([]), null);
});

test("patterns are ordered worst-first", () => {
  const records: AnswerRecord[] = [
    ...Array.from({ length: 8 }, () => mcq("a", "b")),        // 8/8 = 100%
    ...Array.from({ length: 4 }, () => sata(["a"], ["a", "c"])), // 4/4 under-select
    ...Array.from({ length: 12 }, () => sata(["a", "c"], ["a", "c"])),
  ];
  const patterns = detectErrorPatterns(records);
  assert.ok(patterns.length >= 2);
  for (let i = 1; i < patterns.length; i += 1) {
    assert.ok(patterns[i - 1].share >= patterns[i].share, "sorted by share descending");
  }
});

test("the summary names the count and the denominator", () => {
  const patterns = detectErrorPatterns(Array.from({ length: 6 }, () => mcq("a", "b")));
  assert.match(summarizeTopPattern(patterns) ?? "", /6 of 6 chances \(100%\)/);
});
