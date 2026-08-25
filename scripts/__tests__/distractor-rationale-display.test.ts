import assert from "node:assert/strict";
import test from "node:test";
import { getDisplayableDistractorRationales } from "../../apps/web/src/lib/distractor-rationale-display";

// 372 published case studies carried whyWrong rationales that were correctly
// keyed to option ids and never rendered, because the display filter treated
// case_study as a non-option format. It is not: the options are an ordinary
// id/text array and the answer is an option id, or a list of them.
test("case studies show their distractor rationales", () => {
  const shown = getDisplayableDistractorRationales(
    { type: "case_study", correctAnswer: "a", options: [{ id: "a" }, { id: "b" }, { id: "c" }] },
    {
      a: "This is the finding that establishes the priority problem.",
      b: "Tachycardia is expected here and does not change the plan of care.",
      c: "Platelets are low but not the finding that drives the immediate action.",
    },
  );
  assert.deepEqual(Object.keys(shown).sort(), ["b", "c"]);   // the key itself is excluded
});

test("case studies identified by kind rather than type are also shown", () => {
  const shown = getDisplayableDistractorRationales(
    { kind: "case-study", correctAnswer: ["a"], options: [{ id: "a" }, { id: "b" }] },
    { b: "Fluid overload is the opposite problem and the assessment would differ." },
  );
  assert.deepEqual(Object.keys(shown), ["b"]);
});

// Matrix answers are keyed by row label, so there is no option id to match and
// nothing should reach a student through this path; that teaching belongs in
// whyCorrect instead.
test("matrix items surface nothing through the option path", () => {
  const shown = getDisplayableDistractorRationales(
    { type: "matrix", correctAnswer: {}, options: [{ id: "a" }, { id: "b" }] },
    { "Reassure the client and wait": "This delays the highest-priority action." },
  );
  assert.deepEqual(shown, {});
});

test("plain multiple choice is unchanged", () => {
  const shown = getDisplayableDistractorRationales(
    { type: "mcq", correctAnswer: "a", options: [{ id: "a" }, { id: "b" }] },
    { b: "Suctioning first would delay the airway assessment the stem calls for." },
  );
  assert.deepEqual(Object.keys(shown), ["b"]);
});
