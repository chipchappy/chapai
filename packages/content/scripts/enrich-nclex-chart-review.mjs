import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, "..");
const chapaiRoot = path.resolve(packageRoot, "..", "..");
const liveFile = path.join(packageRoot, "questions", "nclex", "live", "reviewed-curated-live.unique.json");
const reportFile = path.join(chapaiRoot, "reports", "nclex-chart-review-enrichment.json");

const CHART_TYPES = new Set(["case_study", "bow_tie", "matrix", "ordering", "sata"]);

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function asItems(value) {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  if (value && typeof value === "object") return Object.values(value).map(String).map((item) => item.trim()).filter(Boolean);
  const raw = String(value ?? "").trim();
  if (!raw) return [];
  return raw.split(/\r?\n|;(?=\s*[A-Z])|\s+\|\s+/).map((item) => item.trim()).filter(Boolean);
}

function unique(values, limit = 6) {
  const seen = new Set();
  const output = [];
  for (const value of values) {
    const normalized = String(value ?? "").replace(/\s+/g, " ").trim();
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(normalized);
    if (output.length >= limit) break;
  }
  return output;
}

function sentenceSplit(text) {
  return String(text ?? "")
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function optionText(question, answer) {
  if (!answer) return "";
  if (Array.isArray(answer)) {
    return answer
      .map((id) => question.options?.find((option) => option.id?.toLowerCase() === String(id).toLowerCase())?.text ?? String(id))
      .join(", ");
  }
  if (typeof answer === "object") {
    return Object.entries(answer).map(([label, value]) => `${label} -> ${value}`).join(" | ");
  }
  return question.options?.find((option) => option.id?.toLowerCase() === String(answer).toLowerCase())?.text ?? String(answer);
}

function allText(question) {
  const exhibits = (question.exhibits ?? []).flatMap((exhibit) => [
    exhibit.title,
    exhibit.body,
    ...asItems(exhibit.items),
  ]);
  return [
    question.stem,
    question.scenarioTitle,
    question.scenario,
    question.additionalInfo,
    question.rationale,
    question.deepRationale,
    question.takeaway,
    question.speedCue,
    ...(question.options ?? []).map((option) => option.text),
    ...exhibits,
  ].filter(Boolean).join(" ");
}

function extractLabMetrics(text) {
  const lower = text.toLowerCase();
  const metrics = [];
  const patterns = [
    ["potassium", /\b(?:potassium|k\+?)\s*(?:is|=|:)?\s*(\d+(?:\.\d+)?\s*(?:mEq\/L|mmol\/L)?)/i, "cardiac membrane risk"],
    ["creatinine", /\bcreatinine\s*(?:is|=|:)?\s*(\d+(?:\.\d+)?\s*(?:mg\/dL)?)/i, "renal function trend"],
    ["lactate", /\blactate\s*(?:is|=|:)?\s*(\d+(?:\.\d+)?\s*(?:mmol\/L)?)/i, "perfusion trend"],
    ["glucose", /\bglucose\s*(?:is|=|:)?\s*(\d+(?:\.\d+)?\s*(?:mg\/dL)?)/i, "metabolic safety"],
    ["sodium", /\b(?:sodium|na\+?)\s*(?:is|=|:)?\s*(\d+(?:\.\d+)?\s*(?:mEq\/L|mmol\/L)?)/i, "neuro/metabolic trend"],
    ["wbc", /\bWBC\s*(?:is|=|:)?\s*(\d+(?:\.\d+)?\s*(?:K\/µL|K\/uL|K)?)/i, "infection signal"],
    ["platelets", /\bplatelets?\s*(?:is|=|:)?\s*(\d+(?:\.\d+)?\s*(?:K\/µL|K\/uL|K)?)/i, "bleeding risk"],
    ["inr", /\bINR\s*(?:is|=|:)?\s*(\d+(?:\.\d+)?)/i, "coagulation"],
    ["aptt", /\baPTT\s*(?:is|=|:)?\s*(\d+(?:\.\d+)?)/i, "heparin safety"],
    ["ph", /\bpH\s*(?:is|=|:)?\s*(\d+(?:\.\d+)?)/i, "acid-base"],
  ];

  for (const [label, pattern, detail] of patterns) {
    const match = text.match(pattern);
    if (match) {
      metrics.push({ label, value: match[1].trim(), flag: inferFlag(label, match[1], lower), detail });
    }
  }

  const trendSignals = [
    ["creatinine", "rising serum creatinine", "high", "renal function trend"],
    ["urine output", "decreased urine output", "low", "renal perfusion"],
    ["lactate", "rising lactate", "critical", "perfusion trend"],
  ];
  for (const [label, phrase, flag, detail] of trendSignals) {
    if (lower.includes(phrase) && !metrics.some((metric) => metric.label === label)) {
      metrics.push({ label, value: phrase, flag, detail });
    }
  }

  return uniqueMetric(metrics, 6);
}

function inferFlag(label, value, lowerText) {
  const numeric = Number(String(value).match(/\d+(?:\.\d+)?/)?.[0] ?? NaN);
  if (label === "potassium" && numeric >= 6) return "critical";
  if (label === "lactate" && numeric >= 4) return "critical";
  if (label === "glucose" && (numeric < 60 || numeric > 300)) return "critical";
  if (label === "platelets" && numeric < 100) return "low";
  if (label === "wbc" && numeric > 12) return "high";
  if (lowerText.includes("critical") || lowerText.includes("rapid deterioration")) return "critical";
  if (lowerText.includes("rising") || lowerText.includes("elevated") || lowerText.includes("high")) return "high";
  if (lowerText.includes("falling") || lowerText.includes("decreased") || lowerText.includes("low")) return "low";
  return "normal";
}

function uniqueMetric(metrics, limit = 6) {
  const seen = new Set();
  const output = [];
  for (const metric of metrics) {
    const key = `${metric.label}:${metric.value}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(metric);
    if (output.length >= limit) break;
  }
  return output;
}

function extractDiagnostics(text) {
  const lower = text.toLowerCase();
  const diagnostics = [];
  const phrases = [
    ["oxygenation", ["hypoxic", "short of breath", "dyspnea", "spo2", "cyanotic"], "critical", "oxygenation"],
    ["blood pressure", ["hypotensive", "hypertension", "blood pressure", "bp"], "high", "pressure trend"],
    ["neuro status", ["harder to arouse", "unequal pupils", "vomiting", "gcs", "new confusion"], "critical", "neuro change"],
    ["urine output", ["oliguria", "decreased urine output", "drop in urine output", "falling urine"], "low", "renal perfusion"],
    ["infection signal", ["fever", "purulent", "wbc", "sepsis"], "high", "infection risk"],
    ["pain signal", ["severe pain", "tenderness", "chest pain", "eye pain"], "high", "unstable symptom cluster"],
  ];

  for (const [label, needles, flag, detail] of phrases) {
    const hit = needles.find((needle) => lower.includes(needle));
    if (hit) {
      diagnostics.push({ label, value: hit, flag, detail });
    }
  }

  const vitalPatterns = [
    ["spO2", /\b(?:SpO2|O2 sat|oxygen saturation)\s*(?:is|=|:)?\s*(\d{2,3}%?)/i, "oxygenation"],
    ["heart rate", /\b(?:heart rate|HR)\s*(?:is|=|:)?\s*(\d{2,3}(?:\/min)?)/i, "rate trend"],
    ["respiratory rate", /\b(?:respiratory rate|RR)\s*(?:is|=|:)?\s*(\d{1,2}(?:\/min)?)/i, "ventilation"],
    ["blood pressure", /\b(?:blood pressure|BP)\s*(?:is|=|:)?\s*(\d{2,3}\/\d{2,3})/i, "pressure trend"],
  ];
  for (const [label, pattern, detail] of vitalPatterns) {
    const match = text.match(pattern);
    if (match) diagnostics.push({ label, value: match[1], flag: inferFlag(label, match[1], lower), detail });
  }

  return uniqueMetric(diagnostics, 6);
}

function buildTimeline(question) {
  const timelineExhibits = (question.exhibits ?? []).filter((exhibit) => exhibit.type === "timeline");
  const fromExhibits = timelineExhibits.flatMap((exhibit) => [
    exhibit.body ? `${exhibit.title}: ${exhibit.body}` : "",
    ...asItems(exhibit.items).map((item) => `${exhibit.title}: ${item}`),
  ]);
  const timePhrases = sentenceSplit([question.scenario, question.additionalInfo, question.stem].filter(Boolean).join(" "))
    .filter((sentence) => /\b(?:hour|minute|day|week|month|yesterday|sudden|abrupt|after|since)\b/i.test(sentence));
  return unique([...fromExhibits, ...timePhrases], 6);
}

function buildChartReview(question) {
  const text = allText(question);
  const noteExhibits = (question.exhibits ?? []).filter((exhibit) => exhibit.type === "note" || exhibit.type === "assessment");
  const hpi = unique([
    question.scenarioTitle,
    question.scenario,
    question.additionalInfo,
    ...noteExhibits.flatMap((exhibit) => [exhibit.body, ...asItems(exhibit.items)]),
    CHART_TYPES.has(question.type) ? question.stem : null,
  ], 6);
  const timeline = buildTimeline(question);
  const labs = extractLabMetrics(text);
  const diagnostics = extractDiagnostics(text);
  const notes = unique([
    ...noteExhibits.flatMap((exhibit) => [exhibit.title, exhibit.body, ...asItems(exhibit.items)]),
    question.additionalInfo,
    question.conceptNotes?.[0],
  ], 6);
  const answerTarget = optionText(question, question.answer);
  const cue = diagnostics[0]
    ? `${diagnostics[0].label}: ${diagnostics[0].value}`
    : labs[0]
      ? `${labs[0].label}: ${labs[0].value}`
      : question.speedCue ?? question.takeaway ?? sentenceSplit(question.rationale)[0] ?? question.stem;
  const pattern = question.diagramBlueprint?.focus ?? question.visualRationale?.caption ?? question.scenarioTitle ?? question.category;

  return {
    patientTitle: question.scenarioTitle ?? question.category ?? "active clinical decision",
    patientCaption: question.scenario ?? question.takeaway ?? "Use the prompt, chart, and answer options together.",
    hpi,
    timeline,
    labs,
    orders: (question.exhibits ?? [])
      .filter((exhibit) => exhibit.type === "orders")
      .flatMap((exhibit) => [exhibit.body, ...asItems(exhibit.items)])
      .filter(Boolean),
    diagnostics,
    notes,
    priorityCues: unique([
      cue,
      question.speedCue,
      question.takeaway,
      question.rationale,
    ], 4),
    diagram: {
      title: question.diagramBlueprint?.title ?? question.visualRationale?.title ?? "rationale pathway",
      nodes: question.visualRationale?.nodes?.length
        ? question.visualRationale.nodes.slice(0, 4)
        : [
          { label: "cue", value: cue },
          { label: "pattern", value: pattern },
          { label: "move", value: answerTarget || "choose the safest response" },
          { label: "next rep", value: question.speedCue ?? question.takeaway ?? "name the unstable clue first" },
        ],
    },
    tutorPrompts: [
      { label: "why this wins", value: `Explain why ${answerTarget || "the correct answer"} is safest.` },
      { label: "miss trap", value: "Show the distractor pattern in one sentence." },
      { label: "next rep", value: question.speedCue ?? question.takeaway ?? "Turn this into a faster bedside cue." },
    ],
  };
}

function hasMeaningfulChartReview(chartReview) {
  return Boolean(
    chartReview
    && (
      chartReview.hpi?.length
      || chartReview.timeline?.length
      || chartReview.labs?.length
      || chartReview.diagnostics?.length
      || chartReview.notes?.length
    ),
  );
}

function summarize(questions) {
  const coverage = {
    total: questions.length,
    chartReview: 0,
    hpi: 0,
    timeline: 0,
    labs: 0,
    orders: 0,
    diagnostics: 0,
    notes: 0,
    diagram: 0,
    tutorPrompts: 0,
  };

  for (const question of questions) {
    const chart = question.chartReview;
    if (hasMeaningfulChartReview(chart)) coverage.chartReview += 1;
    if (chart?.hpi?.length) coverage.hpi += 1;
    if (chart?.timeline?.length) coverage.timeline += 1;
    if (chart?.labs?.length) coverage.labs += 1;
    if (chart?.orders?.length) coverage.orders += 1;
    if (chart?.diagnostics?.length) coverage.diagnostics += 1;
    if (chart?.notes?.length) coverage.notes += 1;
    if (chart?.diagram?.nodes?.length) coverage.diagram += 1;
    if (chart?.tutorPrompts?.length) coverage.tutorPrompts += 1;
  }

  return coverage;
}

const questions = readJson(liveFile, []);
const before = summarize(questions);
const next = questions.map((question) => ({
  ...question,
  chartReview: {
    ...(question.chartReview ?? {}),
    ...buildChartReview(question),
  },
}));
const after = summarize(next);

writeJson(liveFile, next);
writeJson(reportFile, {
  generatedAt: new Date().toISOString(),
  source: path.relative(chapaiRoot, liveFile).replaceAll("\\", "/"),
  policy: "deterministic extraction only; no fabricated labs or active orders",
  before,
  after,
  prioritizedTypes: Array.from(CHART_TYPES),
});

process.stdout.write(`${JSON.stringify({ ok: true, before, after, reportFile: path.relative(chapaiRoot, reportFile).replaceAll("\\", "/") }, null, 2)}\n`);
