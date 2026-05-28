import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  assignTargetDifficulties,
  computeDifficultyFeatures,
  summarizeDistribution,
} from "../recalibrate-difficulty.mjs";

function item(index: number, rawScore: number) {
  return {
    key: `q-${index}`,
    file: "test.json",
    index,
    question: {
      id: `q-${index}`,
      exam: "nclex",
      difficulty: 3,
      structuredRationale: { overview: "x" },
    },
    features: { rawScore },
  };
}

describe("difficulty recalibration", () => {
  it("maps premium baseline rows to the target 10/25/35/20/10 distribution", () => {
    const assignments = assignTargetDifficulties(Array.from({ length: 100 }, (_, index) => item(index, index)));
    const distribution = summarizeDistribution(
      Array.from(assignments.entries()).map(([, difficulty]) => ({ difficulty })),
    );

    assert.deepEqual(distribution, {
      1: 10,
      2: 25,
      3: 35,
      4: 20,
      5: 10,
    });
  });

  it("scores higher-complexity clinical judgment items above simple recall stems", () => {
    const simple = computeDifficultyFeatures({
      id: "simple",
      type: "mcq",
      category: "health_promotion",
      stem: "Which instruction is appropriate for routine screening?",
      options: [
        { id: "a", text: "Schedule routine follow-up." },
        { id: "b", text: "Ignore preventive care." },
      ],
      answer: "a",
      rationale: "Routine health promotion teaching is appropriate.",
    });
    const complex = computeDifficultyFeatures({
      id: "complex",
      type: "case_study",
      category: "physiological_adaptation",
      cjmmStep: "prioritize-hypotheses",
      stem: "A client has hypotension, tachycardia, oxygen saturation 88%, lactate 5.2 mmol/L, fever, confusion, and decreasing urine output. Which hypothesis is the priority?",
      scenario: "Sepsis with shock risk and worsening perfusion.",
      options: [
        { id: "a", text: "Septic shock with impaired perfusion." },
        { id: "b", text: "Routine discomfort after ambulation." },
        { id: "c", text: "Expected fever response." },
      ],
      answer: "a",
      rationale: "The cues indicate sepsis, shock, and impaired perfusion.",
    });

    assert.ok(complex.rawScore > simple.rawScore, `${complex.rawScore} should be greater than ${simple.rawScore}`);
  });
});
