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
const CEREBRAS_KEY = readKey("CEREBRAS_API_KEY", "cerebraskey.txt", /csk-[0-9A-Za-z]{20,}/);
const GROQ_KEY = readKey("GROQ_API_KEY", "groqkey.txt", /gsk_[0-9A-Za-z]{20,}/);
const OPENROUTER_KEY = readKey("OPENROUTER_API_KEY", "openrouterkey.txt", /sk-or-[0-9A-Za-z_\-]{20,}/);
const USE_TOP = Boolean(OPENROUTER_KEY);

// Provider rotation: OpenRouter top model when a valid key exists (the paid-quality
// path), else the proven free pair — Cerebras gpt-oss-120b (primary) + Groq
// llama-3.3-70b (fallback), same providers the live content engine runs on.
async function oneCall(provider, prompt) {
  if (provider === "openrouter") {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST", headers: { "content-type": "application/json", Authorization: `Bearer ${OPENROUTER_KEY}` },
      body: JSON.stringify({ model: "anthropic/claude-3.5-sonnet", messages: [{ role: "user", content: prompt }], temperature: 0.4, max_tokens: 1400 }),
      signal: AbortSignal.timeout(45000),
    });
    if (!res.ok) return "";
    return (await res.json()).choices?.[0]?.message?.content ?? "";
  }
  const cfg = provider === "cerebras"
    ? { url: "https://api.cerebras.ai/v1/chat/completions", key: CEREBRAS_KEY, model: "gpt-oss-120b", low: true }
    : { url: "https://api.groq.com/openai/v1/chat/completions", key: GROQ_KEY, model: "llama-3.3-70b-versatile", low: false };
  const body = { model: cfg.model, messages: [{ role: "user", content: prompt }], temperature: 0.4, max_tokens: 1400 };
  if (cfg.low) body.reasoning_effort = "low";
  const res = await fetch(cfg.url, { method: "POST", headers: { "content-type": "application/json", Authorization: `Bearer ${cfg.key}` }, body: JSON.stringify(body), signal: AbortSignal.timeout(45000) });
  if (!res.ok) return "";
  const j = await res.json();
  return j.choices?.[0]?.message?.content || j.choices?.[0]?.message?.reasoning_content || "";
}
async function callModel(prompt) {
  const chain = USE_TOP ? ["openrouter"] : ["cerebras", "groq"];
  for (const p of chain) {
    try { const t = await oneCall(p, prompt); if (t && t.length > 30) return t; } catch { /* try next */ }
  }
  return "";
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
  return `You are a senior NCLEX-RN nurse educator. For the question below, return STRICT JSON only (no markdown, no prose) with this exact shape:
{
  "diagramWorthy": boolean,   // true only if a diagram genuinely clarifies the concept (pathophysiology cascade, lab/vital trend, prioritization or nursing-process flow, comparative concept). false for pure recall/definition items.
  "visual": null OR {
    "type": "trend" | "flow" | "pathway" | "signal" | "overview",
    "title": string,          // <= 60 chars
    "caption": string,        // <= 90 chars, optional context
    "metrics": [ { "label": string, "value": string, "direction": "up"|"down"|"steady", "directionLabel": string } ],  // ONLY for type "trend" (labs/vitals); else omit
    "nodes": [ { "label": string, "value": string } ],  // ordered steps for flow/pathway/overview/signal; 3-6 items; omit for trend
    "conclusion": string      // one-line clinical takeaway
  },
  "structured": {
    "overview": string,       // 1-2 sentences: the core principle
    "mechanism": string,      // 1-2 sentences: the pathophysiology/why
    "whyCorrect": string,     // why the correct answer is right, specific
    "whyWrong": { "A": string, "B": string }  // per WRONG option letter, why it is wrong
  }
}
Rules: be clinically accurate; never contradict the given correct answer; use only real values; concise. If diagramWorthy is false, set "visual" to null.

STEM: ${row.stem}
OPTIONS:
${optText}
CORRECT ANSWER: ${row.answer}
EXISTING RATIONALE: ${String(row.rationale).slice(0, 700)}`;
}

function extractJson(text) {
  const t = text.replace(/^```[a-z]*\s*/i, "").replace(/```\s*$/i, "").trim();
  const s = t.indexOf("{"); const e = t.lastIndexOf("}");
  if (s === -1 || e === -1) return null;
  try { return JSON.parse(t.slice(s, e + 1)); } catch { return null; }
}

function validVisual(v) {
  if (!v || typeof v !== "object") return null;
  const types = ["trend", "flow", "pathway", "signal", "overview"];
  if (!types.includes(v.type) || !v.title) return null;
  const out = { type: v.type, title: String(v.title).slice(0, 80) };
  if (v.caption) out.caption = String(v.caption).slice(0, 140);
  if (Array.isArray(v.metrics) && v.metrics.length) {
    out.metrics = v.metrics.slice(0, 6).map((m) => ({ label: String(m.label).slice(0, 60), value: String(m.value).slice(0, 40), direction: ["up", "down", "steady"].includes(m.direction) ? m.direction : undefined, directionLabel: m.directionLabel ? String(m.directionLabel).slice(0, 30) : undefined }));
  }
  if (Array.isArray(v.nodes) && v.nodes.length) {
    out.nodes = v.nodes.slice(0, 6).map((n) => ({ label: String(n.label).slice(0, 60), value: String(n.value ?? "").slice(0, 120) }));
  }
  if (!out.metrics && !out.nodes) return null;
  if (v.conclusion) out.conclusion = String(v.conclusion).slice(0, 200);
  return out;
}

async function main() {
  console.error(`[visual] limit=${LIMIT} model=${USE_TOP ? "openrouter/claude-3.5-sonnet (TOP)" : "cerebras gpt-oss-120b + groq (free)"} dry=${DRY} hardest=${HARDEST}`);
  if (!CEREBRAS_KEY && !GROQ_KEY && !USE_TOP) { console.error("[visual] no model key (need Downloads/cerebraskey.txt, groqkey.txt, or openrouterkey.txt)"); process.exit(1); }
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
    if (!USE_TOP) await sleep(12500); // Cerebras ~5 rpm — stay under the free limit
  }
  flush();
  console.error(`[visual] DONE diagrams=${vis} struct-only=${structOnly} fail=${fail} scanned=${i}${DRY ? " (DRY)" : ""}`);
}
main().catch((e) => { console.error("[visual] FATAL", e); process.exit(1); });
