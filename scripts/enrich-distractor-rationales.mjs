#!/usr/bin/env node
/**
 * enrich-distractor-rationales.mjs — give every LIVE NCLEX question premium,
 * question-specific distractor rationales, NON-DESTRUCTIVELY.
 *
 * Premium bar (matches UWorld/Archer expectations): each WRONG option gets
 * 2-3 sentences that (1) name its precise clinical error in THIS scenario,
 * (2) say when that option WOULD be appropriate, and (3) hand the student the
 * discriminating cue. Writes ONLY distractor_rationales on published rows —
 * never the answer key, rationale, publish_state, or review_status.
 *
 * Modes:
 *   default    — fill rows with missing/near-empty distractor_rationales
 *   --upgrade  — also rewrite thin ones (total < 300 chars, i.e. one-liners);
 *                the new set only ships if it passes the stricter gate
 *
 * Usage: node scripts/enrich-distractor-rationales.mjs [--limit=700] [--minutes=240] [--upgrade] [--dry-run]
 */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { resolve, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, "..");
const WEB = resolve(REPO, "apps/web");
const TMP = resolve(REPO, ".genverify-tmp");
if (!existsSync(TMP)) mkdirSync(TMP, { recursive: true });

const args = Object.fromEntries(process.argv.slice(2).map((a) => { const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] ?? true] : [a, true]; }));
const LIMIT = Math.max(1, Number(args.limit ?? 700));
// File mode: operate on staging batch files instead of live D1 rows. The prompt,
// provider rotation and validator below are shared, so a candidate set is held
// to exactly the bar live rows are.
const IN_DIR = args["input-dir"] ?? null;
const OUT_DIR = args["output-dir"] ?? null;
const FILE_MODE = Boolean(IN_DIR);
const MAX_MS = args.minutes ? Number(args.minutes) * 60000 : Infinity;
const DRY = Boolean(args["dry-run"]);
const UPGRADE = Boolean(args.upgrade);
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
const OPENROUTER_KEY = readKey("OPENROUTER_API_KEY", "hermesopenrouter.txt", /sk-or-v1-[A-Za-z0-9]{20,}/);

const DEFS = {
  // OpenRouter free tier non-viable (hy3 reasoning-loops; hermes-405b-free 429).
  // Re-enable with ~$5 credits + model "anthropic/claude-sonnet-5", re-add to pick().
  // openrouter: { key: OPENROUTER_KEY, rpm: 8, url: "https://openrouter.ai/api/v1/chat/completions", model: "anthropic/claude-sonnet-5" },
  cerebras: { key: CEREBRAS_KEY, rpm: 5,  url: "https://api.cerebras.ai/v1/chat/completions",    model: "gpt-oss-120b",            reasoningLow: true },
  groq:     { key: GROQ_KEY,     rpm: 6,  url: "https://api.groq.com/openai/v1/chat/completions", model: "llama-3.3-70b-versatile" },
  gemini:   { key: GEMINI_KEY,   rpm: 10, url: null,                                              model: "gemini-2.5-flash" },
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
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.5, maxOutputTokens: maxTokens, thinkingConfig: { thinkingBudget: 0 } } }),
        signal: AbortSignal.timeout(30000),
      });
      if (res.status === 429) return { text: "", status: 429, retryAfter: 1800 };
      if (!res.ok) return { text: "", status: res.status };
      const j = await res.json();
      return { text: j.candidates?.[0]?.content?.parts?.[0]?.text ?? "", status: 200 };
    }
    const body = { model: d.model, messages: [{ role: "system", content: "You are a senior NCLEX-RN nurse educator. Return STRICT JSON only — no markdown fences, no preamble." }, { role: "user", content: prompt }], temperature: 0.45, max_tokens: maxTokens };
    if (d.reasoningLow) body.reasoning_effort = "low";
    const res = await fetch(d.url, { method: "POST", headers: { "content-type": "application/json", Authorization: `Bearer ${d.key}` }, body: JSON.stringify(body), signal: AbortSignal.timeout(30000) });
    if (res.status === 429) return { text: "", status: 429, retryAfter: Number(res.headers.get("retry-after")) || 60 };
    if (!res.ok) return { text: "", status: res.status };
    const j = await res.json();
    return { text: j.choices?.[0]?.message?.content || "", status: 200 };
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

const SHELL = { cwd: WEB, encoding: "utf8", maxBuffer: 256 * 1024 * 1024, shell: true };
function q(s) { return process.platform === "win32" ? `"${String(s).replace(/"/g, '""')}"` : `'${String(s).replace(/'/g, "'\\''")}'`; }
function d1Query(sql, attempt = 0) {
  const r = spawnSync(`npx wrangler d1 execute chapai-prod --remote --json --command=${q(sql.replace(/\s+/g, " ").trim())}`, SHELL);
  if (r.status !== 0) {
    // Windows spawnSync occasionally dies with a transient libuv assertion — retry.
    if (attempt < 3) { spawnSync(process.platform === "win32" ? "timeout /t 3 >nul" : "sleep 3", { shell: true }); return d1Query(sql, attempt + 1); }
    throw new Error("d1 query failed: " + (r.stderr || r.stdout).slice(0, 300));
  }
  const out = r.stdout; const m = out.match(/\[[\s\S]*\]/); return JSON.parse(m[0])[0].results;
}
function d1ExecFile(path) {
  const r = spawnSync(`npx wrangler d1 execute chapai-prod --remote --file=${q(path)}`, SHELL);
  if (r.status !== 0) throw new Error("d1 exec failed: " + (r.stderr || r.stdout).slice(0, 300));
  return true;
}
const esc = (s) => String(s ?? "").replace(/'/g, "''");

function parseOpts(raw) { try { const o = JSON.parse(raw); return Array.isArray(o) ? o : []; } catch { return []; } }
function correctIds(answer) {
  // string ("b") or JSON array of ids; matrix/bowtie objects are skipped upstream.
  const raw = String(answer ?? "").trim();
  if (raw.startsWith("[")) { try { const a = JSON.parse(raw); return Array.isArray(a) ? a.map((x) => String(x).toLowerCase()) : null; } catch { return null; } }
  if (raw.startsWith("{")) return null;
  return raw ? [raw.toLowerCase()] : null;
}

// Generic filler that teaches nothing — reject the whole set if any option matches.
const GENERIC = [
  /less safe because it delays/i, /does not match the highest-risk cue/i,
  /delays the most important stabilization/i, /anchors on the wrong explanation/i,
  /it is less defensible because/i, /is (simply |just )?incorrect/i,
  /not the (best|correct) (answer|option|choice)/i, /as an ai/i, /i cannot/i,
];
const wordCount = (s) => String(s).trim().split(/\s+/).filter(Boolean).length;

function buildPrompt(row, wrong, opts) {
  const optText = opts.map((o) => `${String(o.id).toLowerCase()}. ${o.text}`).join("\n");
  return `You are a doctorally-prepared NCLEX-RN nurse educator writing PREMIUM distractor rationales that must rival UWorld. For EACH wrong option listed below, write 2-3 tight sentences that:
1. Name its PRECISE clinical error in THIS scenario — tie it to the stem's actual cues/values, never generic.
2. State when that option WOULD be the right move (the clinical context where it belongs).
3. End with the discriminating cue the student should recognize next time.

Return STRICT JSON only — an object keyed by wrong-option letter, string values, nothing else. Example shape: {"a":"...","c":"..."}
Cover exactly these wrong options: ${wrong.join(", ")}. Do NOT include the correct answer. Never contradict the correct answer or the rationale.

STEM: ${row.stem}
OPTIONS:
${optText}
CORRECT ANSWER: ${row.answer}
APPROVED RATIONALE: ${String(row.rationale).slice(0, 700)}`;
}

function extractJson(text) {
  const t = text.replace(/^```[a-z]*\s*/i, "").replace(/```\s*$/i, "").trim();
  const s = t.indexOf("{"); const e = t.lastIndexOf("}");
  if (s === -1 || e === -1) return null;
  try { return JSON.parse(t.slice(s, e + 1)); } catch { return null; }
}

function validate(parsed, wrong, opts) {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const out = {};
  for (const id of wrong) {
    const v = parsed[id] ?? parsed[id.toUpperCase()];
    if (typeof v !== "string") return null;
    const text = v.trim().replace(/\s+/g, " ");
    if (wordCount(text) < 22 || text.length > 900) return null;          // premium floor: real teaching, not a fragment
    if (GENERIC.some((re) => re.test(text))) return null;                 // no filler
    const optText = opts.find((o) => String(o.id).toLowerCase() === id)?.text ?? "";
    if (optText && text.toLowerCase() === String(optText).toLowerCase()) return null;
    out[id] = text;
  }
  return out;
}

// ── file mode ────────────────────────────────────────────────────────────────
// Batch files hold options/answer already parsed; the D1 path hands the same
// fields through as JSON strings. Normalise to the D1 row shape so everything
// downstream stays identical.
const fileIndex = new Map(); // id -> { file, question }

function loadFileRows() {
  const dir = resolve(IN_DIR);
  const out = [];
  for (const name of readdirSync(dir)) {
    if (!name.endsWith(".json") || name.startsWith("_")) continue;
    const full = resolve(dir, name);
    let payload;
    try { payload = JSON.parse(readFileSync(full, "utf8")); } catch { continue; }
    for (const q of payload.questions ?? []) {
      const existing = q.distractorRationales && typeof q.distractorRationales === "object"
        ? JSON.stringify(q.distractorRationales) : "";
      const thin = UPGRADE ? existing.length < 300 : existing.length <= 40;
      if (!thin) continue;
      if (!q.rationale || String(q.rationale).length < 60) continue;
      fileIndex.set(q.id, { file: full, question: q });
      out.push({
        id: q.id,
        stem: q.stem,
        options: JSON.stringify(q.options ?? []),
        answer: typeof q.answer === "string" ? q.answer : JSON.stringify(q.answer),
        rationale: q.rationale,
      });
      if (out.length >= LIMIT) return out;
    }
  }
  return out;
}

/** Apply accepted rationales back onto their batch files, one rewrite per file. */
function flushFiles(accepted) {
  const byFile = new Map();
  for (const [id, valid] of accepted) {
    const hit = fileIndex.get(id);
    if (!hit) continue;
    if (!byFile.has(hit.file)) byFile.set(hit.file, []);
    byFile.get(hit.file).push([id, valid]);
  }
  const target = OUT_DIR ? resolve(OUT_DIR) : resolve(IN_DIR);
  if (OUT_DIR && !existsSync(target)) mkdirSync(target, { recursive: true });
  let files = 0;
  for (const [file, pairs] of byFile) {
    const payload = JSON.parse(readFileSync(file, "utf8"));
    const map = new Map(pairs);
    for (const q of payload.questions ?? []) {
      const v = map.get(q.id);
      if (v) q.distractorRationales = v;
    }
    const dest = OUT_DIR ? resolve(target, basename(file)) : file;
    writeFileSync(dest, JSON.stringify(payload, null, 2) + "\n", "utf8");
    files++;
  }
  return files;
}

async function main() {
  const provs = healthy();
  console.error(`[distractor] limit=${LIMIT} dry=${DRY} upgrade=${UPGRADE} providers=[${provs.join(",")}] minutes=${MAX_MS === Infinity ? "∞" : MAX_MS / 60000}`);
  if (!provs.length) { console.error("[distractor] no keys"); process.exit(1); }
  const filter = UPGRADE
    ? "AND (distractor_rationales IS NULL OR length(distractor_rationales)<300)"
    : "AND (distractor_rationales IS NULL OR length(distractor_rationales)<=40)";
  const rows = FILE_MODE ? loadFileRows() : d1Query(`SELECT id, stem, options, answer, rationale FROM questions WHERE exam='nclex' AND publish_state='published' AND rationale IS NOT NULL AND length(rationale)>=60 ${filter} ORDER BY review_status='final-curated-live' DESC LIMIT ${LIMIT}`);
  console.error(`[distractor] ${rows.length} candidate rows`);

  let done = 0, fail = 0, skip = 0, i = 0;
  const updates = []; const accepted = []; const t0 = Date.now();
  const flush = () => { if (DRY || !updates.length) { updates.length = 0; return; } const f = resolve(TMP, `distractor-${Date.now()}.sql`); writeFileSync(f, updates.join("\n")); d1ExecFile(f); updates.length = 0; };

  for (const row of rows) {
    if (Date.now() - t0 > MAX_MS) { console.error("[distractor] time budget reached"); break; }
    i++;
    const opts = parseOpts(row.options);
    const correct = correctIds(row.answer);
    if (!opts.length || opts.length < 3 || !correct) { skip++; continue; }   // matrix/bowtie/cloze shapes are out of scope
    const ids = opts.map((o) => String(o.id).toLowerCase());
    const wrong = ids.filter((id) => !correct.includes(id));
    if (wrong.length < 1) { skip++; continue; }

    const m = pick(); if (!m) { console.error("[distractor] no provider"); break; }
    const raw = await call(m, buildPrompt(row, wrong, opts), 1200);
    const valid = validate(extractJson(raw), wrong, opts);
    if (!valid) { fail++; if (DEBUG) console.error(`[dbg] ${row.id} rejected via ${m}`); continue; }

    if (FILE_MODE) { accepted.push([row.id, valid]); done++; continue; }
    updates.push(`UPDATE questions SET distractor_rationales='${esc(JSON.stringify(valid))}' WHERE id='${esc(row.id)}' AND publish_state='published';`);
    done++;
    if (updates.length >= 5) flush();
    if (done % 5 === 0 || i <= 3) console.error(`[distractor] ${done} written (${i}/${rows.length}) via ${m} fail=${fail} skip=${skip} ${((Date.now() - t0) / 60000).toFixed(1)}min`);
  }
  if (FILE_MODE) {
    const n = DRY ? 0 : flushFiles(accepted);
    console.error(`[distractor] file mode: ${accepted.length} enriched across ${n} files${DRY ? " (DRY, nothing written)" : ""}`);
  } else flush();
  console.error(`[distractor] DONE written=${done} fail=${fail} skip=${skip} scanned=${i} elapsed=${((Date.now() - t0) / 60000).toFixed(1)}min${DRY ? " (DRY)" : ""}`);
}
main().catch((e) => { console.error("[distractor] FATAL", e); process.exit(1); });
