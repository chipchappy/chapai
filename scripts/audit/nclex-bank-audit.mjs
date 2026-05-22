#!/usr/bin/env node
/**
 * NCLEX bank audit harness — deterministic, zero-fabrication.
 * Measures the live NCLEX bank against the quality pipeline's checkable stages:
 *   dedup, schema integrity, NGN format integrity, citation verifiability,
 *   enrichment coverage, cognitive level, client-need balance vs NCSBN targets.
 * Does NOT assert clinical accuracy (needs grounded sources + SME) and never
 * writes/fabricates anything — it only reads and reports.
 *
 * Usage: node scripts/audit/nclex-bank-audit.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const BANK = path.join(root, "packages/content/questions/nclex/live/reviewed-curated-live.unique.json");
const OUT = path.join(root, "scripts/audit/nclex-bank-digest.md");

const arr = JSON.parse(fs.readFileSync(BANK, "utf8"));
const N = arr.length;

// NCSBN RN client-need target ranges (2023/2026 test plan).
const NCSBN = {
  "Management of Care": [15, 21],
  "Safety and Infection Control": [10, 16],
  "Health Promotion and Maintenance": [6, 12],
  "Psychosocial Integrity": [6, 12],
  "Basic Care and Comfort": [6, 12],
  "Pharmacological and Parenteral Therapies": [13, 19],
  "Reduction of Risk Potential": [9, 15],
  "Physiological Adaptation": [11, 17],
};

const lc = (s) => (typeof s === "string" ? s : "").toLowerCase();
const norm = (s) => lc(s).replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
const tokenSet = (s) => new Set(norm(s).split(" ").filter((w) => w.length > 2));
function jaccard(a, b) {
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter || 1);
}

const refHasLocator = (r) => {
  const s = typeof r === "string" ? r : JSON.stringify(r || {});
  return /(19|20)\d\d/.test(s) || /\bed(ition|\.)|\bpp?\.|\bvol|https?:\/\/|doi/i.test(s);
};

// ── per-item checks ──
const flags = {
  schema: [], formatIntegrity: [], citationWeak: [], noDiagram: [],
  noDistractorRationale: [], recallLevel: [],
};
const fmtCount = {}, clientNeed = {}, difficulty = {}, cognitive = {};

function schemaOk(q) {
  const req = ["id", "exam", "type", "category", "stem", "options", "answer", "rationale", "deepRationale", "references", "nclexClientNeed", "cognitiveLevel"];
  const missing = req.filter((k) => q[k] == null || (typeof q[k] === "string" && q[k].trim() === "") || (Array.isArray(q[k]) && q[k].length === 0));
  return missing;
}

function formatOk(q) {
  const opts = Array.isArray(q.options) ? q.options : [];
  const ids = new Set(opts.map((o) => o.id));
  switch (q.type) {
    case "mcq":
      if (opts.length < 3) return "mcq: <3 options";
      if (typeof q.answer !== "string" || !ids.has(q.answer)) return "mcq: answer not a valid single option";
      return null;
    case "sata":
      if (!Array.isArray(q.answer) || q.answer.length < 2) return "sata: answer must be 2+ options";
      if (q.answer.some((a) => !ids.has(a))) return "sata: answer references unknown option";
      return null;
    case "ordering":
      if (!Array.isArray(q.answer) || q.answer.length !== opts.length) return "ordering: answer must order all options";
      return null;
    case "matrix":
      if (!Array.isArray(q.matrixColumns) || q.matrixColumns.length < 2) return "matrix: missing/short matrixColumns";
      if (!q.matrixRows && typeof q.answer !== "object") return "matrix: missing rows/answer map";
      return null;
    case "bow_tie":
      // True NGN bow-tie = condition + 2 actions + 2 parameters across answer zones.
      if (typeof q.answer === "string") return "bow_tie: single-answer MCQ shape (not a real bow-tie with answer zones)";
      return null;
    case "case_study":
      // True NGN case study = 6 linked items sharing one scenario.
      if (typeof q.answer === "string") return "case_study: single item (not a 6-item unfolding set)";
      return null;
    default:
      return "unknown type: " + q.type;
  }
}

// aggregate
for (const q of arr) {
  fmtCount[q.type] = (fmtCount[q.type] || 0) + 1;
  const cn = q.nclexClientNeed || "(none)"; clientNeed[cn] = (clientNeed[cn] || 0) + 1;
  const df = q.difficulty ?? "(none)"; difficulty[df] = (difficulty[df] || 0) + 1;
  const cg = q.cognitiveLevel || "(none)"; cognitive[cg] = (cognitive[cg] || 0) + 1;

  const miss = schemaOk(q);
  if (miss.length) flags.schema.push({ id: q.id, miss });
  const fmt = formatOk(q);
  if (fmt) flags.formatIntegrity.push({ id: q.id, type: q.type, issue: fmt });
  const refs = Array.isArray(q.references) ? q.references : [];
  if (!refs.some(refHasLocator)) flags.citationWeak.push(q.id);
  if (!(q.visualRationale || q.diagramBlueprint || q.diagram)) flags.noDiagram.push(q.id);
  if (!(q.distractorRationales && Object.keys(q.distractorRationales).length)) flags.noDistractorRationale.push(q.id);
  if (/recall|knowledge|remember|comprehens/i.test(lc(q.cognitiveLevel))) flags.recallLevel.push(q.id);
}

// ── dedup (token-set Jaccard within category buckets) ──
const buckets = {};
for (let i = 0; i < N; i++) {
  const c = arr[i].category || "(none)";
  (buckets[c] ||= []).push(i);
}
const exactStem = {};
const nearDupPairs = [];
let comparisons = 0;
for (const idxs of Object.values(buckets)) {
  const sets = idxs.map((i) => tokenSet(arr[i].stem));
  for (let a = 0; a < idxs.length; a++) {
    const ns = norm(arr[idxs[a]].stem);
    (exactStem[ns] ||= []).push(arr[idxs[a]].id);
    for (let b = a + 1; b < idxs.length; b++) {
      comparisons++;
      const j = jaccard(sets[a], sets[b]);
      if (j >= 0.85) nearDupPairs.push([arr[idxs[a]].id, arr[idxs[b]].id, +j.toFixed(2)]);
    }
  }
}
const exactDupGroups = Object.values(exactStem).filter((g) => g.length > 1);

// ── report ──
const pct = (n) => ((100 * n) / N).toFixed(1) + "%";
let md = `# NCLEX Bank Audit — baseline digest\n\n`;
md += `Source: \`${path.relative(root, BANK)}\`\n\nTotal live items: **${N}**\n\n`;

md += `## Format mix\n`;
for (const [k, v] of Object.entries(fmtCount).sort((a, b) => b[1] - a[1])) md += `- ${k}: ${v} (${pct(v)})\n`;

md += `\n## NGN format-integrity flags: ${flags.formatIntegrity.length} (${pct(flags.formatIntegrity.length)})\n`;
const byIssue = {};
for (const f of flags.formatIntegrity) byIssue[f.issue] = (byIssue[f.issue] || 0) + 1;
for (const [k, v] of Object.entries(byIssue).sort((a, b) => b[1] - a[1])) md += `- ${v} × ${k}\n`;

md += `\n## Citation verifiability\n`;
md += `- Items with NO locator-bearing citation (no year/edition/page/DOI/URL): **${flags.citationWeak.length}** (${pct(flags.citationWeak.length)})\n`;

md += `\n## Enrichment coverage\n`;
md += `- Missing diagram/visual: ${flags.noDiagram.length} (${pct(flags.noDiagram.length)})\n`;
md += `- Missing per-distractor rationale: ${flags.noDistractorRationale.length} (${pct(flags.noDistractorRationale.length)})\n`;

md += `\n## Schema integrity\n`;
md += `- Items with missing required fields: ${flags.schema.length} (${pct(flags.schema.length)})\n`;

md += `\n## Cognitive level (NCLEX favors apply/analyze)\n`;
for (const [k, v] of Object.entries(cognitive).sort((a, b) => b[1] - a[1])) md += `- ${k}: ${v} (${pct(v)})\n`;
md += `- Flagged recall/comprehension-level: ${flags.recallLevel.length} (${pct(flags.recallLevel.length)})\n`;

md += `\n## Difficulty distribution\n`;
for (const [k, v] of Object.entries(difficulty).sort((a, b) => String(a[0]).localeCompare(String(b[0])))) md += `- ${k}: ${v} (${pct(v)})\n`;

md += `\n## Client-need balance vs NCSBN RN targets\n`;
for (const [cat, [lo, hi]] of Object.entries(NCSBN)) {
  const have = clientNeed[cat] || 0;
  const p = (100 * have) / N;
  const status = p < lo ? "UNDER" : p > hi ? "OVER" : "ok";
  md += `- ${cat}: ${have} (${p.toFixed(1)}%) target ${lo}-${hi}% → ${status}\n`;
}
const unmapped = Object.entries(clientNeed).filter(([k]) => !NCSBN[k]);
if (unmapped.length) {
  md += `- Unmapped/other client-need labels: ${unmapped.map(([k, v]) => `${k}:${v}`).join(", ")}\n`;
}

md += `\n## Duplication\n`;
md += `- Exact normalized-stem duplicate groups: ${exactDupGroups.length} (${exactDupGroups.reduce((s, g) => s + g.length, 0)} items)\n`;
md += `- Near-duplicate pairs (Jaccard ≥ 0.85, within category): ${nearDupPairs.length} (from ${comparisons.toLocaleString()} comparisons)\n`;
if (nearDupPairs.length) md += `  - sample: ${nearDupPairs.slice(0, 5).map((p) => p.join("~")).join(" | ")}\n`;

fs.writeFileSync(OUT, md, "utf8");
process.stdout.write(md);
