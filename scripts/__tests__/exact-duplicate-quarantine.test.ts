import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  answerMeaning,
  buildDuplicatePlan,
  duplicateCandidateScore,
} from "../quarantine-exact-duplicate-questions.mjs";

function row(overrides: Record<string, unknown>) {
  return {
    id: "question",
    category: "Physiological Adaptation",
    stem: "The same clinical stem",
    options: JSON.stringify([
      { id: "a", text: "Treat the immediate threat" },
      { id: "b", text: "Delay treatment" },
    ]),
    answer: "a",
    rationale: "The immediate action addresses the unstable physiologic threat before lower-priority care.",
    structured_rationale: null,
    distractor_rationales: JSON.stringify({
      b: "Delay permits the unstable condition to worsen and does not address the immediate threat.",
    }),
    references_json: null,
    visual_rationale: null,
    provenance: null,
    review_status: "curated-live",
    publish_state: "published",
    ...overrides,
  };
}

describe("exact duplicate quarantine planning", () => {
  it("keeps the stronger supported item and quarantines the redundant copy", () => {
    const weak = row({ id: "weak", rationale: "This is the correct answer." });
    const strong = row({
      id: "strong",
      review_status: "final-curated-live",
      rationale: Array.from({ length: 145 }, () => "clinical").join(" "),
      structured_rationale: JSON.stringify({
        overview: "Clinical overview",
        mechanism: "Clinical mechanism",
        whyCorrect: "Clinical priority",
      }),
      references_json: JSON.stringify([{ href: "https://example.org/guideline" }]),
      visual_rationale: JSON.stringify({ type: "flow", nodes: [{ label: "Assess", value: "Act" }] }),
      provenance: JSON.stringify({ qualityMetadata: { evidenceStatus: "source-verified" } }),
    });
    const plan = buildDuplicatePlan([weak, strong], { distinctPublishedBefore: 4_412 });

    assert.ok(duplicateCandidateScore(strong) > duplicateCandidateScore(weak));
    assert.equal(plan.groups[0].winner?.id, "strong");
    assert.deepEqual(plan.groups[0].quarantined.map((item: { id: string }) => item.id), ["weak"]);
    assert.equal(plan.counts.distinctPublishedAfter, 4_412);
  });

  it("fully quarantines conflicting answers without one verified final winner", () => {
    const first = row({ id: "first", answer: "a" });
    const second = row({ id: "second", answer: "b" });
    const plan = buildDuplicatePlan([first, second], { distinctPublishedBefore: 4_412 });

    assert.notEqual(answerMeaning(first), answerMeaning(second));
    assert.equal(plan.groups[0].winner, null);
    assert.equal(plan.groups[0].quarantined.length, 2);
    assert.equal(plan.counts.fullyQuarantinedGroups, 1);
    assert.equal(plan.counts.distinctPublishedAfter, 4_411);
  });

  it("allows one source-verified final item to resolve an answer conflict", () => {
    const verified = row({
      id: "verified",
      answer: "b",
      review_status: "final-curated-live",
      provenance: JSON.stringify({ qualityMetadata: { evidenceStatus: "source-verified" } }),
    });
    const legacy = row({ id: "legacy", answer: "a" });
    const plan = buildDuplicatePlan([verified, legacy], { distinctPublishedBefore: 4_412 });

    assert.equal(plan.groups[0].winner?.id, "verified");
    assert.deepEqual(plan.groups[0].quarantined.map((item: { id: string }) => item.id), ["legacy"]);
  });
});
