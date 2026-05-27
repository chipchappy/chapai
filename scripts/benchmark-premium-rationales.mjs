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
const sampleSize = Number(args.get("sample-size") ?? 50);
const seed = args.get("seed") ?? "p1.6-premium-rationale-benchmark";
const outDir = path.resolve(root, args.get("out-dir") ?? "reports");
const outJson = path.join(outDir, "p1.6-premium-rationale-benchmark.json");
const outMd = path.join(outDir, "p1.6-premium-rationale-benchmark.md");

const boilerplatePattern = /less safe because it delays the immediate nursing priority|does not match the highest-risk cue/i;
const clinicalTerms = [
  "airway", "breathing", "circulation", "perfusion", "oxygenation", "hypoxia", "shock", "sepsis", "lactate",
  "bleeding", "hemorrhage", "coagulation", "anticoagulant", "thrombus", "embolism", "stroke", "ischemia",
  "myocardial", "arrhythmia", "electrolyte", "potassium", "sodium", "glucose", "insulin", "ketones",
  "infection", "neutropenia", "fever", "renal", "fluid", "dehydration", "edema", "seizure", "intracranial",
  "uterine", "fetal", "postpartum", "preeclampsia", "magnesium", "anaphylaxis", "epinephrine", "opioid",
  "naloxone", "sedation", "aspiration", "falls", "delegation", "scope", "sterile", "isolation",
];
const causalTerms = /\b(because|causes|leads to|results in|indicates|reflects|suggests|worsens|prevents|reduces|increases|decreases|impairs|supports|requires)\b/i;
const safetyTerms = /\b(priority|first|immediate|airway|breathing|circulation|unstable|deteriorat|shock|sepsis|bleeding|hemorrhage|hypoxia|safety|risk|escalat|rapid response)\b/i;
const vagueTerms = /\b(may be|could be|generally|usually|less appropriate|not ideal|not the best|consider)\b/i;

function stableHash(value) {
  return crypto.createHash("sha256").update(`${seed}:${value}`).digest("hex");
}

function readQuestions() {
  const files = fs.readdirSync(inputDir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => path.join(inputDir, file));

  const questions = [];
  for (const file of files) {
    const raw = JSON.parse(fs.readFileSync(file, "utf8"));
    const batchQuestions = Array.isArray(raw) ? raw : raw.questions;
    if (!Array.isArray(batchQuestions)) continue;
    for (const question of batchQuestions) {
      if (question?.exam === "nclex") questions.push({ ...question, sourceFile: path.relative(root, file) });
    }
  }
  return questions;
}

function pickSample(questions) {
  const targets = {
    case_study: 10,
    bow_tie: 5,
    matrix: 5,
    sata: 5,
    ordering: 5,
    scenario_mcq: 5,
    decision_map_mcq: 5,
    mcq: 10,
  };
  const sorted = [...questions].sort((a, b) => stableHash(a.id).localeCompare(stableHash(b.id)));
  const sample = [];
  const used = new Set();

  for (const [type, count] of Object.entries(targets)) {
    for (const question of sorted.filter((item) => item.type === type)) {
      if (sample.filter((item) => item.type === type).length >= count) break;
      sample.push(question);
      used.add(question.id);
    }
  }

  for (const question of sorted) {
    if (sample.length >= sampleSize) break;
    if (!used.has(question.id)) sample.push(question);
  }

  return sample.slice(0, sampleSize);
}

function words(text) {
  return String(text ?? "").trim().split(/\s+/).filter(Boolean);
}

function countParagraphs(text) {
  return String(text ?? "").split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean).length;
}

function getCorrectIds(question) {
  if (typeof question.answer === "string") return new Set([question.answer]);
  if (Array.isArray(question.answer)) return new Set(question.answer);
  if (question.answer && typeof question.answer === "object") {
    return new Set(Object.values(question.answer).flat().map(String));
  }
  return new Set();
}

function scoreQuestion(question) {
  const rationaleText = [question.rationale, question.deepRationale, question.takeaway].filter(Boolean).join("\n\n");
  const rationaleWords = words(rationaleText).length;
  const paragraphs = countParagraphs(question.deepRationale ?? question.rationale ?? "");
  const clinicalHits = clinicalTerms.filter((term) => new RegExp(`\\b${term}\\b`, "i").test(rationaleText));
  const resources = Array.isArray(question.references) && question.references.length
    ? question.references.map((ref) => ({
        title: ref.title,
        href: ref.href,
        source: ref.citation ?? ref.title,
        sourceKind: "attached",
      }))
    : getStudyResourcesForQuestion(question).map((resource) => ({
        title: resource.title,
        href: resource.href,
        source: resource.source,
        sourceKind: resource.kind,
      }));

  const correctIds = getCorrectIds(question);
  const options = Array.isArray(question.options) ? question.options : [];
  const wrongOptionIds = options.filter((option) => !correctIds.has(option.id)).map((option) => option.id);
  const distractorRationales = question.distractorRationales ?? {};
  const wrongRationaleStatuses = wrongOptionIds.map((id) => {
    const text = String(distractorRationales[id] ?? "").trim();
    return {
      id,
      words: words(text).length,
      hasBoilerplate: boilerplatePattern.test(text),
      hasClinicalTerm: clinicalTerms.some((term) => new RegExp(`\\b${term}\\b`, "i").test(text)),
      present: Boolean(text),
    };
  });

  const duplicateOptions = new Set(options.map((option) => String(option.text ?? "").trim().toLowerCase())).size < options.length;
  const invalidSingleAnswer = typeof question.answer === "string" && options.length && !options.some((option) => option.id === question.answer);
  const ambiguityFlags = [
    duplicateOptions ? "duplicate option text" : null,
    invalidSingleAnswer ? "answer id not present in options" : null,
    boilerplatePattern.test(rationaleText) ? "boilerplate rationale text" : null,
    rationaleWords < 35 ? "thin rationale under 35 words" : null,
    vagueTerms.test(rationaleText) && clinicalHits.length < 2 ? "vague rationale with weak clinical anchoring" : null,
    wrongRationaleStatuses.some((item) => item.present && item.hasBoilerplate) ? "boilerplate distractor rationale" : null,
    wrongRationaleStatuses.some((item) => !item.present) && wrongOptionIds.length ? "missing distractor rationale" : null,
  ].filter(Boolean);

  const specificity = Math.min(20, Math.round((Math.min(rationaleWords, 140) / 140) * 12) + Math.min(clinicalHits.length, 8));
  const mechanism = causalTerms.test(rationaleText) && clinicalHits.length >= 2 ? 20 : causalTerms.test(rationaleText) ? 12 : clinicalHits.length >= 2 ? 10 : 4;
  const safety = safetyTerms.test(rationaleText) ? 15 : clinicalHits.some((term) => safetyTerms.test(term)) ? 8 : 3;
  const distractorCoverage = wrongOptionIds.length
    ? Math.round((wrongRationaleStatuses.filter((item) => item.present && item.words >= 12 && item.hasClinicalTerm && !item.hasBoilerplate).length / wrongOptionIds.length) * 25)
    : question.type === "bow_tie" ? 18 : 8;
  const citation = resources.length >= 2 ? 15 : resources.length === 1 ? 9 : 0;
  const ambiguity = Math.max(0, 5 - ambiguityFlags.length * 2);
  const total = specificity + mechanism + safety + distractorCoverage + citation + ambiguity;

  return {
    id: question.id,
    type: question.type,
    category: question.category,
    sourceFile: question.sourceFile,
    score: total,
    readiness: total >= 85 && ambiguityFlags.length === 0 ? "premium-ready" : total >= 70 ? "official-style-pass" : "needs-p1.6",
    rationaleWords,
    paragraphs,
    clinicalHits: clinicalHits.slice(0, 8),
    resources: resources.slice(0, 6),
    wrongOptionCount: wrongOptionIds.length,
    distractorCoverage,
    ambiguityFlags,
    gaps: [
      paragraphs < 3 ? "expand to 3-5 paragraphs" : null,
      citation < 15 ? "attach stronger named citations" : null,
      distractorCoverage < 20 && wrongOptionIds.length ? "strengthen why-each-wrong teaching" : null,
      mechanism < 20 ? "name mechanism more explicitly" : null,
      safety < 15 ? "state priority/safety rationale" : null,
    ].filter(Boolean),
  };
}

function pct(n, total) {
  return `${((n / Math.max(total, 1)) * 100).toFixed(1)}%`;
}

fs.mkdirSync(outDir, { recursive: true });
const questions = readQuestions();
const sample = pickSample(questions);
const results = sample.map(scoreQuestion);
const average = results.reduce((sum, item) => sum + item.score, 0) / Math.max(results.length, 1);
const sortedScores = results.map((item) => item.score).sort((a, b) => a - b);
const median = sortedScores[Math.floor(sortedScores.length / 2)] ?? 0;
const readiness = results.reduce((acc, item) => {
  acc[item.readiness] = (acc[item.readiness] ?? 0) + 1;
  return acc;
}, {});
const gapCounts = results.flatMap((item) => item.gaps).reduce((acc, gap) => {
  acc[gap] = (acc[gap] ?? 0) + 1;
  return acc;
}, {});

const payload = {
  generatedAt: new Date().toISOString(),
  inputDir: path.relative(root, inputDir),
  sampleSize: results.length,
  corpusQuestions: questions.length,
  seed,
  scoring: {
    specificity: 20,
    mechanism: 20,
    safetyPriority: 15,
    distractorTeaching: 25,
    citations: 15,
    ambiguity: 5,
  },
  summary: {
    averageScore: Number(average.toFixed(1)),
    medianScore: median,
    readiness,
    gapCounts,
  },
  results,
};

fs.writeFileSync(outJson, `${JSON.stringify(payload, null, 2)}\n`);

const lowest = [...results].sort((a, b) => a.score - b.score).slice(0, 15);
let md = `# P1.6 Premium Rationale Benchmark\n\n`;
md += `Generated: ${payload.generatedAt}\n\n`;
md += `Source: \`${payload.inputDir}\` (${questions.length} NCLEX items scanned, ${results.length} sampled, seed \`${seed}\`).\n\n`;
md += `This is a deterministic benchmark only. It does not certify clinical accuracy; ambiguous or source-sensitive findings still need nursing SME review.\n\n`;
md += `## External Target\n\n`;
md += `- NCSBN/NCLEX target: official test-plan alignment, clinical judgment, item-format fidelity, and safe-priority reasoning.\n`;
md += `- UWorld/Bootcamp-style premium target: detailed correct-answer explanation, why each distractor is wrong, clinical mechanism, visual/source support when useful.\n`;
md += `- Archer-style readiness target: concise NCLEX-like item feel with rationales strong enough to review both correct and incorrect choices.\n`;
md += `- Public reference pages used for the benchmark rubric: https://www.nclex.com/test-plans, https://www.nclex.com/prepare, https://nursing.uworld.com/nclex/free-nclex-exam-practice-questions/, https://nursing.uworld.com/nclex/self-assessment/, https://nurses.archerreview.com/nclex-rn, https://bootcamp.com/nclex.\n\n`;
md += `## Summary\n\n`;
md += `- Average score: ${payload.summary.averageScore}/100\n`;
md += `- Median score: ${payload.summary.medianScore}/100\n`;
for (const [key, value] of Object.entries(readiness)) md += `- ${key}: ${value} (${pct(value, results.length)})\n`;
md += `\n## Main Gaps\n\n`;
for (const [gap, value] of Object.entries(gapCounts).sort((a, b) => b[1] - a[1])) {
  md += `- ${gap}: ${value} (${pct(value, results.length)})\n`;
}
md += `\n## Lowest-Scoring Sample Items\n\n`;
md += `| Score | Item | Type | Category | Main gaps |\n`;
md += `| ---: | --- | --- | --- | --- |\n`;
for (const item of lowest) {
  md += `| ${item.score} | \`${item.id}\` | ${item.type} | ${item.category} | ${item.gaps.join("; ") || "none"} |\n`;
}
md += `\n## P1.6 Build Recommendation\n\n`;
md += `1. Keep the first PR deterministic: attach source candidates from \`getStudyResourcesForQuestion\`, add the structured rationale field, and render citations/why-wrong blocks without paid generation.\n`;
md += `2. Run a 100-200 item pilot expansion only after the deterministic pass reports clean schema and citation coverage.\n`;
md += `3. Escalate only clinical ambiguity or source conflicts to model/SME review; do not use paid model calls for broad citation mapping unless explicitly approved.\n`;

fs.writeFileSync(outMd, md);
console.log(JSON.stringify(payload.summary, null, 2));
console.log(`wrote ${path.relative(root, outJson)}`);
console.log(`wrote ${path.relative(root, outMd)}`);
