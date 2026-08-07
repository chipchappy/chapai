#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Bank-wide content quality + clinical consistency audit.
//
// `lib/question-quality.ts` already scores questions, but it does so in memory at
// selection time — so nothing could answer "how many questions are weak?" or
// "which ones do we fix first?". This runs the same dimensions across the whole
// published bank and writes a remediation queue.
//
// It is READ-ONLY. It never edits, unpublishes, or quarantines anything: content
// gets flagged for a human, because a false positive that silently removes a
// good question is worse than a flag someone dismisses in five seconds.
//
//   node scripts/audit-content-quality.mjs [--limit N] [--out reports/x.json]
//
// Requires wrangler auth (stored OAuth, not cftoken.txt — that is deploy-scoped).
// ─────────────────────────────────────────────────────────────────────────────
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const WRANGLER = resolve(ROOT, "node_modules/wrangler/bin/wrangler.js");
const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const LIMIT = Number(flag("limit", "20000"));
const OUT = resolve(ROOT, flag("out", "reports/content-quality-audit.json"));

function d1(sql) {
  const env = { ...process.env };
  delete env.CLOUDFLARE_API_TOKEN;   // deploy-scoped; D1 rejects it
  delete env.CLOUDFLARE_ACCOUNT_ID;
  // Newlines inside the --command argument get mangled on Windows and the API
  // rejects the resulting request; keep the statement on one line.
  const flat = sql.replace(/\s+/g, " ").trim();
  const raw = execFileSync(process.execPath, [
    WRANGLER, "d1", "execute", "chapai-prod", "--remote", "--json", "--command", flat,
  ], { cwd: resolve(ROOT, "apps/web"), env, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  const start = raw.indexOf("[");
  return JSON.parse(raw.slice(start))[0]?.results ?? [];
}

const json = (value, fallback) => {
  if (!value) return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
};
const text = (value) => String(value ?? "").trim();
const words = (value) => (text(value).match(/\b[\w'-]+\b/g) ?? []).length;

// ── quality dimensions ──────────────────────────────────────────────────────
// Mirrors lib/question-quality.ts and adds the two dimensions the brief asked
// for that the runtime scorer does not currently model: NGN richness and
// difficulty quality.
function scoreQuestion(row) {
  const rationale = text(row.deep_rationale) || text(row.rationale);
  const rWords = words(rationale);
  const options = json(row.options, []);
  const distractors = json(row.distractor_rationales, null);
  const structured = json(row.structured_rationale, null);
  const references = json(row.references_json, null);
  const risks = [];
  let score = 0;

  // validation status
  if (row.review_status === "final-curated-live") score += 25;
  else if (row.review_status === "curated-live") score += 14;
  else if (row.review_status === "approved") score += 6;

  // rationale depth
  if (rWords >= 140) score += 20;
  else if (rWords >= 90) score += 16;
  else if (rWords >= 55) score += 11;
  else if (rWords >= 30) score += 6;
  if (rWords < 20) { risks.push("weak-rationale"); score -= 20; }
  if (/^(see (above|rationale)|n\/a|tbd|placeholder)/i.test(rationale)) { risks.push("placeholder-rationale"); score -= 30; }

  // structured teaching
  const hasStructured = Boolean(structured?.overview && structured?.mechanism && structured?.whyCorrect);
  if (hasStructured) score += 20;

  // distractor coverage
  const optionCount = Array.isArray(options) ? options.length : 0;
  const distractorCount = Array.isArray(distractors)
    ? distractors.length
    : distractors && typeof distractors === "object" ? Object.keys(distractors).length : 0;
  const needed = Math.max(0, optionCount - 1);
  const coverage = needed > 0 ? Math.min(1, distractorCount / needed) : 1;
  score += Math.round(coverage * 15);
  if (coverage < 0.66 && optionCount >= 3) risks.push("incomplete-distractor-teaching");

  // citations + visuals
  const hasRefs = (Array.isArray(references) ? references.length : 0) > 0;
  if (hasRefs) score += 10; else risks.push("uncited");
  if (text(row.visual_rationale)) score += 5;

  // NGN richness — a format is only "rich" if it carries the chart context that
  // makes it worth the interaction.
  const type = String(row.type ?? "mcq");
  const ngnFormat = ["matrix", "bow_tie", "ordering", "sata", "case_study"].includes(type);
  const hasChart = Boolean(text(row.scenario) || text(row.chart_review) || text(row.exhibits) || text(row.additional_info));
  if (ngnFormat && hasChart) score += 8;
  else if (ngnFormat && !hasChart) { risks.push("ngn-format-without-chart-context"); score -= 6; }

  // case shape without case content
  if ((row.case_study_id || type === "case_study") && !hasChart) {
    risks.push("incomplete-case-context");
    score -= 20;
  }

  // difficulty quality — an unset difficulty cannot be blueprinted or targeted.
  if (row.difficulty == null || row.difficulty === "") risks.push("no-difficulty");
  else score += 3;

  const normalized = Math.max(0, Math.min(100, score));
  const tier = risks.includes("placeholder-rationale") ? 4
    : normalized >= 78 ? 0
    : normalized >= 62 ? 1
    : normalized >= 44 ? 2
    : normalized >= 28 ? 3
    : 4;

  return { score: normalized, tier, rationaleWords: rWords, coverage, risks };
}

// ── clinical consistency checks ─────────────────────────────────────────────
// Deliberately conservative. Each rule targets a contradiction that is nearly
// always an authoring error, and each flags for review rather than acting.
const ALLERGY_CLASS = [
  { allergy: /\bpenicillin\b/i, conflict: /\b(amoxicillin|ampicillin|piperacillin|nafcillin|penicillin)\b/i, label: "penicillin-allergy-vs-penicillin-class" },
  { allergy: /\bsulfa\b|\bsulfonamide\b/i, conflict: /\b(sulfamethoxazole|bactrim|trimethoprim-sulfamethoxazole|furosemide)\b/i, label: "sulfa-allergy-vs-sulfonamide" },
  { allergy: /\bnsaid\b|\baspirin\b/i, conflict: /\b(ibuprofen|ketorolac|naproxen|indomethacin)\b/i, label: "nsaid-allergy-vs-nsaid" },
  { allergy: /\bcephalosporin\b/i, conflict: /\b(cefazolin|ceftriaxone|cefepime|cephalexin)\b/i, label: "cephalosporin-allergy-vs-cephalosporin" },
];

// Physiologic bounds. Outside these a value is almost certainly a typo rather
// than a deliberately extreme teaching case.
const VITAL_BOUNDS = [
  { re: /\bHR\s*(?:of\s*)?(\d{1,3})\b/gi, min: 20, max: 240, label: "implausible-heart-rate" },
  { re: /\bRR\s*(?:of\s*)?(\d{1,3})\b/gi, min: 4, max: 60, label: "implausible-respiratory-rate" },
  { re: /\bSpO2\s*(?:of\s*)?(\d{1,3})\s*%/gi, min: 40, max: 100, label: "implausible-spo2" },
  { re: /\btemperature\s*(?:of\s*)?(\d{2,3}(?:\.\d)?)\s*°?\s*C\b/gi, min: 28, max: 43, label: "implausible-temp-c" },
  { re: /\bpotassium\s*(?:of\s*)?(\d(?:\.\d)?)\b/gi, min: 1.5, max: 9, label: "implausible-potassium" },
  { re: /\bpH\s*(?:of\s*)?(\d(?:\.\d{1,2})?)\b/gi, min: 6.6, max: 7.8, label: "implausible-ph" },
];

function checkConsistency(row) {
  const flags = [];
  const blob = [row.stem, row.scenario, row.additional_info, row.chart_review, row.exhibits]
    .map(text).filter(Boolean).join("\n");
  if (!blob) return flags;

  // Allergy vs administered/indicated drug.
  //
  // A deliberate conflict is a legitimate — and common — teaching device: the
  // student is meant to catch the unsafe order. Flagging those as defects buries
  // the real errors in noise, so items whose whole point is catching the conflict
  // are excluded. Verified against a real flagged item (a chain-of-command
  // question ordering ampicillin for a penicillin-anaphylaxis patient).
  const intentionalConflict = /chain of command|unsafe order|question the order|clarif|hold the (?:dose|medication)|contraindicat|should the nurse (?:administer|give)|medication error|verify the allergy|advocat/i
    .test(`${blob} ${text(row.category)}`);
  const allergyLine = /allerg(?:y|ies)\s*[:\-]?\s*([^\n.;]{0,120})/i.exec(blob)?.[1] ?? "";
  if (!intentionalConflict && allergyLine && !/\bnkda\b|no known/i.test(allergyLine)) {
    for (const rule of ALLERGY_CLASS) {
      if (rule.allergy.test(allergyLine) && rule.conflict.test(blob)) flags.push(rule.label);
    }
  }

  // physiologic plausibility
  for (const bound of VITAL_BOUNDS) {
    bound.re.lastIndex = 0;
    let match;
    while ((match = bound.re.exec(blob))) {
      const value = Number(match[1]);
      if (Number.isFinite(value) && (value < bound.min || value > bound.max)) {
        flags.push(`${bound.label}:${match[1]}`);
        break;
      }
    }
  }

  // contradictory ages within one item
  const ages = [...blob.matchAll(/\b(\d{1,3})[-\s]?year[-\s]?old\b/gi)].map((m) => Number(m[1]));
  if (new Set(ages).size > 1) flags.push(`contradictory-age:${[...new Set(ages)].join("/")}`);

  // adult bank containing a paediatric age
  if (ages.some((age) => age < 12)) flags.push(`pediatric-age-in-adult-bank:${Math.min(...ages)}`);

  // answer/rationale mismatch: the stated correct option text should appear in
  // the rationale somewhere. Only checked when the answer is prose, not a letter.
  const answer = text(row.answer);
  const rationale = text(row.deep_rationale) || text(row.rationale);
  if (answer.length > 12 && rationale.length > 40) {
    const key = answer.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(/\s+/).filter((w) => w.length > 4).slice(0, 3);
    if (key.length >= 2 && !key.some((w) => rationale.toLowerCase().includes(w))) {
      flags.push("answer-not-discussed-in-rationale");
    }
  }

  // options that duplicate each other
  const options = json(row.options, []);
  if (Array.isArray(options) && options.length > 1) {
    const norm = options.map((o) => text(typeof o === "string" ? o : o?.text ?? o?.label).toLowerCase());
    if (new Set(norm.filter(Boolean)).size < norm.filter(Boolean).length) flags.push("duplicate-options");
  }

  return flags;
}

// ── run ─────────────────────────────────────────────────────────────────────
console.log("Reading published bank from chapai-prod (read-only)…");
const rows = d1(`SELECT id, type, category, difficulty, review_status, stem, options, answer,
  rationale, deep_rationale, distractor_rationales, structured_rationale, references_json,
  visual_rationale, scenario, additional_info, chart_review, exhibits, case_study_id
  FROM questions WHERE publish_state='published' LIMIT ${LIMIT}`);
console.log(`Scoring ${rows.length} questions…`);

const tiers = [0, 0, 0, 0, 0];
const riskCounts = new Map();
const flagCounts = new Map();
const remediation = [];
const consistency = [];

for (const row of rows) {
  const quality = scoreQuestion(row);
  tiers[quality.tier] += 1;
  for (const risk of quality.risks) riskCounts.set(risk, (riskCounts.get(risk) ?? 0) + 1);

  if (quality.tier >= 3) {
    remediation.push({ id: row.id, type: row.type, category: row.category, score: quality.score, tier: quality.tier, rationaleWords: quality.rationaleWords, risks: quality.risks });
  }

  const flags = checkConsistency(row);
  if (flags.length) {
    for (const f of flags) flagCounts.set(f.split(":")[0], (flagCounts.get(f.split(":")[0]) ?? 0) + 1);
    consistency.push({ id: row.id, type: row.type, category: row.category, flags });
  }
}

// Worst first — this is the fix-order.
remediation.sort((a, b) => a.score - b.score);

const summary = {
  generatedAt: new Date().toISOString(),
  scanned: rows.length,
  tiers: { premium: tiers[0], strong: tiers[1], acceptable: tiers[2], weak: tiers[3], unusable: tiers[4] },
  premiumPoolPercent: Math.round(((tiers[0] + tiers[1]) / Math.max(1, rows.length)) * 100),
  qualityRisks: Object.fromEntries([...riskCounts.entries()].sort((a, b) => b[1] - a[1])),
  consistencyFlagged: consistency.length,
  consistencyFlags: Object.fromEntries([...flagCounts.entries()].sort((a, b) => b[1] - a[1])),
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify({ summary, remediationQueue: remediation.slice(0, 2000), consistencyQueue: consistency.slice(0, 2000) }, null, 2));

console.log("\n── Quality tiers ─────────────────────────────");
console.log(`  premium (0)    ${tiers[0]}`);
console.log(`  strong  (1)    ${tiers[1]}`);
console.log(`  acceptable (2) ${tiers[2]}`);
console.log(`  weak    (3)    ${tiers[3]}`);
console.log(`  unusable(4)    ${tiers[4]}`);
console.log(`  premium pool   ${summary.premiumPoolPercent}% of published`);
console.log("\n── Top quality risks ─────────────────────────");
for (const [risk, n] of [...riskCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)) console.log(`  ${String(n).padStart(6)}  ${risk}`);
console.log("\n── Clinical consistency flags ────────────────");
if (!flagCounts.size) console.log("  none");
for (const [f, n] of [...flagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)) console.log(`  ${String(n).padStart(6)}  ${f}`);
console.log(`\nWrote ${OUT}`);
console.log(`Remediation queue: ${remediation.length} questions at tier 3+ (worst first).`);
