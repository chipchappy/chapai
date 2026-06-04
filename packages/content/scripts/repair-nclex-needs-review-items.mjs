import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, "..");
const rawLiveFile = path.join(packageRoot, "questions", "nclex", "live", "reviewed-curated-live.json");
const liveFile = path.join(packageRoot, "questions", "nclex", "live", "reviewed-curated-live.unique.json");

const TARGET_IDS = new Set(["nclex_q075", "nclex_q075--case", "nclex_q075--bow", "mb895-n006"]);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function safeReplace(text) {
  return String(text ?? "")
    .replace(/without\s+assessment/gi, "before completing an assessment")
    .replace(/\s+/g, " ")
    .trim();
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function ensureChart(question) {
  if (!question.chartReview || typeof question.chartReview !== "object") {
    // eslint-disable-next-line no-param-reassign
    question.chartReview = {};
  }
  return question.chartReview;
}

function ensureMetricArray(value) {
  return Array.isArray(value) ? value : [];
}

function addIfEmpty(array, items) {
  if (array.length) return array;
  return items.slice();
}

function repairQuestion(question) {
  question.stem = safeReplace(question.stem);
  question.rationale = safeReplace(question.rationale);
  if (question.deepRationale) {
    question.deepRationale = safeReplace(question.deepRationale);
  }

  const chart = ensureChart(question);
  chart.patientTitle = chart.patientTitle || "sudden_speech_change";
  chart.patientCaption = chart.patientCaption || "Sudden language change is time-sensitive; assess and escalate immediately.";
  chart.chiefComplaint = chart.chiefComplaint || "Sudden difficulty speaking / word-finding and new confusion.";

  chart.history = addIfEmpty(ensureArray(chart.history), [
    "No known baseline aphasia; symptoms started suddenly.",
    "Ask/confirm last-known-well time and anticoagulant use.",
  ]);

  chart.hpi = addIfEmpty(ensureArray(chart.hpi), [
    "Family reports abrupt onset of word-finding difficulty and confusion.",
    "Assess airway/breathing/circulation and obtain a focused neuro assessment.",
  ]);

  chart.timeline = addIfEmpty(ensureArray(chart.timeline), [
    "0 min: Symptoms recognized; activate facility stroke protocol if indicated.",
    "0-5 min: Check blood glucose; assess neuro status; obtain vitals and oxygen saturation.",
  ]);

  chart.vitals = addIfEmpty(ensureMetricArray(chart.vitals), [
    { label: "BP", value: "168/92", unit: "mmHg", flag: "high" },
    { label: "HR", value: "98", unit: "bpm", flag: "high" },
    { label: "SpO2", value: "96", unit: "%", flag: "normal" },
  ]);

  chart.diagnostics = addIfEmpty(ensureMetricArray(chart.diagnostics), [
    { label: "Blood glucose (POC)", value: "112", unit: "mg/dL", flag: "normal" },
  ]);

  chart.notes = addIfEmpty(ensureArray(chart.notes), [
    "New neurologic symptoms require rapid assessment and escalation; do not delay for reassurance-only actions.",
  ]);

  if (["case_study", "bow_tie", "matrix", "ordering", "sata"].includes(question.type)) {
    chart.providerOrders = addIfEmpty(ensureArray(chart.providerOrders), [
      "Activate stroke alert per facility protocol.",
      "Obtain POC glucose and full set of vitals.",
      "Prepare for STAT CT head without contrast and notify provider/rapid response as indicated.",
      "Establish IV access; keep NPO until swallow screen completed.",
    ]);
  }

  if (question.id === "mb895-n006" && String(question.rationale ?? "").trim().length < 80) {
    question.rationale =
      "Sudden word-finding difficulty and confusion can indicate an acute neurologic event (e.g., stroke). The safest priority is to assess the client for an acute neurologic problem immediately and escalate per protocol.";
  }

  return question;
}

function main() {
  const files = [rawLiveFile, liveFile];
  const repaired = Array.from(TARGET_IDS).sort();
  const results = [];

  for (const filePath of files) {
    const payload = readJson(filePath);
    if (!Array.isArray(payload)) {
      throw new Error(`Unexpected payload in ${filePath}; expected array`);
    }

    let touched = 0;
    const next = payload.map((question) => {
      if (!TARGET_IDS.has(question?.id)) return question;
      touched += 1;
      return repairQuestion({ ...question, chartReview: question.chartReview ? { ...question.chartReview } : undefined });
    });

    if (touched !== TARGET_IDS.size) {
      throw new Error(`Expected to repair ${TARGET_IDS.size} questions in ${filePath}, but found ${touched}.`);
    }

    writeJson(filePath, next);
    results.push({ file: filePath, repairedCount: touched });
  }

  process.stdout.write(JSON.stringify({ ok: true, results, repaired }, null, 2) + "\n");
}

main();
