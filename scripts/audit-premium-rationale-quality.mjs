#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = parseArgs(process.argv.slice(2));
const inputPath = path.resolve(root, args.input ?? "packages/content/questions/nclex/live");
const reportPath = path.resolve(root, args.report ?? `reports/premium-rationale-quality-audit-${today()}.md`);
const jsonPath = path.resolve(root, args.json ?? reportPath.replace(/\.md$/i, ".json"));
const failOnGaps = Boolean(args["fail-on-gaps"]);

const PREMIUM_RATIONALE_WORDS = Number(args["min-rationale-words"] ?? 150);
const MIN_DISTRACTOR_WORDS = Number(args["min-distractor-words"] ?? 12);
const MIN_VISUAL_NODES = Number(args["min-visual-nodes"] ?? 3);

function parseArgs(argv) {
  const out = {};
  for (const arg of argv) {
    const match = arg.match(/^--([^=]+)(?:=(.*))?$/);
    if (!match) continue;
    out[match[1]] = match[2] ?? true;
  }
  return out;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function listJsonFiles(target) {
  const stat = fs.statSync(target);
  if (stat.isFile()) return target.endsWith(".json") ? [target] : [];
  const files = [];
  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    const next = path.join(target, entry.name);
    if (entry.isDirectory()) files.push(...listJsonFiles(next));
    else if (entry.isFile() && entry.name.endsWith(".json")) files.push(next);
  }
  return files.sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));
}

function extractQuestions(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.questions)) return payload.questions;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function words(value) {
  return String(value ?? "").trim().split(/\s+/).filter(Boolean).length;
}

function text(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function field(question, camel, snake = camel.replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`)) {
  return question?.[camel] ?? question?.[snake] ?? question?.metadata?.[camel] ?? question?.metadata?.[snake];
}

function objectPresent(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length);
}

function arrayPresent(value) {
  return Array.isArray(value) && value.length > 0;
}

function normalizeDistractors(question) {
  const distractors = field(question, "distractorRationales");
  if (Array.isArray(distractors)) {
    return Object.fromEntries(distractors.map((item, index) => [item?.id ?? String(index), item?.rationale ?? item?.text ?? item]));
  }
  return objectPresent(distractors) ? distractors : {};
}

function normalizeVisual(question) {
  return field(question, "visualRationale") ?? field(question, "diagramBlueprint") ?? field(question, "visual");
}

function visualNodeCount(visual) {
  if (!visual || typeof visual !== "object") return 0;
  const candidates = [visual.nodes, visual.steps, visual.checkpoints, visual.lanes, visual.metrics, visual.items]
    .filter(Array.isArray)
    .map((item) => item.length);
  return candidates.length ? Math.max(...candidates) : 0;
}

function hasBoilerplate(value) {
  const body = text(value).toLowerCase();
  return /n\s*\/?\s*a\b|not applicable|this is (a )?correct (choice|answer|option)|because it is correct|less safe because it delays|does not match the highest-risk cue/.test(body);
}

function typeOf(question) {
  return text(field(question, "type") || field(question, "questionType") || "unknown");
}

function needsDistractorRationales(question) {
  const type = typeOf(question);
  return ["mcq", "sata", "matrix", "bow_tie", "case_study", "scenario_mcq", "decision_map_mcq"].includes(type);
}

function diagramWorthy(question) {
  return field(question, "diagramWorthiness") === true || field(question, "diagramWorthy") === true || field(question, "visualWorthy") === true;
}

function auditQuestion(question, source) {
  const rationaleWords = words(field(question, "rationale") ?? question.rationale);
  const structured = field(question, "structuredRationale");
  const distractors = normalizeDistractors(question);
  const visual = normalizeVisual(question);
  const visualPresent = objectPresent(field(question, "visualRationale")) || words(field(question, "visualRationale")) >= 25;
  const diagramBlueprintPresent = objectPresent(field(question, "diagramBlueprint")) || arrayPresent(field(question, "diagramBlueprint"));
  const weakDistractors = Object.values(distractors).filter((value) => words(value) < MIN_DISTRACTOR_WORDS || hasBoilerplate(value)).length;
  const missingDistractors = needsDistractorRationales(question) && !Object.keys(distractors).length;
  const worthy = diagramWorthy(question);
  const weakVisual = worthy && (!visualPresent || visualNodeCount(visual) < MIN_VISUAL_NODES);
  const missing = [];

  if (rationaleWords < PREMIUM_RATIONALE_WORDS) missing.push("short rationale");
  if (!objectPresent(structured)) missing.push("missing structured rationale");
  if (missingDistractors) missing.push("missing distractor rationales");
  if (weakDistractors) missing.push("weak distractor rationales");
  if (weakVisual) missing.push("diagram-worthy without premium visual");

  return {
    id: question.id ?? question.questionId ?? "unknown",
    source,
    type: typeOf(question),
    gate: text(field(question, "qualityGate") || "none"),
    rationaleWords,
    structuredPresent: objectPresent(structured),
    distractorCount: Object.keys(distractors).length,
    weakDistractors,
    visualPresent,
    diagramBlueprintPresent,
    diagramWorthy: worthy,
    missing,
    stem: text(question.stem ?? question.question).slice(0, 140),
  };
}

const files = listJsonFiles(inputPath);
const rows = [];
for (const file of files) {
  const questions = extractQuestions(readJson(file));
  for (const question of questions) {
    if (args.all || question?.exam === "nclex" || inputPath.toLowerCase().includes("nclex")) {
      rows.push(auditQuestion(question, path.relative(root, file)));
    }
  }
}

const summary = summarize(rows);
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(jsonPath, JSON.stringify({ generatedAt: new Date().toISOString(), input: path.relative(root, inputPath), thresholds: thresholds(), summary, examples: examples(rows) }, null, 2) + "\n");
fs.writeFileSync(reportPath, renderMarkdown(summary, rows), "utf8");
process.stdout.write(`${JSON.stringify({ report: path.relative(root, reportPath), json: path.relative(root, jsonPath), summary }, null, 2)}\n`);

if (failOnGaps && summary.premiumReady < summary.total) {
  process.exitCode = 1;
}

function thresholds() {
  return {
    minRationaleWords: PREMIUM_RATIONALE_WORDS,
    minDistractorWords: MIN_DISTRACTOR_WORDS,
    minVisualNodes: MIN_VISUAL_NODES,
  };
}

function summarize(rows) {
  const total = rows.length;
  const count = (predicate) => rows.filter(predicate).length;
  return {
    total,
    premiumReady: count((row) => row.missing.length === 0),
    shortRationale: count((row) => row.rationaleWords < PREMIUM_RATIONALE_WORDS),
    missingStructured: count((row) => !row.structuredPresent),
    missingDistractors: count((row) => row.missing.includes("missing distractor rationales")),
    weakDistractors: count((row) => row.weakDistractors > 0),
    visualPresent: count((row) => row.visualPresent),
    diagramBlueprintPresent: count((row) => row.diagramBlueprintPresent),
    diagramWorthy: count((row) => row.diagramWorthy),
    diagramWorthyWithoutPremiumVisual: count((row) => row.missing.includes("diagram-worthy without premium visual")),
    strictGateButNotPremium: count((row) => row.gate.includes("strict") && row.missing.length > 0),
    byType: counts(rows.map((row) => row.type)),
    byGate: counts(rows.map((row) => row.gate || "none")),
  };
}

function counts(values) {
  return values.reduce((acc, value) => {
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

function examples(rows) {
  return rows
    .filter((row) => row.missing.length)
    .sort((left, right) => right.missing.length - left.missing.length || left.rationaleWords - right.rationaleWords)
    .slice(0, 20);
}

function pct(value, total) {
  return total ? `${((value / total) * 100).toFixed(1)}%` : "0.0%";
}

function renderMarkdown(summary, rows) {
  const topExamples = examples(rows);
  return [
    "# Premium Rationale Quality Audit",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    `Input: \`${path.relative(root, inputPath)}\``,
    "",
    "## Thresholds",
    "",
    `- Minimum rationale length: ${PREMIUM_RATIONALE_WORDS} words`,
    `- Minimum distractor rationale length: ${MIN_DISTRACTOR_WORDS} words`,
    `- Minimum visual nodes for diagram-worthy items: ${MIN_VISUAL_NODES}`,
    "",
    "## Summary",
    "",
    `- Total NCLEX items scanned: ${summary.total}`,
    `- Premium-ready by this gate: ${summary.premiumReady} (${pct(summary.premiumReady, summary.total)})`,
    `- Short rationales: ${summary.shortRationale} (${pct(summary.shortRationale, summary.total)})`,
    `- Missing structured rationales: ${summary.missingStructured} (${pct(summary.missingStructured, summary.total)})`,
    `- Missing distractor rationales: ${summary.missingDistractors} (${pct(summary.missingDistractors, summary.total)})`,
    `- Weak distractor rationales: ${summary.weakDistractors} (${pct(summary.weakDistractors, summary.total)})`,
    `- Diagram-worthy without premium visual: ${summary.diagramWorthyWithoutPremiumVisual} (${pct(summary.diagramWorthyWithoutPremiumVisual, summary.total)})`,
    `- Strict gate but not premium-ready: ${summary.strictGateButNotPremium} (${pct(summary.strictGateButNotPremium, summary.total)})`,
    "",
    "## Type Distribution",
    "",
    ...Object.entries(summary.byType).sort((a, b) => b[1] - a[1]).map(([type, count]) => `- ${type}: ${count}`),
    "",
    "## Quality Gate Distribution",
    "",
    ...Object.entries(summary.byGate).sort((a, b) => b[1] - a[1]).map(([gate, count]) => `- ${gate}: ${count}`),
    "",
    "## Highest-Risk Examples",
    "",
    "| Item | Type | Gate | Words | Missing | Stem |",
    "| --- | --- | --- | ---: | --- | --- |",
    ...topExamples.map((row) => `| \`${row.id}\` | ${row.type} | ${row.gate || "none"} | ${row.rationaleWords} | ${row.missing.join(", ")} | ${row.stem.replaceAll("|", "\\|")} |`),
    "",
    "## Interpretation",
    "",
    "This audit is a production-readiness screen, not a nursing clinical certification. Items that fail here should not be described as premium-ready until they receive source-backed expansion, distractor-level teaching, visual review for diagram-worthy concepts, and final clinical QA.",
    "",
  ].join("\n");
}
