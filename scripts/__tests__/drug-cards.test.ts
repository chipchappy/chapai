import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { DRUG_CARDS, getDrugCardById, getDrugCardTerms, searchDrugCards } from "../../apps/web/src/lib/drug-cards";

describe("drug card library", () => {
  it("loads unique high-yield NCLEX drug cards with required teaching fields", () => {
    assert.ok(DRUG_CARDS.length >= 20);
    assert.equal(new Set(DRUG_CARDS.map((card) => card.id)).size, DRUG_CARDS.length);
    for (const card of DRUG_CARDS) {
      assert.ok(card.genericName.length > 0);
      assert.ok(card.class.length > 0);
      assert.ok(card.mechanism.split(/\s+/).length >= 8);
      assert.ok(card.priorityLabs.length >= 1);
      assert.ok(card.nursingAssessments.length >= 1);
      assert.ok(card.contraindications.length >= 1);
    }
  });

  it("supports search and rationale linking terms", () => {
    assert.equal(getDrugCardById("warfarin")?.genericName, "warfarin");
    assert.ok(searchDrugCards("potassium").some((card) => card.id === "digoxin"));
    assert.ok(getDrugCardTerms().some((entry) => entry.term === "Coumadin" && entry.card.id === "warfarin"));
  });
});
