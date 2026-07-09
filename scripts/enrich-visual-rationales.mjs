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
const OPENROUTER_KEY = readKey("OPENROUTER_API_KEY", "openrouterkey.txt", /sk-or-[0-9A-Za-z_\-]{20,}/);
const DEFS = OPENROUTER_KEY
  ? { openrouter: { key: OPENROUTER_KEY, rpm: 20, url: "https://openrouter.ai/api/v1/chat/completions", model: "anthropic/claude-3.5-sonnet", low: false } }
  : {
      cerebras: { key: readKey("CEREBRAS_API_KEY", "cerebraskey.txt", /csk-[0-9A-Za-z]{20,}/), rpm: 5, url: "https://api.cerebras.ai/v1/chat/completions", model: "gpt-oss-120b", low: true },
      groq: { key: readKey("GROQ_API_KEY", "groqkey.txt", /gsk_[0-9A-Za-z]{20,}/), rpm: 6, url: "https://api.groq.com/openai/v1/chat/completions", model: "llama-3.3-70b-versatile", low: false },
    };
const USE_TOP = Boolean(OPENROUTER_KEY);
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
function d1Query(sql) {
  const r = spawnSync(`npx wrangler d1 execute chapai-prod --remote --json --command=${q(sql.replace(/\s+/g, " ").trim())}`, SHELL);
  if (r.status !== 0) throw new Error("d1 query failed: " + (r.stderr || r.stdout).slice(0, 400));
  const m = r.stdout.match(/\[[\s\S]*\]/); return JSON.parse(m[0])[0].results;
}
function d1ExecFile(path) {
  const r = spawnSync(`npx wrangler d1 execute chapai-prod --remote --file=${q(path)}`, SHELL);
  if (r.status !== 0) throw new Error("d1 exec failed: " + (r.stderr || r.stdout).slice(0, 400));
  return true;
}
const esc = (s) => String(s ?? "").replace(/'/g, "''");
const parseOpts = (raw) => { try { const o = JSON.parse(raw); return Array.isArray(o) ? o : []; } catch { return []; } };

function buildPrompt(row) {
  const opts = parseOpts(row.options);
  const optText = opts.length ? opts.map((o) => `${String(o.id).toUpperCase()}. ${o.text}`).join("\n") : "(see stem)";
  return `You are a doctorally-prepared NCLEX-RN nurse educator writing PREMIUM board-review content that must rival UWorld and Archer. Return STRICT JSON only (no markdown, no prose) with this exact shape:
{
  "diagramWorthy": boolean,   // true ONLY when a visual genuinely deepens understanding: a pathophysiology cascade, a lab/vital trend, a prioritization/nursing-process algorithm, or a staged management pathway. false for pure recall/definition/single-fact items — do NOT force a diagram.
  "visual": null OR {
    "type": "trend" | "flow" | "pathway",
    "title": string,          // specific and clinical, <= 60 chars (e.g. "DKA Correction Sequence", not "Management")
    "caption": string,        // one line of orienting context, <= 100 chars
    // Choose "trend" whenever the item hinges on interpreting LABS or VITALS. It renders as a bar chart.
    "metrics": [ { "label": string, "value": string, "direction": "up"|"down"|"steady", "directionLabel": string } ],  // 3-5 real labs/vitals WITH a numeric value + unit so bars scale (e.g. label "Serum K+", value "5.9 mEq/L", direction "up", directionLabel "high"); include the abnormal AND relevant normal values that define the picture
    // Otherwise use "flow"/"pathway". It renders as a real top-down FLOWCHART, so:
    //   nodes[0]   = the clinical TRIGGER or presenting cue (short, e.g. "Fever + chills during transfusion")
    //   nodes[1..] = ordered ACTIONS, each label = the action, value = the concrete specific (dose/rate/target/timeframe)
    //   nodes[last]= the expected OUTCOME / resolution (e.g. "Symptoms resolve; document reaction")
    "nodes": [ { "label": string, "value": string } ],  // 4-6 total: trigger + actions + outcome
    "conclusion": string      // a memorable, testable clinical pearl (the single thing to remember)
  },
  "structured": {
    "overview": string,       // 2-3 sentences: the governing clinical principle this item tests
    "mechanism": string,      // 2-3 sentences: the SPECIFIC pathophysiology / pharmacology driving the answer
    "whyCorrect": string,     // 2-3 sentences: precisely why the correct option is right, tied to the mechanism
    "whyWrong": { "A": string, "B": string }  // one specific, non-generic sentence per WRONG option letter naming its exact clinical error
  }
}
QUALITY BAR — non-negotiable:
- Node "label" MUST be a descriptive clinical phrase (e.g. "Give isotonic fluids", "Recheck K+ in 2 h"). NEVER a bare option letter ("A"), a number ("1"), or "Step 1".
- Node "value" MUST be filled with a concrete specific: a dose, rate, lab target, timeframe, or parameter (e.g. "0.9% NaCl 15-20 mL/kg/h", "target K+ 3.5-5.0", "within first 15 min"). Never leave it empty or vague.
- Use exact numbers, units, doses, and thresholds throughout. No hand-waving ("monitor closely", "as needed") without the specific metric.
- Prefer type "trend" when the item hinges on interpreting lab/vital values.
- Be clinically precise and current; NEVER contradict the given correct answer. Do not write "the nurse should" filler.
- If diagramWorthy is false, set "visual" to null but STILL return a rich "structured" block.

STEM: ${row.stem}
OPTIONS:
${optText}
CORRECT ANSWER: ${row.answer}
EXISTING RATIONALE: ${String(row.rationale).slice(0, 900)}`;
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

function validVisual(v) {
  if (!v || typeof v !== "object") return null;
  const types = ["trend", "flow", "pathway", "signal", "overview"];
  if (!types.includes(v.type) || !v.title) return null;
  const out = { type: v.type, title: String(v.title).slice(0, 80) };
  if (v.caption) out.caption = String(v.caption).slice(0, 140);
  if (Array.isArray(v.metrics) && v.metrics.length) {
    const metrics = v.metrics.slice(0, 6)
      .filter((m) => !isWeakLabel(m.label) && String(m.value ?? "").trim().length > 0)
      .map((m) => ({ label: String(m.label).slice(0, 60), value: String(m.value).slice(0, 40), direction: ["up", "down", "steady"].includes(m.direction) ? m.direction : undefined, directionLabel: m.directionLabel ? String(m.directionLabel).slice(0, 30) : undefined }));
    if (metrics.length >= 2) out.metrics = metrics;
  }
  if (Array.isArray(v.nodes) && v.nodes.length) {
    const nodes = v.nodes.slice(0, 6)
      // Every node must have a descriptive label AND a concrete value.
      .filter((n) => !isWeakLabel(n.label) && String(n.value ?? "").trim().length >= 3)
      .map((n) => ({ label: String(n.label).slice(0, 60), value: String(n.value).slice(0, 120) }));
    if (nodes.length >= 3) out.nodes = nodes;
  }
  if (!out.metrics && !out.nodes) return null; // nothing survived the quality gate
  if (v.conclusion) out.conclusion = String(v.conclusion).slice(0, 200);
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
    const visual = parsed.diagramWorthy ? validVisual(parsed.visual) : null;
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
