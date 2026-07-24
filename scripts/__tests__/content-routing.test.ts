import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  allocateBlueprintCounts,
  allocateBlueprintDeficits,
  getBlueprintCountMismatches,
} from "../../apps/web/src/lib/blueprint-allocation";
import {
  getCaseStudyReleaseIssues,
  getCaseStudyEligibleQuestions,
  getCompleteCaseStudyGroups,
  qualityFirstCaseGroups,
  shuffleQuestionBlocks,
} from "../../apps/web/src/lib/clinical-case-study";
import {
  buildDistinctClinicalSections,
  isClinicalEntryDuplicate,
} from "../../apps/web/src/lib/clinical-chart-sections";
import { getPracticeExamDefinitions, getRichDeck } from "../../apps/web/src/lib/practice-data";
import { getQuestionIntegrityIssues } from "../../apps/web/src/lib/question-renderability";
import {
  getQuestionQualityProfile,
  qualityFirstDiverseOrder,
  qualityFirstShuffle,
  type QualityQuestionLike,
} from "../../apps/web/src/lib/question-quality";
import {
  NCLEX_CATEGORIES,
  NCLEX_READINESS_BLUEPRINT,
} from "../../apps/web/src/lib/types";

function caseQuestion(id: string, caseStudyId: string | null, cjmmStep: string | null) {
  return {
    id,
    type: "case_study",
    caseStudyId,
    cjmmStep,
    rationale: "The priority cue is linked to the safest nursing action because it addresses the immediate threat.",
    options: [
      { id: "a", text: "Priority action" },
      { id: "b", text: "Lower-priority action" },
    ],
    answer: "a",
  };
}

describe("quality-first NCLEX routing", () => {
  it("places clinically reviewed, complete teaching items before generic rationales", () => {
    const premium: QualityQuestionLike = {
      id: "premium",
      reviewStatus: "final-curated-live",
      rationale: Array.from({ length: 150 }, () => "clinical").join(" "),
      options: [
        { id: "a", text: "Correct" },
        { id: "b", text: "Wrong" },
        { id: "c", text: "Wrong" },
        { id: "d", text: "Wrong" },
      ],
      answer: "a",
      distractorRationales: {
        b: "This delays stabilization and does not address the immediate oxygenation threat.",
        c: "This focuses on a lower-priority finding while the client remains physiologically unstable.",
        d: "This action is appropriate later, after the immediate safety threat is controlled.",
      },
      structuredRationale: {
        overview: "The client has an acute change that requires immediate stabilization before routine care.",
        mechanism: "The cue cluster indicates impaired oxygen delivery, so delayed intervention increases tissue injury.",
        whyCorrect: "The correct action addresses the immediate physiologic threat and permits rapid reassessment.",
        whyWrong: {},
        citations: [{ source: "official" }],
      },
      references: [{ title: "Official source" }],
      visualRationale: { type: "flow" },
    };
    const generic: QualityQuestionLike = {
      id: "generic",
      rationale: "This is the correct answer.",
      options: premium.options,
      answer: "a",
    };

    assert.equal(qualityFirstShuffle([generic, premium], "student-a")[0].id, "premium");
    assert.equal(getQuestionQualityProfile(premium).tier, 0);
    assert.equal(getQuestionQualityProfile(generic).tier, 4);
  });

  it("allocates the 2026 client-needs blueprint exactly without rounding drift", () => {
    const blueprint = Object.fromEntries(
      Object.entries(NCLEX_CATEGORIES).map(([key, value]) => [key, value.pct]),
    );
    const allocation = allocateBlueprintCounts(blueprint, 75);

    assert.equal(Object.values(allocation).reduce((sum, count) => sum + count, 0), 75);
    assert.equal(Object.keys(allocation).length, 8);
    assert.equal(allocation.management_of_care, 13);
    assert.equal(allocation.risk_reduction, 9);
    assert.ok(Object.values(allocation).every((count) => count > 0));
  });

  it("subtracts an unfolding case from full-form category targets", () => {
    const blueprint = Object.fromEntries(
      Object.entries(NCLEX_CATEGORIES).map(([key, value]) => [key, value.pct]),
    );
    const initial: Record<string, number> = {
      physiological_adaptation: 2,
      risk_reduction: 1,
      pharmacological: 2,
      health_promotion: 1,
    };
    const allocation = allocateBlueprintDeficits(blueprint, 75, initial);
    const totalTargets = allocateBlueprintCounts(blueprint, 75);

    assert.equal(Object.values(allocation).reduce((sum, count) => sum + count, 0), 69);
    for (const key of Object.keys(blueprint)) {
      assert.equal(allocation[key] + (initial[key] ?? 0), totalTargets[key]);
    }
  });

  it("represents every available premium format before repeating one format", () => {
    const makePremium = (id: string, type: string): QualityQuestionLike => ({
      id,
      type,
      reviewStatus: "final-curated-live",
      rationale: Array.from({ length: 150 }, () => "clinical").join(" "),
      options: [
        { id: "a", text: "Correct" },
        { id: "b", text: "Wrong" },
        { id: "c", text: "Wrong" },
        { id: "d", text: "Wrong" },
      ],
      answer: "a",
      distractorRationales: {
        b: "This delays stabilization and does not address the immediate oxygenation threat.",
        c: "This focuses on a lower-priority finding while the client remains physiologically unstable.",
        d: "This action is appropriate later, after the immediate safety threat is controlled.",
      },
      structuredRationale: {
        overview: "The client has an acute change that requires immediate stabilization before routine care.",
        mechanism: "The cue cluster indicates impaired oxygen delivery, so delayed intervention increases tissue injury.",
        whyCorrect: "The correct action addresses the immediate physiologic threat and permits rapid reassessment.",
        whyWrong: {
          b: "This delays stabilization and does not address the immediate oxygenation threat.",
        },
        citations: [{ source: "official" }],
      },
      references: [{ title: "Official source" }],
    });
    const bank = [
      ...Array.from({ length: 6 }, (_, index) => makePremium(`mcq-${index}`, "mcq")),
      makePremium("sata-1", "sata"),
      makePremium("matrix-1", "matrix"),
      {
        id: "low-quality-ordering",
        type: "ordering",
        rationale: "This is the correct answer.",
      },
    ];
    const firstFour = qualityFirstDiverseOrder(bank, "student-a").slice(0, 4);

    assert.ok(firstFour.some((question) => question.id === "sata-1"));
    assert.ok(firstFour.some((question) => question.id === "matrix-1"));
    assert.ok(firstFour.some((question) => question.id.startsWith("mcq-")));
    assert.ok(firstFour.every((question) => question.id !== "low-quality-ordering"));
  });
});

describe("complete unfolding case-study routing", () => {
  it("rejects orphaned case-study labels and keeps six ordered CJMM steps", () => {
    const steps = [
      "recognize-cues",
      "analyze-cues",
      "prioritize-hypotheses",
      "generate-solutions",
      "take-actions",
      "evaluate-outcomes",
    ];
    const complete = steps.map((step, index) => caseQuestion(`case-${index + 1}`, "case-a", step));
    const orphan = caseQuestion("orphan", null, null);

    assert.equal(getCompleteCaseStudyGroups([...complete, orphan]).length, 1);
    assert.deepEqual(
      getCaseStudyEligibleQuestions([...complete, orphan]).map((question) => question.id),
      complete.map((question) => question.id),
    );
  });

  it("varies student order while preserving a contiguous ordered case block", () => {
    const steps = [
      "recognize-cues",
      "analyze-cues",
      "prioritize-hypotheses",
      "generate-solutions",
      "take-actions",
      "evaluate-outcomes",
    ];
    const complete = steps.map((step, index) => caseQuestion(`case-${index + 1}`, "case-a", step));
    const singles = Array.from({ length: 12 }, (_, index) => ({
      id: `single-${index + 1}`,
      rationale: "A sufficiently specific clinical explanation for the selected nursing response.",
    }));
    const first = shuffleQuestionBlocks([...complete, ...singles], "student-a");
    const second = shuffleQuestionBlocks([...complete, ...singles], "student-b");

    assert.notDeepEqual(first.map((question) => question.id), second.map((question) => question.id));
    for (const order of [first, second]) {
      const caseIndexes = order
        .map((question, index) => question.caseStudyId === "case-a" ? index : -1)
        .filter((index) => index >= 0);
      assert.deepEqual(caseIndexes, Array.from({ length: 6 }, (_, index) => caseIndexes[0] + index));
      assert.deepEqual(
        caseIndexes.map((index) => order[index].cjmmStep),
        steps,
      );
    }
  });

  it("keeps fifteen release-ready, distinct, source-grounded six-item cases", () => {
    const deck = getRichDeck("case-study").filter((question) => question.exam === "nclex");
    const groups = getCompleteCaseStudyGroups(deck);
    const vte = groups.find((group) => group.id === "nclex-vte-pe-ngn");
    const sepsis = groups.find((group) => group.id === "codex-nclex-sepsis-urinary-ngn");
    const postpartum = groups.find((group) => group.id === "codex-nclex-postpartum-hemorrhage-ngn");

    assert.equal(deck.length, 90);
    assert.equal(groups.length, 15);
    assert.equal(new Set(deck.map((question) => question.id)).size, deck.length);
    assert.equal(new Set(deck.map((question) => question.stem.trim().toLowerCase())).size, deck.length);
    assert.ok(vte);
    assert.ok(sepsis);
    assert.ok(postpartum);
    assert.match(vte.questions[0].chartReview?.nursingNotes?.join(" ") ?? "", /speaking in short phrases/i);
    assert.doesNotMatch(vte.questions[0].chartReview?.nursingNotes?.join(" ") ?? "", /pulmonary emboli/i);
    assert.match(vte.questions[2].chartReview?.nursingNotes?.join(" ") ?? "", /pulmonary emboli/i);
    assert.match(vte.questions[4].chartReview?.nursingNotes?.join(" ") ?? "", /left arm weakness/i);
    assert.equal(vte.questions[2].kind, "ordering");
    assert.match(vte.questions[2].nclexInstruction ?? "", /most immediate threat/i);
    assert.deepEqual(vte.questions[2].correctAnswer, ["c", "a", "d"]);
    assert.doesNotMatch(sepsis.questions[0].chartReview?.labs?.map((lab) => lab.label).join(" ") ?? "", /lactate/i);
    assert.match(sepsis.questions[1].chartReview?.labs?.map((lab) => lab.label).join(" ") ?? "", /lactate/i);
    assert.doesNotMatch(postpartum.questions[4].chartReview?.nursingNotes?.join(" ") ?? "", /cervical laceration identified/i);
    assert.match(postpartum.questions[5].chartReview?.nursingNotes?.join(" ") ?? "", /cervical laceration/i);
    assert.ok(
      deck.every((question) => (question.chartReview?.hpi?.length ?? 0) >= 3),
      "each case item retains a detailed HPI",
    );
    assert.ok(
      deck.every((question) => {
        const hpi = new Set((question.chartReview?.hpi ?? []).map((line) => line.trim().toLowerCase()));
        return (question.chartReview?.nursingNotes ?? []).every((line) => !hpi.has(line.trim().toLowerCase()));
      }),
      "HPI and nursing notes stay distinct",
    );
    assert.ok(deck.every((question) => getQuestionIntegrityIssues(question).length === 0));
    for (const group of groups) {
      assert.deepEqual(getCaseStudyReleaseIssues(group.questions), []);
      assert.deepEqual(
        group.questions.map((question) => question.cjmmStep),
        [
          "recognize-cues",
          "analyze-cues",
          "prioritize-hypotheses",
          "generate-solutions",
          "take-actions",
          "evaluate-outcomes",
        ],
      );
      assert.ok(group.questions.every((question) => question.qualityMetadata?.evidenceStatus === "source-verified"));
      assert.ok(group.questions.every((question) => question.qualityMetadata?.clinicalReviewStatus === "pending"));
      assert.ok(group.questions.every((question) => question.qualityMetadata?.psychometricStatus === "precalibration"));
      assert.ok(group.questions.every((question) => (question.structuredRationale?.citations.length ?? 0) >= 2));
      assert.ok(group.questions.every((question) => getQuestionQualityProfile(question).tier <= 1));
    }
  });

  it("detects any readiness-form category drift from the exact blueprint", () => {
    const blueprint = Object.fromEntries(
      Object.entries(NCLEX_CATEGORIES).map(([key, value]) => [key, value.pct]),
    );
    const exact = allocateBlueprintCounts(blueprint, 85);

    assert.deepEqual(getBlueprintCountMismatches(blueprint, 85, exact), []);

    const imbalanced = {
      ...exact,
      psychosocial: exact.psychosocial - 3,
      physiological_adaptation: exact.physiological_adaptation + 3,
    };
    const mismatches = Object.fromEntries(
      getBlueprintCountMismatches(blueprint, 85, imbalanced)
        .map(({ key, target, actual }) => [key, { target, actual }]),
    );
    assert.deepEqual(mismatches, {
      physiological_adaptation: {
        target: exact.physiological_adaptation,
        actual: exact.physiological_adaptation + 3,
      },
      psychosocial: {
        target: exact.psychosocial,
        actual: exact.psychosocial - 3,
      },
    });
  });

  it("keeps readiness targets inside the 2026 ranges while avoiding low-quality quota filler", () => {
    const allocation = allocateBlueprintCounts(NCLEX_READINESS_BLUEPRINT, 85);

    assert.deepEqual(allocation, {
      management_of_care: 15,
      safety_infection_control: 11,
      pharmacological: 14,
      risk_reduction: 10,
      physiological_adaptation: 13,
      basic_care_comfort: 8,
      psychosocial: 8,
      health_promotion: 6,
    });
  });

  it("assigns three unique, subject-diverse cases to every NCLEX readiness form", () => {
    const deck = getRichDeck("case-study").filter((question) => question.exam === "nclex");
    const definitions = getPracticeExamDefinitions({ nclex: 999 })
      .filter((definition) => definition.exam === "nclex");
    const reservedQuestionIds = new Set<string>();
    const assignedCaseIds = new Set<string>();

    for (const definition of definitions) {
      const groups = qualityFirstCaseGroups(deck, definition.seed)
        .filter((group) => getCaseStudyReleaseIssues(group.questions).length === 0)
        .filter((group) => group.questions.every((question) => !reservedQuestionIds.has(question.id)))
        .slice(0, 3);

      assert.equal(groups.length, 3, definition.id);
      assert.equal(groups.flatMap((group) => group.questions).length, 18, definition.id);
      const subjectAreas = new Set(groups.map((group) => (
        group.questions[0].caseStudyTitle?.split(":")[0] ?? group.id
      )));
      assert.ok(subjectAreas.size >= 2, `${definition.id} should span at least two subject areas`);

      for (const group of groups) {
        assert.equal(assignedCaseIds.has(group.id), false, `${group.id} was reused across forms`);
        assignedCaseIds.add(group.id);
        group.questions.forEach((question) => reservedQuestionIds.add(question.id));
      }
    }

    assert.equal(assignedCaseIds.size, 15);
    assert.equal(reservedQuestionIds.size, 90);
  });
});

describe("clinical chart section integrity", () => {
  it("removes exact and near-duplicate notes from HPI while preserving new nursing observations", () => {
    const hpi = [
      "HPI: Sudden dyspnea began 45 minutes before arrival with sharp pleuritic chest pain.",
    ];
    const sections = buildDistinctClinicalSections({
      hpi,
      notes: [
        "Sudden dyspnea began 45 minutes before arrival with sharp pleuritic chest pain.",
        "0615: Client is speaking in short phrases; right calf is warm, tender, and visibly enlarged.",
      ],
    });

    assert.equal(sections.hpi.length, 1);
    assert.deepEqual(sections.notes, [
      "0615: Client is speaking in short phrases; right calf is warm, tender, and visibly enlarged.",
    ]);
    assert.equal(isClinicalEntryDuplicate(hpi[0], sections.notes[0]), false);
  });
});
