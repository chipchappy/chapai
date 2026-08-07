#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Priority 1 — case study prose scenario → structured chart tabs.
//
// All 534 published case studies carry a 2-3 sentence `scenario` blob and no
// chart at all. This turns that into the tabbed chart an NGN case study needs:
// HPI, nurses' notes, labs, orders, vitals timeline — where each tab carries
// information the others do not.
//
// The non-overlap requirement is enforced TWICE: once in the prompt, and again
// as a hard gate on the model's output. Anything that fails the gate is rejected
// and retried, never written. A model told "make the tabs distinct" will happily
// paraphrase the same paragraph five ways otherwise.
//
// Writes to a staging JSONL. It does NOT touch production — apply is a separate,
// reviewable step.
//
//   node scripts/enrich-case-study-charts.mjs --limit 5            # sample
//   node scripts/enrich-case-study-charts.mjs --limit 534          # full run
//   node scripts/enrich-case-study-charts.mjs --limit 5 --show     # print output
// ─────────────────────────────────────────────────────────────────────────────
import { execFileSync } from "node:child_process";
import { appendFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const ROOT = resolve(import.meta.dirname, "..");
const WRANGLER = resolve(ROOT, "node_modules/wrangler/bin/wrangler.js");
const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const LIMIT = Number(flag("limit", "5"));
const SHOW = args.includes("--show");
const OUT = resolve(ROOT, flag("out", "packages/content/staging/case-study-charts.jsonl"));
const MODEL = flag("model", "meta/llama-3.3-70b-instruct");

// Env keys in this shell are quote-wrapped; strip them or auth fails with 401.
const API_KEY = (process.env.NVIDIA_API_KEY ?? "").replace(/^["']|["']$/g, "").trim();
if (!API_KEY) { console.error("NVIDIA_API_KEY is required."); process.exit(1); }

function d1(sql) {
  const env = { ...process.env };
  delete env.CLOUDFLARE_API_TOKEN;
  delete env.CLOUDFLARE_ACCOUNT_ID;
  const raw = execFileSync(process.execPath, [
    WRANGLER, "d1", "execute", "chapai-prod", "--remote", "--json", "--command", sql.replace(/\s+/g, " ").trim(),
  ], { cwd: resolve(ROOT, "apps/web"), env, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  return JSON.parse(raw.slice(raw.indexOf("[")))[0]?.results ?? [];
}

async function chat(messages, { maxTokens = 2200, temperature = 0.4 } = {}) {
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, messages, max_tokens: maxTokens, temperature }),
    });
    if (response.status === 429 || response.status >= 500) {
      await sleep(attempt * 4000);   // free tier is rate limited; back off rather than fail the row
      continue;
    }
    if (!response.ok) throw new Error(`${response.status} ${(await response.text()).slice(0, 180)}`);
    const payload = await response.json();
    return payload.choices?.[0]?.message?.content ?? "";
  }
  throw new Error("exhausted retries");
}

const SYSTEM = `You are a nurse educator who writes NCLEX Next Generation case study charts.
You produce ONLY valid minified JSON. No prose, no markdown, no code fences.`;

function buildPrompt(row) {
  return `Build the electronic chart for this NCLEX-RN case study.

CASE TITLE: ${row.scenario_title ?? "Untitled"}
EXISTING SUMMARY: ${row.scenario}
THE QUESTION BEING ASKED: ${row.stem}

Return JSON with exactly these keys:
{"hpi":[..],"notes":[..],"labs":[..],"orders":[..],"timeline":[..]}

ABSOLUTE RULE — each tab must contain information found in NO other tab. A student
who reads one tab must still need the others. Do not restate the summary in any tab.

hpi (3-5 strings): the history a provider documents. Onset and progression of the
  presenting problem, pertinent positives AND negatives, relevant past medical/
  surgical/obstetric history, home medications, allergies, social context.
  NO vital signs. NO lab values. NO nursing observations.

notes (3-5 strings): timed nurses' notes, each beginning "HH:MM — ". Objective
  bedside observations only: assessment findings, patient statements in quotes,
  interventions performed and the patient's response. NO history. NO lab values.

labs (3-6 strings): "Test: value unit (reference range)" with a flag where
  abnormal. Only tests genuinely relevant to this case. NO interpretation.

orders (3-5 strings): active provider orders — medications with dose/route/
  frequency, monitoring, diet, activity. NO assessment findings.

timeline (3-4 strings): vital sign sets over time, "HH:MM — BP x/y, HR z, RR a,
  T b°C, SpO2 c%". Values must trend in a way consistent with the case.

Clinical accuracy is mandatory. Values must be internally consistent and must
support the question being asked without giving the answer away.`;
}

// ── the distinctness gate ───────────────────────────────────────────────────
const norm = (v) => String(v ?? "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
const contentWords = (arr) => new Set(
  (Array.isArray(arr) ? arr : []).flatMap((s) => norm(s).split(" ")).filter((w) => w.length > 4),
);

function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const w of a) if (b.has(w)) shared += 1;
  return shared / new Set([...a, ...b]).size;
}

function gate(chart, row) {
  const problems = [];
  const need = { hpi: 3, notes: 3, labs: 3, orders: 3, timeline: 3 };
  for (const [key, min] of Object.entries(need)) {
    const arr = chart?.[key];
    if (!Array.isArray(arr) || arr.length < min) problems.push(`${key}: expected >=${min} entries, got ${Array.isArray(arr) ? arr.length : "none"}`);
  }
  if (problems.length) return problems;

  // No tab may substantially restate another, nor the original summary.
  const sets = Object.fromEntries(Object.keys(need).map((k) => [k, contentWords(chart[k])]));
  const pairs = [["hpi", "notes"], ["hpi", "timeline"], ["hpi", "labs"], ["notes", "labs"], ["notes", "orders"], ["notes", "timeline"]];
  for (const [a, b] of pairs) {
    const overlap = jaccard(sets[a], sets[b]);
    if (overlap > 0.32) problems.push(`${a} and ${b} overlap ${(overlap * 100).toFixed(0)}%`);
  }
  const summary = contentWords([row.scenario]);
  for (const key of ["hpi", "notes"]) {
    if (jaccard(sets[key], summary) > 0.42) problems.push(`${key} restates the existing summary`);
  }

  // Tab-specific contract: nurses' notes are timed, labs carry numbers.
  const timed = (chart.notes ?? []).filter((s) => /^\d{1,2}:\d{2}\s*[—-]/.test(String(s).trim())).length;
  if (timed < Math.ceil(chart.notes.length / 2)) problems.push("notes are not timed entries");
  if (!(chart.labs ?? []).some((s) => /\d/.test(String(s)))) problems.push("labs carry no values");
  if ((chart.hpi ?? []).some((s) => /\bBP\b|\bHR\b|SpO2|\bRR\b/i.test(String(s)))) problems.push("hpi contains vital signs (belongs in timeline)");

  return problems;
}

function parseJson(raw) {
  const cleaned = String(raw).replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end < 0) return null;
  try { return JSON.parse(cleaned.slice(start, end + 1)); } catch { return null; }
}

// ── run ─────────────────────────────────────────────────────────────────────
const done = new Set();
if (existsSync(OUT)) {
  for (const line of readFileSync(OUT, "utf8").split("\n")) {
    if (!line.trim()) continue;
    try { done.add(JSON.parse(line).id); } catch { /* ignore partial line */ }
  }
}
console.log(`Already staged: ${done.size}`);

const rows = d1(`SELECT id, scenario_title, scenario, stem FROM questions
  WHERE publish_state='published' AND type='case_study'
    AND (chart_review IS NULL OR length(chart_review) < 80)
  ORDER BY id LIMIT ${LIMIT + done.size}`).filter((r) => !done.has(r.id)).slice(0, LIMIT);

console.log(`Enriching ${rows.length} case studies with ${MODEL}\n`);
mkdirSync(dirname(OUT), { recursive: true });

let accepted = 0, rejected = 0;
for (const [index, row] of rows.entries()) {
  let chart = null, problems = ["not attempted"];
  for (let attempt = 1; attempt <= 3 && problems.length; attempt += 1) {
    try {
      const messages = [
        { role: "system", content: SYSTEM },
        { role: "user", content: buildPrompt(row) },
      ];
      // Feed the gate's complaints back on retry — far more effective than
      // simply re-rolling the same prompt.
      if (problems.length && problems[0] !== "not attempted") {
        messages.push({ role: "assistant", content: JSON.stringify(chart ?? {}) });
        messages.push({ role: "user", content: `Rejected: ${problems.join("; ")}. Fix these and return corrected JSON only.` });
      }
      const raw = await chat(messages, { temperature: attempt === 1 ? 0.35 : 0.6 });
      chart = parseJson(raw);
      problems = chart ? gate(chart, row) : ["unparseable JSON"];
    } catch (error) {
      problems = [`request failed: ${error.message}`];
    }
    if (problems.length) await sleep(1200);
  }

  if (problems.length) {
    rejected += 1;
    console.log(`  ✗ ${row.id} — ${problems.slice(0, 2).join("; ")}`);
  } else {
    accepted += 1;
    appendFileSync(OUT, `${JSON.stringify({ id: row.id, scenarioTitle: row.scenario_title, chart, model: MODEL, generatedAt: new Date().toISOString() })}\n`);
    console.log(`  ✓ ${row.id}`);
    if (SHOW) console.log(JSON.stringify(chart, null, 2));
  }
  await sleep(900);   // stay inside the free tier's request rate
  if ((index + 1) % 25 === 0) console.log(`  … ${index + 1}/${rows.length}`);
}

console.log(`\nAccepted ${accepted}, rejected ${rejected}. Staged in ${OUT}`);
console.log("Nothing was written to production. Review the staging file, then apply separately.");
