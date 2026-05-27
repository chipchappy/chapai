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
const mode = args.get("mode") ?? "pilot";
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
  "antibiotic", "antibiotics", "meningitis", "droplet", "culture", "cultures", "lumbar", "puncture",
  "ventilation", "ventilatory", "respiratory", "vital capacity", "neuromuscular", "weakness", "bradycardia",
  "cord", "umbilical", "compression", "oxytocin", "fundus", "atony", "placenta", "ectopic", "surgical",
  "cortisol", "adrenal", "steroid", "lithium", "toxicity", "diarrhea", "spores", "sporicidal", "contact",
  "transmission", "headache", "post-dural", "fetal heart", "placental", "IVIG", "plasmapheresis",
];

const conditionProfiles = [
  {
    match: /\b(meningitis|nuchal|photophobia|petechiae|droplet|broad-spectrum antibiotics|lumbar puncture)\b/i,
    label: "bacterial meningitis with possible sepsis",
    terms: ["meningitis", "infection", "sepsis", "antibiotics", "droplet"],
    mechanism: "delayed antibiotics or missing droplet isolation can worsen neurologic injury, septic shock, and transmission risk.",
  },
  {
    match: /\b(guillain|ascending weakness|vital capacity|respiratory mechanics|ivig|plasmapheresis)\b/i,
    label: "Guillain-Barre respiratory muscle weakness",
    terms: ["ventilation", "vital capacity", "respiratory", "neuromuscular", "weakness"],
    mechanism: "ascending neuromuscular weakness can impair ventilation, so declining vital capacity signals airway and breathing risk.",
  },
  {
    match: /\b(cord prolapse|visible cord|umbilical|fetal bradycardia|presenting part|knee-chest|trendelenburg)\b/i,
    label: "umbilical cord compression",
    terms: ["cord", "compression", "fetal", "bradycardia", "oxygenation"],
    mechanism: "cord compression reduces fetal perfusion and oxygenation, so relieving pressure and mobilizing emergency birth support come first.",
  },
  {
    match: /\b(postpartum hemorrhage|boggy fundus|fundal massage|uterine atony|oxytocin|lochia)\b/i,
    label: "uterine atony hemorrhage",
    terms: ["postpartum", "hemorrhage", "uterine", "atony", "oxytocin"],
    mechanism: "uterine atony allows continued bleeding, so fundal massage, help, and uterotonic support protect circulation.",
  },
  {
    match: /\b(ectopic|ruptured ectopic|shoulder pain|adnexal|surgical evaluation)\b/i,
    label: "ruptured ectopic pregnancy hemorrhage",
    terms: ["ectopic", "bleeding", "hemorrhage", "perfusion", "surgical"],
    mechanism: "intra-abdominal bleeding threatens perfusion, so urgent surgical evaluation and hemodynamic support outrank teaching.",
  },
  {
    match: /\b(adrenal crisis|cortisol|hydrocortisone|steroid|hypotension|hyperkalemia)\b/i,
    label: "adrenal crisis with shock risk",
    terms: ["adrenal", "cortisol", "steroid", "shock", "fluid"],
    mechanism: "cortisol deficiency can cause refractory hypotension and shock, so steroid replacement and fluids are time-sensitive.",
  },
  {
    match: /\b(lithium|tremor|ataxia|toxicity|renal|dehydration)\b/i,
    label: "lithium toxicity and renal clearance",
    terms: ["lithium", "toxicity", "renal", "fluid", "dehydration"],
    mechanism: "dehydration or reduced renal clearance raises lithium levels, increasing neurologic toxicity and safety risk.",
  },
  {
    match: /\b(c\.?\s*difficile|clostridioides|spores|sporicidal|soap-and-water|profuse diarrhea)\b/i,
    label: "C. difficile spore transmission",
    terms: ["diarrhea", "spores", "sporicidal", "contact", "transmission"],
    mechanism: "C. difficile spores persist in the environment, so contact precautions, soap-and-water hygiene, and sporicidal cleaning interrupt transmission.",
  },
  {
    match: /\b(lumbar puncture|post-dural|upright headache|spinal spaces|cerebrospinal)\b/i,
    label: "post-lumbar-puncture complication monitoring",
    terms: ["lumbar", "puncture", "headache", "post-dural", "safety"],
    mechanism: "a severe positional headache after puncture can reflect cerebrospinal fluid leak and needs assessment instead of routine ambulation or dismissal.",
  },
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

function collectQuestionText(question) {
  return cleanText([
    question.id,
    question.caseStudyId,
    question.scenarioTitle,
    question.category,
    question.subcategory,
    question.nclexClientNeed,
    question.cjmmStep,
    question.stem,
    question.scenario,
    question.rationale,
    question.deepRationale,
    question.takeaway,
    JSON.stringify(question.exhibits ?? []),
    JSON.stringify(question.options ?? []),
    JSON.stringify(question.distractorRationales ?? {}),
  ].filter(Boolean).join(" "));
}

function inferClinicalFocus(question) {
  const haystack = collectQuestionText(question);
  const profile = conditionProfiles.find((entry) => entry.match.test(haystack));
  const hits = clinicalTerms.filter((term) => new RegExp(`\\b${term.replace(/\s+/g, "\\s+")}\\b`, "i").test(haystack));
  const terms = [...new Set([...(profile?.terms ?? []), ...hits])].slice(0, 6);
  const fallbackLabel = titleCase(question.scenarioTitle || question.subcategory || question.category || "clinical priority");
  const label = profile?.label ?? fallbackLabel;
  const mechanism = profile?.mechanism
    ?? `${label} changes patient stability; the nurse should prioritize the cue that protects airway, breathing, circulation, safety, or infection control before routine care.`;
  return {
    label,
    mechanism,
    terms: terms.length ? terms : ["priority", "safety", "perfusion"],
    cue: terms.length ? terms.slice(0, 4).join(", ") : label,
  };
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
  const haystack = collectQuestionText(question);
  return clinicalTerms.filter((term) => new RegExp(`\\b${term.replace(/\s+/g, "\\s+")}\\b`, "i").test(haystack)).slice(0, 5);
}

function hasClinicalTerm(value) {
  return clinicalTerms.some((term) => new RegExp(`\\b${term.replace(/\s+/g, "\\s+")}\\b`, "i").test(value));
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

function buildWhyWrong(question, focus) {
  const source = question.distractorRationales && typeof question.distractorRationales === "object"
    ? question.distractorRationales
    : {};
  const whyWrong = {};

  for (const [key, value] of Object.entries(source)) {
    const rawText = sentence(value);
    const text = sentence(`${rawText} Clinically, this misses ${focus.label}: ${focus.mechanism}`);
    if (words(text).length >= 10) {
      whyWrong[key] = text;
    }
  }

  for (const id of getWrongIds(question)) {
    if (whyWrong[id]) continue;
    const option = question.options.find((item) => item.id === id);
    whyWrong[id] = `Option ${id.toUpperCase()} is weaker because "${cleanText(option?.text)}" does not address ${focus.label}. ${focus.mechanism} The keyed response better protects ${focus.terms.slice(0, 3).join(", ")} in this stem.`;
  }

  return whyWrong;
}

function buildStructuredRationale(question) {
  const focus = inferClinicalFocus(question);
  const topic = titleCase(question.subcategory || question.category);
  const rationale = sentence(question.deepRationale || question.rationale || question.takeaway || "Review the keyed answer against the highest-risk patient cue in the stem");
  const citations = buildCitations(question);
  const studyResources = getStudyResourcesForQuestion(question);
  const resourceNote = studyResources.length
    ? `The attached study resources can reinforce ${studyResources.slice(0, 2).map((item) => item.topic).join(" and ")}.`
    : "Use the attached NCLEX blueprint citation to review the expected clinical-judgment behavior.";

  return {
    overview: sentence(`The safest answer is ${correctOptionText(question)}. ${rationale} The clinical focus is ${focus.label}, so the review should connect the answer to ${focus.terms.slice(0, 4).join(", ")}.`),
    mechanism: sentence(`This item tests ${topic} through ${focus.label}: ${focus.mechanism} These ${focus.cue} cues determine whether the nurse must act now, escalate care, or withhold routine teaching until safety is protected`),
    whyCorrect: sentence(`${correctOptionText(question)} is correct because it directly addresses ${focus.label}. ${focus.mechanism} ${resourceNote}`),
    whyWrong: buildWhyWrong(question, focus),
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

function enrichQuestion(question, file, { includeSourcePath = false } = {}) {
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
    ...(includeSourcePath ? { sourcePath: file } : {}),
  };
}

function writePilot() {
  const allQuestions = readQuestions();
  const pilotEntries = pickPilot(allQuestions);
  const pilotQuestions = pilotEntries.map(({ question, file }) =>
    enrichQuestion(question, file, { includeSourcePath: true }),
  );

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
}

function writeFullBank() {
  const files = fs.readdirSync(inputDir)
    .filter((file) => file.endsWith(".json"))
    .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));
  const byType = {};
  let itemCount = 0;
  let errorCount = 0;

  fs.mkdirSync(outputDir, { recursive: true });

  for (const file of files) {
    const sourcePath = path.join(inputDir, file);
    const payload = JSON.parse(fs.readFileSync(sourcePath, "utf8").replace(/^\uFEFF/, ""));
    const originalQuestions = Array.isArray(payload) ? payload : payload.questions;
    if (!Array.isArray(originalQuestions)) continue;
    const outputQuestions = originalQuestions.map((question) => {
      if (question?.exam !== "nclex") return question;
      const enriched = enrichQuestion(question, path.relative(root, sourcePath));
      const errors = validateStructuredRationale(enriched);
      if (errors.length) errorCount += errors.length;
      byType[enriched.type] = (byType[enriched.type] ?? 0) + 1;
      itemCount += 1;
      return enriched;
    });
    const outputPayload = Array.isArray(payload)
      ? outputQuestions
      : {
          ...payload,
          generatedBy: {
            ...(payload.generatedBy ?? {}),
            structuredRationaleBackfill: {
              agentId: "codex",
              runtime: "deterministic",
              promptSource: "scripts/generate-structured-rationale-pilot.mjs",
            },
          },
          questions: outputQuestions,
        };
    fs.writeFileSync(path.join(outputDir, file), `${JSON.stringify(outputPayload, null, 2)}\n`);
  }

  const fullReportFile = path.join(root, "reports", "p1.6-structured-rationale-full-bank.md");
  let report = `# P1.6 Structured Rationale Full-Bank Backfill\n\n`;
  report += `Generated: ${new Date().toISOString()}\n\n`;
  report += `Input: \`${path.relative(root, inputDir)}\`\n\n`;
  report += `Output: \`${path.relative(root, outputDir)}\`\n\n`;
  report += `Files: ${files.length}\n\n`;
  report += `NCLEX items: ${itemCount}\n\n`;
  report += `Validation issues: ${errorCount}\n\n`;
  report += `## Type Mix\n\n`;
  for (const [type, count] of Object.entries(byType).sort()) {
    report += `- ${type}: ${count}\n`;
  }
  report += `\n## Guardrails\n\n`;
  report += `- No model calls.\n`;
  report += `- No in-place bank edits; source directory is left untouched.\n`;
  report += `- Output is a parallel generated bank and must be spot-checked before production sync.\n`;
  fs.writeFileSync(fullReportFile, report);

  console.log(JSON.stringify({ outputDir: path.relative(root, outputDir), reportFile: path.relative(root, fullReportFile), files: files.length, items: itemCount, validationIssues: errorCount, byType }, null, 2));
  if (errorCount) {
    throw new Error(`Full-bank structured rationale validation failed for ${errorCount} checks`);
  }
}

if (mode === "full") {
  writeFullBank();
} else {
  writePilot();
}
