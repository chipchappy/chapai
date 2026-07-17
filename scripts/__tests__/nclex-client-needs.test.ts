import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  clientNeedFromCanonicalLabel,
  inferNclexClientNeedFromText,
  resolveNclexClientNeed,
} from "../../apps/web/src/lib/nclex-client-needs";

describe("nclex client-need resolution", () => {
  it("resolves every official client-need label to its canonical key", () => {
    const expected: Array<[string, string]> = [
      ["Management of Care", "management_of_care"],
      ["Safety and Infection Control", "safety_infection_control"],
      ["Health Promotion and Maintenance", "health_promotion"],
      ["Psychosocial Integrity", "psychosocial"],
      ["Basic Care and Comfort", "basic_care_comfort"],
      ["Pharmacological and Parenteral Therapies", "pharmacological"],
      ["Reduction of Risk Potential", "risk_reduction"],
      ["Physiological Adaptation", "physiological_adaptation"],
    ];
    for (const [category, want] of expected) {
      assert.equal(resolveNclexClientNeed({ exam: "nclex", category }), want, `${category} should resolve to ${want}`);
    }
  });

  // Regression: `enteral` matches inside "par-enteral", and basic_care_comfort is
  // tested before pharmacological, so keyword inference alone misfiled 78 live rows.
  it("does not mistake 'Parenteral' for enteral feeding", () => {
    assert.equal(inferNclexClientNeedFromText("Pharmacological and Parenteral Therapies"), "basic_care_comfort");
    assert.equal(resolveNclexClientNeed({ exam: "nclex", category: "Pharmacological and Parenteral Therapies" }), "pharmacological");
  });

  // Regression: no keyword matches "Management of Care", so inference silently
  // fell through to the physiological_adaptation default for 74 live rows.
  it("does not let 'Management of Care' fall through to the default", () => {
    assert.equal(inferNclexClientNeedFromText("Management of Care"), "physiological_adaptation");
    assert.equal(resolveNclexClientNeed({ exam: "nclex", category: "Management of Care" }), "management_of_care");
  });

  it("an exact label beats a subcategory that would infer differently", () => {
    // "Abuse Recognition" hits the management_of_care `abuse` keyword first.
    assert.equal(
      resolveNclexClientNeed({ exam: "nclex", category: "Psychosocial Integrity", subcategory: "Pediatric Abuse Recognition" }),
      "psychosocial",
    );
    // "Complications" hits the risk_reduction `complication` keyword first.
    assert.equal(
      resolveNclexClientNeed({ exam: "nclex", category: "Physiological Adaptation", subcategory: "Labor Complications" }),
      "physiological_adaptation",
    );
  });

  it("tolerates casing and ampersand variants", () => {
    assert.equal(clientNeedFromCanonicalLabel("  pharmacological & parenteral therapies "), "pharmacological");
    assert.equal(clientNeedFromCanonicalLabel("SAFETY & INFECTION CONTROL"), "safety_infection_control");
    assert.equal(clientNeedFromCanonicalLabel("chest_tube_management"), undefined);
  });

  // Slug-style categories must keep inferring exactly as before — the label map
  // is additive and must not disturb the ~3,500 live rows that rely on keywords.
  // These assert CURRENT behavior, so they fail if the label map leaks.
  it("leaves slug-style categories on the inference path", () => {
    const slugs: Array<[string, string]> = [
      ["restraint_safety", "safety_infection_control"],
      ["chain_of_command_for_unsafe_orders", "management_of_care"],
      ["delegation_and_supervision", "management_of_care"],
      ["blood_transfusion_reaction", "risk_reduction"],
      ["parkinson_medication_timing", "pharmacological"],
      ["autonomic_dysreflexia", "physiological_adaptation"],
      ["neonatal_hypoglycemia", "physiological_adaptation"],
      ["dic", "physiological_adaptation"],
    ];
    for (const [category, want] of slugs) {
      assert.equal(resolveNclexClientNeed({ exam: "nclex", category }), want, `${category} should still infer ${want}`);
    }
  });

  // KNOWN SHADOWING (not fixed here — changing the keyword chain would reclassify
  // live rows and deserves its own decision). basic_care_comfort carries a bare
  // `tube` and is tested BEFORE risk_reduction, so risk_reduction's own
  // `chest[_ ]tube` pattern is unreachable and all 93 published
  // chest_tube_management rows land in basic_care_comfort. Pinned so the day
  // someone tightens `tube` to `\btube\b`, this test tells them what moves.
  it("documents the chest-tube shadowing (93 live rows)", () => {
    assert.equal(resolveNclexClientNeed({ exam: "nclex", category: "chest_tube_management" }), "basic_care_comfort");
    assert.equal(inferNclexClientNeedFromText("chest tube"), "basic_care_comfort");
  });

  it("ignores non-nclex exams", () => {
    assert.equal(resolveNclexClientNeed({ exam: "ccrn", category: "Management of Care" }), undefined);
  });
});
