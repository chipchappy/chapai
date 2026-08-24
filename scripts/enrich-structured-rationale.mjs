#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Backfill structured_rationale on published questions.
//
//   node scripts/enrich-structured-rationale.mjs --dry-run --limit 3   # first
//   node scripts/enrich-structured-rationale.mjs --limit 40
//
// This is the largest remaining quality gap in the bank. structured_rationale
// is what PracticeTerminalPane renders as the teaching breakdown; without it a
// student gets the flat rationale and nothing that separates the distractors.
//
// THE ONE RULE THAT MATTERS MOST
//
//   whyWrong keys MUST be the literal `id` strings from that row's `options`,
//   copied byte-for-byte, no case changes.
//
// distractor-rationale-display.ts filters with `optionIds.has(optionId)` — an
// EXACT match, no case folding. 243 published rows shipped with "A"/"B" keys
// against "a"/"b" option ids and silently rendered nothing: no error, no log,
// students simply never saw why the wrong answers were wrong. Writing 2,000+
// more of these is nine times the blast radius, so the gate below rejects any
// key that is not present in `options` rather than trying to repair it.
//
// Unlike deep_rationale, this column is JSON by design and is parsed before
// display, so JSON here is correct — the opposite of the row-rationale script.
// ---------------------------------------------------------------------------
import { execFileSync } from "node:child_process";
import { appendFileSync, mkdirSync, readFileSync, existsSync, writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { dirname, resolve } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { complete, mapConcurrent, parseJsonLoose } from "./lib/llm.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const LOCAL_WRANGLER = resolve(ROOT, "node_modules/wrangler/bin/wrangler.js");
const WRANGLER = existsSync(LOCAL_WRANGLER) ? LOCAL_WRANGLER : "wrangler";

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const LIMIT = Number(flag("limit", "25"));
const DRY = args.includes("--dry-run");
const SHOW = args.includes("--show");
// Concurrency, not model choice, is the lever now that Cerebras answers in
// ~1s. 12 in flight sits far under the 1000 req/min ceiling.
const CONCURRENCY = Number(flag("concurrency", "12"));
const WRITE_BATCH = Number(flag("batch", "40"));

const OUT_FILE = resolve(ROOT, "scripts/staging/structured-rationale.jsonl");
const REVERT_FILE = resolve(ROOT, "reports/structured-rationale-revert.jsonl");

if (!process.env.CEREBRAS_API_KEY && !process.env.NVIDIA_API_KEY) {
  console.error("Set CEREBRAS_API_KEY (preferred) or NVIDIA_API_KEY.");
  process.exit(1);
}

const DASH = "—";

// ─── D1, with retry across token rotation ────────────────────────────────────
// wrangler's OAuth expires on a fixed clock and refreshes lazily on the NEXT
// invocation, so a long run always crosses an expiry: the one call that lands
// on it fails while every call after it succeeds.
const D1_ATTEMPTS = 4;
const D1_BACKOFF_MS = [3_000, 10_000, 30_000];

// Windows caps a process command line near 32KB. A batch of 40 rationales is
// roughly 57KB of SQL, so passing it via --command failed with an opaque spawn
// error that looked like a D1 problem. Anything large goes through a temp file
// with --file instead, which has no such limit.
const SQL_INLINE_LIMIT = 6_000;

function d1Once(sql) {
  const env = { ...process.env };
  delete env.CLOUDFLARE_API_TOKEN;   // deploy-scoped; D1 rejects it with 7403
  delete env.CLOUDFLARE_ACCOUNT_ID;
  const flat = sql.replace(/\s+/g, " ").trim();
  let tmp = null;
  let cmd;
  if (flat.length > SQL_INLINE_LIMIT) {
    tmp = resolve(tmpdir(), `d1-${randomUUID()}.sql`);
    writeFileSync(tmp, flat, "utf8");
    cmd = ["d1", "execute", "chapai-prod", "--remote", "--json", "--file", tmp];
  } else {
    cmd = ["d1", "execute", "chapai-prod", "--remote", "--json", "--command", flat];
  }
  try {
    const raw = WRANGLER.endsWith(".js")
      ? execFileSync(process.execPath, [WRANGLER, ...cmd], { cwd: resolve(ROOT, "apps/web"), env, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 })
      : execFileSync(WRANGLER, cmd, { cwd: resolve(ROOT, "apps/web"), env, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
    return JSON.parse(raw.slice(raw.indexOf("[")))[0];
  } finally {
    if (tmp) { try { unlinkSync(tmp); } catch {} }
  }
}

function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function d1(sql) {
  let last;
  for (let attempt = 1; attempt <= D1_ATTEMPTS; attempt += 1) {
    try { return d1Once(sql); } catch (error) {
      last = error;
      const text = `${error?.stdout ?? ""}${error?.message ?? ""}`;
      if (!/7403|Authentication|fetch failed/.test(text) || attempt === D1_ATTEMPTS) break;
      const wait = D1_BACKOFF_MS[attempt - 1] ?? 30_000;
      console.log(`    (D1 auth/transient, retrying in ${wait / 1000}s ${DASH} ${attempt}/${D1_ATTEMPTS})`);
      sleepSync(wait);
    }
  }
  throw last;
}

const esc = (v) => String(v).replace(/'/g, "''");
const safeJson = (v, fb) => {
  if (v == null || v === "") return fb;
  try { return JSON.parse(v) ?? fb; } catch { return fb; }
};

// Model access lives in scripts/lib/llm.mjs: Cerebras first (~1s/call, 1000
// req/min) with NVIDIA as fallback (~36s/call). The gap is why this script is
// concurrent rather than serial.

const SYSTEM = `You are a nurse educator writing NCLEX-RN teaching rationales.
You produce ONLY valid minified JSON. No prose, no markdown, no code fences.`;

function buildPrompt(row, optionIds, correctIds) {
  const options = safeJson(row.options, []);
  const wrong = optionIds.filter((id) => !correctIds.includes(id));
  return `Question (${row.type}) in the category "${row.category}":
"${row.stem}"

Options:
${options.map((o) => `  ${o.id}: ${o.text}${correctIds.includes(o.id) ? "   <-- CORRECT" : ""}`).join("\n")}

Existing rationale for reference (do not simply copy it):
"${String(row.rationale ?? "").slice(0, 900)}"

Return a JSON object with exactly these keys:
  "overview"    one or two sentences naming what the item tests
  "mechanism"   the patho or pharmacology that makes the correct answer correct
  "whyCorrect"  why the keyed answer is right, naming it explicitly
  "whyWrong"    an object keyed by the INCORRECT option ids: ${wrong.map((id) => `"${id}"`).join(", ")}
                Use those id strings EXACTLY as written. Do not change their case.
                Do NOT include the correct option. Each value explains why that
                specific option is wrong, referring to its actual content.
  "citations"   an array of nursing reference strings, or [] if you are unsure.
                NEVER invent a citation, page number, DOI or URL.

Every string must be at least 20 words. Do NOT add any extra text.`;
}

const PLACEHOLDER = /\b(best answer|correct because it is correct|as stated above|see rationale|refer to the rationale)\b/i;

function gate(obj, optionIds, correctIds) {
  const problems = [];
  if (!obj || typeof obj !== "object") return ["model returned no usable JSON object"];
  for (const key of ["overview", "mechanism", "whyCorrect"]) {
    const value = obj[key];
    if (typeof value !== "string") { problems.push(`missing ${key}`); continue; }
    const words = value.trim().split(/\s+/).filter(Boolean);
    if (words.length < 20) problems.push(`${key} too short (${words.length} words)`);
    if (PLACEHOLDER.test(value)) problems.push(`${key} is placeholder phrasing`);
  }

  const whyWrong = obj.whyWrong;
  if (!whyWrong || typeof whyWrong !== "object" || Array.isArray(whyWrong)) {
    problems.push("whyWrong missing");
    return problems;
  }
  const wrong = optionIds.filter((id) => !correctIds.includes(id));
  for (const id of wrong) {
    const value = whyWrong[id];
    if (typeof value !== "string") { problems.push(`whyWrong missing option "${id}"`); continue; }
    if (value.trim().split(/\s+/).filter(Boolean).length < 20) problems.push(`whyWrong["${id}"] too short`);
  }
  // The 243-row bug: a key that is not an exact option id renders as nothing.
  for (const key of Object.keys(whyWrong)) {
    if (!optionIds.includes(key)) problems.push(`whyWrong key "${key}" is not an option id`);
    if (correctIds.includes(key)) problems.push(`whyWrong includes the correct option "${key}"`);
  }

  const citations = obj.citations;
  if (!Array.isArray(citations)) problems.push("citations must be an array");
  else for (const c of citations) {
    if (typeof c !== "string") { problems.push("citation is not a string"); continue; }
    // Hallucinated citations arrive as DOIs, URLs and journal names.
    if (/https?:\/\/|doi\.org|\bdoi:/i.test(c)) problems.push("citation looks fabricated (URL/DOI)");
  }
  return problems;
}


// ─── main ────────────────────────────────────────────────────────────────────
(async () => {
  const done = new Set();
  if (existsSync(OUT_FILE)) {
    for (const line of readFileSync(OUT_FILE, "utf8").split("\n")) {
      if (!line.trim()) continue;
      try { done.add(JSON.parse(line).id); } catch {}
    }
  }
  console.log(`Already processed locally: ${done.size}`);

  // mcq and sata only: matrix/ordering/bow_tie have no option-based distractors
  // for whyWrong to explain, and forcing the shape onto them would produce
  // exactly the kind of empty teaching the audit already flags.
  const rows = d1(`
    SELECT id, type, category, stem, options, answer, rationale
    FROM questions
    WHERE publish_state = 'published'
      AND type IN ('mcq','sata')
      AND (structured_rationale IS NULL OR structured_rationale = '')
    ORDER BY id
    LIMIT ${LIMIT + done.size}
  `)?.results?.filter((r) => !done.has(r.id)).slice(0, LIMIT) ?? [];

  console.log(`Processing ${rows.length} with Cerebras->NVIDIA chain${DRY ? "  (dry run)" : ""}\n`);
  mkdirSync(dirname(OUT_FILE), { recursive: true });
  mkdirSync(dirname(REVERT_FILE), { recursive: true });

  let accepted = 0, rejected = 0, skipped = 0;
  const providers = new Map();
  const pending = [];

  const produced = await mapConcurrent(rows, CONCURRENCY, async (row) => {
    const options = safeJson(row.options, []);
    const optionIds = options.map((o) => o?.id).filter((id) => typeof id === "string");
    const answer = safeJson(row.answer, row.answer);
    const correctIds = (Array.isArray(answer) ? answer : [answer]).filter((id) => typeof id === "string");
    if (optionIds.length < 2 || !correctIds.length || correctIds.some((id) => !optionIds.includes(id))) {
      return { row, skip: "malformed options/answer" };
    }

    let result = null, problems = ["not attempted"];
    for (let attempt = 1; attempt <= 3 && problems.length; attempt += 1) {
      try {
        const messages = [{ role: "system", content: SYSTEM }, { role: "user", content: buildPrompt(row, optionIds, correctIds) }];
        if (problems[0] !== "not attempted") {
          messages.push({ role: "assistant", content: JSON.stringify(result ?? {}) });
          messages.push({ role: "user", content: `Rejected: ${problems.join("; ")}. Fix these and return corrected JSON only.` });
        }
        const { text, provider } = await complete(messages, { temperature: 0.25, maxTokens: 1800 });
        providers.set(provider, (providers.get(provider) ?? 0) + 1);
        result = parseJsonLoose(text);
        problems = gate(result, optionIds, correctIds);
      } catch (error) {
        problems = [`request failed: ${error.message}`];
      }
    }
    return problems.length ? { row, problems } : { row, result };
  });

  for (const item of produced) {
    if (item.skip) { skipped += 1; continue; }
    if (!item.result) { rejected += 1; console.log(`  x ${item.row.id} ${DASH} ${item.problems.slice(0, 2).join("; ")}`); continue; }
    accepted += 1;
    if (SHOW || DRY) console.log(`\n--- ${item.row.id} ---\n${JSON.stringify(item.result, null, 1).slice(0, 700)}\n`);
    if (!DRY) pending.push({ id: item.row.id, payload: JSON.stringify(item.result) });
  }

  // One statement per batch rather than one per row: every wrangler call spawns
  // a node process, and that dominated the runtime once generation stopped
  // being the bottleneck. The NULL guard stays in the WHERE so a concurrent
  // run can never clobber a row someone else just filled.
  for (let i = 0; i < pending.length; i += WRITE_BATCH) {
    const slice = pending.slice(i, i + WRITE_BATCH);
    const cases = slice.map((r) => `WHEN '${esc(r.id)}' THEN '${esc(r.payload)}'`).join(" ");
    const ids = slice.map((r) => `'${esc(r.id)}'`).join(",");
    d1(`UPDATE questions SET structured_rationale = CASE id ${cases} END
        WHERE id IN (${ids}) AND (structured_rationale IS NULL OR structured_rationale = '')`);
    for (const r of slice) {
      appendFileSync(REVERT_FILE, `${JSON.stringify({ id: r.id, before: null })}\n`);
      appendFileSync(OUT_FILE, `${JSON.stringify({ id: r.id, at: new Date().toISOString() })}\n`);
    }
    process.stdout.write(`\r  written ${Math.min(i + WRITE_BATCH, pending.length)}/${pending.length}`);
  }
  if (pending.length) process.stdout.write("\n");
  console.log(`providers: ${[...providers].map(([k, v]) => `${k}=${v}`).join(" ") || "none"}`);
  console.log(`\naccepted ${accepted}   rejected ${rejected}   skipped ${skipped}`);
  if (!DRY && accepted) console.log(`Revert manifest: ${REVERT_FILE}`);
})();
