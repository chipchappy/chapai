import assert from "node:assert/strict";
import test from "node:test";
import { auditStrategy, soundStrategy } from "../../apps/web/src/lib/strategy-quality";
import { PRINCIPLES } from "../../apps/web/src/lib/nclex-principles";
// @ts-expect-error — the enrichment pass runs under plain node, so its copy is .mjs
import { PRINCIPLES as SCRIPT_PRINCIPLES } from "../lib/nclex-principles.mjs";

// Real strings taken from the first backfill's output. These are the shapes the
// gate exists to stop, so they are asserted verbatim rather than paraphrased.
const INVERTED =
  "One option escalates to the provider; the rest are independent actions. When an option requires escalation, it is usually the correct choice after basic measures have been addressed.";
const CIRCULAR =
  "Four options are presented, each representing a distinct type of transfusion reaction. When options are categorized by reaction type, the correct choice is identified by matching the stem’s described signs to the characteristic features of each reaction category.";
const DRIFTS =
  "Four options are pharmacologic interventions and one is a delivery decision. When most options are direct nursing actions and one escalates care, the most critical choice is usually the action that addresses the immediate physiological threat.";
const SOUND =
  "Two options involve escalation and two involve independent nursing actions. When escalation is present, the first step is to address the safety concern before any routine action.";

test("rejects inverted escalation advice", () => {
  assert.ok(auditStrategy(INVERTED).includes("inverted escalation advice"));
  assert.equal(soundStrategy(INVERTED), null);
});

test("rejects a note that restates the task", () => {
  assert.ok(auditStrategy(CIRCULAR).includes("circular — restates the task"));
});

test("rejects a rule that never engages the structure it named", () => {
  assert.ok(auditStrategy(DRIFTS).includes("rule does not engage the structure named"));
});

test("keeps a sound note", () => {
  assert.deepEqual(auditStrategy(SOUND), []);
  assert.equal(soundStrategy(SOUND), SOUND);
});

test("empty and missing notes are simply absent, not errors", () => {
  assert.equal(soundStrategy(undefined), null);
  assert.equal(soundStrategy(""), null);
  assert.equal(soundStrategy("   "), null);
});

// Regression: the first audit used /escalat\b/, which cannot match
// "escalation" because \b needs a boundary immediately after "escalat". That
// mis-flagged sound notes as principle-free and inflated the failure count.
test("principle stems match inflected words", () => {
  for (const word of ["escalation", "assessment", "prioritise", "stabilizing", "delegation"]) {
    const note = `Three options intervene and one assesses. When the stem defines the problem, ${word} follows the established order.`;
    assert.ok(
      !auditStrategy(note).includes("names no transferable principle"),
      `"${word}" should satisfy the principle check`,
    );
  }
});

// The render gate and the enrichment pass each need the catalog, in TypeScript
// and in plain ESM respectively. Two copies can drift, and a drifted copy means
// the pass writes a rule the UI then refuses to render.
test("the two copies of the principle catalog are identical", () => {
  assert.deepEqual(SCRIPT_PRINCIPLES, PRINCIPLES);
});

// Every catalog rule must survive the render gate whatever structure sentence
// precedes it, or the pass could write notes that are silently never shown.
test("every catalog principle composes into a note the render gate accepts", () => {
  const structures = [
    "Three options intervene and one assesses.",
    "All four options are assessments.",
    "One option escalates to the prescriber; the other three are independent actions.",
    "Two options differ only in timing.",
  ];
  for (const [id, rule] of Object.entries(PRINCIPLES)) {
    for (const structure of structures) {
      const note = `${structure} ${rule}`;
      assert.deepEqual(auditStrategy(note), [], `${id} rejected after "${structure}"`);
    }
  }
});
