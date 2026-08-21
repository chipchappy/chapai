#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Repair structured_rationale.whyWrong keys that do not match their option ids.
//
// apps/web/src/lib/distractor-rationale-display.ts:64 filters whyWrong entries
// with `optionIds.has(optionId)` -- an EXACT string match, no case folding. Rows
// whose whyWrong is keyed "A"/"B" while options are keyed "a"/"b" therefore drop
// every distractor explanation silently: no error, no log, students just see
// nothing.
//
//   node scripts/fix-whywrong-option-keys.mjs --dry-run
//   node scripts/fix-whywrong-option-keys.mjs
//
// Only structured_rationale.whyWrong KEYS change. Values, sibling keys
// (overview/mechanism/whyCorrect/citations) and every other column are
// untouched. A key is only remapped when exactly one option id matches it
// case-insensitively -- never a blind .toLowerCase(), because some rows use
// numeric or uuid option ids.
// ---------------------------------------------------------------------------
import { execFileSync } from "node:child_process";
import { appendFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const WRANGLER = resolve(ROOT, "node_modules/wrangler/bin/wrangler.js");
const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const REVERT = resolve(ROOT, "reports/whywrong-case-revert.jsonl");

function d1(sql) {
  const env = { ...process.env };
  delete env.CLOUDFLARE_API_TOKEN;   // deploy-scoped; D1 rejects it with 7403
  delete env.CLOUDFLARE_ACCOUNT_ID;
  const raw = execFileSync(process.execPath, [
    WRANGLER, "d1", "execute", "chapai-prod", "--remote", "--json", "--command", sql.replace(/\s+/g, " ").trim(),
  ], { cwd: resolve(ROOT, "apps/web"), env, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  return JSON.parse(raw.slice(raw.indexOf("[")))[0];
}

const esc = (v) => String(v).replace(/'/g, "''");
const safeJson = (v, fb) => {
  if (v == null || v === "") return fb;
  try { return JSON.parse(v) ?? fb; } catch { return fb; }
};

const rows = d1(`
  SELECT id, options, structured_rationale
  FROM questions
  WHERE publish_state = 'published'
    AND structured_rationale IS NOT NULL AND structured_rationale <> ''
    AND instr(structured_rationale, '"whyWrong"') > 0
`)?.results ?? [];

console.log(`Scanning ${rows.length} published rows with a whyWrong block${DRY ? "  (dry run)" : ""}\n`);

const planned = [];
let alreadyFine = 0, unmatched = 0, ambiguous = 0;

for (const row of rows) {
  const options = safeJson(row.options, []);
  const optionIds = options.map((o) => o?.id).filter((id) => typeof id === "string");
  const sr = safeJson(row.structured_rationale, null);
  const whyWrong = sr?.whyWrong;
  if (!sr || !whyWrong || typeof whyWrong !== "object" || Array.isArray(whyWrong)) continue;

  const idSet = new Set(optionIds);
  const remapped = {};
  let changes = 0;
  let rowUnmatched = 0;

  for (const [key, value] of Object.entries(whyWrong)) {
    if (idSet.has(key)) { remapped[key] = value; continue; }   // already correct
    const matches = optionIds.filter((id) => id.toLowerCase() === key.toLowerCase());
    if (matches.length === 1) {
      remapped[matches[0]] = value;
      changes += 1;
    } else {
      if (matches.length > 1) ambiguous += 1;
      remapped[key] = value;      // leave untouched, report it
      rowUnmatched += 1;
    }
  }

  if (rowUnmatched) unmatched += 1;
  if (!changes) { alreadyFine += 1; continue; }

  const next = { ...sr, whyWrong: remapped };
  planned.push({ id: row.id, before: row.structured_rationale, after: JSON.stringify(next), changes });
}

console.log(`already correct : ${alreadyFine}`);
console.log(`to remap        : ${planned.length}`);
console.log(`rows with keys matching no option : ${unmatched}`);
console.log(`ambiguous (multiple case-insensitive matches, skipped) : ${ambiguous}`);

if (!planned.length) { console.log("\nNothing to do."); process.exit(0); }

for (const p of planned.slice(0, 2)) {
  const b = JSON.parse(p.before).whyWrong;
  const a = JSON.parse(p.after).whyWrong;
  console.log(`\n  ${p.id}`);
  console.log(`    before keys: ${JSON.stringify(Object.keys(b))}`);
  console.log(`    after  keys: ${JSON.stringify(Object.keys(a))}`);
}

if (DRY) { console.log(`\nDRY RUN - would rewrite ${planned.length} rows. Nothing written.`); process.exit(0); }

mkdirSync(dirname(REVERT), { recursive: true });
let done = 0;
for (const p of planned) {
  appendFileSync(REVERT, `${JSON.stringify({ id: p.id, before: p.before })}\n`);
  d1(`UPDATE questions SET structured_rationale = '${esc(p.after)}' WHERE id = '${esc(p.id)}'`);
  done += 1;
  process.stdout.write(`\r  rewritten ${done}/${planned.length}`);
}
process.stdout.write("\n");
console.log(`\nRows changed: ${done}`);
console.log(`Revert manifest: ${REVERT}`);
console.log("Only structured_rationale.whyWrong keys were touched.");
