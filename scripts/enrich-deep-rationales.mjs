#!/usr/bin/env node
/**
 * enrich-deep-rationales.mjs — bring already-LIVE NCLEX questions "up to par".
 *
 * ~45% of published rows have a solid basic rationale + distractor coverage but
 * lack a premium deep_rationale (the "Deeper Clinical Context" accordion). This
 * fills that gap NON-DESTRUCTIVELY: it only writes deep_rationale (+ authored_at)
 * on rows that already have stem/options/answer/rationale. It NEVER touches the
 * answer key, publish_state, or review_status — so a live question only gets
 * richer, never broken or unpublished. Safe under AGENTS.md.
 *
 * Elaborating a question whose answer + basic rationale are already vetted is
 * low-risk, so this is gen-only (no cross-verify) with an anti-slop + length
 * gate. Throttled across the same free providers as the generator.
 *
 * Usage: node scripts/enrich-deep-rationales.mjs [--limit=500] [--minutes=180] [--dry-run]
 */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, "..");
const WEB = resolve(REPO, "apps/web");
const TMP = resolve(REPO, ".genverify-tmp");
if (!existsSync(TMP)) mkdirSync(TMP, { recursive: true });

const args = Object.fromEntries(process.argv.slice(2).map((a) => { const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] ?? true] : [a, true]; }));
const LIMIT = Math.max(1, Number(args.limit ?? 1000));
const MAX_MS = args.minutes ? Number(args.minutes) * 60000 : Infinity;
const DRY = Boolean(args["dry-run"]);
// --regenerate: rewrite EXISTING deep rationales at the premium bar (hardest first),
// not just fill missing ones. --hardest orders by difficulty regardless.
const REGEN = Boolean(args.regenerate);
const HARDEST = Boolean(args.hardest) || REGEN;
const DEBUG = Boolean(process.env.GVP_DEBUG);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function readKey(envName, fileName, re) {
  if (process.env[envName]) return process.env[envName].trim();
  const p = resolve(homedir(), "Downloads", fileName);
  if (!existsSync(p)) return "";
  const raw = readFileSync(p, "utf8");
  const m = raw.match(re); if (m) return m[0];
  const tail = raw.split(/\s+/).filter(Boolean).pop();
  return tail ? tail.replace(/^=/, "") : "";
}
const GEMINI_KEY = readKey("GEMINI_API_KEY", "freegeminikey.txt", /AIza[0-9A-Za-z_\-]{20,}/);
const GROQ_KEY = readKey("GROQ_API_KEY", "groqkey.txt", /gsk_[0-9A-Za-z]{20,}/);
const CEREBRAS_KEY = readKey("CEREBRAS_API_KEY", "cerebraskey.txt", /csk-[0-9A-Za-z]{20,}/);

const DEFS = {
  cerebras: { key: CEREBRAS_KEY, rpm: 5,  url: "https://api.cerebras.ai/v1/chat/completions",    model: "gpt-oss-120b",            jsonMode: false, reasoningLow: true },
  groq:     { key: GROQ_KEY,     rpm: 6,  url: "https://api.groq.com/openai/v1/chat/completions", model: "llama-3.3-70b-versatile", jsonMode: false },
  gemini:   { key: GEMINI_KEY,   rpm: 10, url: null,                                              model: "gemini-2.5-flash",        jsonMode: false },
};
const state = {};
for (const k of Object.keys(DEFS)) state[k] = { last: 0, cooldownUntil: 0, minInterval: Math.ceil((60000 / DEFS[k].rpm) * 1.12), fails: 0 };
const healthy = () => Object.keys(DEFS).filter((k) => DEFS[k].key);
const nextFree = (k) => Math.max(state[k].cooldownUntil, state[k].last + state[k].minInterval);
function usable() {
  const now = Date.now();
  let c = healthy().filter((k) => state[k].cooldownUntil < now + 300000 && state[k].fails < 4);
  if (!c.length) c = healthy().filter((k) => state[k].cooldownUntil < now + 300000);
  if (!c.length) c = healthy();
  return c;
}
function pick() {
  const c = usable(); if (!c.length) return null;
  const now = Date.now();
  const ready = c.filter((k) => nextFree(k) <= now);
  if (ready.length) return ready[Math.floor(Math.random() * ready.length)];
  return c.sort((a, b) => nextFree(a) - nextFree(b))[0];
}
async function rawCall(name, prompt, maxTokens) {
  const d = DEFS[name]; if (!d.key) return { text: "", status: 0 };
  try {
    if (name === "gemini") {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${d.model}:generateContent`, {
        method: "POST", headers: { "content-type": "application/json", "x-goog-api-key": d.key },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.6, maxOutputTokens: maxTokens, thinkingConfig: { thinkingBudget: 0 } } }),
        signal: AbortSignal.timeout(30000),
      });
      if (res.status === 429) return { text: "", status: 429, retryAfter: 1800 };
      if (!res.ok) return { text: "", status: res.status };
      const j = await res.json();
      return { text: j.candidates?.[0]?.content?.parts?.[0]?.text ?? "", status: 200 };
    }
    const body = { model: d.model, messages: [{ role: "system", content: "You are a senior NCLEX-RN nurse educator. Write only the requested explanation prose — no preamble, no JSON, no headings." }, { role: "user", content: prompt }], temperature: 0.55, max_tokens: maxTokens };
    if (d.reasoningLow) body.reasoning_effort = "low";
    const res = await fetch(d.url, { method: "POST", headers: { "content-type": "application/json", Authorization: `Bearer ${d.key}` }, body: JSON.stringify(body), signal: AbortSignal.timeout(30000) });
    if (res.status === 429) return { text: "", status: 429, retryAfter: Number(res.headers.get("retry-after")) || 60 };
    if (!res.ok) return { text: "", status: res.status };
    const j = await res.json();
    return { text: j.choices?.[0]?.message?.content || j.choices?.[0]?.message?.reasoning_content || "", status: 200 };
  } catch (e) { return { text: "", status: -1, err: String(e?.message || e) }; }
}
async function call(name, prompt, maxTokens) {
  const s = state[name];
  const wait = Math.max(0, nextFree(name) - Date.now());
  if (wait > 0) await sleep(wait);
  s.last = Date.now();
  const r = await rawCall(name, prompt, maxTokens);
  if (r.status === 429) { s.cooldownUntil = Date.now() + r.retryAfter * 1000; if (DEBUG) console.error(`[dbg] ${name} 429 ${r.retryAfter}s`); }
  else if (r.status === -1 || r.status >= 500) { s.cooldownUntil = Date.now() + 900000; if (DEBUG) console.error(`[dbg] ${name} ${r.status} park 15m`); }
  if (!r.text) s.fails++; else s.fails = 0;
  return r.text;
}

const ANTI_SLOP = [/as an ai/i, /i cannot/i, /the question tests/i, /recognizes the cue/i, /here is/i, /sure[,!]/i, /\bjson\b/i];

const SHELL = { cwd: WEB, encoding: "utf8", maxBuffer: 256 * 1024 * 1024, shell: true };
function q(s) { return process.platform === "win32" ? `"${String(s).replace(/"/g, '""')}"` : `'${String(s).replace(/'/g, "'\\''")}'`; }
function d1Query(sql) {
  const r = spawnSync(`npx wrangler d1 execute chapai-prod --remote --json --command=${q(sql.replace(/\s+/g, " ").trim())}`, SHELL);
  if (r.status !== 0) throw new Error("d1 query failed: " + (r.stderr || r.stdout).slice(0, 300));
  const out = r.stdout; const m = out.match(/\[[\s\S]*\]/); return JSON.parse(m[0])[0].results;
}
function d1ExecFile(path) {
  const r = spawnSync(`npx wrangler d1 execute chapai-prod --remote --file=${q(path)}`, SHELL);
  if (r.status !== 0) throw new Error("d1 exec failed: " + (r.stderr || r.stdout).slice(0, 300));
  return true;
}
const esc = (s) => String(s ?? "").replace(/'/g, "''");

function parseOpts(raw) { try { const o = JSON.parse(raw); return Array.isArray(o) ? o : []; } catch { return []; } }
function buildPrompt(row) {
  const opts = parseOpts(row.options);
  const optText = opts.length ? opts.map((o) => `${String(o.id).toUpperCase()}. ${o.text}`).join("\n") : "(see stem)";
  return `You are a doctorally-prepared NCLEX-RN nurse educator writing a PREMIUM rationale that must rival UWorld and Archer in depth and precision. Write 750-1000 characters in 2-3 tight paragraphs of plain clinical prose (no headings, no lists, no preamble, no "the nurse should" filler).

Requirements:
- Open with the SPECIFIC pathophysiology or pharmacology that governs this item — name the mechanism, cite the relevant numbers/thresholds/timeframes.
- State exactly WHY the correct answer is right, tied directly to that mechanism.
- Explain WHY the most tempting wrong options are wrong, naming each one's precise clinical error.
- Close with one high-yield, testable pearl or a concrete test-taking cue a student can carry into the exam.
Be exact and current; use real values and units; NEVER contradict the given correct answer.

STEM: ${row.stem}
OPTIONS:
${optText}
CORRECT ANSWER: ${row.answer}
EXISTING SHORT RATIONALE: ${row.rationale}`;
}

async function main() {
  const provs = healthy();
  console.error(`[enrich] limit=${LIMIT} dry=${DRY} providers=[${provs.join(",")}] minutes=${MAX_MS === Infinity ? "∞" : MAX_MS / 60000}`);
  if (!provs.length) { console.error("[enrich] no keys"); process.exit(1); }
  console.error(`[enrich] mode=${REGEN ? "REGENERATE existing (premium)" : "fill missing"} order=${HARDEST ? "hardest-first" : "curated-first"}`);
  const missingFilter = REGEN ? "" : "AND (deep_rationale IS NULL OR length(deep_rationale)<250)";
  const order = HARDEST ? "difficulty DESC, review_status='final-curated-live' DESC" : "review_status='final-curated-live' DESC";
  const rows = d1Query(`SELECT id, stem, options, answer, rationale FROM questions WHERE exam='nclex' AND publish_state='published' AND rationale IS NOT NULL AND length(rationale)>=60 ${missingFilter} ORDER BY ${order} LIMIT ${LIMIT}`);
  console.error(`[enrich] ${rows.length} rows to enrich`);

  let done = 0, fail = 0, slop = 0, i = 0;
  const updates = []; const t0 = Date.now();
  const flush = () => { if (DRY || !updates.length) { updates.length = 0; return; } const f = resolve(TMP, `enrich-${Date.now()}.sql`); writeFileSync(f, updates.join("\n")); d1ExecFile(f); updates.length = 0; };

  for (const row of rows) {
    if (Date.now() - t0 > MAX_MS) { console.error("[enrich] time budget reached"); break; }
    i++;
    const m = pick(); if (!m) { console.error("[enrich] no provider"); break; }
    const out = (await call(m, buildPrompt(row), 1100)).trim().replace(/^```[a-z]*\s*/i, "").replace(/```$/i, "").trim();
    if (!out || out.length < 350) { fail++; if (DEBUG) console.error(`[dbg] ${row.id} short(${out.length}) via ${m}`); continue; }
    if (ANTI_SLOP.some((re) => re.test(out))) { slop++; if (DEBUG) console.error(`[dbg] ${row.id} slop`); continue; }
    const clean = out.slice(0, 2000);
    const now = Math.floor(Date.now() / 1000);
    updates.push(`UPDATE questions SET deep_rationale='${esc(clean)}', deep_rationale_authored_at=${now} WHERE id='${esc(row.id)}' AND publish_state='published';`);
    done++;
    if (updates.length >= 5) flush();
    if (done % 5 === 0 || i <= 3) console.error(`[enrich] ${done} enriched (${i}/${rows.length}) via ${m} fail=${fail} slop=${slop} ${((Date.now() - t0) / 60000).toFixed(1)}min`);
  }
  flush();
  console.error(`[enrich] DONE enriched=${done} fail=${fail} slop=${slop} scanned=${i} elapsed=${((Date.now() - t0) / 60000).toFixed(1)}min${DRY ? " (DRY)" : ""}`);
}
main().catch((e) => { console.error("[enrich] FATAL", e); process.exit(1); });
