#!/usr/bin/env node
/**
 * enrich-visual-rationales.mjs — add uniform diagrams (+ structured rationale) to
 * already-LIVE NCLEX questions, NON-DESTRUCTIVELY.
 *
 * Writes ONLY visual_rationale and structured_rationale on published rows that have
 * a vetted stem/answer/rationale. Never touches the answer key, publish_state, or
 * review_status. The model must judge diagram-worthiness — questions whose concept
 * is not genuinely visualizable get structured rationale only (no forced diagram).
 *
 * Model: free Gemini 2.5 Flash by default. If a valid OpenRouter key is present
 * (Downloads/openrouterkey.txt or OPENROUTER_API_KEY) it uses a top model instead
 * (anthropic/claude-3.5-sonnet) — that is the "pay a small fee for quality" path.
 *
 * Usage: node scripts/enrich-visual-rationales.mjs [--limit=50] [--minutes=60] [--hardest] [--dry-run]
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
const LIMIT = Math.max(1, Number(args.limit ?? 40));
const MAX_MS = args.minutes ? Number(args.minutes) * 60000 : Infinity;
const DRY = Boolean(args["dry-run"]);
const HARDEST = Boolean(args.hardest);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function readKey(envName, fileName, re) {
  if (process.env[envName]) return process.env[envName].trim();
  const p = resolve(homedir(), "Downloads", fileName);
  if (!existsSync(p)) return "";
  const raw = readFileSync(p, "utf8");
  const m = raw.match(re); return m ? m[0] : "";
}
// Provider rotation with the proven throttle from the live content engine:
// per-provider rate limits, 429 cooldown, failure parking, and pick-the-ready.
// OpenRouter (top model) is used exclusively when a valid key exists; otherwise
// the free pair Cerebras gpt-oss-120b + Groq llama-3.3-70b.
// --premium: route through a top OpenRouter model (default claude-sonnet-5),
// PREFERRED over the free pair which stays as fallback. Needs OpenRouter credits.
const PREMIUM = Boolean(args.premium);
const PREMIUM_MODEL = typeof args.premium === "string" ? args.premium : "anthropic/claude-sonnet-5";
const OPENROUTER_KEY = readKey("OPENROUTER_API_KEY", "hermesopenrouter.txt", /sk-or-v1-[A-Za-z0-9]{20,}/)
  || readKey("OPENROUTER_API_KEY", "openrouterkey.txt", /sk-or-[0-9A-Za-z_\-]{20,}/);
const DEFS = {
  cerebras: { key: readKey("CEREBRAS_API_KEY", "cerebraskey.txt", /csk-[0-9A-Za-z]{20,}/), rpm: 5, url: "https://api.cerebras.ai/v1/chat/completions", model: "gpt-oss-120b", low: true },
  groq: { key: readKey("GROQ_API_KEY", "groqkey.txt", /gsk_[0-9A-Za-z]{20,}/), rpm: 6, url: "https://api.groq.com/openai/v1/chat/completions", model: "llama-3.3-70b-versatile", low: false },
};
if (PREMIUM && OPENROUTER_KEY) {
  DEFS.openrouter = { key: OPENROUTER_KEY, rpm: 20, url: "https://openrouter.ai/api/v1/chat/completions", model: PREMIUM_MODEL, low: false };
}
const USE_TOP = Boolean(PREMIUM && OPENROUTER_KEY);
const state = {};
for (const k of Object.keys(DEFS)) state[k] = { last: 0, cooldownUntil: 0, minInterval: Math.ceil((60000 / DEFS[k].rpm) * 1.12), fails: 0 };
const healthy = () => Object.keys(DEFS).filter((k) => DEFS[k].key);
const nextFree = (k) => Math.max(state[k].cooldownUntil, state[k].last + state[k].minInterval);
function pick() {
  const now = Date.now();
  let c = healthy().filter((k) => state[k].cooldownUntil < now + 300000 && state[k].fails < 5);
  if (!c.length) c = healthy().filter((k) => state[k].cooldownUntil < now + 300000);
  if (!c.length) c = healthy();
  if (!c.length) return null;
  const ready = c.filter((k) => nextFree(k) <= now);
  if (ready.includes("openrouter")) return "openrouter"; // --premium: prefer the top model
  return ready.length ? ready[Math.floor(Math.random() * ready.length)] : c.sort((a, b) => nextFree(a) - nextFree(b))[0];
}
async function rawCall(name, prompt) {
  const d = DEFS[name];
  const body = { model: d.model, messages: [{ role: "user", content: prompt }], temperature: 0.4, max_tokens: 1400 };
  if (d.low) body.reasoning_effort = "low";
  const res = await fetch(d.url, { method: "POST", headers: { "content-type": "application/json", Authorization: `Bearer ${d.key}` }, body: JSON.stringify(body), signal: AbortSignal.timeout(45000) });
  if (res.status === 429) return { text: "", status: 429, retryAfter: Number(res.headers.get("retry-after")) || 60 };
  if (!res.ok) return { text: "", status: res.status };
  const j = await res.json();
  return { text: j.choices?.[0]?.message?.content || j.choices?.[0]?.message?.reasoning_content || "", status: 200 };
}
async function callModel(prompt) {
  const name = pick();
  if (!name) return "";
  const wait = Math.max(0, nextFree(name) - Date.now());
  if (wait > 0) await sleep(wait);
  const s = state[name];
  s.last = Date.now();
  let r;
  try { r = await rawCall(name, prompt); } catch { r = { text: "", status: -1 }; }
  if (r.status === 429) s.cooldownUntil = Date.now() + r.retryAfter * 1000;
  else if (r.status === -1 || r.status >= 500) s.cooldownUntil = Date.now() + 900000;
  if (!r.text) { s.fails++; } else { s.fails = 0; }
  return r.text;
}

const SHELL = { cwd: WEB, encoding: "utf8", maxBuffer: 256 * 1024 * 1024, shell: true };
function q(s) { return process.platform === "win32" ? `"${String(s).replace(/"/g, '""')}"` : `'${String(s).replace(/'/g, "'\\''")}'`; }
function d1Query(sql, attempt = 0) {
  const r = spawnSync(`npx wrangler d1 execute chapai-prod --remote --json --command=${q(sql.replace(/\s+/g, " ").trim())}`, SHELL);
  if (r.status !== 0) {
    if (attempt < 3) { spawnSync(process.platform === "win32" ? "timeout /t 3 >nul" : "sleep 3", { shell: true }); return d1Query(sql, attempt + 1); }
    throw new Error("d1 query failed: " + (r.stderr || r.stdout).slice(0, 400));
  }
  const m = r.stdout.match(/\[[\s\S]*\]/); return JSON.parse(m[0])[0].results;
}
function d1ExecFile(path, attempt = 0) {
  const r = spawnSync(`npx wrangler d1 execute chapai-prod --remote --file=${q(path)}`, SHELL);
  if (r.status !== 0) {
    // Windows spawnSync can die with a transient libuv assertion mid-run — retry.
    if (attempt < 3) { spawnSync(process.platform === "win32" ? "timeout /t 3 >nul" : "sleep 3", { shell: true }); return d1ExecFile(path, attempt + 1); }
    throw new Error("d1 exec failed: " + (r.stderr || r.stdout).slice(0, 400));
  }
  return true;
}
const esc = (s) => String(s ?? "").replace(/'/g, "''");
const parseOpts = (raw) => { try { const o = JSON.parse(raw); return Array.isArray(o) ? o : []; } catch { return []; } };

function buildPrompt(row) {
  const opts = parseOpts(row.options);
  const optText = opts.length ? opts.map((o) => `${String(o.id).toLowerCase()}. ${o.text}`).join("\n") : "(see stem)";
  return `You are a doctorally-prepared NCLEX-RN nurse educator building a PREMIUM VISUAL GUIDE that must rival UWorld and Archer. This visual is a SEPARATE learning aid that sits beside a full written rationale — its job is to give a VISUAL LEARNER something that makes the answer stick, NOT to restate prose. Return STRICT JSON only (no markdown, no prose):
{
  "diagramWorthy": boolean,   // true when a visual genuinely deepens understanding (a cascade, a lab picture, an onset/priority race, or an answer-decision map). false for pure recall/definition — do NOT force one.
  "visual": null OR {
    "type": "timeline" | "compare" | "trend" | "flow" | "pathway",
    "title": string,          // specific + clinical, <= 60 chars
    "caption": string,        // one orienting line, <= 100 chars
    // PICK THE TYPE THAT MAPS THIS ITEM'S DISCRIMINATOR:
    // "timeline"  — when the answer turns on ONSET SPEED or SEQUENCE ("which first", priority, time-to-effect).
    //   items ordered fastest/first -> slowest/last; set highlight:true on the winning move.
    "items": [ { "label": string, "value": string, "note": string, "highlight": boolean } ],  // value = time (e.g. "1-3 min","hours"); note = why it lands there vs the others
    // "compare"   — when it is a SELECT-BEST among plausible options; visualize the decision.
    //   Provide a crux PER OPTION LETTER. Do NOT label correctness yourself — the app sets the checkmark from the answer key.
    "optionNotes": { "a": string, "b": string },  // one sharp clause per option: why it wins, or its exact clinical error / when it WOULD be right
    // "trend"     — when it hinges on interpreting LABS/VITALS (renders as reference-range gauges).
    "metrics": [ { "label": string, "value": string, "direction": "up"|"down"|"steady", "directionLabel": string, "range": string } ],  // real value+unit; range = normal band e.g. "3.5-5.0"
    // "flow"/"pathway" — a management/pathophysiology CASCADE (renders top-down with arrows).
    //   nodes[0]=trigger/cue, nodes[1..]=ordered actions (value=dose/rate/target/timeframe), nodes[last]=outcome.
    "nodes": [ { "label": string, "value": string } ],  // 4-6 total
    "conclusion": string      // the single memorable, testable pearl
  },
  "structured": {
    "overview": string,       // 2-3 sentences: the governing clinical principle
    "mechanism": string,      // 2-3 sentences: the SPECIFIC pathophysiology/pharmacology
    "whyCorrect": string,     // 2-3 sentences: precisely why the correct option is right, tied to mechanism
    "whyWrong": { "a": string, "b": string }  // one specific sentence per WRONG option letter naming its exact error
  }
}
QUALITY BAR — non-negotiable:
- Prefer "timeline" for priority/"which-first" items and "compare" for select-best items — these map the reasoning best. Use "trend" for lab items, "flow" for management sequences.
- Every label/note is a descriptive CLINICAL phrase with exact numbers/units/doses/timeframes. NEVER a bare letter, number, or "Step 1". No "monitor closely" filler.
- For "compare": give a crux for EVERY option letter (correct + wrong). For "timeline": include the correct move AND the tempting-but-slower distractors so the race is visible.
- Be current and precise; NEVER contradict the given correct answer.
- If diagramWorthy is false, set "visual" to null but STILL return a rich "structured" block.

STEM: ${row.stem}
OPTIONS:
${optText}
CORRECT ANSWER: ${row.answer}
EXISTING RATIONALE: ${String(row.rationale).slice(0, 900)}`;
}

// Parse the correct-answer key into a set of option-letter ids (SATA-aware).
function answerIdSet(answer) {
  const raw = String(answer ?? "").trim();
  if (raw.startsWith("[")) { try { return new Set(JSON.parse(raw).map((x) => String(x).toLowerCase())); } catch { return new Set(); } }
  if (raw.startsWith("{")) return new Set();
  return new Set(raw ? [raw.toLowerCase()] : []);
}

function extractJson(text) {
  const t = text.replace(/^```[a-z]*\s*/i, "").replace(/```\s*$/i, "").trim();
  const s = t.indexOf("{"); const e = t.lastIndexOf("}");
  if (s === -1 || e === -1) return null;
  try { return JSON.parse(t.slice(s, e + 1)); } catch { return null; }
}

// Quality gate: a label that is a bare option letter, a number, or "Step N" is a
// low-effort placeholder — reject the whole diagram so only premium ones ship.
const isWeakLabel = (s) => {
  const t = String(s ?? "").trim();
  return t.length < 3 || /^(option\s+)?[a-f]$/i.test(t) || /^\d+$/.test(t) || /^step\s*\d+$/i.test(t) || /^(choice|answer)\s*[a-f\d]+$/i.test(t);
};

const wc = (s) => String(s ?? "").trim().split(/\s+/).filter(Boolean).length;

// Validate + ASSEMBLE the visual. For "compare", verdicts are set mechanically
// from the answer key (row) — the model is never trusted for correctness.
function validVisual(v, row) {
  if (!v || typeof v !== "object") return null;
  const types = ["timeline", "compare", "trend", "flow", "pathway", "signal", "overview"];
  if (!types.includes(v.type) || !v.title) return null;
  const out = { type: v.type, title: String(v.title).slice(0, 80) };
  if (v.caption) out.caption = String(v.caption).slice(0, 140);

  if (v.type === "compare") {
    const opts = parseOpts(row.options);
    const notes = v.optionNotes && typeof v.optionNotes === "object" ? v.optionNotes : {};
    const correct = answerIdSet(row.answer);
    if (!opts.length || opts.length < 2 || !correct.size) return null;
    const options = opts.slice(0, 6).map((o) => {
      const id = String(o.id).toLowerCase();
      const note = String(notes[id] ?? notes[id.toUpperCase()] ?? "").trim().replace(/\s+/g, " ");
      return { label: `${id.toUpperCase()} · ${String(o.text).slice(0, 70)}`, verdict: correct.has(id) ? "correct" : "wrong", note: note.slice(0, 240) };
    });
    // Need a real crux on most options and at least one correct verdict present.
    if (options.filter((o) => wc(o.note) >= 5).length < Math.max(2, opts.length - 1)) return null;
    out.options = options;
  } else if (v.type === "timeline") {
    if (!Array.isArray(v.items) || v.items.length < 2) return null;
    const items = v.items.slice(0, 6)
      .filter((it) => !isWeakLabel(it.label) && String(it.value ?? "").trim().length > 0 && wc(it.note) >= 4)
      .map((it) => ({ label: String(it.label).slice(0, 60), value: String(it.value).slice(0, 24), note: String(it.note).slice(0, 200), highlight: Boolean(it.highlight) }));
    if (items.length < 2) return null;
    if (!items.some((it) => it.highlight)) items[0].highlight = true; // ensure a winner is marked
    out.items = items;
  } else {
    if (Array.isArray(v.metrics) && v.metrics.length) {
      const metrics = v.metrics.slice(0, 6)
        .filter((m) => !isWeakLabel(m.label) && String(m.value ?? "").trim().length > 0)
        .map((m) => ({ label: String(m.label).slice(0, 60), value: String(m.value).slice(0, 40), direction: ["up", "down", "steady"].includes(m.direction) ? m.direction : undefined, directionLabel: m.directionLabel ? String(m.directionLabel).slice(0, 30) : undefined, range: m.range && /\d/.test(String(m.range)) ? String(m.range).slice(0, 24) : undefined }));
      if (metrics.length >= 2) out.metrics = metrics;
    }
    if (Array.isArray(v.nodes) && v.nodes.length) {
      const nodes = v.nodes.slice(0, 6)
        .filter((n) => !isWeakLabel(n.label) && String(n.value ?? "").trim().length >= 3)
        .map((n) => ({ label: String(n.label).slice(0, 60), value: String(n.value).slice(0, 120) }));
      if (nodes.length >= 3) out.nodes = nodes;
    }
    if (!out.metrics && !out.nodes) return null;
  }
  if (v.conclusion) out.conclusion = String(v.conclusion).slice(0, 220);
  return out;
}

async function main() {
  console.error(`[visual] limit=${LIMIT} providers=[${healthy().join(",")}]${USE_TOP ? " TOP" : ""} dry=${DRY} hardest=${HARDEST}`);
  if (!healthy().length) { console.error("[visual] no model key (need Downloads/cerebraskey.txt, groqkey.txt, or openrouterkey.txt)"); process.exit(1); }
  const order = HARDEST ? "difficulty DESC, " : "";
  const rows = d1Query(`SELECT id, stem, options, answer, rationale FROM questions WHERE exam='nclex' AND publish_state='published' AND rationale IS NOT NULL AND length(rationale)>=60 AND (visual_rationale IS NULL OR length(visual_rationale)<10) ORDER BY ${order}review_status='final-curated-live' DESC LIMIT ${LIMIT}`);
  console.error(`[visual] ${rows.length} candidate rows`);

  let vis = 0, structOnly = 0, fail = 0, i = 0;
  const updates = []; const t0 = Date.now();
  const flush = () => { if (DRY || !updates.length) { updates.length = 0; return; } const f = resolve(TMP, `visual-${Date.now()}.sql`); writeFileSync(f, updates.join("\n")); d1ExecFile(f); updates.length = 0; };

  for (const row of rows) {
    if (Date.now() - t0 > MAX_MS) { console.error("[visual] time budget reached"); break; }
    i++;
    let raw = "";
    try { raw = await callModel(buildPrompt(row)); } catch (e) { fail++; continue; }
    const parsed = extractJson(raw);
    if (!parsed) { fail++; continue; }
    const sets = [];
    const visual = parsed.diagramWorthy ? validVisual(parsed.visual, row) : null;
    if (visual) sets.push(`visual_rationale='${esc(JSON.stringify(visual))}'`);
    if (parsed.structured && parsed.structured.whyCorrect) {
      sets.push(`structured_rationale='${esc(JSON.stringify(parsed.structured))}'`);
    }
    if (!sets.length) { fail++; continue; }
    updates.push(`UPDATE questions SET ${sets.join(", ")} WHERE id='${esc(row.id)}' AND publish_state='published';`);
    if (visual) vis++; else structOnly++;
    if (updates.length >= 5) flush();
    if (i % 5 === 0 || i <= 3) console.error(`[visual] ${i}/${rows.length} diagrams=${vis} struct-only=${structOnly} fail=${fail} ${((Date.now() - t0) / 60000).toFixed(1)}min`);
    // pacing handled by the provider throttle in callModel
  }
  flush();
  console.error(`[visual] DONE diagrams=${vis} struct-only=${structOnly} fail=${fail} scanned=${i}${DRY ? " (DRY)" : ""}`);
}
main().catch((e) => { console.error("[visual] FATAL", e); process.exit(1); });
