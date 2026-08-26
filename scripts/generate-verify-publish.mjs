#!/usr/bin/env node
/**
 * generate-verify-publish.mjs — the engine that grows the live NCLEX bank
 * toward 4,000 WITHOUT slop, using only FREE models, persistently.
 *
 * Pipeline per question:
 *   1. GENERATE  — a free model (Cerebras gpt-oss-120b / Groq llama-3.3-70b /
 *                  Gemini 2.5 Flash / NVIDIA Nemotron) produces a question (JSON).
 *   2. VALIDATE  — strict schema check (options, answer key, lengths, distractors).
 *   3. DEDUP     — reject if the stem collides with ANY existing nclex stem.
 *   4. VERIFY    — a SECOND pass by a DIFFERENT model (clinical-accuracy reviewer)
 *                  must return PASS. Fail-closed. Catches answer-key / rationale
 *                  errors heuristics miss (the whole point of "no slop").
 *   5. GATE      — rationale>=80, deep_rationale>=350, per-distractor coverage,
 *                  anti-slop phrase blocklist.
 *   6. PUBLISH   — passers INSERT to D1 as publish_state='published',
 *                  review_status='curated-live' (sync-guard keeps them live).
 *
 * Rate-aware multi-provider SCHEDULER: each free provider has its own RPM and
 * daily quota. We pool them — always use whichever provider is ready soonest,
 * throttle to its RPM, and on HTTP 429 cool that provider down for `retry-after`
 * seconds (NOT permanently). Cross-verification uses a different provider than
 * the generator whenever two are healthy; otherwise it self-verifies.
 *
 * Observed free limits (2026-06): Cerebras 5 req/min + 2400/day (fast ~0.6s);
 * Groq ~28 req/min; Gemini Flash ~10 req/min + daily token cap; Nemotron slow.
 *
 * Keys: env GEMINI_API_KEY / GEN_NVIDIA_API_KEY / GROQ_API_KEY / CEREBRAS_API_KEY,
 * else Downloads/{freegeminikey,freenemotronkey,groqkey,cerebraskey}.txt.
 * D1 writes via `npx wrangler` (working OAuth). No deploy required.
 *
 * Usage: node scripts/generate-verify-publish.mjs --target=500 [--minutes=180] [--dry-run]
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
const MAX_MS = args.minutes ? Number(args.minutes) * 60000 : Infinity;
const DRY = Boolean(args["dry-run"]);
const DEBUG = Boolean(process.env.GVP_DEBUG);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function readKey(envName, fileName, re) {
  if (process.env[envName]) return process.env[envName].trim();
  const p = resolve(homedir(), "Downloads", fileName);
  if (!existsSync(p)) return "";
  const raw = readFileSync(p, "utf8");
  const m = raw.match(re);
  if (m) return m[0];
  const tail = raw.split(/\s+/).filter(Boolean).pop();
  return tail ? tail.replace(/^=/, "") : "";
}
const GEMINI_KEY = readKey("GEMINI_API_KEY", "freegeminikey.txt", /AIza[0-9A-Za-z_\-]{20,}/);
const NVIDIA_KEY = readKey("GEN_NVIDIA_API_KEY", "freenemotronkey.txt", /nvapi-[0-9A-Za-z_\-]{20,}/);
const GROQ_KEY = readKey("GROQ_API_KEY", "groqkey.txt", /gsk_[0-9A-Za-z]{20,}/);
const CEREBRAS_KEY = readKey("CEREBRAS_API_KEY", "cerebraskey.txt", /csk-[0-9A-Za-z]{20,}/);

// ---- Provider registry + per-provider rate state ----
// rpm = requests/minute we self-throttle to (just under the free-tier ceiling).
const DEFS = {
  cerebras: { key: CEREBRAS_KEY, rpm: 5,  url: "https://api.cerebras.ai/v1/chat/completions",        model: "gpt-oss-120b",                                jsonMode: false, reasoningLow: true },
  groq:     { key: GROQ_KEY,     rpm: 6,  url: "https://api.groq.com/openai/v1/chat/completions",     model: "llama-3.3-70b-versatile",                     jsonMode: true  }, // free tier: 1000 req/day + 12k tokens/min — rpm 6 keeps tokens under the TPM ceiling
  nemo:     { key: NVIDIA_KEY,   rpm: 12, url: "https://integrate.api.nvidia.com/v1/chat/completions", model: "nvidia/llama-3.3-nemotron-super-49b-v1.5",    jsonMode: false },
  gemini:   { key: GEMINI_KEY,   rpm: 10, url: null,                                                  model: "gemini-2.5-flash",                            jsonMode: true  },
};
const state = {};
for (const k of Object.keys(DEFS)) state[k] = { last: 0, cooldownUntil: 0, minInterval: Math.ceil((60000 / DEFS[k].rpm) * 1.12), fails: 0 };

function healthyProviders() { return Object.keys(DEFS).filter((k) => DEFS[k].key); }
function nextFree(k) { const s = state[k]; return Math.max(s.cooldownUntil, s.last + s.minInterval); }

// A provider is usable if it has a key, isn't in a long cooldown, and hasn't
// been failing repeatedly (a chronically-empty/broken endpoint like a dead NIM).
function usable(exclude) {
  const now = Date.now();
  let c = healthyProviders().filter((k) => k !== exclude && state[k].cooldownUntil < now + 300000 && state[k].fails < 4);
  if (!c.length) c = healthyProviders().filter((k) => k !== exclude && state[k].cooldownUntil < now + 300000);
  if (!c.length) c = healthyProviders().filter((k) => k !== exclude);
  return c;
}
// Greedy scheduler: among usable providers, honor a `prefer` provider when it's
// ready soon (used to keep GENERATION on the strongest model so each provider
// does 1 call/question — doubles Cerebras's effective rate). Otherwise prefer
// any ready NOW (random for diversity), else the one that frees up soonest.
function pickProvider(exclude, prefer) {
  const cands = usable(exclude);
  if (!cands.length) return null;
  const now = Date.now();
  if (prefer && cands.includes(prefer) && nextFree(prefer) <= now + 20000) return prefer;
  const ready = cands.filter((k) => nextFree(k) <= now);
  if (ready.length) return ready[Math.floor(Math.random() * ready.length)];
  return cands.sort((a, b) => nextFree(a) - nextFree(b))[0];
}
// Strongest generator first (gpt-oss-120b > llama-70b > nemotron > gemini-flash).
const GEN_PREF = ["cerebras", "groq", "nemo", "gemini"];
function preferredGen() { return GEN_PREF.find((k) => DEFS[k].key) || null; }

// Raw model call → { text, status, retryAfter }. Uniform across providers.
async function rawCall(name, prompt, maxTokens) {
  const d = DEFS[name];
  if (!d.key) return { text: "", status: 0 };
  try {
    if (name === "gemini") {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${d.model}:generateContent`, {
        method: "POST", headers: { "content-type": "application/json", "x-goog-api-key": d.key },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7, maxOutputTokens: maxTokens, responseMimeType: "application/json", thinkingConfig: { thinkingBudget: 0 } } }),
        signal: AbortSignal.timeout(30000),
      });
      if (res.status === 429) return { text: "", status: 429, retryAfter: 1800 }; // daily token cap — cool off 30 min
      if (res.status === 503) return { text: "", status: 503, retryAfter: 20 };
      if (!res.ok) return { text: "", status: res.status };
      const j = await res.json();
      return { text: j.candidates?.[0]?.content?.parts?.[0]?.text ?? "", status: 200 };
    }
    const sys = name === "nemo" ? "detailed thinking off. Output strict JSON only." : "You output only strict JSON.";
    const body = { model: d.model, messages: [{ role: "system", content: sys }, { role: "user", content: prompt }], temperature: 0.6, max_tokens: maxTokens };
    if (d.jsonMode) body.response_format = { type: "json_object" };
    if (d.reasoningLow) body.reasoning_effort = "low"; // gpt-oss-120b: don't burn the token budget on hidden reasoning → keeps `content` populated + fast

    const res = await fetch(d.url, { method: "POST", headers: { "content-type": "application/json", Authorization: `Bearer ${d.key}` }, body: JSON.stringify(body), signal: AbortSignal.timeout(30000) });
    if (res.status === 429) return { text: "", status: 429, retryAfter: Number(res.headers.get("retry-after")) || 60 };
    if (!res.ok) return { text: "", status: res.status };
    const j = await res.json();
    return { text: j.choices?.[0]?.message?.content || j.choices?.[0]?.message?.reasoning_content || "", status: 200 };
  } catch (e) { return { text: "", status: -1, err: String(e?.message || e) }; }
}

// Throttled call: wait for this provider's next free slot, call, handle 429.
async function call(name, prompt, maxTokens) {
  const s = state[name];
  const wait = Math.max(0, nextFree(name) - Date.now());
  if (wait > 0) await sleep(wait);
  s.last = Date.now();
  const r = await rawCall(name, prompt, maxTokens);
  if (r.status === 429) { s.cooldownUntil = Date.now() + (r.retryAfter * 1000); if (DEBUG) console.error(`[dbg]   ${name} 429 → cooldown ${r.retryAfter}s`); }
  else if (r.status === -1 || r.status === 503 || r.status >= 500) { s.cooldownUntil = Date.now() + 900000; if (DEBUG) console.error(`[dbg]   ${name} status=${r.status} (${r.err || "5xx/timeout"}) → park 15min`); } // dead/slow endpoint: park well beyond the usable() window so it leaves rotation
  if (!r.text) s.fails++; else s.fails = 0;
  return r.text;
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
const ANTI_SLOP = [/recognizes the cue/i, /active cue/i, /sorting task/i, /feels less technical/i, /clinical judgment rather than recall/i, /new-order/i, /lab-callback/i, /the question tests/i, /as an ai/i, /i cannot/i];

function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
function chooseType() { const r = Math.random(); return r < 0.4 ? "sata" : r < 0.7 ? "matrix" : "mcq"; }

function genPrompt(type, subject, diff) {
  const base = `You are a senior NCLEX-RN item writer. Write ONE exam-quality, clinically accurate Next-Gen question on "${subject}" at difficulty ${diff}/5 (3-4 = hard, requires analysis not recall). Use a realistic vignette with concrete vitals/labs/orders. Avoid generic filler. Return STRICT JSON only.`;
  const rat = `"rationale":"2-3 sentence explanation of why the answer is correct","deep_rationale":"600-1000 char explanation: pathophysiology, why the correct answer wins, why each wrong option fails, one clinical pearl","references":[{"title":"...","citation":"..."}]`;
  if (type === "sata") return `${base}\nSELECT-ALL-THAT-APPLY: 5-6 options, 2-4 correct.\nJSON: {"stem":"...","options":[{"id":"a","text":"..."},{"id":"b","text":"..."},{"id":"c","text":"..."},{"id":"d","text":"..."},{"id":"e","text":"..."}],"answer":["a","c"],"distractor_rationales":{"b":"why this option is wrong","d":"why this option is wrong"},${rat}}`;
  if (type === "matrix") return `${base}\nNGN MATRIX/COGNITIVE GRID: 2-3 column headers, 4-6 row findings, each assigned to exactly one column.\nJSON: {"stem":"...","matrix_columns":["Anticipated","Not anticipated"],"matrix_rows":[{"label":"finding","answer":"Anticipated"}],${rat}}`;
  return `${base}\nSINGLE-BEST-ANSWER MCQ: 4 options, exactly 1 correct.\nJSON: {"stem":"...","options":[{"id":"a","text":"..."},{"id":"b","text":"..."},{"id":"c","text":"..."},{"id":"d","text":"..."}],"answer":"b","distractor_rationales":{"a":"why wrong","c":"why wrong","d":"why wrong"},${rat}}`;
}

function extractJson(t) {
  if (!t) return null;
  let s = t.replace(/^```(json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  try { return JSON.parse(s); } catch {}
  const a = s.indexOf("{"), b = s.lastIndexOf("}");
  if (a >= 0 && b > a) { try { return JSON.parse(s.slice(a, b + 1)); } catch {} }
  return null;
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
    const a = o.answer; if (!Array.isArray(a) || a.length < 1 || a.length >= opts.length || !a.every((x) => ids.has(String(x).toLowerCase()))) return null;
    const aset = new Set(a.map((x) => String(x).toLowerCase())); wrongIds = [...ids].filter((x) => !aset.has(x)); answer = JSON.stringify([...aset]);
  } else {
    const a = String(o.answer ?? "").toLowerCase().trim(); if (!ids.has(a)) return null; wrongIds = [...ids].filter((x) => x !== a); answer = a;
  }
  if (!distractors || !wrongIds.every((w) => distractors[w] || distractors[w.toUpperCase()])) return null;
  return { stem, options: JSON.stringify(opts), answer, rationale, deep, distractors: JSON.stringify(distractors), refs, cols: null, rows: null };
}

async function verify(type, o, genModel) {
  const prompt = `You are a strict NCLEX-RN clinical-accuracy reviewer. Review this ${type} question. Check: (1) is the keyed correct answer clinically correct? (2) is the rationale medically accurate with NO errors? (3) is it appropriately difficult and unambiguous? Return STRICT JSON {"verdict":"PASS"|"FAIL","reason":"short"}. FAIL if the keyed answer is wrong, the rationale contains ANY clinical error, the question is ambiguous/debatable, or it is medically inaccurate.\n\nQUESTION: ${JSON.stringify({ stem: o.stem, options: o.options ?? o.matrix_columns, answer: o.answer, rationale: o.rationale, deep: String(o.deep_rationale ?? "").slice(0, 700) }).slice(0, 3800)}`;
  // Cross-model first, but ONLY consider providers ready within ~15s — never
  // block verification waiting out a parked/cooled provider's full cooldown
  // (that caused a 15-min stall). The generator is already warm, so it is the
  // reliable self-verify fallback. Fail-closed.
  const soon = Date.now() + 15000;
  const others = healthyProviders().filter((k) => k !== genModel && state[k].fails < 4 && nextFree(k) <= soon);
  const order = [...others, genModel]; // self-verify with the (warm) generator is the last resort
  const tried = new Set();
  for (const vm of order) {
    if (tried.has(vm)) continue;
    tried.add(vm);
    const out = await call(vm, prompt, 400);
    const parsed = extractJson(out);
    if (parsed && parsed.verdict) return { ok: parsed.verdict === "PASS", vm, self: vm === genModel };
  }
  return { ok: false, vm: null };
}

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
function esc(s) { return String(s ?? "").replace(/'/g, "''"); }

async function main() {
  const provs = healthyProviders();
  console.error(`[gvp] target=${TARGET} dry=${DRY} providers=[${provs.join(",")}] minutes=${MAX_MS === Infinity ? "∞" : MAX_MS / 60000}`);
  if (!provs.length) { console.error("No model keys found (cerebraskey/groqkey/freegeminikey/freenemotronkey .txt in Downloads, or env)"); process.exit(1); }
  console.error("[gvp] loading existing nclex stems for dedup...");
  const liveRows = d1Query("SELECT DISTINCT substr(lower(stem),1,80) s FROM questions WHERE exam='nclex'");
  const live = new Set(liveRows.map((r) => r.s));
  console.error(`[gvp] ${live.size} existing stems loaded`);

  let published = 0, genFail = 0, dupFail = 0, verifyFail = 0, gateFail = 0, attempts = 0;
  const inserts = []; const t0 = Date.now();
  const flush = () => { if (DRY || !inserts.length) { inserts.length = 0; return; } const f = resolve(TMP, `b-${Date.now()}.sql`); writeFileSync(f, inserts.join("\n")); d1ExecFile(f); inserts.length = 0; };

  while (published < TARGET && Date.now() - t0 < MAX_MS) {
    attempts++;
    const type = chooseType(); const subject = pick(SUBJECTS); const diff = pick([2, 3, 3, 4, 4, 5]);
    const gm = pickProvider(null, preferredGen());
    if (!gm) { console.error("[gvp] no providers available — stopping"); break; }
    if (DEBUG) console.error(`[dbg] att=${attempts} gen=${gm} type=${type} subj="${subject}"`);
    const raw = await call(gm, genPrompt(type, subject, diff), 1900);
    const obj = extractJson(raw); if (!obj) { genFail++; if (DEBUG) console.error(`[dbg]   genFail (rawLen=${raw.length})`); continue; }
    const v = validate(type, obj); if (!v) { gateFail++; if (DEBUG) console.error(`[dbg]   gateFail`); continue; }
    const key = v.stem.slice(0, 80).toLowerCase();
    if (live.has(key)) { dupFail++; if (DEBUG) console.error(`[dbg]   dupFail`); continue; }
    const { ok, vm } = await verify(type, obj, gm);
    if (!ok) { verifyFail++; if (DEBUG) console.error(`[dbg]   verifyFail (vm=${vm})`); continue; }
    live.add(key);
    const id = `genv-${gm}-${Math.floor(Date.now() / 1000)}-${attempts}-${Math.random().toString(36).slice(2, 7)}`;
    const cat = subject.replace(/[^a-z0-9]+/gi, "_").toLowerCase();
    const now = Math.floor(Date.now() / 1000);
    inserts.push(
      `INSERT OR IGNORE INTO questions (id,exam,type,category,subcategory,difficulty,stem,options,answer,rationale,deep_rationale,deep_rationale_authored_at,distractor_rationales,references_json,matrix_columns,matrix_rows,tags,publish_state,review_status,provenance,created_at) VALUES (` +
      `'${id}','nclex','${type}','${esc(cat)}','${esc(subject)}',${diff},'${esc(v.stem)}','${esc(v.options)}','${esc(v.answer)}','${esc(v.rationale)}','${esc(v.deep)}',${now},` +
      `${v.distractors ? `'${esc(v.distractors)}'` : "NULL"},${v.refs ? `'${esc(v.refs)}'` : "NULL"},${v.cols ? `'${esc(v.cols)}'` : "NULL"},${v.rows ? `'${esc(v.rows)}'` : "NULL"},` +
      `'${esc(JSON.stringify([type, "NGN", "gen-verified"]))}','published','curated-live','genverify:gen=${gm}+verify=${vm}',${now});`
    );
    published++;
    if (inserts.length >= 4) flush();
    const mins = ((Date.now() - t0) / 60000).toFixed(1);
    console.error(`[gvp] +1 (${gm}→${vm}) published=${published}/${TARGET} att=${attempts} gen=${genFail} dup=${dupFail} vrf=${verifyFail} gate=${gateFail} ${mins}min`);
  }
  flush();
  console.error(`[gvp] DONE published=${published} attempts=${attempts} genFail=${genFail} dup=${dupFail} verifyFail=${verifyFail} gateFail=${gateFail} elapsed=${((Date.now() - t0) / 60000).toFixed(1)}min${DRY ? " (DRY-RUN)" : ""}`);
}
main().catch((e) => { console.error("[gvp] FATAL", e); process.exit(1); });
