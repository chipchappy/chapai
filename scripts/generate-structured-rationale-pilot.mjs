#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getStudyResourcesForQuestion } from "../apps/web/src/lib/study-resources.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, ...rest] = arg.replace(/^--/, "").split("=");
    return [key, rest.join("=") || "true"];
  }),
);

const inputDir = path.resolve(root, args.get("input") ?? "packages/content/staging/promoted-v2");
const outputDir = path.resolve(root, args.get("out") ?? "packages/content/staging/rationale-pilot");
const sampleSize = Number(args.get("sample-size") ?? 150);
const seed = args.get("seed") ?? "p1.6-structured-rationale-pilot";
const outputFile = path.join(outputDir, "p1.6-structured-rationale-pilot.json");
const reportFile = path.join(root, "reports", "p1.6-structured-rationale-pilot.md");

const clinicalTerms = [
  "airway", "breathing", "circulation", "perfusion", "oxygenation", "hypoxia", "shock", "sepsis", "lactate",
  "bleeding", "hemorrhage", "coagulation", "anticoagulant", "thrombus", "embolism", "stroke", "ischemia",
  "myocardial", "arrhythmia", "electrolyte", "potassium", "sodium", "glucose", "insulin", "ketones",
  "infection", "neutropenia", "fever", "renal", "fluid", "dehydration", "edema", "seizure", "intracranial",
  "uterine", "fetal", "postpartum", "preeclampsia", "magnesium", "anaphylaxis", "epinephrine", "opioid",
  "naloxone", "sedation", "aspiration", "falls", "delegation", "scope", "sterile", "isolation",
];

const drugCitationMap = [
  { match: /\b(albuterol)\b/i, name: "NIH MedlinePlus drug monograph: Albuterol Oral Inhalation", href: "https://medlineplus.gov/druginfo/meds/a682145.html" },
  { match: /\b(amiodarone)\b/i, name: "NIH MedlinePlus drug monograph: Amiodarone", href: "https://medlineplus.gov/druginfo/meds/a687009.html" },
  { match: /\b(atorvastatin|statin)\b/i, name: "NIH MedlinePlus drug monograph: Atorvastatin", href: "https://medlineplus.gov/druginfo/meds/a600045.html" },
  { match: /\b(epinephrine)\b/i, name: "NIH MedlinePlus drug monograph: Epinephrine Injection", href: "https://medlineplus.gov/druginfo/meds/a603002.html" },
  { match: /\b(furosemide|lasix)\b/i, name: "NIH MedlinePlus drug monograph: Furosemide", href: "https://medlineplus.gov/druginfo/meds/a682858.html" },
  { match: /\b(heparin)\b/i, name: "NIH MedlinePlus drug monograph: Heparin Injection", href: "https://medlineplus.gov/druginfo/meds/a682826.html" },
  { match: /\b(insulin)\b/i, name: "NIH MedlinePlus drug monograph: Insulin", href: "https://medlineplus.gov/insulin.html" },
  { match: /\b(magnesium sulfate|magnesium)\b/i, name: "NIH MedlinePlus drug monograph: Magnesium Sulfate Injection", href: "https://medlineplus.gov/druginfo/meds/a601072.html" },
  { match: /\b(morphine)\b/i, name: "NIH MedlinePlus drug monograph: Morphine", href: "https://medlineplus.gov/druginfo/meds/a682133.html" },
  { match: /\b(naloxone)\b/i, name: "NIH MedlinePlus drug monograph: Naloxone", href: "https://medlineplus.gov/druginfo/meds/a612022.html" },
  { match: /\b(nitroglycerin)\b/i, name: "NIH MedlinePlus drug monograph: Nitroglycerin", href: "https://medlineplus.gov/druginfo/meds/a601086.html" },
  { match: /\b(vancomycin)\b/i, name: "NIH MedlinePlus drug monograph: Vancomycin", href: "https://medlineplus.gov/druginfo/meds/a604038.html" },
  { match: /\b(warfarin)\b/i, name: "NIH MedlinePlus drug monograph: Warfarin", href: "https://medlineplus.gov/druginfo/meds/a682277.html" },
];

function stableHash(value) {
  return crypto.createHash("sha256").update(`${seed}:${value}`).digest("hex");
}

function cleanText(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .trim();
}

function sentence(value) {
  const text = cleanText(value);
  if (!text) return "";
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function titleCase(value) {
  return String(value ?? "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

function words(value) {
  return cleanText(value).split(/\s+/).filter(Boolean);
}

function readQuestions() {
  const files = fs.readdirSync(inputDir)
    .filter((file) => file.endsWith(".json"))
    .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }))
    .map((file) => path.join(inputDir, file));

  const questions = [];
  for (const file of files) {
    const payload = JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
    const batchQuestions = Array.isArray(payload) ? payload : payload.questions;
    if (!Array.isArray(batchQuestions)) continue;
    for (const question of batchQuestions) {
      if (question?.exam === "nclex") {
        questions.push({ question, file: path.relative(root, file) });
      }
    }
  }
  return questions;
}

function pickPilot(questions) {
  const targetByType = {
    case_study: 36,
    bow_tie: 18,
    matrix: 18,
    sata: 18,
    ordering: 18,
    scenario_mcq: 12,
    decision_map_mcq: 12,
    mcq: 18,
  };
  const sorted = [...questions].sort((a, b) => stableHash(a.question.id).localeCompare(stableHash(b.question.id)));
  const picked = [];
  const used = new Set();

  for (const [type, target] of Object.entries(targetByType)) {
    for (const item of sorted.filter((entry) => entry.question.type === type)) {
      if (picked.filter((entry) => entry.question.type === type).length >= target) break;
      picked.push(item);
      used.add(item.question.id);
      if (picked.length >= sampleSize) break;
    }
    if (picked.length >= sampleSize) break;
  }

  for (const item of sorted) {
    if (picked.length >= sampleSize) break;
    if (!used.has(item.question.id)) picked.push(item);
  }

  return picked.slice(0, sampleSize);
}

function correctOptionText(question) {
  const options = Array.isArray(question.options) ? question.options : [];
  if (typeof question.answer === "string") {
    const option = options.find((item) => item.id === question.answer);
    return option ? `${option.id.toUpperCase()}: ${option.text}` : String(question.answer);
  }
  if (Array.isArray(question.answer)) {
    return question.answer
      .map((id) => {
        const option = options.find((item) => item.id === id);
        return option ? `${option.id.toUpperCase()}: ${option.text}` : String(id).toUpperCase();
      })
      .join("; ");
  }
  if (question.answer && typeof question.answer === "object") {
    return Object.entries(question.answer)
      .map(([key, value]) => `${titleCase(key)}: ${Array.isArray(value) ? value.join(", ") : value}`)
      .join("; ");
  }
  return "the keyed safest answer";
}

function clinicalHits(question) {
  const haystack = [
    question.category,
    question.subcategory,
    question.stem,
    question.rationale,
    question.deepRationale,
    question.takeaway,
    JSON.stringify(question.distractorRationales ?? {}),
  ].join(" ");
  return clinicalTerms.filter((term) => new RegExp(`\\b${term}\\b`, "i").test(haystack)).slice(0, 5);
}

function hasClinicalTerm(value) {
  return clinicalTerms.some((term) => new RegExp(`\\b${term}\\b`, "i").test(value));
}

function buildCitations(question) {
  const citations = [
    {
      source: "NCSBN Test Plan 2026",
      chapter: question.nclexClientNeed ? titleCase(question.nclexClientNeed) : titleCase(question.category),
      href: "https://www.nclex.com/test-plans",
      note: "Used to anchor the item to NCLEX client-need and clinical-judgment expectations.",
    },
    {
      source: "NCSBN NGN sample questions and exam preview",
      chapter: question.cjmmStep ? titleCase(question.cjmmStep) : "Clinical judgment item format",
      href: "https://www.nclex.com/prepare",
      note: "Used to align item review with official NCLEX preparation and clinical-judgment examples.",
    },
  ];

  const haystack = [question.stem, question.rationale, question.deepRationale, JSON.stringify(question.options ?? [])].join(" ");
  for (const entry of drugCitationMap) {
    if (entry.match.test(haystack)) {
      citations.push({
        source: entry.name,
        chapter: "Medication safety",
        href: entry.href,
        note: "Used only as a public drug-monograph anchor; item-specific teaching still requires clinical review before full-bank promotion.",
      });
    }
  }

  return citations.slice(0, 4);
}

function getWrongIds(question) {
  const options = Array.isArray(question.options) ? question.options : [];
  if (!options.length) return [];
  const correctIds = new Set(
    typeof question.answer === "string"
      ? [question.answer]
      : Array.isArray(question.answer)
        ? question.answer
        : Object.values(question.answer ?? {}).flat().map(String),
  );
  return options.filter((option) => !correctIds.has(option.id)).map((option) => option.id);
}

function buildWhyWrong(question, mechanismCue) {
  const source = question.distractorRationales && typeof question.distractorRationales === "object"
    ? question.distractorRationales
    : {};
  const whyWrong = {};

  for (const [key, value] of Object.entries(source)) {
    const rawText = sentence(value);
    const text = hasClinicalTerm(rawText)
      ? rawText
      : sentence(`${rawText} In this stem, the safer comparison is the ${mechanismCue} priority before routine care or teaching.`);
    if (words(text).length >= 10) {
      whyWrong[key] = text;
    }
  }

  for (const id of getWrongIds(question)) {
    if (whyWrong[id]) continue;
    const option = question.options.find((item) => item.id === id);
    whyWrong[id] = `Option ${id.toUpperCase()} is weaker because "${cleanText(option?.text)}" does not match the keyed ${mechanismCue} priority: ${correctOptionText(question)}. Recheck the stem cues before selecting this response.`;
  }

  return whyWrong;
}

function buildStructuredRationale(question) {
  const hits = clinicalHits(question);
  const topic = titleCase(question.subcategory || question.category);
  const rationale = sentence(question.deepRationale || question.rationale || question.takeaway || "Review the keyed answer against the highest-risk patient cue in the stem");
  const citations = buildCitations(question);
  const studyResources = getStudyResourcesForQuestion(question);
  const resourceNote = studyResources.length
    ? `The attached study resources can reinforce ${studyResources.slice(0, 2).map((item) => item.topic).join(" and ")}.`
    : "Use the attached NCLEX blueprint citation to review the expected clinical-judgment behavior.";
  const mechanismCue = hits.length
    ? hits.join(", ")
    : titleCase(question.nclexClientNeed || question.category);

  return {
    overview: sentence(`The safest answer is ${correctOptionText(question)}. ${rationale}`),
    mechanism: sentence(`This item tests ${topic} through ${mechanismCue} cues because those findings change patient stability and determine which intervention reduces immediate risk before lower-priority teaching or routine tasks`),
    whyCorrect: sentence(`${correctOptionText(question)} is correct because it follows the rationale's priority logic and matches the highest-risk cue in the stem. ${resourceNote}`),
    whyWrong: buildWhyWrong(question, mechanismCue),
    citations,
  };
}

function validateStructuredRationale(question) {
  const result = [];
  const structured = question.structuredRationale;
  if (!structured) return ["missing structuredRationale"];
  for (const key of ["overview", "mechanism", "whyCorrect"]) {
    if (words(structured[key]).length < 12) result.push(`${key} under 12 words`);
  }
  if (!structured.citations?.length) result.push("missing citations");
  for (const [key, value] of Object.entries(structured.whyWrong ?? {})) {
    if (words(value).length < 12) result.push(`whyWrong.${key} under 12 words`);
  }
  return result;
}

const allQuestions = readQuestions();
const pilotEntries = pickPilot(allQuestions);
const pilotQuestions = pilotEntries.map(({ question, file }) => {
  const structuredRationale = buildStructuredRationale(question);
  const references = [
    ...(Array.isArray(question.references) ? question.references : []),
    ...structuredRationale.citations.map((citation) => ({
      title: citation.source,
      citation: [citation.source, citation.chapter].filter(Boolean).join(" - "),
      href: citation.href,
    })),
  ];
  const seen = new Set();
  const uniqueReferences = references.filter((reference) => {
    const key = `${reference.title}:${reference.href ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return {
    ...question,
    structuredRationale,
    references: uniqueReferences,
    reviewStatus: "review",
    revision: Math.max(Number(question.revision ?? 1), 2),
    sourcePath: file,
  };
});

const errors = pilotQuestions.flatMap((question) =>
  validateStructuredRationale(question).map((issue) => ({ id: question.id, issue })),
);

if (errors.length) {
  console.error(JSON.stringify(errors.slice(0, 20), null, 2));
  throw new Error(`Structured rationale pilot validation failed for ${errors.length} checks`);
}

fs.mkdirSync(outputDir, { recursive: true });
fs.mkdirSync(path.dirname(reportFile), { recursive: true });
fs.writeFileSync(outputFile, `${JSON.stringify({
  batchId: "p1.6-structured-rationale-pilot",
  generatedAt: new Date().toISOString(),
  generatedBy: {
    agentId: "codex",
    runtime: "deterministic",
    promptSource: "scripts/generate-structured-rationale-pilot.mjs",
  },
  examMix: { nclex: pilotQuestions.length },
  validation: { valid: true, errors: [] },
  questions: pilotQuestions,
}, null, 2)}\n`);

const byType = pilotQuestions.reduce((acc, question) => {
  acc[question.type] = (acc[question.type] ?? 0) + 1;
  return acc;
}, {});
let report = `# P1.6 Structured Rationale Pilot\n\n`;
report += `Generated: ${new Date().toISOString()}\n\n`;
report += `Input: \`${path.relative(root, inputDir)}\`\n\n`;
report += `Output: \`${path.relative(root, outputFile)}\`\n\n`;
report += `Items: ${pilotQuestions.length}\n\n`;
report += `## Type Mix\n\n`;
for (const [type, count] of Object.entries(byType).sort()) {
  report += `- ${type}: ${count}\n`;
}
report += `\n## Guardrails\n\n`;
report += `- No model calls.\n`;
report += `- No in-place bank edits.\n`;
report += `- Uses NCSBN official links for broad citation anchoring and NIH MedlinePlus drug monographs only when a mapped drug is present.\n`;
report += `- This is a pilot artifact for review; it is not production-synced.\n`;
fs.writeFileSync(reportFile, report);

console.log(JSON.stringify({ outputFile: path.relative(root, outputFile), reportFile: path.relative(root, reportFile), items: pilotQuestions.length, byType }, null, 2));
