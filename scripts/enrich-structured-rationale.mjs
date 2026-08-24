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
import { appendFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const ROOT = resolve(import.meta.dirname, "..");
const LOCAL_WRANGLER = resolve(ROOT, "node_modules/wrangler/bin/wrangler.js");
const WRANGLER = existsSync(LOCAL_WRANGLER) ? LOCAL_WRANGLER : "wrangler";

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const LIMIT = Number(flag("limit", "25"));
const DRY = args.includes("--dry-run");
const SHOW = args.includes("--show");
const MODEL = flag("model", "meta/llama-3.1-70b-instruct");

const OUT_FILE = resolve(ROOT, "scripts/staging/structured-rationale.jsonl");
const REVERT_FILE = resolve(ROOT, "reports/structured-rationale-revert.jsonl");

const API_KEY = (process.env.NVIDIA_API_KEY ?? "").replace(/^["']|["']$/g, "").trim();
if (!API_KEY) { console.error("NVIDIA_API_KEY is required."); process.exit(1); }

const DASH = "—";

// ─── D1, with retry across token rotation ────────────────────────────────────
// wrangler's OAuth expires on a fixed clock and refreshes lazily on the NEXT
// invocation, so a long run always crosses an expiry: the one call that lands
// on it fails while every call after it succeeds.
const D1_ATTEMPTS = 4;
const D1_BACKOFF_MS = [3_000, 10_000, 30_000];

function d1Once(sql) {
  const env = { ...process.env };
  delete env.CLOUDFLARE_API_TOKEN;   // deploy-scoped; D1 rejects it with 7403
  delete env.CLOUDFLARE_ACCOUNT_ID;
  const cmd = ["d1", "execute", "chapai-prod", "--remote", "--json", "--command", sql.replace(/\s+/g, " ").trim()];
  const raw = WRANGLER.endsWith(".js")
    ? execFileSync(process.execPath, [WRANGLER, ...cmd], { cwd: resolve(ROOT, "apps/web"), env, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 })
    : execFileSync(WRANGLER, cmd, { cwd: resolve(ROOT, "apps/web"), env, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  return JSON.parse(raw.slice(raw.indexOf("[")))[0];
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

// ─── model ───────────────────────────────────────────────────────────────────
const REQUEST_TIMEOUT_MS = 600_000;
const MAX_ATTEMPTS = 6;

async function chat(messages, options = {}) {
  let lastReason = "unknown";
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL, messages,
          max_tokens: options.maxTokens ?? 1600,
          temperature: options.temperature ?? 0.3,
          ...(options.response_format ? { response_format: options.response_format } : {}),
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (response.status === 429 || response.status >= 500) {
        lastReason = `${response.status}`;
        const wait = [15_000, 45_000, 120_000, 240_000, 360_000][attempt - 1] ?? 150_000;
        console.log(`    (capacity ${lastReason}, waiting ${Math.round(wait / 1000)}s ${DASH} ${attempt}/${MAX_ATTEMPTS})`);
        await sleep(wait);
        continue;
      }
      if (!response.ok) throw new Error(`${response.status} ${(await response.text()).slice(0, 180)}`);
      return (await response.json()).choices?.[0]?.message?.content ?? "";
    } catch (error) {
      lastReason = error?.name === "TimeoutError" ? "timeout" : (error?.message ?? "error");
      if (attempt === MAX_ATTEMPTS) break;
      console.log(`    (${lastReason}, retrying ${DASH} ${attempt}/${MAX_ATTEMPTS})`);
      await sleep(10_000 * attempt);
    }
  }
  throw new Error(`exhausted retries (${lastReason})`);
}

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

function parseJson(raw) {
  const cleaned = String(raw).replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end < 0) return null;
  try { return JSON.parse(cleaned.slice(start, end + 1)); } catch { return null; }
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

  console.log(`Processing ${rows.length} with ${MODEL}${DRY ? "  (dry run)" : ""}\n`);
  mkdirSync(dirname(OUT_FILE), { recursive: true });
  mkdirSync(dirname(REVERT_FILE), { recursive: true });

  let accepted = 0, rejected = 0, skipped = 0;
  for (const row of rows) {
    const options = safeJson(row.options, []);
    const optionIds = options.map((o) => o?.id).filter((id) => typeof id === "string");
    const answer = safeJson(row.answer, row.answer);
    const correctIds = (Array.isArray(answer) ? answer : [answer]).filter((id) => typeof id === "string");

    if (optionIds.length < 2 || !correctIds.length || correctIds.some((id) => !optionIds.includes(id))) {
      skipped += 1;
      console.log(`  - ${row.id} ${DASH} skipped, malformed options/answer`);
      continue;
    }

    let result = null, problems = ["not attempted"];
    for (let attempt = 1; attempt <= 3 && problems.length; attempt += 1) {
      try {
        const messages = [{ role: "system", content: SYSTEM }, { role: "user", content: buildPrompt(row, optionIds, correctIds) }];
        if (problems[0] !== "not attempted") {
          messages.push({ role: "assistant", content: JSON.stringify(result ?? {}) });
          messages.push({ role: "user", content: `Rejected: ${problems.join("; ")}. Fix these and return corrected JSON only.` });
        }
        const raw = await chat(messages, { temperature: 0.25, response_format: { type: "json_object" } });
        result = parseJson(raw);
        problems = gate(result, optionIds, correctIds);
      } catch (error) {
        problems = [`request failed: ${error.message}`];
      }
      if (problems.length) await sleep(1200);
    }

    if (problems.length) {
      rejected += 1;
      console.log(`  x ${row.id} ${DASH} ${problems.slice(0, 2).join("; ")}`);
      continue;
    }

    accepted += 1;
    const payload = JSON.stringify(result);
    if (SHOW || DRY) console.log(`\n--- ${row.id} ---\n${JSON.stringify(result, null, 1).slice(0, 900)}\n`);
    if (DRY) continue;

    // Only fills a NULL. The WHERE guard means a concurrent writer cannot be
    // clobbered even if two runs overlap.
    appendFileSync(REVERT_FILE, `${JSON.stringify({ id: row.id, before: null })}\n`);
    d1(`UPDATE questions SET structured_rationale = '${esc(payload)}'
        WHERE id = '${esc(row.id)}' AND (structured_rationale IS NULL OR structured_rationale = '')`);
    appendFileSync(OUT_FILE, `${JSON.stringify({ id: row.id, model: MODEL, at: new Date().toISOString() })}\n`);
    console.log(`  + ${row.id} ${DASH} ${Object.keys(result.whyWrong).length} distractors, ${result.citations.length} citations`);
  }

  console.log(`\naccepted ${accepted}   rejected ${rejected}   skipped ${skipped}`);
  if (!DRY && accepted) console.log(`Revert manifest: ${REVERT_FILE}`);
})();
