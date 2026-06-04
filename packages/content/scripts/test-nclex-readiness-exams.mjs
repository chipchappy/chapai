import assert from "node:assert/strict";
import { buildReadinessExamManifest } from "./build-nclex-readiness-exams.mjs";
import { CLIENT_NEED_TARGETS } from "./nclex-second-pass-refinement-core.mjs";

const needs = Object.keys(CLIENT_NEED_TARGETS);
const types = ["mcq", "sata", "case_study", "bow_tie", "matrix", "ordering"];

const questions = Array.from({ length: 520 }, (_, index) => {
  const id = `fixture-${String(index + 1).padStart(4, "0")}`;
  return {
    id,
    exam: "nclex",
    type: types[index % types.length],
    nclexClientNeed: needs[index % needs.length],
    category: `category_${index % 16}`,
    difficulty: ((index % 5) + 1),
    stem: `Fixture stem ${index + 1} with a distinct bedside cue.`,
    options: [
      { id: "a", text: "Option A" },
      { id: "b", text: "Option B" },
    ],
    answer: "a",
    rationale: "Fixture rationale with enough detail to pass readiness assembly tests.",
    references: [{ title: "Fixture source", href: "https://example.com/source" }],
  };
});

const refinement = {
  manifest: questions.map((question) => ({
    questionId: question.id,
    status: "approved",
    scores: {
      qualityScore: 90,
      clinicalAccuracyScore: 90,
      duplicateRiskScore: 0,
    },
  })),
};

const manifest = buildReadinessExamManifest({
  questions,
  refinement,
  minUnique: 500,
});

assert.equal(manifest.ok, true);
assert.equal(manifest.exams.length, 5);
assert.equal(manifest.counts.totalReadinessItems, 425);
assert.equal(manifest.counts.duplicateIdsAcrossExams, 0);

for (const exam of manifest.exams) {
  assert.equal(exam.length, 85);
  assert.equal(new Set(exam.questionIds).size, exam.questionIds.length);
}

const blocked = buildReadinessExamManifest({
  questions: questions.slice(0, 400),
  refinement,
  minUnique: 500,
});
assert.equal(blocked.ok, false);
assert.ok(blocked.blockers.some((blocker) => blocker.code === "approved_pool_below_floor"));

console.log(JSON.stringify({ ok: true, tested: "nclex-readiness-exams" }, null, 2));
