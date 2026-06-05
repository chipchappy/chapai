#!/usr/bin/env node
/**
 * Deterministic NCLEX candidate review gate.
 *
 * This does not publish or mutate D1. It scores generated candidates against
 * the live bank and emits an audit manifest. The gate is intentionally strict:
 * boilerplate rationales, malformed NGN labels, duplicate stems, and thin
 * rationales are held instead of promoted.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const args = parseArgs(process.argv.slice(2));
const inputFile = path.resolve(repoRoot, args.input ?? "packages/content/questions/nclex/draft/generated-nemoclaw-batches.json");
const liveFile = path.resolve(repoRoot, args.live ?? "packages/content/questions/nclex/live/reviewed-curated-live.unique.json");
const outFile = path.resolve(repoRoot, args.out ?? "reports/nclex-candidate-review-latest.json");
const limit = Number(args.limit ?? 200);
const minScore = Number(args["min-score"] ?? 82);

const BOILERPLATE_RE = /less safe because it delays the immediate nursing priority|does not match the highest-risk cue/i;
const HIGH_VALUE_TYPES = new Set(["case_study", "bow_tie", "matrix", "sata", "ordering"]);
const TYPE_PRIORITY = new Map([
  ["case_study", 0],
  ["bow_tie", 1],
  ["matrix", 2],
  ["sata", 3],
  ["ordering", 4],
  ["mcq", 5],
]);

const CLINICAL_TERMS = [
  "airway", "breathing", "circulation", "oxygen", "hypoxia", "perfusion", "shock", "sepsis",
  "hemorrhage", "bleeding", "coagulation", "inr", "heparin", "warfarin", "insulin",
  "potassium", "sodium", "glucose", "acidosis", "alkalosis", "ventilation", "peep",
  "plateau", "pneumothorax", "myocardial", "stroke", "seizure", "intracranial",
  "eclampsia", "postpartum", "placenta", "fetal", "neonate", "dehydration", "renal",
  "creatinine", "metformin", "infection", "neutropenia", "anaphylaxis", "epinephrine",
  "opioid", "naloxone", "suicide", "delirium", "psychosis", "restraint", "delegation",
  "isolation", "fall", "wound", "pressure", "aspiration", "dysphagia", "pain",
  "vital", "lab", "arrhythmia", "tachycardia", "bradycardia", "hypotension", "hypertension",
];

function parseArgs(argv) {
  const parsed = {};
  for (const arg of argv) {
    const match = arg.match(/^--([^=]+)(?:=(.*))?$/);
    if (match) parsed[match[1]] = match[2] ?? true;
  }
  return parsed;
}

function readJsonArray(file) {
  const payload = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!Array.isArray(payload)) {
    throw new Error(`${file} is not a JSON array`);
  }
  return payload;
}

function textOf(value) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function words(value) {
  return textOf(value).trim().split(/\s+/).filter(Boolean).length;
}

function normalized(value) {
  return textOf(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function fingerprint(question) {
  return normalized(`${question.stem ?? ""} ${question.scenarioTitle ?? ""}`).slice(0, 240);
}

function hasClinicalNoun(question) {
  const haystack = normalized([
    question.stem,
    question.scenario,
    question.rationale,
    question.deepRationale,
    question.category,
    question.subcategory,
    textOf(question.options),
  ].join(" "));
  return CLINICAL_TERMS.some((term) => haystack.includes(term));
}

function answerIds(answer) {
  if (Array.isArray(answer)) return answer.map(String);
  if (answer && typeof answer === "object") return Object.values(answer).map(String);
  return [String(answer ?? "").trim()].filter(Boolean);
}

function optionIds(question) {
  return Array.isArray(question.options)
    ? question.options.map((option, index) => String(option?.id ?? String.fromCharCode(97 + index)).toLowerCase())
    : [];
}

function distractorCoverage(question) {
  const distractors = question.distractorRationales;
  if (!distractors || typeof distractors !== "object" || Array.isArray(distractors)) {
    return { ok: false, covered: 0, expected: 0, boilerplate: false };
  }

  const correct = new Set(answerIds(question.answer).map((id) => id.toLowerCase()));
  const wrongIds = optionIds(question).filter((id) => !correct.has(id));
  if (wrongIds.length === 0) {
    return { ok: false, covered: 0, expected: 0, boilerplate: false };
  }

  let covered = 0;
  let boilerplate = false;
  for (const id of wrongIds) {
    const raw = distractors[id] ?? distractors[id.toUpperCase()];
    const rationale = textOf(raw);
    if (BOILERPLATE_RE.test(rationale)) boilerplate = true;
    if (words(rationale) >= 10 && hasAnyClinicalTerm(rationale)) covered += 1;
  }
  return { ok: covered === wrongIds.length && !boilerplate, covered, expected: wrongIds.length, boilerplate };
}

function hasAnyClinicalTerm(value) {
  const haystack = normalized(value);
  return CLINICAL_TERMS.some((term) => haystack.includes(term));
}

function bowTieIntegrity(question) {
  if (question.type !== "bow_tie") return { ok: true, reason: null };
  const bowTie = question.bowTie;
  if (!bowTie || typeof bowTie !== "object") {
    return { ok: false, reason: "missing_bow_tie_payload" };
  }

  const center = bowTie.center ?? bowTie.condition ?? bowTie.cause;
  const left = bowTie.leftActions ?? bowTie.actions;
  const right = bowTie.rightMonitoring ?? bowTie.rightMonitors ?? bowTie.outcomes;
  const centerOk = Boolean(typeof center === "string" ? center.trim() : center?.text);
  const leftCorrect = Array.isArray(left)
    ? left.filter((item) => typeof item === "string" ? item.trim() : item?.isCorrect || item?.text).length
    : 0;
  const rightCorrect = Array.isArray(right)
    ? right.filter((item) => typeof item === "string" ? item.trim() : item?.isCorrect || item?.text).length
    : 0;

  if (!centerOk || leftCorrect < 2 || rightCorrect < 2) {
    return { ok: false, reason: "not_three_zone_bow_tie" };
  }
  return { ok: true, reason: null };
}

function caseStudyIntegrity(question, caseGroups) {
  if (question.type !== "case_study") return { ok: true, reason: null };
  const groupKey = question.caseStudyId
    ? `id:${question.caseStudyId}`
    : `scenario:${normalized(`${question.scenarioTitle ?? ""}|${question.scenario ?? ""}`)}`;
  const siblings = caseGroups.get(groupKey) ?? 0;
  if (siblings < 2) {
    return { ok: false, reason: "not_genuine_grouped_case_study" };
  }
  return { ok: true, reason: null };
}

function buildCaseGroups(candidates) {
  const groups = new Map();
  for (const question of candidates) {
    if (question.type !== "case_study") continue;
    const key = question.caseStudyId
      ? `id:${question.caseStudyId}`
      : `scenario:${normalized(`${question.scenarioTitle ?? ""}|${question.scenario ?? ""}`)}`;
    groups.set(key, (groups.get(key) ?? 0) + 1);
  }
  return groups;
}

function scoreQuestion(question, liveFingerprints, batchFingerprints, caseGroups) {
  const issues = [];
  let score = 0;
  const allText = textOf(question);
  const fp = fingerprint(question);

  if (!question.id) issues.push("missing_id");
  if (!question.stem || words(question.stem) < 10) issues.push("thin_stem");
  if (!Array.isArray(question.options) || question.options.length < 2) issues.push("missing_options");
  if (question.answer == null || textOf(question.answer).trim() === "") issues.push("missing_answer");
  if (!question.rationale || words(question.rationale) < 25) issues.push("thin_rationale");
  if (BOILERPLATE_RE.test(allText)) issues.push("boilerplate_distractor_rationale");
  if (!hasClinicalNoun(question)) issues.push("missing_clinical_specificity");
  if (liveFingerprints.has(fp)) issues.push("duplicate_live_fingerprint");
  if ((batchFingerprints.get(fp) ?? 0) > 1) issues.push("duplicate_batch_fingerprint");

  const caseIntegrity = caseStudyIntegrity(question, caseGroups);
  if (!caseIntegrity.ok) issues.push(caseIntegrity.reason);
  const bowTie = bowTieIntegrity(question);
  if (!bowTie.ok) issues.push(bowTie.reason);

  const distractors = distractorCoverage(question);
  if (!distractors.ok) issues.push(distractors.boilerplate ? "boilerplate_distractors" : "incomplete_distractor_teaching");

  if (HIGH_VALUE_TYPES.has(question.type)) score += caseIntegrity.ok && bowTie.ok ? 20 : 0;
  if (question.type === "mcq") score += 8;
  if (Number(question.difficulty) >= 3 && Number(question.difficulty) <= 5) score += 10;
  if (words(question.stem) >= 35 && words(question.stem) <= 130) score += 15;
  else if (words(question.stem) >= 20 && words(question.stem) <= 160) score += 8;
  if (/\b(\d+(\.\d+)?|mg|mEq|mmHg|SpO2|FiO2|PaO2|INR|aPTT|cm H2O|bpm|kg|mL)\b/i.test(allText)) score += 10;
  if (words(question.rationale) >= 60) score += 15;
  else if (words(question.rationale) >= 35) score += 8;
  if (words(question.deepRationale) >= 90) score += 10;
  if (distractors.ok) score += 15;
  if (Array.isArray(question.references) && question.references.length > 0) score += 10;
  if (question.reviewStatus === "final-curated-live") score += 10;
  if (!liveFingerprints.has(fp)) score += 5;

  const hardReject = issues.some((issue) => [
    "missing_id",
    "missing_options",
    "missing_answer",
    "boilerplate_distractor_rationale",
    "boilerplate_distractors",
    "not_genuine_grouped_case_study",
    "not_three_zone_bow_tie",
    "missing_bow_tie_payload",
    "duplicate_live_fingerprint",
    "duplicate_batch_fingerprint",
  ].includes(issue));

  return {
    id: question.id ?? null,
    type: question.type ?? "unknown",
    category: question.category ?? null,
    difficulty: question.difficulty ?? null,
    score,
    decision: !hardReject && score >= minScore ? "promote" : "hold_review",
    issues,
    stem: question.stem ?? "",
  };
}

const live = readJsonArray(liveFile);
const candidates = readJsonArray(inputFile);
const liveFingerprints = new Set(live.map(fingerprint));
const batchFingerprints = new Map();
for (const question of candidates) {
  const fp = fingerprint(question);
  batchFingerprints.set(fp, (batchFingerprints.get(fp) ?? 0) + 1);
}
const caseGroups = buildCaseGroups(candidates);

const reviewed = candidates
  .map((question) => scoreQuestion(question, liveFingerprints, batchFingerprints, caseGroups))
  .sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (TYPE_PRIORITY.get(a.type) ?? 9) - (TYPE_PRIORITY.get(b.type) ?? 9);
  });

const promoted = reviewed.filter((item) => item.decision === "promote").slice(0, limit);
const held = reviewed.filter((item) => item.decision !== "promote").slice(0, Math.max(limit, 200));
const issueCounts = {};
for (const item of reviewed) {
  for (const issue of item.issues) {
    issueCounts[issue] = (issueCounts[issue] ?? 0) + 1;
  }
}

const manifest = {
  generatedAt: new Date().toISOString(),
  source: {
    inputFile: path.relative(repoRoot, inputFile).replaceAll("\\", "/"),
    liveFile: path.relative(repoRoot, liveFile).replaceAll("\\", "/"),
  },
  gate: {
    minScore,
    rule: "Promote only non-duplicate, clinically specific, non-boilerplate rows with valid NGN structure and premium rationale support.",
  },
  summary: {
    candidateCount: candidates.length,
    liveCount: live.length,
    promotableCount: reviewed.filter((item) => item.decision === "promote").length,
    emittedPromotedCount: promoted.length,
    heldCount: reviewed.filter((item) => item.decision !== "promote").length,
    issueCounts,
  },
  promoted,
  held,
};

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
process.stdout.write(`Reviewed ${candidates.length} candidates. Promotable: ${manifest.summary.promotableCount}. Manifest: ${path.relative(repoRoot, outFile)}\n`);
