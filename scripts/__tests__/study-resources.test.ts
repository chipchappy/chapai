import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getStudyResourcesForWeakArea } from "../../apps/web/src/lib/study-resources";

describe("study resource recommendations", () => {
  it("maps pharmacology weak areas to medication review resources", () => {
    const resources = getStudyResourcesForWeakArea({
      category: "pharmacological",
      difficulty: 4,
      cjmmStep: "take-actions",
    });

    assert.ok(resources.some((resource) => resource.href === "/free/nclex-pharmacology-questions"));
    assert.ok(resources.some((resource) => resource.href === "/tools/dosage-calculator"));
    assert.ok(resources.every((resource, index, list) => list.findIndex((candidate) => candidate.href === resource.href) === index));
  });

  it("normalizes legacy risk-reduction category labels", () => {
    const resources = getStudyResourcesForWeakArea({
      category: "Reduction of Risk Potential",
      cjmmStep: "analyze-cues",
    });

    assert.ok(resources.some((resource) => resource.href === "/free/nclex-lab-values-questions"));
    assert.ok(resources.some((resource) => resource.href === "/free/nclex-matrix-questions"));
  });
});
