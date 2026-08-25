#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Write a test-taking strategy note into structured_rationale.
//
//   node scripts/enrich-test-strategy.mjs --dry-run --limit 10 --show
//   node scripts/enrich-test-strategy.mjs --limit 500
//   node scripts/enrich-test-strategy.mjs --redo --limit 500   # replace unsound
//
// v2. The first version let the model write the transferable rule itself, and
// an audit of the 3,382 rows it produced found 37% unsound — including 82 that
// asserted escalating to the prescriber is the correct choice, the inverse of
// what the exam tests. The model no longer writes rules. It names the option
// STRUCTURE and SELECTS a principle from scripts/lib/nclex-principles.mjs,
// whose text is emitted verbatim, so an invented or inverted rule is not
// representable.
//
// MERGES, never overwrites: the row's existing overview/mechanism/whyCorrect/
// whyWrong/citations are preserved and only `strategy` is set.
// ---------------------------------------------------------------------------
import { execFileSync } from "node:child_process";
import { appendFileSync, mkdirSync, readFileSync, existsSync, writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { dirname, resolve } from "node:path";
import { complete, mapConcurrent, parseJsonLoose } from "./lib/llm.mjs";
import { PRINCIPLES, PRINCIPLE_IDS, PRINCIPLE_MENU, applicabilityProblem } from "./lib/nclex-principles.mjs";
import { auditStrategy } from "./lib/strategy-gate.mjs";

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
// --force replaces every stored note, not only the unsound ones: the v1 rows
// were free text judged by a gate that needed correcting twice, whereas a
// catalog note is sound by construction.
const FORCE = args.includes("--force");
const REDO = args.includes("--redo") || FORCE;

const OUT_FILE = resolve(ROOT, "scripts/staging/test-strategy-v2.jsonl");
const SQL_INLINE_LIMIT = 6_000;   // Windows caps a command line near 32KB

function d1(sql) {
  const env = { ...process.env };
  delete env.CLOUDFLARE_API_TOKEN; delete env.CLOUDFLARE_ACCOUNT_ID;
  const flat = sql.replace(/\s+/g, " ").trim();
  // A -- comment survives the flatten above as a comment on the ENTIRE
  // remaining query, which silently drops the WHERE clause and selects the
  // whole table. Ids such as "q001--matrix" are unaffected: a comment has
  // whitespace around it.
  // Quoted literals are stripped first: a rationale may legitimately contain
  // " -- ", and only a comment outside a string can swallow the query.
  if (/(^|\s)--\s/.test(flat.replace(/'(?:[^']|'')*'/g, "''"))) {
    throw new Error("SQL contains a -- comment, which flattening turns into a comment on the rest of the query. Move it outside the template literal.");
  }
  let tmp = null;
  const cmd = ["d1", "execute", "chapai-prod", "--remote", "--json"];
  if (flat.length > SQL_INLINE_LIMIT) {
    tmp = resolve(tmpdir(), `d1-${randomUUID()}.sql`);
    writeFileSync(tmp, flat, "utf8"); cmd.push("--file", tmp);
  } else cmd.push("--command", flat);
  try {
    let last;
    // wrangler's OAuth refreshes lazily on the next invocation, so a long run
    // always crosses an expiry: the one call that lands on it fails and every
    // call after it succeeds.
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
  } finally { if (tmp) { try { unlinkSync(tmp); } catch {} } }
}

const esc = (v) => String(v).replace(/'/g, "''");
const safeJson = (v, fb) => { try { return JSON.parse(v) ?? fb; } catch { return fb; } };

const SYSTEM = `You classify NCLEX-RN item structure.
You produce ONLY valid minified JSON. No prose, no markdown, no code fences.`;

function buildPrompt(row, options, correctIds) {
  const optionLines = options
    .map((o) => `  ${o.id}: ${o.text}${correctIds.includes(o.id) ? "   <-- CORRECT (never reveal this)" : ""}`)
    .join("\n");
  return `Classify this NCLEX-RN item so a strategy note can be assembled.

STEM: ${row.stem}

OPTIONS:
${optionLines}

Return two things.

1. "structure" — ONE sentence naming what KIND of thing each option is, counted.
   Describe the option set only. Never hint which one is correct.
     "Three options intervene and one assesses."
     "Two options differ only in timing."
     "All four options are assessments."
     "One option escalates to the prescriber; the other three are independent actions."

2. "principle" — the id of the ONE rule below that a student would use to
   resolve that structure. Choose the rule that actually decides this item.

${PRINCIPLE_MENU}

HARD RULES
  - "structure" must never indicate which option is correct, and must never
    describe the content of the correct option specifically.
  - No drug names, doses, lab values or diagnoses in "structure".
  - "structure" is 8 to 30 words, exactly one sentence.
  - "principle" must be one of the ids above, copied exactly.

Return JSON: {"structure":"<one sentence>","principle":"<id>"}`;
}

const COUNTED = /\b(one|two|three|four|five|six|seven|eight|all|every|each|both|\d+)\b/i;
const POINTS_AT_ANSWER = /\b(focus on the option|choose the option|select the option|the correct|the best option|the answer|pick the|is correct)\b/i;
// A structure sentence that argues with itself — "three options intervene and
// one assesses, but all options are actually interventions" — was the model
// talking its way past the applicability check rather than classifying.
const SELF_CONTRADICTION = /(but|however|although|though)[^.]*(actually|in fact|really)|there (is|are) no/i;
const CLINICAL_SPECIFIC = /\b\d+\s*(mg|mcg|mL|mmol|mEq|units?|bpm|mmHg)\b|\b(diuretic|heparin|insulin|amiodarone|furosemide|metoprolol|warfarin|BNP|troponin)\b/i;

/** @returns {string[]} problems; empty means the pair is usable. */
function gate(payload, correctIds, isSata) {
  const problems = [];
  const structure = typeof payload?.structure === "string" ? payload.structure.trim() : "";
  const principle = typeof payload?.principle === "string" ? payload.principle.trim() : "";
  if (!structure) problems.push("no structure sentence");
  if (!PRINCIPLE_IDS.includes(principle)) {
    problems.push(`unknown principle "${principle}"`);
    return problems;
  }

  const words = structure.split(/\s+/).filter(Boolean).length;
  if (words < 8) problems.push(`structure too short (${words} words)`);
  if (words > 30) problems.push(`structure too long (${words} words)`);
  const sentences = structure.split(/(?<=[.!?])\s+/).filter((x) => x.trim().length > 3);
  if (sentences.length > 1) problems.push("structure is more than one sentence");
  if (!COUNTED.test(structure)) problems.push("structure does not count the options");
  if (POINTS_AT_ANSWER.test(structure)) problems.push("structure points at the correct option");
  if (CLINICAL_SPECIFIC.test(structure)) problems.push("structure repeats clinical content");
  if (SELF_CONTRADICTION.test(structure)) problems.push("structure contradicts itself");
  const letter = new RegExp(`\\boption\\s+${correctIds[0]}\\b`, "i");
  if (letter.test(structure)) problems.push("structure names the correct option outright");

  // A sound rule that does not bite on this structure is still wrong: it can
  // discard an option the item does not contain.
  if (!problems.length) {
    const mismatch = applicabilityProblem(principle, structure, isSata);
    if (mismatch) problems.push(mismatch);
  }

  // The composed note must also survive the gate that guards the render path,
  // so nothing can be written that the UI would then refuse to show.
  if (!problems.length) {
    const composed = `${structure} ${PRINCIPLES[principle]}`;
    const reasons = auditStrategy(composed);
    if (reasons.length) problems.push(`composed note fails render gate: ${reasons.join("; ")}`);
  }
  return problems;
}

(async () => {
  mkdirSync(dirname(OUT_FILE), { recursive: true });
  const done = new Set(
    existsSync(OUT_FILE)
      ? readFileSync(OUT_FILE, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l).id)
      : [],
  );
  console.log(`Already processed locally: ${done.size}`);

  // --redo also revisits rows whose stored note fails the gate; the default
  // only fills rows that have no note at all.
  // case_study is option-based too, so the same structure-plus-principle shape
  // applies; matrix, ordering and bow-tie get theirs from
  // enrich-matrix-rationale.mjs, which knows their row layout.
  //
  // No -- comments inside this template: d1() flattens the SQL onto one line,
  // which turns a line comment into a comment on everything after it.
  const rows = d1(`
    SELECT id, stem, options, answer, structured_rationale
    FROM questions
    WHERE publish_state = 'published' AND type IN ('mcq','sata','case_study')
      AND structured_rationale IS NOT NULL AND structured_rationale <> ''
      ${REDO ? "" : "AND json_extract(structured_rationale,'$.strategy') IS NULL"}
    ORDER BY id
  `)?.results ?? [];

  const todo = rows.filter((row) => {
    if (done.has(row.id)) return false;
    if (FORCE || !REDO) return true;
    const current = safeJson(row.structured_rationale, {})?.strategy;
    return !current || auditStrategy(current).length > 0;
  }).slice(0, LIMIT);

  console.log(`Processing ${todo.length}${DRY ? "  (dry run)" : ""}\n`);

  let accepted = 0, rejected = 0, skipped = 0;
  const pending = [];
  const providers = new Map();
  const chosen = new Map();

  const produced = await mapConcurrent(todo, CONCURRENCY, async (row) => {
    const options = safeJson(row.options, []);
    const answer = safeJson(row.answer, row.answer);
    // Answers come in three shapes: ["a","c"], a bare "a", and a comma list
    // "a,b,c". The app comma-splits too (practice-session.ts), so the last
    // form grades correctly for students and only this pass was skipping it.
    const correctIds = (Array.isArray(answer) ? answer : String(answer ?? "").split(","))
      .map((id) => String(id).trim())
      .filter(Boolean);
    const existing = safeJson(row.structured_rationale, null);
    if (!existing || !options.length || !correctIds.length) return { row, skip: "malformed row" };

    let payload = null, problems = ["not attempted"];
    for (let attempt = 1; attempt <= 3 && problems.length; attempt += 1) {
      try {
        const messages = [
          { role: "system", content: SYSTEM },
          { role: "user", content: buildPrompt(row, options, correctIds) },
        ];
        if (problems[0] !== "not attempted") {
          messages.push({ role: "assistant", content: JSON.stringify(payload ?? {}) });
          messages.push({ role: "user", content: `Rejected: ${problems.join("; ")}. Return corrected JSON only.` });
        }
        const { text, provider } = await complete(messages, { temperature: 0.3, maxTokens: 300 });
        providers.set(provider, (providers.get(provider) ?? 0) + 1);
        payload = parseJsonLoose(text);
        problems = gate(payload, correctIds, correctIds.length > 1);
      } catch (error) { problems = [`request failed: ${error.message}`]; }
    }
    if (problems.length) return { row, problems };

    const strategy = `${payload.structure.trim()} ${PRINCIPLES[payload.principle]}`;
    return { row, principle: payload.principle, merged: { ...existing, strategy } };
  });

  for (const item of produced) {
    if (item.skip) { skipped += 1; continue; }
    if (!item.merged) { rejected += 1; console.log(`  x ${item.row.id} — ${item.problems.slice(0, 2).join("; ")}`); continue; }
    accepted += 1;
    chosen.set(item.principle, (chosen.get(item.principle) ?? 0) + 1);
    if (SHOW || DRY) console.log(`  ${item.row.id}  [${item.principle}]\n    ${item.merged.strategy}\n`);
    if (!DRY) pending.push({ id: item.row.id, payload: JSON.stringify(item.merged) });
  }

  for (let i = 0; i < pending.length; i += WRITE_BATCH) {
    const slice = pending.slice(i, i + WRITE_BATCH);
    const cases = slice.map((r) => `WHEN '${esc(r.id)}' THEN '${esc(r.payload)}'`).join(" ");
    const ids = slice.map((r) => `'${esc(r.id)}'`).join(",");
    d1(`UPDATE questions SET structured_rationale = CASE id ${cases} END WHERE id IN (${ids})`);
    for (const r of slice) appendFileSync(OUT_FILE, `${JSON.stringify({ id: r.id, at: new Date().toISOString() })}\n`);
    process.stdout.write(`\r  written ${Math.min(i + WRITE_BATCH, pending.length)}/${pending.length}`);
  }
  if (pending.length) process.stdout.write("\n");

  console.log(`providers: ${[...providers].map(([k, v]) => `${k}=${v}`).join(" ") || "none"}`);
  console.log(`principles: ${[...chosen].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${v}`).join(" ") || "none"}`);
  console.log(`\naccepted ${accepted}   rejected ${rejected}   skipped ${skipped}`);
})();
