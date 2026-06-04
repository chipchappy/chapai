import assert from "node:assert/strict";
import { assessQuestion, buildRefinementReport } from "./nclex-second-pass-refinement-core.mjs";

const baseQuestion = {
  id: "nclex-test-001",
  exam: "nclex",
  type: "mcq",
  nclexClientNeed: "physiological_adaptation",
  cognitiveLevel: "analyze",
  category: "Respiratory decline",
  subcategory: "Pneumothorax",
  difficulty: 3,
  stem: "A client develops sudden dyspnea and absent breath sounds on one side after central line placement. Which action is safest?",
  options: [
    { id: "a", text: "Prepare for rapid decompression per protocol" },
    { id: "b", text: "Encourage oral fluids" },
    { id: "c", text: "Delay assessment until the next vital sign round" },
    { id: "d", text: "Place the client supine and leave to notify dietary" },
  ],
  answer: "a",
  rationale: "Sudden dyspnea with unilateral absent breath sounds after line placement is consistent with tension pneumothorax risk. The safest answer is A because rapid escalation and decompression-focused preparation protects ventilation and perfusion.",
  distractorRationales: {
    b: "Fluids do not address obstructive shock physiology.",
    c: "Delaying reassessment is unsafe.",
    d: "Leaving the client delays emergency care.",
  },
  tags: ["respiratory", "shock", "priority"],
  references: [{ title: "2026 NCLEX-RN Test Plan", href: "https://www.ncsbn.org/publications/2026-nclex-rn-test-plan" }],
  reviewStatus: "final-curated-live",
  sourceStage: "live",
  waveMetadata: {
    familyKey: "respiratory::pneumothorax::mcq",
    angleSignature: "central-line unilateral breath sounds",
    duplicateFingerprint: "respiratory::pneumothorax::mcq::central-line",
  },
  chartReview: {
    patientTitle: "Central line respiratory decline",
    chiefComplaint: "Sudden shortness of breath",
    hpi: ["Central venous catheter inserted 10 minutes ago."],
    vitals: [{ label: "SpO2", value: "86%", flag: "critical" }],
    diagnostics: [{ label: "Breath sounds", value: "Absent on right", flag: "critical" }],
    priorityCues: ["sudden dyspnea", "absent unilateral breath sounds"],
  },
  visualRationale: {
    type: "pathway",
    title: "Obstructive shock pathway",
    nodes: [
      { label: "cue", value: "sudden dyspnea" },
      { label: "pattern", value: "tension pneumothorax" },
      { label: "move", value: "rapid escalation" },
      { label: "next rep", value: "protect ventilation first" },
    ],
  },
  tutorReady: true,
};

const clean = assessQuestion(baseQuestion, 1);
assert.equal(clean.status, "approved");
assert.equal(clean.scores.duplicateRiskScore, 0);
assert.ok(clean.scores.qualityScore >= 86);

const missingAnswer = assessQuestion({ ...baseQuestion, id: "bad-answer", answer: "z" }, 1);
assert.equal(missingAnswer.status, "needs_review");
assert.ok(missingAnswer.issues.includes("answer_not_in_options"));

const missingCitation = assessQuestion({ ...baseQuestion, id: "bad-cite", references: [{ title: "Unverified source" }] }, 1);
assert.equal(missingCitation.citations.status, "needs_review");
assert.ok(missingCitation.issues.includes("reference_unverified"));

const report = buildRefinementReport([baseQuestion, { ...baseQuestion, id: "dupe" }], { targetCount: 5000 });
assert.equal(report.summary.sourceCount, 2);
assert.equal(report.summary.topUpNeeded, true);
assert.ok(report.summary.remainingTo5000 > 0);
assert.ok(report.topUp.clientNeedDeficits.length > 0);

console.log("nclex second-pass refinement tests passed");
