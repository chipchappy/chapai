#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Apply staged case-study charts to D1.
//
// Reads packages/content/staging/case-study-charts.jsonl, re-runs the SAME gate
// the generator used, and writes chart_review only for entries that pass.
// Anything failing the gate is reported and skipped, never written.
//
//   node scripts/apply-case-study-charts.mjs --dry-run     # always run first
//   node scripts/apply-case-study-charts.mjs --limit 25    # small batch
//   node scripts/apply-case-study-charts.mjs
//
// Only column touched: chart_review, only on type='case_study'.
// Every applied id lands in reports/case-study-charts-applied.json so the
// change is revertible.
//
// DASHES: the timed-note check matches em dash / en dash / hyphen via \u
// escapes, never literal characters. A literal here was already corrupted once
// by an encoding round-trip, which silently failed every entry and presented as
// a "Unicode bug" when it was really an escaping bug.
// ---------------------------------------------------------------------------
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const WRANGLER = resolve(ROOT, "node_modules/wrangler/bin/wrangler.js");
const args = process.argv.slice(2);
const flagValue = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const DRY = args.includes("--dry-run");
const STAGING = resolve(ROOT, flagValue("staging", "packages/content/staging/case-study-charts.jsonl"));
const REPORT = resolve(ROOT, flagValue("report", "reports/case-study-charts-applied.json"));
const BATCH = Number(flagValue("batch", "60"));
const LIMIT = Number(flagValue("limit", "0"));

function d1(sql) {
  const env = { ...process.env };
  delete env.CLOUDFLARE_API_TOKEN;   // deploy-scoped; D1 rejects it with 7403
  delete env.CLOUDFLARE_ACCOUNT_ID;
  const raw = execFileSync(process.execPath, [
    WRANGLER, "d1", "execute", "chapai-prod", "--remote", "--json", "--command", sql.replace(/\s+/g, " ").trim(),
  ], { cwd: resolve(ROOT, "apps/web"), env, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  return JSON.parse(raw.slice(raw.indexOf("[")))[0];
}

// ---- gate (identical contract to the generator) ---------------------------
const norm = (v) => String(v ?? "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
const contentWords = (arr) => new Set(
  (Array.isArray(arr) ? arr : []).flatMap((s) => norm(s).split(" ")).filter((w) => w.length > 4),
);
function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const w of a) if (b.has(w)) shared += 1;
  return shared / new Set([...a, ...b]).size;
}

const TIMED_NOTE = new RegExp("^\\d{1,2}:\\d{2}\\s*[\\u2014\\u2013-]");
const VITALS_IN_TEXT = /\bBP\b|\bHR\b|SpO2|\bRR\b/i;

function gate(chart) {
  const problems = [];
  const need = { hpi: 3, notes: 3, labs: 3, orders: 3, timeline: 3 };
  for (const [key, min] of Object.entries(need)) {
    const arr = chart?.[key];
    if (!Array.isArray(arr) || arr.length < min) {
      problems.push(`${key}: expected >=${min}, got ${Array.isArray(arr) ? arr.length : "none"}`);
    }
  }
  if (problems.length) return problems;

  const sets = Object.fromEntries(Object.keys(need).map((k) => [k, contentWords(chart[k])]));
  const pairs = [["hpi", "notes"], ["hpi", "timeline"], ["hpi", "labs"], ["notes", "labs"], ["notes", "orders"], ["notes", "timeline"]];
  for (const [a, b] of pairs) {
    const overlap = jaccard(sets[a], sets[b]);
    if (overlap > 0.32) problems.push(`${a}/${b} overlap ${(overlap * 100).toFixed(0)}%`);
  }

  const timed = chart.notes.filter((s) => TIMED_NOTE.test(String(s).trim())).length;
  if (timed < Math.ceil(chart.notes.length / 2)) problems.push("notes are not timed entries");
  if (!chart.labs.some((s) => /\d/.test(String(s)))) problems.push("labs carry no values");
  if (chart.hpi.some((s) => VITALS_IN_TEXT.test(String(s)))) problems.push("hpi contains vital signs");

  return problems;
}

// ---- load + dedupe --------------------------------------------------------
// Concurrent generator runs each read the resume set at startup, so the staging
// file can hold the same id many times. Last entry for an id wins.
const byId = new Map();
let malformed = 0;
for (const line of readFileSync(STAGING, "utf8").split("\n")) {
  if (!line.trim()) continue;
  try {
    const row = JSON.parse(line);
    if (row && row.id && row.chart) byId.set(row.id, row);
    else malformed += 1;
  } catch { malformed += 1; }
}

const passing = [];
const failing = [];
for (const row of byId.values()) {
  const problems = gate(row.chart);
  if (problems.length) failing.push({ id: row.id, problems });
  else passing.push(row);
}

console.log(`staging file : ${STAGING}`);
console.log(`unique ids   : ${byId.size}${malformed ? `  (${malformed} malformed lines skipped)` : ""}`);
console.log(`gate passed  : ${passing.length}`);
console.log(`gate failed  : ${failing.length}`);
if (failing.length) {
  console.log("\nfailures (first 10):");
  for (const f of failing.slice(0, 10)) console.log(`  ${f.id} -> ${f.problems.slice(0, 3).join("; ")}`);
}

const targets = LIMIT > 0 ? passing.slice(0, LIMIT) : passing;
if (!targets.length) {
  console.log("\nNothing to apply.");
  process.exit(failing.length ? 1 : 0);
}

if (DRY) {
  console.log(`\nDRY RUN - would write chart_review for ${targets.length} case studies. Nothing written.`);
  process.exit(0);
}

// ---- apply ----------------------------------------------------------------
const esc = (v) => String(v).replace(/'/g, "''");
let applied = 0;
for (let i = 0; i < targets.length; i += BATCH) {
  const slice = targets.slice(i, i + BATCH);
  // CASE keeps it one statement per batch while writing a distinct payload per id.
  const ids = slice.map((r) => `'${esc(r.id)}'`).join(",");
  const cases = slice.map((r) => `WHEN '${esc(r.id)}' THEN '${esc(JSON.stringify(r.chart))}'`).join(" ");
  const sql = `UPDATE questions SET chart_review = CASE id ${cases} END
               WHERE id IN (${ids}) AND type = 'case_study'`;
  const result = d1(sql);
  applied += Number((result && result.meta && result.meta.changes) || 0);
  process.stdout.write(`\r  applied ${Math.min(i + BATCH, targets.length)}/${targets.length}`);
}
process.stdout.write("\n");

mkdirSync(dirname(REPORT), { recursive: true });
writeFileSync(REPORT, JSON.stringify({
  appliedAt: new Date().toISOString(),
  rowsChanged: applied,
  ids: targets.map((r) => r.id),
  gateFailures: failing,
}, null, 2));

console.log(`\nRows changed: ${applied}`);
console.log(`Revert manifest: ${REPORT}`);
console.log("Only chart_review on type='case_study' was touched.");
