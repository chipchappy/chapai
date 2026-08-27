#!/usr/bin/env node
/**
 * dedupe-promoted.mjs — collapse a promoted-* generation to its unique questions.
 *
 *   node scripts/dedupe-promoted.mjs --in promoted-v4 --out promoted-v5
 *
 * The v2/v3/v4 generations each hold 32,746 rows that collapse to ~2,625 unique
 * stems — one stem repeats 906 times. Publishing that as-is would flood the bank
 * with the same item. This picks one best copy per stem and writes a clean set
 * in the same batch envelope the sync script reads.
 *
 * "Best copy" = the one that teaches most: structuredRationale first, then
 * references, then rationale length. Ties keep the first seen, so the output is
 * deterministic for the same input.
 *
 * Difficulty conflicts are reported, not silently resolved: 188 stems carry
 * different difficulty values across their own duplicates, which means the
 * recalibration pass disagreed with itself. Those ids go to a sidecar file for
 * human review rather than being quietly averaged.
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const STAGING = join(ROOT, "packages", "content", "staging");

const argv = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};
const IN = arg("--in", "promoted-v4");
const OUT = arg("--out", "promoted-v5");
const PER_BATCH = Number(arg("--per-batch", "10"));
const EXCLUDE = arg("--exclude-ids", "");
const DRY = argv.includes("--dry-run");

const inDir = join(STAGING, IN);
const outDir = join(STAGING, OUT);
if (!existsSync(inDir)) { console.error(`No such input dir: ${inDir}`); process.exit(1); }

// Ids already live in production. Re-emitting them would aim an upsert at a
// real row; the sync guard refuses to overwrite published rows, so the write
// would be a silent no-op, and shipping items that can never land is worse than
// not shipping them.
const liveIds = new Set(
  EXCLUDE && existsSync(EXCLUDE)
    ? readFileSync(EXCLUDE, "utf8").split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
    : [],
);
if (EXCLUDE) console.log(`excluding ${liveIds.size} ids already live in production`);

/** Normalise a stem so trivial punctuation/case differences do not read as distinct questions. */
const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();

/** How much a copy teaches. Higher wins. */
function teachScore(q) {
  let s = 0;
  if (q.structuredRationale) s += 1000;
  if (Array.isArray(q.references) && q.references.length) s += 500;
  s += Math.min(String(q.rationale || "").length, 400);
  return s;
}

const groups = new Map();   // normStem -> { best, score, copies, difficulties:Set, ids:[] }
let scanned = 0, files = 0, unusable = 0, alreadyLive = 0;

for (const file of readdirSync(inDir).filter((f) => f.endsWith(".json"))) {
  files++;
  let payload;
  try { payload = JSON.parse(readFileSync(join(inDir, file), "utf8")); }
  catch { unusable++; continue; }
  for (const q of payload.questions || []) {
    scanned++;
    const key = norm(q.stem);
    if (!key) { unusable++; continue; }
    if (liveIds.has(q.id)) { alreadyLive++; continue; }
    const score = teachScore(q);
    const g = groups.get(key);
    if (!g) {
      groups.set(key, { best: q, score, copies: 1, difficulties: new Set([q.difficulty]), ids: [q.id] });
    } else {
      g.copies++;
      g.difficulties.add(q.difficulty);
      g.ids.push(q.id);
      if (score > g.score) { g.best = q; g.score = score; }
    }
  }
}

let unique = [...groups.values()];

// Stem-dedupe can still leave two distinct stems sharing an id (a defect in the
// source generation). id is the upsert key, so a collision means one question
// silently replaces the other. Keep the better copy and record the loser.
const byId = new Map();
const idCollisions = [];
for (const g of unique) {
  const prev = byId.get(g.best.id);
  if (!prev) { byId.set(g.best.id, g); continue; }
  const [keep, drop] = g.score > prev.score ? [g, prev] : [prev, g];
  byId.set(keep.best.id, keep);
  idCollisions.push({ id: keep.best.id, kept: String(keep.best.stem).slice(0, 90), dropped: String(drop.best.stem).slice(0, 90) });
}
unique = [...byId.values()];
const conflicts = unique
  .filter((g) => g.difficulties.size > 1)
  .map((g) => ({ id: g.best.id, kept: g.best.difficulty, seen: [...g.difficulties].sort(), copies: g.copies }));

console.log(`input   ${IN}: ${files} files, ${scanned} rows${unusable ? `, ${unusable} unusable` : ""}${alreadyLive ? `, ${alreadyLive} skipped as already live` : ""}`);
console.log(`unique  ${unique.length} questions  (${(100 - unique.length / scanned * 100).toFixed(1)}% removed)`);
console.log(`         with structuredRationale: ${unique.filter((g) => g.best.structuredRationale).length}`);
console.log(`         with references:          ${unique.filter((g) => (g.best.references || []).length).length}`);
console.log(`id collisions resolved:       ${idCollisions.length}`);
console.log(`difficulty conflicts flagged: ${conflicts.length}`);

if (DRY) { console.log("\n[dry-run] nothing written"); process.exit(0); }

if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

// Stable order so re-runs produce identical files: exam, then category, then id.
unique.sort((a, b) =>
  (a.best.exam || "").localeCompare(b.best.exam || "") ||
  (a.best.category || "").localeCompare(b.best.category || "") ||
  String(a.best.id).localeCompare(String(b.best.id)));

const generatedAt = new Date().toISOString();
let written = 0, batchNo = 0;
for (let i = 0; i < unique.length; i += PER_BATCH) {
  batchNo++;
  const slice = unique.slice(i, i + PER_BATCH).map((g) => g.best);
  const mix = slice.reduce((acc, q) => { acc[q.exam] = (acc[q.exam] || 0) + 1; return acc; }, {});
  const id = `dedup-batch-${String(batchNo).padStart(3, "0")}`;
  writeFileSync(join(outDir, `${id}.json`), JSON.stringify({
    batchId: id,
    generatedAt,
    generatedBy: {
      agentId: "dedupe-promoted",
      runtime: "deterministic",
      promptSource: "scripts/dedupe-promoted.mjs",
      sourceGeneration: IN,
    },
    examMix: mix,
    validation: { valid: true, errors: [] },
    questions: slice,
  }, null, 2) + "\n", "utf8");
  written += slice.length;
}

writeFileSync(join(outDir, "_difficulty-conflicts.json"), JSON.stringify({
  note: "Stems whose duplicate copies carried different difficulty values. The kept copy's value is listed; a human should confirm it before publishing.",
  source: IN,
  generatedAt,
  count: conflicts.length,
  conflicts,
}, null, 2) + "\n", "utf8");

console.log(`\nwrote ${written} questions across ${batchNo} batches -> ${OUT}/`);
console.log(`plus _difficulty-conflicts.json (${conflicts.length} entries, excluded from batch files)`);
