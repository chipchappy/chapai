import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  allocateBlueprintCounts,
  allocateBlueprintDeficits,
} from "../../apps/web/src/lib/blueprint-allocation";
import {
  getCaseStudyEligibleQuestions,
  getCompleteCaseStudyGroups,
  shuffleQuestionBlocks,
} from "../../apps/web/src/lib/clinical-case-study";
import {
  buildDistinctClinicalSections,
  isClinicalEntryDuplicate,
} from "../../apps/web/src/lib/clinical-chart-sections";
import { getRichDeck } from "../../apps/web/src/lib/practice-data";
import {
  getQuestionQualityProfile,
  qualityFirstDiverseOrder,
  qualityFirstShuffle,
  type QualityQuestionLike,
} from "../../apps/web/src/lib/question-quality";
import { NCLEX_CATEGORIES } from "../../apps/web/src/lib/types";

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

  it("keeps the verified VTE fallback as one genuinely unfolding six-item case", () => {
    const deck = getRichDeck("case-study").filter((question) => question.exam === "nclex");
    const groups = getCompleteCaseStudyGroups(deck);

    assert.equal(deck.length, 6);
    assert.equal(groups.length, 1);
    assert.match(deck[0].chartReview?.nursingNotes?.join(" ") ?? "", /speaking in short phrases/i);
    assert.doesNotMatch(deck[0].chartReview?.nursingNotes?.join(" ") ?? "", /pulmonary emboli/i);
    assert.match(deck[2].chartReview?.nursingNotes?.join(" ") ?? "", /pulmonary emboli/i);
    assert.match(deck[4].chartReview?.nursingNotes?.join(" ") ?? "", /left arm weakness/i);
    assert.ok(
      deck.every((question) => (question.chartReview?.hpi?.length ?? 0) >= 3),
      "each case item retains a detailed HPI",
    );
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
