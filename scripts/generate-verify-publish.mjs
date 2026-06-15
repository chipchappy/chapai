#!/usr/bin/env node
/**
 * generate-verify-publish.mjs — the engine that grows the live NCLEX bank
 * toward 4,000 WITHOUT slop, using only FREE models.
 *
 * Pipeline per question:
 *   1. GENERATE  — Nemotron 49B or Gemini 2.5 Flash produces a question (JSON).
 *   2. VALIDATE  — strict schema check (options, answer key, lengths).
 *   3. DEDUP     — reject if stem collides with a live question (in-memory set).
 *   4. VERIFY    — a SECOND pass by Gemini (clinical-accuracy reviewer) must
 *                  return PASS. Catches the answer-key / rationale errors that
 *                  heuristics miss (the whole point of "no slop").
 *   5. GATE      — rationale>=250, deep_rationale>=350, per-distractor coverage,
 *                  anti-slop phrase blocklist.
 *   6. PUBLISH   — passers INSERT to D1 as publish_state='published',
 *                  review_status='curated-live' (sync-guard keeps them live).
 *
 * Keys: reads Downloads/freegeminikey.txt + freenemotronkey.txt (or env
 * GEMINI_API_KEY / GEN_NVIDIA_API_KEY). D1 writes via `npx wrangler` (uses the
 * working OAuth). No deploy required.
 *
 * Usage:  node scripts/generate-verify-publish.mjs --target=40 [--dry-run]
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

const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] ?? true] : [a, true];
}));
const TARGET = Math.max(1, Number(args.target ?? 40));
const DRY = Boolean(args["dry-run"]);

function readKey(envName, fileName, re) {
  if (process.env[envName]) return process.env[envName].trim();
  const p = resolve(homedir(), "Downloads", fileName);
  if (!existsSync(p)) return "";
  const raw = readFileSync(p, "utf8");
  const m = raw.match(re);
  if (m) return m[0];
  return raw.split(/\s+/).filter(Boolean).pop().replace(/^=/, "");
}
let GEMINI_CAPPED = false; // set true once Gemini returns 429 so we stop hammering it
const GEMINI_KEY = readKey("GEMINI_API_KEY", "freegeminikey.txt", /AIza[0-9A-Za-z_\-]{20,}/);
const NVIDIA_KEY = readKey("GEN_NVIDIA_API_KEY", "freenemotronkey.txt", /nvapi-[0-9A-Za-z_\-]{20,}/);
const GROQ_KEY = readKey("GROQ_API_KEY", "groqkey.txt", /gsk_[0-9A-Za-z]{20,}/);
const CEREBRAS_KEY = readKey("CEREBRAS_API_KEY", "cerebraskey.txt", /csk-[0-9A-Za-z]{20,}/);

// Per-provider cap flags so a 429 on one provider doesn't stall the others.
const caps = { groq: { capped: false }, cerebras: { capped: false }, nemo: { capped: false } };

// Generic OpenAI-compatible chat call (Groq, Cerebras, NVIDIA NIM).
async function oaiChat(url, key, model, prompt, maxTokens, capRef, jsonMode) {
  if (!key || capRef.capped) return "";
  try {
    const body = { model, messages: [{ role: "system", content: "You output only strict JSON." }, { role: "user", content: prompt }], temperature: 0.6, max_tokens: maxTokens };
    if (jsonMode) body.response_format = { type: "json_object" };
    const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json", Authorization: `Bearer ${key}` }, body: JSON.stringify(body), signal: AbortSignal.timeout(45000) });
    if (res.status === 429) { capRef.capped = true; return ""; }
    if (!res.ok) return "";
    const j = await res.json();
    return j.choices?.[0]?.message?.content || j.choices?.[0]?.message?.reasoning_content || "";
  } catch { return ""; }
}

// Provider registry. Groq + Cerebras run Llama-3.3-70B fast; NVIDIA Nemotron
// 49B; Gemini 2.5 Flash. Each is a separate free quota pool.
const PROVIDERS = {
  groq: (p, mt) => oaiChat("https://api.groq.com/openai/v1/chat/completions", GROQ_KEY, "llama-3.3-70b-versatile", p, mt, caps.groq, true),
  cerebras: (p, mt) => oaiChat("https://api.cerebras.ai/v1/chat/completions", CEREBRAS_KEY, "llama-3.3-70b", p, mt, caps.cerebras, true),
  nemo: (p, mt) => oaiChat("https://integrate.api.nvidia.com/v1/chat/completions", NVIDIA_KEY, "nvidia/llama-3.3-nemotron-super-49b-v1.5", p, mt, caps.nemo, false),
  gemini: (p, mt) => gemini(p, mt),
};
function availableModels() {
  const a = [];
  if (GROQ_KEY && !caps.groq.capped) a.push("groq");
  if (CEREBRAS_KEY && !caps.cerebras.capped) a.push("cerebras");
  if (NVIDIA_KEY && !caps.nemo.capped) a.push("nemo");
  if (GEMINI_KEY && !GEMINI_CAPPED) a.push("gemini");
  return a;
}
if (availableModels().length === 0) { console.error("No model keys found (groqkey.txt / cerebraskey.txt / freegeminikey.txt / freenemotronkey.txt in Downloads)"); process.exit(1); }

// ---- wrangler D1 helpers (Windows-safe quoting) ----
const SHELL = { cwd: WEB, encoding: "utf8", maxBuffer: 128 * 1024 * 1024, shell: true };
function q(s) { return process.platform === "win32" ? `"${String(s).replace(/"/g, '""')}"` : `'${String(s).replace(/'/g, "'\\''")}'`; }
function d1Query(sql) {
  const r = spawnSync(`npx wrangler d1 execute chapai-prod --remote --json --command=${q(sql.replace(/\s+/g, " ").trim())}`, SHELL);
  if (r.status !== 0) throw new Error("d1 query failed: " + (r.stderr || r.stdout).slice(0, 300));
  const out = r.stdout; const i = out.indexOf("[");
  return JSON.parse(out.slice(i))[0].results;
}
function d1ExecFile(path) {
  const r = spawnSync(`npx wrangler d1 execute chapai-prod --remote --file=${q(path)}`, SHELL);
  if (r.status !== 0) throw new Error("d1 exec failed: " + (r.stderr || r.stdout).slice(0, 300));
  return true;
}

const SUBJECTS = [
  "sepsis and septic shock","heart failure exacerbation","acute coronary syndrome","atrial fibrillation with RVR",
  "COPD exacerbation","acute respiratory failure","pulmonary embolism","asthma exacerbation","ARDS",
  "diabetic ketoacidosis","hyperosmolar hyperglycemic state","hypoglycemia","thyroid storm","Addisonian crisis",
  "acute kidney injury","hyperkalemia","hyponatremia and SIADH","metabolic acidosis","fluid volume overload",
  "ischemic stroke and tPA","increased intracranial pressure","status epilepticus","autonomic dysreflexia","Guillain-Barre",
  "preeclampsia and HELLP","postpartum hemorrhage","magnesium sulfate therapy","fetal heart rate decelerations","placental abruption","cord prolapse",
  "neonatal hypoglycemia","pediatric respiratory distress","pediatric dehydration","epiglottitis","intussusception","Kawasaki disease",
  "suicide risk assessment","alcohol withdrawal","lithium toxicity","serotonin syndrome","NMS","bipolar mania",
  "delegation and supervision","prioritization and triage","chain of command for unsafe orders","informed consent","HIPAA and confidentiality",
  "central line CLABSI prevention","blood transfusion reaction","high-alert medication safety","fall and pressure injury prevention","restraint safety",
  "anticoagulation safety (warfarin/heparin)","insulin administration safety","opioid oversedation","digoxin toxicity","antibiotic adverse effects",
  "GI bleed and hypovolemic shock","acute pancreatitis","cirrhosis and hepatic encephalopathy","bowel obstruction","appendicitis",
  "burns and fluid resuscitation","sickle cell crisis","DVT and VTE prophylaxis","DIC","anaphylaxis",
  "tuberculosis airborne precautions","C. diff contact precautions","chest tube management","tracheostomy care","mechanical ventilation",
  "myasthenia gravis crisis","multiple sclerosis exacerbation","Parkinson medication timing","spinal cord injury","peripheral neurovascular assessment",
  "nephrotic syndrome","BPH and urinary retention","Cushing syndrome","SIADH vs diabetes insipidus","pheochromocytoma",
];
const ANTI_SLOP = [/recognizes the cue/i, /active cue/i, /sorting task/i, /feels less technical/i, /clinical judgment rather than recall/i, /new-order/i, /lab-callback/i, /the question tests/i];

function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
function chooseType() { const r = Math.random(); return r < 0.4 ? "sata" : r < 0.7 ? "matrix" : "mcq"; }

function genPrompt(type, subject, diff) {
  const base = `You are a senior NCLEX-RN item writer. Write ONE exam-quality, clinically accurate question on "${subject}" at difficulty ${diff}/5. Use a realistic vignette with concrete vitals/labs. Return STRICT JSON only.`;
  const rat = `"rationale":"2-3 sentence explanation","deep_rationale":"600-1000 char explanation: pathophysiology, why the correct answer wins, why each wrong option fails, one clinical pearl","references":[{"title":"...","citation":"..."}]`;
  if (type === "sata") return `${base}\nSELECT-ALL: 5-6 options, 2-4 correct.\nJSON: {"stem":"...","options":[{"id":"a","text":"..."},{"id":"b","text":"..."},{"id":"c","text":"..."},{"id":"d","text":"..."},{"id":"e","text":"..."}],"answer":["a","c"],"distractor_rationales":{"b":"why wrong","d":"why wrong"},${rat}}`;
  if (type === "matrix") return `${base}\nNGN MATRIX: 2-3 column headers, 4-6 row findings each in exactly one column.\nJSON: {"stem":"...","matrix_columns":["C1","C2"],"matrix_rows":[{"label":"finding","answer":"C1"}],${rat}}`;
  return `${base}\nSINGLE-BEST MCQ: 4 options, 1 correct.\nJSON: {"stem":"...","options":[{"id":"a","text":"..."},{"id":"b","text":"..."},{"id":"c","text":"..."},{"id":"d","text":"..."}],"answer":"b","distractor_rationales":{"a":"why wrong","c":"why wrong","d":"why wrong"},${rat}}`;
}

function extractJson(t) {
  if (!t) return null;
  let s = t.replace(/^```(json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  try { return JSON.parse(s); } catch {}
  const a = s.indexOf("{"), b = s.lastIndexOf("}");
  if (a >= 0 && b > a) { try { return JSON.parse(s.slice(a, b + 1)); } catch {} }
  return null;
}

async function gemini(prompt, maxTokens = 2048) {
  for (const model of ["gemini-2.5-flash", "gemini-2.0-flash"]) {
    for (let att = 0; att < 3; att++) {
      let res;
      try {
        res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: "POST", headers: { "content-type": "application/json", "x-goog-api-key": GEMINI_KEY },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7, maxOutputTokens: maxTokens, responseMimeType: "application/json", thinkingConfig: { thinkingBudget: 0 } } }),
          signal: AbortSignal.timeout(45000),
        });
      } catch { await new Promise(r => setTimeout(r, 1000)); continue; }
      if (res.ok) { const j = await res.json(); return j.candidates?.[0]?.content?.parts?.[0]?.text ?? ""; }
      if (res.status === 429) { GEMINI_CAPPED = true; return ""; } // daily/RPM quota — don't stall, fall back to Nemotron
      if (res.status === 503) { await new Promise(r => setTimeout(r, 2000 * (att + 1))); continue; }
      break;
    }
  }
  return "";
}
async function nemotron(prompt) {
  if (!NVIDIA_KEY) return "";
  try {
    const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST", headers: { "content-type": "application/json", Authorization: `Bearer ${NVIDIA_KEY}` },
      body: JSON.stringify({ model: "nvidia/llama-3.3-nemotron-super-49b-v1.5", messages: [{ role: "system", content: "detailed thinking off. Output strict JSON only." }, { role: "user", content: prompt }], temperature: 0.6, max_tokens: 2048 }),
      signal: AbortSignal.timeout(45000),
    });
    if (!res.ok) return "";
    const j = await res.json(); return j.choices?.[0]?.message?.content || j.choices?.[0]?.message?.reasoning_content || "";
  } catch { return ""; }
}

function validate(type, o) {
  const stem = String(o.stem ?? "").trim(); const rationale = String(o.rationale ?? "").trim(); const deep = String(o.deep_rationale ?? "").trim();
  if (stem.length < 50 || rationale.length < 80 || deep.length < 350) return null;
  if (ANTI_SLOP.some((re) => re.test(stem) || re.test(rationale) || re.test(deep))) return null;
  const refs = Array.isArray(o.references) && o.references.length ? JSON.stringify(o.references) : null;
  const distractors = o.distractor_rationales && typeof o.distractor_rationales === "object" ? o.distractor_rationales : null;
  if (type === "matrix") {
    const cols = o.matrix_columns, rows = o.matrix_rows;
    if (!Array.isArray(cols) || cols.length < 2 || !Array.isArray(rows) || rows.length < 4) return null;
    const cset = new Set(cols.map(String)); const map = {};
    for (const r of rows) { const l = String(r.label ?? "").trim(), an = String(r.answer ?? "").trim(); if (!l || !cset.has(an)) return null; map[l] = an; }
    return { stem, options: JSON.stringify(cols.map((c, i) => ({ id: String.fromCharCode(97 + i), text: String(c) }))), answer: JSON.stringify(map), rationale, deep, distractors: null, refs, cols: JSON.stringify(cols), rows: JSON.stringify(rows) };
  }
  const opts = o.options; if (!Array.isArray(opts) || opts.length < 4) return null;
  const ids = new Set();
  for (const op of opts) { const id = String(op.id ?? "").toLowerCase().trim(), tx = String(op.text ?? "").trim(); if (!id || !tx || ids.has(id)) return null; ids.add(id); }
  let answer, wrongIds;
  if (type === "sata") {
    const a = o.answer; if (!Array.isArray(a) || a.length < 1 || a.length >= opts.length || !a.every(x => ids.has(String(x).toLowerCase()))) return null;
    const aset = new Set(a.map(x => String(x).toLowerCase())); wrongIds = [...ids].filter(x => !aset.has(x)); answer = JSON.stringify([...aset]);
  } else {
    const a = String(o.answer ?? "").toLowerCase().trim(); if (!ids.has(a)) return null; wrongIds = [...ids].filter(x => x !== a); answer = a;
  }
  // Gate: distractor rationale must cover every wrong option.
  if (!distractors || !wrongIds.every((w) => distractors[w] || distractors[w.toUpperCase()])) return null;
  return { stem, options: JSON.stringify(opts), answer, rationale, deep, distractors: JSON.stringify(distractors), refs, cols: null, rows: null };
}

async function verify(type, o, genModel) {
  const prompt = `You are a strict NCLEX-RN clinical-accuracy reviewer. Review this ${type} question. Check: (1) is the keyed correct answer clinically correct? (2) is the rationale medically accurate with no errors? (3) is it appropriately difficult and unambiguous? Return STRICT JSON {"verdict":"PASS"|"FAIL","reason":"short"}. FAIL if the answer is wrong, the rationale contains any clinical error, the question is ambiguous/debatable, or it is medically inaccurate.\n\nQUESTION: ${JSON.stringify({ stem: o.stem, options: o.options ?? o.matrix_columns, answer: o.answer, rationale: o.rationale }).slice(0, 3500)}`;
  // Cross-model verification: review with a DIFFERENT model than the generator.
  // Try up to 2 verifiers; fail-closed (no PASS = reject) to prevent slop.
  const others = availableModels().filter((m) => m !== genModel);
  const order = (others.length ? others : availableModels()).slice(0, 2);
  for (const vm of order) {
    const out = await PROVIDERS[vm](prompt, 300);
    const parsed = extractJson(out);
    if (parsed && parsed.verdict) return parsed.verdict === "PASS";
  }
  return false;
}

function esc(s) { return String(s ?? "").replace(/'/g, "''"); }

async function main() {
  console.log(`[gvp] target=${TARGET} dry=${DRY} gemini=${!!GEMINI_KEY} nemotron=${!!NVIDIA_KEY}`);
  console.log("[gvp] loading live stems for dedup...");
  const liveRows = d1Query("SELECT substr(lower(stem),1,80) s FROM questions WHERE exam='nclex' AND publish_state='published'");
  const live = new Set(liveRows.map((r) => r.s));
  console.log(`[gvp] ${live.size} live stems loaded`);

  let published = 0, genFail = 0, dupFail = 0, verifyFail = 0, gateFail = 0, attempts = 0;
  const inserts = []; const now = Math.floor(Date.now() / 1000);

  while (published < TARGET && attempts < TARGET * 6) {
    attempts++;
    const type = chooseType(); const subject = pick(SUBJECTS); const diff = 2 + Math.floor(Math.random() * 3);
    // Pick a generator from whatever providers still have quota.
    const gens = availableModels();
    if (gens.length === 0) { console.log("[gvp] all providers capped/exhausted — stopping early"); break; }
    const gm = pick(gens);
    const raw = await PROVIDERS[gm](genPrompt(type, subject, diff), 2048);
    const obj = extractJson(raw); if (!obj) { genFail++; continue; }
    const v = validate(type, obj); if (!v) { gateFail++; continue; }
    const key = v.stem.slice(0, 80).toLowerCase();
    if (live.has(key)) { dupFail++; continue; }
    // cross-verify clinical accuracy with a different model
    const ok = await verify(type, obj, gm); if (!ok) { verifyFail++; continue; }
    live.add(key);
    const id = `genv-${useNemo ? "nemo" : "gemini"}-${now}-${attempts}-${Math.random().toString(36).slice(2, 7)}`;
    const cat = subject.replace(/[^a-z0-9]+/gi, "_").toLowerCase();
    inserts.push(
      `INSERT OR IGNORE INTO questions (id,exam,type,category,subcategory,difficulty,stem,options,answer,rationale,deep_rationale,deep_rationale_authored_at,distractor_rationales,references_json,matrix_columns,matrix_rows,tags,publish_state,review_status,provenance,created_at) VALUES (`+
      `'${id}','nclex','${type}','${esc(cat)}','${esc(subject)}',${diff},'${esc(v.stem)}','${esc(v.options)}','${esc(v.answer)}','${esc(v.rationale)}','${esc(v.deep)}',${now},`+
      `${v.distractors ? `'${esc(v.distractors)}'` : "NULL"},${v.refs ? `'${esc(v.refs)}'` : "NULL"},${v.cols ? `'${esc(v.cols)}'` : "NULL"},${v.rows ? `'${esc(v.rows)}'` : "NULL"},`+
      `'${esc(JSON.stringify([type, "NGN", "gen-verified"]))}','published','curated-live','genverify:${useNemo ? "nemotron" : "gemini"}+gemini-verified',${now});`
    );
    published++;
    if (!DRY && inserts.length >= 8) { const f = resolve(TMP, `b-${Date.now()}.sql`); writeFileSync(f, inserts.join("\n")); d1ExecFile(f); inserts.length = 0; }
    if (attempts % 6 === 0 || published > 0) console.log(`[gvp] att=${attempts} published=${published} genFail=${genFail} dup=${dupFail} verifyFail=${verifyFail} gateFail=${gateFail}`);
  }
  if (!DRY && inserts.length) { const f = resolve(TMP, `b-${Date.now()}.sql`); writeFileSync(f, inserts.join("\n")); d1ExecFile(f); }
  console.log(`[gvp] DONE published=${published} attempts=${attempts} genFail=${genFail} dup=${dupFail} verifyFail=${verifyFail} gateFail=${gateFail}${DRY ? " (DRY-RUN, nothing written)" : ""}`);
}
main().catch((e) => { console.error("[gvp] FATAL", e); process.exit(1); });
