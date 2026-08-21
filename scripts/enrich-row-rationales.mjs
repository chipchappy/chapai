#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Matrix / ordering per-row rationales.
//
// Generates a short rationale for each matrix row (why that finding belongs in
// its column) or each ordering step (why it precedes the next), then APPENDS
// them to the question's existing deep_rationale as readable prose.
//
//   node scripts/enrich-row-rationales.mjs --dry-run --limit 3   # always first
//   node scripts/enrich-row-rationales.mjs --limit 25
//
// THREE THINGS THIS SCRIPT MUST NEVER DO AGAIN (all were live bugs):
//
//  1. Never write JSON into deep_rationale. That column is the PRIMARY rationale
//     students read -- PracticeTerminalPane/PracticeQuestionPane/NclexExamPane all
//     resolve `deepRationale ?? rationale`, so a JSON blob there renders on screen
//     as raw braces and quotes. Output is prose, always.
//  2. Never overwrite deep_rationale. All 593 matrix + 45 ordering published
//     questions already have one. We append a section; the original text is
//     preserved verbatim and captured in the revert manifest first.
//  3. Never interpolate a value into SQL unquoted. The previous version did
//     `SET deep_rationale = ${JSON.stringify(obj)}` -- unquoted, unescaped, a
//     syntax error on every row even if the filter had matched anything.
//
// Resume is marker-based: a question already carrying SECTION_MARKER is skipped,
// so re-running is safe and never double-appends.
// ---------------------------------------------------------------------------
import { execFileSync } from "node:child_process";
import { appendFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const ROOT = resolve(import.meta.dirname, "..");
// Prefer the repo-local wrangler so this runs from WSL or Windows unchanged.
const LOCAL_WRANGLER = resolve(ROOT, "node_modules/wrangler/bin/wrangler.js");
const WRANGLER = existsSync(LOCAL_WRANGLER) ? LOCAL_WRANGLER : "wrangler";

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const LIMIT = Number(flag("limit", "50"));
const SHOW = args.includes("--show");
const DRY = args.includes("--dry-run");
// llama-3.3-70b on NVIDIA NIM is saturated: probed 2026-08-14, times out at 90s.
// 3.1-70b answers the same prompt in ~36s and returns clean minified JSON.
const MODEL = flag("model", "meta/llama-3.1-70b-instruct");

const OUT_FILE = resolve(ROOT, "scripts/staging/row-rationales.jsonl");
const REVERT_FILE = resolve(ROOT, "reports/row-rationales-revert.jsonl");

// Env keys in this shell are quote-wrapped; strip them or auth fails with 401.
const API_KEY = (process.env.NVIDIA_API_KEY ?? "").replace(/^["']|["']$/g, "").trim();
if (!API_KEY) { console.error("NVIDIA_API_KEY is required."); process.exit(1); }

// The heading we append under. Doubles as the resume marker.
const SECTION_MARKER = "Why each of these belongs where it does:";
const BULLET = "•";
const DASH = "—";

// Retries because wrangler's OAuth token expires on a fixed clock (8h) and is
// refreshed lazily on the NEXT invocation. A multi-hour run will therefore cross
// an expiry, and the single call that lands on it returns 7403 while every call
// after it succeeds. Without a retry the whole run died on that one call, 24
// rows in. Sleeps between attempts to let the refresh land.
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
    try {
      return d1Once(sql);
    } catch (error) {
      last = error;
      const text = `${error?.stdout ?? ""}${error?.message ?? ""}`;
      const transient = text.includes("7403") || text.includes("Authentication") || text.includes("fetch failed");
      if (!transient || attempt === D1_ATTEMPTS) break;
      const wait = D1_BACKOFF_MS[attempt - 1] ?? 30_000;
      console.log(`    (D1 auth/transient failure, retrying in ${wait / 1000}s ${DASH} attempt ${attempt}/${D1_ATTEMPTS})`);
      sleepSync(wait);
    }
  }
  throw last;
}

const esc = (v) => String(v).replace(/'/g, "''");

// Safe JSON column read. These columns are nullable and are '' on some legacy
// rows; JSON.parse on either throws and killed the previous run mid-batch.
function safeJson(value, fallback) {
  if (value == null || value === "") return fallback;
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch { return fallback; }
}

const REQUEST_TIMEOUT_MS = 600_000;
const MAX_ATTEMPTS = 6;

async function chat(messages, options = {}) {
  let lastReason = "unknown";
  const { maxTokens = 800, temperature = 0.4 } = options;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL, messages, max_tokens: maxTokens, temperature,
          ...(options.response_format ? { response_format: options.response_format } : {}),
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (response.status === 429 || response.status >= 500) {
        lastReason = `${response.status}`;
        const wait = [15_000, 45_000, 120_000, 240_000, 360_000][attempt - 1] ?? 150_000;
        console.log(`    (capacity ${lastReason}, waiting ${Math.round(wait / 1000)}s ${DASH} attempt ${attempt}/${MAX_ATTEMPTS})`);
        await sleep(wait);
        continue;
      }
      if (!response.ok) throw new Error(`${response.status} ${(await response.text()).slice(0, 180)}`);
      const payload = await response.json();
      return payload.choices?.[0]?.message?.content ?? "";
    } catch (error) {
      lastReason = error?.name === "TimeoutError" ? "timeout" : (error?.message ?? "error");
      if (attempt === MAX_ATTEMPTS) break;
      console.log(`    (${lastReason}, retrying ${DASH} attempt ${attempt}/${MAX_ATTEMPTS})`);
      await sleep(10_000 * attempt);
    }
  }
  throw new Error(`exhausted retries (${lastReason})`);
}

const SYSTEM = `You are a nurse educator writing rationales for NGN matrix and ordering questions.
You produce ONLY valid minified JSON. No prose, no markdown, no code fences.`;

// The model still returns JSON -- it is a reliable transport for a keyed map.
// We convert it to prose before it ever reaches the database.
// Responses are keyed by INDEX ("1", "2", ...), never by the row label.
// Matrix labels are full sentences ("Confirming the client understands the
// procedure, risks, and alternatives."); requiring the model to echo one back
// byte-for-byte as a JSON key failed constantly on punctuation and truncation,
// and every one of those failures looked like a missing rationale. The index is
// mapped back to its label here, where it cannot drift.
function buildMatrixPrompt(row, items) {
  const columns = safeJson(row.matrix_columns, []);
  return `You are given an NGN matrix question about: "${row.stem}"
The columns are: ${columns.join(" | ")}.
Each finding below is followed by the column it has been assigned to.
For each one, write ONE OR TWO sentences explaining why that finding belongs in THAT column.
Name the specific clinical mechanism — do not restate the assignment.

${items.map((it) => `${it.key}. "${it.label}" -> assigned to: ${it.assignment ?? "(see stem)"}`).join("\n")}

Return a JSON object whose keys are the numbers above as strings ("1", "2", ...)
and whose values are the rationale strings. At least 15 words each.
Do NOT add any extra text.`;
}

function buildOrderingPrompt(row, items, lastStep) {
  return `You are given an NGN ordering question about: "${row.stem}"
The correct sequence is:
${items.map((it) => `${it.key}. ${it.label}`).join("\n")}
${items.length + 1}. ${lastStep}

For each numbered step listed above, write ONE OR TWO sentences explaining why it
must come before the step that follows it. Use priority frameworks explicitly
(ABC, safety, assessment-before-intervention, Maslow).

Return a JSON object whose keys are the numbers above as strings ("1", "2", ...)
and whose values are the rationale strings. At least 15 words each.
Do NOT add any extra text.`;
}

function gateRationales(obj, items) {
  const problems = [];
  if (!obj || typeof obj !== "object") return ["model returned no usable JSON object"];
  for (const it of items) {
    const val = obj[it.key];
    if (typeof val !== "string") { problems.push(`no rationale for #${it.key}`); continue; }
    const words = val.trim().split(/\s+/).filter(Boolean);
    if (words.length < 15) problems.push(`#${it.key} too short (${words.length} words)`);
    // Catches the model restating the assignment instead of explaining it.
    if (/^(this|the)\s+(finding|step|option)\s+(is|belongs)/i.test(val.trim())) {
      problems.push(`#${it.key} is a restatement, not a mechanism`);
    }
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

// ---- prose composition ----------------------------------------------------
// This is the whole point of the rewrite: what lands in the database is text a
// student can read, not a serialised object.
function composeProse(existing, items, rationales, { numbered }) {
  const lines = items.map((it) => {
    const head = numbered
      ? `Step ${it.key} ${DASH} ${it.label}`
      : it.assignment ? `${it.label} ${DASH} ${it.assignment}` : it.label;
    return `${BULLET} ${head}: ${rationales[it.key].trim()}`;
  });
  const section = `${SECTION_MARKER}\n${lines.join("\n")}`;
  const base = String(existing ?? "").trim();
  return base ? `${base}\n\n${section}` : section;
}

// ---- main -----------------------------------------------------------------
(async () => {
  const done = new Set();
  if (existsSync(OUT_FILE)) {
    for (const line of readFileSync(OUT_FILE, "utf8").split("\n")) {
      if (!line.trim()) continue;
      try { done.add(JSON.parse(line).id); } catch {}
    }
  }
  console.log(`Already processed locally: ${done.size}`);

  // Select published matrix/ordering that have NOT yet received the appended
  // section. Note the filter is on the marker, not on deep_rationale being
  // empty -- every one of these rows already has a rationale.
  const rows = d1(`
    SELECT id, type, stem, matrix_columns, matrix_rows, options, answer, deep_rationale
    FROM questions
    WHERE type IN ('matrix', 'ordering')
      AND publish_state = 'published'
      AND (deep_rationale IS NULL OR deep_rationale NOT LIKE '%${esc(SECTION_MARKER)}%')
    ORDER BY id
    LIMIT ${LIMIT + done.size}
  `)?.results?.filter((r) => !done.has(r.id)).slice(0, LIMIT) ?? [];

  console.log(`Processing ${rows.length} questions with ${MODEL}${DRY ? "  (dry run)" : ""}\n`);
  mkdirSync(dirname(OUT_FILE), { recursive: true });
  mkdirSync(dirname(REVERT_FILE), { recursive: true });

  let accepted = 0, rejected = 0, skipped = 0;
  for (const row of rows) {
    // Derive the items needing rationales, guarding every JSON column. Items
    // carry {key, label, assignment}; the key is the index the model answers on.
    let items = [];
    let numbered = false;
    let lastStep = "";
    if (row.type === "matrix") {
      const matrixRows = safeJson(row.matrix_rows, []);
      items = matrixRows
        .filter((r) => typeof r?.label === "string" && r.label.trim())
        .map((r, i) => ({ key: String(i + 1), label: r.label.trim(), assignment: r.answer ?? null }));
    } else {
      const options = safeJson(row.options, []);
      const answer = safeJson(row.answer, []);
      // Legacy ordering rows store options as [] and answer as "0,1,2,3,4";
      // there is no step text to reason about, so they are reported and skipped
      // rather than fed to the model as empty strings.
      const idToText = Object.fromEntries(options.map((o) => [o?.id, o?.text]));
      const ordered = (Array.isArray(answer) ? answer : [])
        .map((id) => idToText[id])
        .filter((t) => typeof t === "string" && t.trim());
      items = ordered.slice(0, Math.max(0, ordered.length - 1))
        .map((label, i) => ({ key: String(i + 1), label: label.trim(), assignment: null }));
      lastStep = ordered[ordered.length - 1] ?? "";
      numbered = true;
    }

    if (items.length < 2) {
      skipped += 1;
      console.log(`  - ${row.id} (${row.type}) ${DASH} skipped, no usable rows (legacy shape)`);
      continue;
    }

    const prompt = row.type === "matrix"
      ? buildMatrixPrompt(row, items)
      : buildOrderingPrompt(row, items, lastStep);

    let rationales = null, problems = ["not attempted"];
    for (let attempt = 1; attempt <= 3 && problems.length; attempt += 1) {
      try {
        const messages = [{ role: "system", content: SYSTEM }, { role: "user", content: prompt }];
        if (problems[0] !== "not attempted") {
          messages.push({ role: "assistant", content: JSON.stringify(rationales ?? {}) });
          messages.push({ role: "user", content: `Rejected: ${problems.join("; ")}. Fix these and return corrected JSON only.` });
        }
        const raw = await chat(messages, { temperature: 0, response_format: { type: "json_object" } });
        rationales = parseJson(raw);
        problems = gateRationales(rationales, items);
      } catch (error) {
        problems = [`request failed: ${error.message}`];
      }
      if (problems.length) await sleep(1200);
    }

    if (problems.length) {
      rejected += 1;
      console.log(`  x ${row.id} (${row.type}) ${DASH} ${problems.slice(0, 2).join("; ")}`);
      continue;
    }

    const next = composeProse(row.deep_rationale, items, rationales, { numbered });
    accepted += 1;

    if (SHOW || DRY) {
      console.log(`\n--- ${row.id} (${row.type}) would become ---\n${next}\n`);
    }
    if (DRY) continue;

    // Capture the BEFORE value first so the append is reversible.
    appendFileSync(REVERT_FILE, `${JSON.stringify({ id: row.id, before: row.deep_rationale ?? null })}\n`);

    d1(`UPDATE questions SET deep_rationale = '${esc(next)}' WHERE id = '${esc(row.id)}' AND type IN ('matrix','ordering')`);
    appendFileSync(OUT_FILE, `${JSON.stringify({ id: row.id, type: row.type, model: MODEL, generatedAt: new Date().toISOString() })}\n`);
    console.log(`  + ${row.id} (${row.type}) ${DASH} appended ${items.length} row rationales`);
  }

  console.log(`\naccepted ${accepted}   rejected ${rejected}   skipped ${skipped}`);
  if (!DRY && accepted) console.log(`Revert manifest: ${REVERT_FILE}`);
})();
