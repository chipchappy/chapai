import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { DRUG_CARDS, getDrugCardById, getDrugCardTerms, searchDrugCards } from "../../apps/web/src/lib/drug-cards";
import { getDrugCardStudyResourcesFromText, mergeStudyResources } from "../../apps/web/src/lib/drug-card-recommendations";

describe("drug card library", () => {
  it("loads unique high-yield NCLEX drug cards with required teaching fields", () => {
    assert.ok(DRUG_CARDS.length >= 50);
    assert.equal(new Set(DRUG_CARDS.map((card) => card.id)).size, DRUG_CARDS.length);
    for (const card of DRUG_CARDS) {
      assert.ok(card.genericName.length > 0);
      assert.ok(card.class.length > 0);
      assert.ok(card.mechanism.split(/\s+/).length >= 8);
      assert.ok(card.priorityLabs.length >= 1);
      assert.ok(card.nursingAssessments.length >= 1);
      assert.ok(card.contraindications.length >= 1);
      assert.ok(card.sourceName?.length);
      assert.ok(card.sourceHref?.startsWith("https://medlineplus.gov/"));
    }
  });

  it("supports search and rationale linking terms", () => {
    const terms = getDrugCardTerms();
    assert.equal(getDrugCardById("warfarin")?.genericName, "warfarin");
    assert.ok(searchDrugCards("potassium").some((card) => card.id === "digoxin"));
    assert.ok(terms.some((entry) => entry.term === "Coumadin" && entry.card.id === "warfarin"));
    for (const card of DRUG_CARDS) {
      assert.ok(terms.some((entry) => entry.term === card.genericName && entry.card.id === card.id));
    }
  });

  it("creates specific drug-card resources from missed medication text", () => {
    const resources = getDrugCardStudyResourcesFromText([
      "The client taking digoxin reports nausea and visual halos with a potassium of 3.0 mEq/L.",
      "The selected answer delayed heparin bleeding assessment.",
    ]);

    assert.ok(resources.some((resource) => resource.href === "/study/pharmacology/digoxin"));
    assert.ok(resources.some((resource) => resource.href === "/study/pharmacology/heparin"));
    assert.equal(new Set(resources.map((resource) => resource.href)).size, resources.length);

    const merged = mergeStudyResources(resources, [{ ...resources[0], title: "Duplicate" }], 4);
    assert.equal(new Set(merged.map((resource) => resource.href)).size, merged.length);
  });
});
