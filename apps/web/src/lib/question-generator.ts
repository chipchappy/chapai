// Shared dual-model NGN question generation core. Used by the admin route
// (manual trigger) and the cron route (24/7 unattended accrual). Generates
// drafts only — never publishes. Claude reviews drafts before they go live.

export type GenType = "sata" | "matrix" | "mcq";

type D1Like = {
  prepare: (q: string) => {
    bind: (...v: unknown[]) => { all: <T>() => Promise<{ results: T[] }>; run: () => Promise<unknown> };
    all: <T>() => Promise<{ results: T[] }>;
  };
};

export type GenEnv = {
  DB?: D1Like;
  GEMINI_API_KEY?: string;
  GEN_NVIDIA_API_KEY?: string;
};

const SUBJECTS = [
  "sepsis and septic shock", "heart failure exacerbation", "acute coronary syndrome", "atrial fibrillation with RVR",
  "COPD exacerbation", "acute respiratory failure", "pulmonary embolism", "asthma status asthmaticus",
  "diabetic ketoacidosis", "hyperosmolar hyperglycemic state", "hypoglycemia management", "thyroid storm",
  "acute kidney injury", "hyperkalemia", "hyponatremia and SIADH", "fluid volume overload",
  "ischemic stroke and tPA", "increased intracranial pressure", "seizure and status epilepticus", "spinal cord injury autonomic dysreflexia",
  "preeclampsia and HELLP", "postpartum hemorrhage", "magnesium sulfate therapy", "fetal heart rate interpretation",
  "neonatal hypoglycemia", "pediatric respiratory distress", "pediatric dehydration", "Kawasaki disease",
  "suicide risk assessment", "alcohol withdrawal", "lithium toxicity", "serotonin syndrome",
  "delegation and supervision", "prioritization and triage", "chain of command for unsafe orders", "informed consent",
  "central line care and CLABSI prevention", "blood transfusion reaction", "high-alert medication safety", "fall and pressure injury prevention",
  "anticoagulation safety", "insulin administration safety", "opioid oversedation", "antibiotic adverse effects",
  "GI bleed and shock", "pancreatitis", "cirrhosis and hepatic encephalopathy", "bowel obstruction",
  "burns and fluid resuscitation", "sickle cell crisis", "DVT and VTE prophylaxis", "wound infection and sepsis",
  "tuberculosis airborne precautions", "C. diff contact precautions", "chest tube management", "tracheostomy care",
  "Addisonian crisis", "Cushing syndrome", "pheochromocytoma", "myasthenia gravis crisis",
  "Guillain-Barre syndrome", "multiple sclerosis exacerbation", "Parkinson medication timing", "dementia safety",
  "peritoneal vs hemodialysis", "nephrotic syndrome", "BPH and urinary retention", "acute glomerulonephritis",
];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
export function chooseType(): GenType {
  const r = Math.random();
  if (r < 0.40) return "sata";
  if (r < 0.70) return "matrix";
  return "mcq";
}

function buildPrompt(type: GenType, subject: string, difficulty: number): string {
  const common = `You are a senior NCLEX-RN item writer creating an exam-quality question on "${subject}" at difficulty ${difficulty}/5. The clinical content must be 100% accurate to current US nursing standards (NCSBN, AHA/ACLS, ADA, ACOG, ISMP). Return STRICT JSON only — no markdown, no prose outside the JSON.`;
  const r = `"rationale": a 2-3 sentence concise explanation; "deep_rationale": a 600-1000 character premium explanation covering pathophysiology, why the correct answer wins, why each wrong option fails, and one clinical pearl; "references": array of 1-2 {"title","citation"} from authoritative sources.`;
  if (type === "sata") {
    return `${common}\nCreate a SELECT-ALL-THAT-APPLY question with 5 or 6 options where 2-4 are correct. Realistic vignette with concrete vitals/labs where relevant. Do not include a vital sign or lab that demands an intervention the question does not ask about.\nReturn JSON exactly: {"stem":"...","options":[{"id":"a","text":"..."},{"id":"b","text":"..."},{"id":"c","text":"..."},{"id":"d","text":"..."},{"id":"e","text":"..."}],"answer":["a","c"],"distractor_rationales":{"b":"why b is wrong"},${r}}`;
  }
  if (type === "matrix") {
    return `${common}\nCreate an NGN MATRIX/grid question. Provide 2 or 3 column headers and 4-6 row findings, each assigned to exactly one column.\nReturn JSON exactly: {"stem":"...","matrix_columns":["Col1","Col2"],"matrix_rows":[{"label":"finding","answer":"Col1"}],${r}}`;
  }
  return `${common}\nCreate a single-best-answer multiple-choice question with 4 options, one correct. Realistic vignette.\nReturn JSON exactly: {"stem":"...","options":[{"id":"a","text":"..."},{"id":"b","text":"..."},{"id":"c","text":"..."},{"id":"d","text":"..."}],"answer":"b","distractor_rationales":{"a":"...","c":"...","d":"..."},${r}}`;
}

function extractJsonObject(text: string): Record<string, unknown> | null {
  if (!text) return null;
  const t = text.replace(/^```(json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  try { return JSON.parse(t); } catch { /* substring */ }
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a >= 0 && b > a) { try { return JSON.parse(t.slice(a, b + 1)); } catch { /* give up */ } }
  return null;
}

const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"];
async function callGemini(key: string, prompt: string): Promise<string> {
  let lastErr = "";
  for (const model of GEMINI_MODELS) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 4096, responseMimeType: "application/json", thinkingConfig: { thinkingBudget: 0 } },
        }),
      });
      if (res.ok) {
        const j = await res.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
        return j.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      }
      lastErr = `gemini ${res.status}`;
      if (res.status === 429 || res.status === 503) { await new Promise((r) => setTimeout(r, 1500 * (attempt + 1))); continue; }
      break;
    }
  }
  throw new Error(lastErr || "gemini failed");
}

async function callNemotron(key: string, prompt: string): Promise<string> {
  const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "nvidia/llama-3.3-nemotron-super-49b-v1.5",
      messages: [{ role: "system", content: "detailed thinking off. You output only strict JSON." }, { role: "user", content: prompt }],
      temperature: 0.6, max_tokens: 2048,
    }),
  });
  if (!res.ok) throw new Error(`nemotron ${res.status}`);
  const j = await res.json() as { choices?: Array<{ message?: { content?: string; reasoning_content?: string } }> };
  return j.choices?.[0]?.message?.content || j.choices?.[0]?.message?.reasoning_content || "";
}

type Validated = { stem: string; options: string; answer: string; rationale: string; deep: string; distractors: string | null; refs: string | null; cols: string | null; rows: string | null };
function validate(type: GenType, o: Record<string, unknown>): Validated | null {
  const stem = String(o.stem ?? "").trim();
  const rationale = String(o.rationale ?? "").trim();
  const deep = String(o.deep_rationale ?? "").trim();
  if (stem.length < 40 || rationale.length < 30 || deep.length < 350) return null;
  const refs = Array.isArray(o.references) && o.references.length ? JSON.stringify(o.references) : null;
  const distractors = o.distractor_rationales && typeof o.distractor_rationales === "object" ? JSON.stringify(o.distractor_rationales) : null;
  if (type === "matrix") {
    const cols = o.matrix_columns; const rows = o.matrix_rows;
    if (!Array.isArray(cols) || cols.length < 2 || !Array.isArray(rows) || rows.length < 3) return null;
    const colSet = new Set(cols.map((c) => String(c)));
    const answerMap: Record<string, string> = {};
    for (const r of rows as Array<{ label?: unknown; answer?: unknown }>) {
      const label = String(r.label ?? "").trim(); const ans = String(r.answer ?? "").trim();
      if (!label || !colSet.has(ans)) return null; answerMap[label] = ans;
    }
    return { stem, options: JSON.stringify(cols.map((c, i) => ({ id: String.fromCharCode(97 + i), text: String(c) }))), answer: JSON.stringify(answerMap), rationale, deep, distractors: null, refs, cols: JSON.stringify(cols), rows: JSON.stringify(rows) };
  }
  const opts = o.options;
  if (!Array.isArray(opts) || opts.length < 4) return null;
  const ids = new Set<string>();
  for (const op of opts as Array<{ id?: unknown; text?: unknown }>) {
    const id = String(op.id ?? "").toLowerCase().trim(); const text = String(op.text ?? "").trim();
    if (!id || !text || ids.has(id)) return null; ids.add(id);
  }
  let answer: string;
  if (type === "sata") {
    const a = o.answer;
    if (!Array.isArray(a) || a.length < 1 || a.length >= opts.length || !a.every((x) => ids.has(String(x).toLowerCase()))) return null;
    answer = JSON.stringify(a.map((x) => String(x).toLowerCase()));
  } else {
    const a = String(o.answer ?? "").toLowerCase().trim();
    if (!ids.has(a)) return null; answer = a;
  }
  return { stem, options: JSON.stringify(opts), answer, rationale, deep, distractors, refs, cols: null, rows: null };
}

export type GenResult = { generated: number; byModel: Record<string, number>; failed: number; failures: string[]; draftIds: string[] };

export async function generateDraftBatch(env: GenEnv, opts: { count: number; model: "gemini" | "nemotron" | "both"; type?: GenType }): Promise<GenResult> {
  const { DB } = env; const gKey = env.GEMINI_API_KEY; const nKey = env.GEN_NVIDIA_API_KEY;
  if (!DB) throw new Error("DB unavailable");
  const now = Math.floor(Date.now() / 1000);
  let generated = 0; const byModel: Record<string, number> = { gemini: 0, nemotron: 0 };
  const failures: string[] = []; const draftIds: string[] = [];
  for (let i = 0; i < opts.count; i++) {
    const type = opts.type ?? chooseType();
    const subject = pick(SUBJECTS);
    const difficulty = 2 + Math.floor(Math.random() * 3);
    const useModel = opts.model === "both" ? (i % 2 === 0 ? "gemini" : "nemotron") : opts.model;
    if (useModel === "gemini" && !gKey) { failures.push("gemini: no key"); continue; }
    if (useModel === "nemotron" && !nKey) { failures.push("nemotron: no key"); continue; }
    const prompt = buildPrompt(type, subject, difficulty);
    try {
      const raw = useModel === "gemini" ? await callGemini(gKey!, prompt) : await callNemotron(nKey!, prompt);
      const obj = extractJsonObject(raw);
      if (!obj) { failures.push(`${useModel}/${type}: unparseable`); continue; }
      const v = validate(type, obj);
      if (!v) { failures.push(`${useModel}/${type}: invalid`); continue; }
      const dup = await DB.prepare("SELECT 1 AS x FROM questions WHERE substr(stem,1,70)=? LIMIT 1").bind(v.stem.slice(0, 70)).all<{ x: number }>();
      if (dup.results.length) { failures.push(`${useModel}/${type}: dup`); continue; }
      const id = `gen-${useModel}-${now}-${i}-${Math.random().toString(36).slice(2, 7)}`;
      const category = subject.replace(/[^a-z0-9]+/gi, "_").toLowerCase();
      await DB.prepare(
        `INSERT INTO questions (id, exam, type, category, subcategory, difficulty, stem, options, answer, rationale, deep_rationale, deep_rationale_authored_at, distractor_rationales, references_json, matrix_columns, matrix_rows, tags, publish_state, review_status, provenance, created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      ).bind(id, "nclex", type, category, subject, difficulty, v.stem, v.options, v.answer, v.rationale, v.deep, now, v.distractors, v.refs, v.cols, v.rows, JSON.stringify([type, "NGN", "gen"]), "draft", "needs_review", `gen:${useModel}`, now).run();
      generated++; byModel[useModel]++; draftIds.push(id);
    } catch (e) {
      failures.push(`${useModel}/${type}: ${e instanceof Error ? e.message.slice(0, 60) : "err"}`);
    }
  }
  return { generated, byModel, failed: failures.length, failures: failures.slice(0, 12), draftIds };
}
