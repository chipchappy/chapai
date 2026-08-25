#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Add a test-taking strategy note to structured_rationale.
//
//   node scripts/enrich-test-strategy.mjs --dry-run --limit 3
//   node scripts/enrich-test-strategy.mjs --limit 400
//
// Measured before building this: only 30% of published questions contained any
// strategy language at all, and none of it came from the enrichment passes —
// the field did not exist. Every other pass taught the CONTENT of an item. This
// teaches how to read the item, which is the part that transfers to the next
// question a student has never seen.
//
// MERGES, never overwrites. The row's existing overview/mechanism/whyCorrect/
// whyWrong/citations are re-serialised untouched and only `strategy` is added,
// so a failure here can never cost work the earlier passes did.
// ---------------------------------------------------------------------------
import { execFileSync } from "node:child_process";
import { appendFileSync, mkdirSync, readFileSync, existsSync, writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { dirname, resolve } from "node:path";
import { complete, mapConcurrent, parseJsonLoose } from "./lib/llm.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const LOCAL_WRANGLER = resolve(ROOT, "node_modules/wrangler/bin/wrangler.js");
const WRANGLER = existsSync(LOCAL_WRANGLER) ? LOCAL_WRANGLER : "wrangler";

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const LIMIT = Number(flag("limit", "25"));
const CONCURRENCY = Number(flag("concurrency", "12"));
const WRITE_BATCH = Number(flag("batch", "20"));
const DRY = args.includes("--dry-run");
const SHOW = args.includes("--show");

const OUT_FILE = resolve(ROOT, "scripts/staging/test-strategy.jsonl");
const REVERT_FILE = resolve(ROOT, "reports/test-strategy-revert.jsonl");
const SQL_INLINE_LIMIT = 6_000;   // Windows caps a command line near 32KB

function d1(sql) {
  const env = { ...process.env };
  delete env.CLOUDFLARE_API_TOKEN;
  delete env.CLOUDFLARE_ACCOUNT_ID;
  const flat = sql.replace(/\s+/g, " ").trim();
  let tmp = null;
  const cmd = ["d1", "execute", "chapai-prod", "--remote", "--json"];
  if (flat.length > SQL_INLINE_LIMIT) {
    tmp = resolve(tmpdir(), `d1-${randomUUID()}.sql`);
    writeFileSync(tmp, flat, "utf8");
    cmd.push("--file", tmp);
  } else {
    cmd.push("--command", flat);
  }
  try {
    let last;
    for (let attempt = 1; attempt <= 4; attempt += 1) {
      try {
        const raw = execFileSync(process.execPath, [WRANGLER, ...cmd],
          { cwd: resolve(ROOT, "apps/web"), env, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
        return JSON.parse(raw.slice(raw.indexOf("[")))[0];
      } catch (error) {
        last = error;
        const text = `${error?.stdout ?? ""}${error?.message ?? ""}`;
        if (!/7403|Authentication|fetch failed/.test(text) || attempt === 4) break;
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, [3_000, 10_000, 30_000][attempt - 1]);
      }
    }
    throw last;
  } finally {
    if (tmp) { try { unlinkSync(tmp); } catch {} }
  }
}

const esc = (v) => String(v).replace(/'/g, "''");
const safeJson = (v, fb) => { try { return JSON.parse(v) ?? fb; } catch { return fb; } };

const SYSTEM = `You write NCLEX-RN test-taking strategy notes.
You produce ONLY valid minified JSON. No prose, no markdown, no code fences.`;

function buildPrompt(row, options, correctIds) {
  return `Write the TEST-TAKING STRATEGY note for this NCLEX-RN item.

STEM: ${row.stem}

OPTIONS:
${options.map((o) => `  ${o.id}: ${o.text}${correctIds.includes(o.id) ? "   <-- CORRECT (never reveal this)" : ""}`).join("\n")}

The rationale already explains the clinical content. Do NOT repeat it. This note
teaches how to READ an item built like this one, so the skill carries to a
question the student has never seen.

Write EXACTLY two sentences:

  SENTENCE 1 — name the STRUCTURE of the option set, by category, counting them.
    "Three options intervene and one assesses."
    "Two options differ only in timing."
    "One option escalates to the provider; the rest are independent actions."

  SENTENCE 2 — the transferable RULE that resolves that structure, stated as a
    general principle a student could apply to any item of this shape.
    "When the stem already establishes the problem, the assessment is the distractor."
    "When options differ only by timing, the item is testing sequence, not choice."
    "Escalation is rarely first while an independent nursing action remains."

HARD RULES
  - NEVER indicate which option is correct. No "focus on the option that...",
    no "one offers...", no describing the key's content. A student rereading
    this must still have to do the work.
  - Do NOT begin with "Identify", "Recognize", "Note that" or "Understand".
    Start with the structure itself.
  - No clinical specifics: no drug names, doses, lab values or diagnoses.
  - 20 to 45 words total.

Return JSON: {"strategy":"<two sentences>"}`;
}
const FILLER = /\b(read (the question )?carefully|use your (nursing )?judg|trust your instincts|eliminate wrong answers|study hard|remember to (think|prioriti))/i;

// Openers that turn every note into the same sentence.
const DEAD_OPENER = /^\s*(identify|recognize|recognise|note|understand|remember|observe|realize)\b/i;

// Language that points at the key. The first sample run passed the length and
// filler checks while saying "focus on the option that escalates the current
// therapy" — which is an answer, not a strategy. Gating on length alone let
// that through.
const POINTS_AT_ANSWER = /\b(focus on the option|choose the option|select the option|the option that|one option (?:offers|provides|is correct)|the best option is|pick the)\b/i;

// A strategy note that names a drug, dose or lab value has drifted back into
// clinical content, which the rationale already covers.
const CLINICAL_SPECIFIC = /\b\d+\s*(mg|mcg|mL|mmol|mEq|units?|bpm|mmHg)\b|\b(diuretic|heparin|insulin|amiodarone|furosemide|metoprolol|warfarin|BNP|troponin)\b/i;

function gate(payload, correctIds) {
  const problems = [];
  const s = payload?.strategy;
  if (typeof s !== "string") return ["no strategy string"];
  const text = s.trim();
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words < 18) problems.push(`too short (${words} words)`);
  if (words > 55) problems.push(`too long (${words} words)`);
  if (FILLER.test(text)) problems.push("generic filler");
  if (DEAD_OPENER.test(text)) problems.push("formulaic opener");
  if (POINTS_AT_ANSWER.test(text)) problems.push("points at the correct option");
  if (CLINICAL_SPECIFIC.test(text)) problems.push("repeats clinical content instead of strategy");
  const letter = new RegExp(`\\boption\\s+${correctIds[0]}\\b|\\banswer\\s+is\\s+${correctIds[0]}\\b`, "i");
  if (letter.test(text)) problems.push("names the correct option outright");
  // Two sentences is the specified shape; one long sentence is the failure mode.
  const sentences = text.split(/(?<=[.!?])\s+/).filter((x) => x.trim().length > 3);
  if (sentences.length < 2) problems.push("not two sentences");
  return problems;
}
(async () => {
  mkdirSync(dirname(OUT_FILE), { recursive: true });
  mkdirSync(dirname(REVERT_FILE), { recursive: true });
  const done = new Set(
    existsSync(OUT_FILE)
      ? readFileSync(OUT_FILE, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l).id)
      : [],
  );
  console.log(`Already processed locally: ${done.size}`);

  // Only rows that already have a structured rationale: this augments that
  // object, and there is nothing to merge into otherwise.
  const rows = d1(`
    SELECT id, stem, options, answer, structured_rationale
    FROM questions
    WHERE publish_state = 'published' AND type IN ('mcq','sata')
      AND structured_rationale IS NOT NULL AND structured_rationale <> ''
      AND instr(structured_rationale, '"strategy"') = 0
    ORDER BY id
    LIMIT ${LIMIT + done.size}
  `)?.results?.filter((r) => !done.has(r.id)).slice(0, LIMIT) ?? [];

  console.log(`Processing ${rows.length}${DRY ? "  (dry run)" : ""}\n`);

  let accepted = 0, rejected = 0, skipped = 0;
  const pending = [];
  const providers = new Map();

  const produced = await mapConcurrent(rows, CONCURRENCY, async (row) => {
    const options = safeJson(row.options, []);
    const answer = safeJson(row.answer, row.answer);
    const correctIds = (Array.isArray(answer) ? answer : [answer]).filter((v) => typeof v === "string");
    const existing = safeJson(row.structured_rationale, null);
    if (!existing || !options.length || !correctIds.length) {
      return { row, skip: "malformed row" };
    }

    let payload = null, problems = ["not attempted"];
    for (let attempt = 1; attempt <= 3 && problems.length; attempt += 1) {
      try {
        const messages = [{ role: "system", content: SYSTEM }, { role: "user", content: buildPrompt(row, options, correctIds) }];
        if (problems[0] !== "not attempted") {
          messages.push({ role: "assistant", content: JSON.stringify(payload ?? {}) });
          messages.push({ role: "user", content: `Rejected: ${problems.join("; ")}. Return corrected JSON only.` });
        }
        const { text, provider } = await complete(messages, { temperature: 0.4, maxTokens: 400 });
        providers.set(provider, (providers.get(provider) ?? 0) + 1);
        payload = parseJsonLoose(text);
        problems = gate(payload, correctIds);
      } catch (error) { problems = [`request failed: ${error.message}`]; }
    }
    if (problems.length) return { row, problems };

    // MERGE. Every existing key is preserved byte-for-byte; only `strategy` is
    // added. This pass must never be able to cost the earlier ones their work.
    return { row, merged: { ...existing, strategy: payload.strategy.trim() } };
  });

  for (const item of produced) {
    if (item.skip) { skipped += 1; continue; }
    if (!item.merged) { rejected += 1; console.log(`  x ${item.row.id} — ${item.problems.slice(0, 2).join("; ")}`); continue; }
    accepted += 1;
    if (SHOW || DRY) console.log(`  ${item.row.id}\n    ${item.merged.strategy}\n`);
    if (!DRY) pending.push({ id: item.row.id, payload: JSON.stringify(item.merged) });
  }

  for (let i = 0; i < pending.length; i += WRITE_BATCH) {
    const slice = pending.slice(i, i + WRITE_BATCH);
    const cases = slice.map((r) => `WHEN '${esc(r.id)}' THEN '${esc(r.payload)}'`).join(" ");
    const ids = slice.map((r) => `'${esc(r.id)}'`).join(",");
    // The instr guard makes a re-run idempotent and stops two overlapping runs
    // from writing over each other.
    d1(`UPDATE questions SET structured_rationale = CASE id ${cases} END
        WHERE id IN (${ids}) AND instr(structured_rationale, '"strategy"') = 0`);
    for (const r of slice) {
      appendFileSync(REVERT_FILE, `${JSON.stringify({ id: r.id, note: "strategy key added; remove it to revert" })}\n`);
      appendFileSync(OUT_FILE, `${JSON.stringify({ id: r.id, at: new Date().toISOString() })}\n`);
    }
    process.stdout.write(`\r  written ${Math.min(i + WRITE_BATCH, pending.length)}/${pending.length}`);
  }
  if (pending.length) process.stdout.write("\n");
  console.log(`providers: ${[...providers].map(([k, v]) => `${k}=${v}`).join(" ") || "none"}`);
  console.log(`\naccepted ${accepted}   rejected ${rejected}   skipped ${skipped}`);
})();
