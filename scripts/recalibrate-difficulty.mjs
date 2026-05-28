#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const TARGET_DISTRIBUTION = Object.freeze({
  1: 0.10,
  2: 0.25,
  3: 0.35,
  4: 0.20,
  5: 0.10,
});

const CLINICAL_FINDING_TERMS = [
  "airway", "respiratory", "oxygen", "spo2", "breathing", "ventilation", "wheezing", "stridor",
  "perfusion", "pulse", "blood pressure", "hypotension", "tachycardia", "bradycardia", "shock",
  "bleeding", "hemorrhage", "anticoagulant", "heparin", "warfarin", "aptt", "inr",
  "sepsis", "infection", "fever", "neutropenia", "lactate", "culture", "antibiotic",
  "glucose", "insulin", "ketone", "potassium", "sodium", "electrolyte", "dehydration",
  "stroke", "seizure", "intracranial", "confusion", "delirium", "weakness", "pupil",
  "renal", "urine", "creatinine", "fluid", "edema", "pain", "chest pain", "fetal",
  "uterine", "postpartum", "preeclampsia", "magnesium", "cord", "newborn", "pediatric",
  "suicide", "psychosis", "lithium", "toxicity", "falls", "isolation", "delegation",
];

const BLOOM_VERBS = [
  { match: /\b(recognize|identify|observe|collect|find|cue)\b/i, score: 4 },
  { match: /\b(apply|implement|administer|teach|intervene|respond)\b/i, score: 9 },
  { match: /\b(analyze|interpret|differentiate|compare|trend|correlate)\b/i, score: 14 },
  { match: /\b(prioritize|first|best|most important|highest priority|urgent)\b/i, score: 17 },
  { match: /\b(evaluate|reassess|determine effectiveness|expected outcome|follow up)\b/i, score: 18 },
];

const CJMM_STEP_WEIGHT = {
  "recognize-cues": 5,
  "analyze-cues": 13,
  "prioritize-hypotheses": 17,
  "generate-solutions": 15,
  "take-actions": 16,
  "evaluate-outcomes": 18,
};

// Midpoint weights from the official 2026 NCLEX-RN client-need ranges.
const CLIENT_NEED_WEIGHTS = [
  { match: /management_of_care|management of care|delegation|prioritization|case management/i, weight: 18 },
  { match: /safety_infection|safety|infection|isolation|fall|restraint/i, weight: 13 },
  { match: /health_promotion|health promotion|growth|development|screening/i, weight: 9 },
  { match: /psychosocial|mental|psychiatric|therapeutic communication|crisis/i, weight: 9 },
  { match: /basic_care|comfort|mobility|nutrition|elimination/i, weight: 9 },
  { match: /pharmacological|pharmacology|parenteral|medication|drug/i, weight: 16 },
  { match: /risk_reduction|risk reduction|lab|diagnostic|complication/i, weight: 12 },
  { match: /physiological_adaptation|physiological adaptation|cardiac|respiratory|endocrine|neuro|shock|sepsis/i, weight: 14 },
];

const TYPE_COMPLEXITY = {
  mcq: 2,
  scenario_mcq: 5,
  decision_map_mcq: 6,
  sata: 7,
  ordering: 8,
  matrix: 9,
  bow_tie: 10,
  case_study: 12,
};

function defaultInputDir() {
  for (const dir of ["promoted-v3", "promoted-v2", "promoted"]) {
    const candidate = path.join(repoRoot, "packages", "content", "staging", dir);
    if (fs.existsSync(candidate)) return candidate;
  }
  return path.join(repoRoot, "packages", "content", "staging", "promoted");
}

function parseArgs(argv) {
  const options = {
    inputDir: defaultInputDir(),
    outputDir: path.join(repoRoot, "packages", "content", "staging", "promoted-v4"),
    report: path.join(repoRoot, "reports", "p1.7-difficulty-recalibration.md"),
    dryRun: false,
    force: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const readValue = () => {
      const value = argv[++index];
      if (!value) throw new Error(`Missing value for ${arg}`);
      return value;
    };
    if (arg === "--input-dir") options.inputDir = path.resolve(readValue());
    else if (arg.startsWith("--input-dir=")) options.inputDir = path.resolve(arg.slice("--input-dir=".length));
    else if (arg === "--output-dir") options.outputDir = path.resolve(readValue());
    else if (arg.startsWith("--output-dir=")) options.outputDir = path.resolve(arg.slice("--output-dir=".length));
    else if (arg === "--report") options.report = path.resolve(readValue());
    else if (arg.startsWith("--report=")) options.report = path.resolve(arg.slice("--report=".length));
    else if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--force") options.force = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  if (path.resolve(options.inputDir) === path.resolve(options.outputDir) && !options.dryRun) {
    throw new Error("Refusing to write recalibrated output into the input directory");
  }
  return options;
}

function stableHash(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function normalize(value) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9\s]+/g, " ").replace(/\s+/g, " ").trim();
}

function tokenize(value) {
  const stop = new Set(["the", "and", "for", "with", "that", "this", "from", "which", "what", "into", "client", "nurse", "action"]);
  return normalize(value).split(" ").filter((word) => word.length > 2 && !stop.has(word));
}

function collectQuestionText(question) {
  return [
    question.category,
    question.subcategory,
    question.nclexClientNeed,
    question.cjmmStep,
    question.scenarioTitle,
    question.scenario,
    question.stem,
    question.rationale,
    JSON.stringify(question.exhibits ?? []),
    JSON.stringify(question.options ?? []),
    JSON.stringify(question.bowTie ?? {}),
    JSON.stringify(question.matrixRows ?? []),
  ].filter(Boolean).join(" ");
}

function wordCount(value) {
  return tokenize(value).length;
}

function countClinicalFindings(question) {
  const haystack = normalize(collectQuestionText(question));
  const hits = CLINICAL_FINDING_TERMS.filter((term) => haystack.includes(normalize(term)));
  const numericFindings = (collectQuestionText(question).match(/\b\d+(\.\d+)?\s?(mg\/dL|mmHg|bpm|%|sec|mEq\/L|cm|weeks|kg|mL|L)\b/gi) ?? []).length;
  return new Set(hits).size + Math.min(numericFindings, 8);
}

function bloomScore(question) {
  const haystack = `${question.cjmmStep ?? ""} ${question.stem ?? ""}`;
  const verbScore = BLOOM_VERBS.reduce((score, entry) => entry.match.test(haystack) ? Math.max(score, entry.score) : score, 7);
  return Math.max(verbScore, CJMM_STEP_WEIGHT[question.cjmmStep] ?? 0);
}

function clientNeedScore(question) {
  const haystack = [question.nclexClientNeed, question.category, question.subcategory, question.tags?.join(" ")].filter(Boolean).join(" ");
  return CLIENT_NEED_WEIGHTS.find((entry) => entry.match.test(haystack))?.weight ?? 10;
}

function correctOptionText(question) {
  const answers = Array.isArray(question.answer)
    ? question.answer
    : typeof question.answer === "string"
      ? [question.answer]
      : Object.values(question.answer ?? {}).flat();
  const answerSet = new Set(answers.map((answer) => String(answer).toLowerCase()));
  return (question.options ?? [])
    .filter((option) => answerSet.has(String(option.id).toLowerCase()))
    .map((option) => option.text)
    .join(" ");
}

function jaccard(left, right) {
  const leftSet = new Set(tokenize(left));
  const rightSet = new Set(tokenize(right));
  if (!leftSet.size || !rightSet.size) return 0;
  let overlap = 0;
  for (const token of leftSet) {
    if (rightSet.has(token)) overlap += 1;
  }
  return overlap / new Set([...leftSet, ...rightSet]).size;
}

function distractorPlausibilityScore(question) {
  const correctText = correctOptionText(question) || question.rationale || question.stem;
  const answerIds = new Set(
    (Array.isArray(question.answer)
      ? question.answer
      : typeof question.answer === "string"
        ? [question.answer]
        : Object.values(question.answer ?? {}).flat()).map((id) => String(id).toLowerCase()),
  );
  const distractors = (question.options ?? []).filter((option) => !answerIds.has(String(option.id).toLowerCase()));
  if (!distractors.length) return 10;
  const averageSimilarity = distractors.reduce((sum, option) => {
    const rationale = question.distractorRationales?.[option.id] ?? "";
    return sum + Math.max(jaccard(option.text, correctText), jaccard(rationale, question.rationale ?? ""));
  }, 0) / distractors.length;
  return Math.round(Math.min(20, averageSimilarity * 70 + Math.min(distractors.length, 6)));
}

export function computeDifficultyFeatures(question) {
  const text = collectQuestionText(question);
  const stemWords = wordCount(question.stem ?? "");
  const findings = countClinicalFindings(question);
  const stemLengthScore = Math.max(0, Math.min(18, Math.round((stemWords - 20) / 4)));
  const findingsScore = Math.min(22, findings * 2);
  const bloom = bloomScore(question);
  const distractors = distractorPlausibilityScore(question);
  const clientNeed = clientNeedScore(question);
  const typeComplexity = TYPE_COMPLEXITY[question.type] ?? 3;
  const scenarioComplexity = wordCount(text) > 140 ? 6 : wordCount(text) > 85 ? 3 : 0;
  const rawScore = Math.round(stemLengthScore + findingsScore + bloom + distractors + clientNeed + typeComplexity + scenarioComplexity);
  return {
    stemWords,
    findings,
    stemLengthScore,
    findingsScore,
    bloomScore: bloom,
    distractorPlausibilityScore: distractors,
    clientNeedScore: clientNeed,
    typeComplexity,
    scenarioComplexity,
    rawScore,
  };
}

function targetCounts(total) {
  const counts = {};
  let assigned = 0;
  for (const difficulty of [1, 2, 3, 4]) {
    counts[difficulty] = Math.round(total * TARGET_DISTRIBUTION[difficulty]);
    assigned += counts[difficulty];
  }
  counts[5] = Math.max(0, total - assigned);
  return counts;
}

export function assignTargetDifficulties(items) {
  const sorted = [...items].sort((left, right) => {
    const rawDelta = left.features.rawScore - right.features.rawScore;
    if (rawDelta) return rawDelta;
    return stableHash(`${left.file}:${left.index}:${left.question.id}`).localeCompare(stableHash(`${right.file}:${right.index}:${right.question.id}`));
  });
  const counts = targetCounts(sorted.length);
  const assignments = new Map();
  let cursor = 0;
  for (const difficulty of [1, 2, 3, 4, 5]) {
    const bucketCount = counts[difficulty];
    for (let offset = 0; offset < bucketCount && cursor < sorted.length; offset += 1, cursor += 1) {
      assignments.set(sorted[cursor].key, difficulty);
    }
  }
  return assignments;
}

function emptyDistribution() {
  return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
}

export function summarizeDistribution(questions) {
  const distribution = emptyDistribution();
  for (const question of questions) {
    const difficulty = Number(question.difficulty);
    if (difficulty >= 1 && difficulty <= 5) distribution[difficulty] += 1;
  }
  return distribution;
}

function pct(count, total) {
  return total > 0 ? Math.round((count / total) * 100) : 0;
}

function distributionLine(distribution, total) {
  return [1, 2, 3, 4, 5].map((difficulty) => {
    const count = distribution[difficulty] ?? 0;
    return `L${difficulty}: ${count} (${pct(count, total)}%)`;
  }).join(", ");
}

function readBatches(inputDir) {
  const files = fs.readdirSync(inputDir).filter((file) => file.endsWith(".json")).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  return files.map((file) => {
    const absolute = path.join(inputDir, file);
    return { file, payload: JSON.parse(fs.readFileSync(absolute, "utf8").replace(/^\uFEFF/, "")) };
  });
}

function isPremiumBaseline(question) {
  return question?.exam === "nclex" && Boolean(question.structuredRationale);
}

function safeReplaceOutput(outputDir, force) {
  if (!fs.existsSync(outputDir)) return;
  if (!force) throw new Error(`Output directory already exists: ${outputDir}. Use --force to replace it.`);
  const stagingRoot = path.join(repoRoot, "packages", "content", "staging");
  const relative = path.relative(stagingRoot, outputDir);
  if (relative.startsWith("..") || path.isAbsolute(relative) || !path.basename(outputDir).startsWith("promoted-v")) {
    throw new Error(`Refusing to remove unsafe output directory: ${outputDir}`);
  }
  fs.rmSync(outputDir, { recursive: true, force: true });
}

function writeReport(file, summary) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const lines = [
    "# P1.7 Difficulty Recalibration",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    `Input: \`${path.relative(repoRoot, summary.inputDir)}\``,
    `Output: \`${summary.dryRun ? "dry-run" : path.relative(repoRoot, summary.outputDir)}\``,
    "",
    `Premium baseline rows: ${summary.premiumRows}`,
    `Unique premium IDs: ${summary.uniquePremiumRows}`,
    `Duplicate premium rows: ${summary.duplicatePremiumRows}`,
    `Legacy NCLEX rows preserved: ${summary.legacyRows}`,
    `Difficulty changes: ${summary.changed}`,
    "",
    "## Distribution",
    "",
    `Before: ${distributionLine(summary.beforeDistribution, summary.premiumRows)}`,
    `After: ${distributionLine(summary.afterDistribution, summary.premiumRows)}`,
    `After D1 upsert view: ${distributionLine(summary.uniqueAfterDistribution, summary.uniquePremiumRows)}`,
    `Target: ${[1, 2, 3, 4, 5].map((difficulty) => `L${difficulty}: ${Math.round(TARGET_DISTRIBUTION[difficulty] * 100)}%`).join(", ")}`,
    "",
    "## Scoring Inputs",
    "",
    "- Stem length and scenario size",
    "- Count of clinical findings, abnormal values, and priority cues",
    "- Bloom/CJMM action verb complexity",
    "- Distractor plausibility by token similarity to the keyed answer and rationale",
    "- NCLEX-RN 2026 client-need midpoint weight",
    "- Item-type complexity",
    "",
    "## Guardrails",
    "",
    "- No model calls.",
    "- No in-place bank edits.",
    "- Only NCLEX rows with structured rationales are recalibrated.",
    "- Legacy/unstructured NCLEX rows are preserved and reported separately.",
    "",
    "## Sample Changes",
    "",
    ...summary.sampleChanges.map((change) => `- ${change.id}: L${change.from} -> L${change.to} (${change.reason})`),
    "",
  ];
  fs.writeFileSync(file, `${lines.join("\n")}\n`);
}

export function recalibrateDifficulty(options) {
  const batches = readBatches(options.inputDir);
  const items = [];
  const legacyRows = [];
  const allPremiumBefore = [];

  for (const batch of batches) {
    const questions = Array.isArray(batch.payload) ? batch.payload : batch.payload.questions;
    if (!Array.isArray(questions)) continue;
    questions.forEach((question, index) => {
      if (question?.exam !== "nclex") return;
      if (!isPremiumBaseline(question)) {
        legacyRows.push(question);
        return;
      }
      const features = computeDifficultyFeatures(question);
      const key = `${batch.file}:${index}:${question.id}`;
      items.push({ key, file: batch.file, index, question, features });
      allPremiumBefore.push(question);
    });
  }

  const assignments = assignTargetDifficulties(items);
  const sampleChanges = [];
  let changed = 0;
  const premiumAfter = [];

  for (const item of items) {
    const nextDifficulty = assignments.get(item.key) ?? item.question.difficulty;
    const previousDifficulty = Number(item.question.difficulty);
    if (previousDifficulty !== nextDifficulty) {
      changed += 1;
      if (sampleChanges.length < 25) {
        sampleChanges.push({
          id: item.question.id,
          from: previousDifficulty,
          to: nextDifficulty,
          reason: `raw=${item.features.rawScore}, findings=${item.features.findings}, bloom=${item.features.bloomScore}`,
        });
      }
    }
    premiumAfter.push({ ...item.question, difficulty: nextDifficulty });
  }

  if (!options.dryRun) {
    safeReplaceOutput(options.outputDir, options.force);
    fs.mkdirSync(options.outputDir, { recursive: true });
    for (const batch of batches) {
      const questions = Array.isArray(batch.payload) ? batch.payload : batch.payload.questions;
      if (!Array.isArray(questions)) {
        fs.writeFileSync(path.join(options.outputDir, batch.file), `${JSON.stringify(batch.payload, null, 2)}\n`);
        continue;
      }
      const nextQuestions = questions.map((question, index) => {
        if (!isPremiumBaseline(question)) return question;
        const key = `${batch.file}:${index}:${question.id}`;
        return { ...question, difficulty: assignments.get(key) ?? question.difficulty };
      });
      const payload = Array.isArray(batch.payload)
        ? nextQuestions
        : {
            ...batch.payload,
            generatedBy: {
              ...batch.payload.generatedBy,
              difficultyRecalibration: {
                agentId: "codex",
                runtime: "deterministic",
                promptSource: "scripts/recalibrate-difficulty.mjs",
              },
            },
            questions: nextQuestions,
          };
      fs.writeFileSync(path.join(options.outputDir, batch.file), `${JSON.stringify(payload, null, 2)}\n`);
    }
  }

  const uniquePremium = new Map();
  for (const question of premiumAfter) {
    uniquePremium.set(question.id, question);
  }

  const summary = {
    inputDir: options.inputDir,
    outputDir: options.outputDir,
    dryRun: options.dryRun,
    premiumRows: items.length,
    uniquePremiumRows: uniquePremium.size,
    duplicatePremiumRows: Math.max(0, premiumAfter.length - uniquePremium.size),
    legacyRows: legacyRows.length,
    changed,
    beforeDistribution: summarizeDistribution(allPremiumBefore),
    afterDistribution: summarizeDistribution(premiumAfter),
    uniqueAfterDistribution: summarizeDistribution([...uniquePremium.values()]),
    sampleChanges,
  };
  writeReport(options.report, summary);
  return summary;
}

function isDirectRun() {
  return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}

if (isDirectRun()) {
  try {
    const summary = recalibrateDifficulty(parseArgs(process.argv.slice(2)));
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  }
}
