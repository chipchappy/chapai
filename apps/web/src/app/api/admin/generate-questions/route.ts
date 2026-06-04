import { NextRequest, NextResponse } from "next/server";
import { resolveEnv } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Dual-model NGN question generator. Gemini 2.5 Flash (JSON mode) + NVIDIA
// Nemotron 49B generate drafts in parallel; everything lands as
// publish_state='draft' + review_status='needs_review' for Claude's second
// pass. NOTHING is auto-published. Idempotent-safe: dedups by stem prefix.
//
//   curl -X POST .../api/admin/generate-questions \
//     -H "x-author-secret: <ADMIN_AUTHOR_SECRET>" -H "content-type: application/json" \
//     -d '{"count":8,"model":"both"}'

type D1 = {
  prepare: (q: string) => {
    bind: (...v: unknown[]) => { all: <T>() => Promise<{ results: T[] }>; run: () => Promise<unknown> };
    all: <T>() => Promise<{ results: T[] }>;
  };
};

type GenType = "sata" | "matrix" | "mcq";

function json(status: number, payload: unknown) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

// Broad NCLEX-RN subject taxonomy across all 8 client-need categories.
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
  "central line care and CLABSI prevention", "blood transfusion reaction", "medication reconciliation high-alert drugs", "fall and pressure injury prevention",
  "anticoagulation safety", "insulin administration safety", "opioid oversedation", "antibiotic adverse effects",
  "GI bleed and shock", "pancreatitis", "cirrhosis and hepatic encephalopathy", "bowel obstruction",
  "burns and fluid resuscitation", "sickle cell crisis", "DVT and VTE prophylaxis", "wound infection and sepsis",
];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function chooseType(): GenType {
  const r = Math.random();
  if (r < 0.40) return "sata";     // NGN
  if (r < 0.70) return "matrix";   // NGN
  return "mcq";                    // breadth
}

function buildPrompt(type: GenType, subject: string, difficulty: number): string {
  const common = `You are a senior NCLEX-RN item writer creating an exam-quality question on "${subject}" at difficulty ${difficulty}/5. The clinical content must be 100% accurate to current US nursing standards (NCSBN, AHA/ACLS, ADA, ACOG, ISMP). Return STRICT JSON only — no markdown, no prose outside the JSON.`;
  const rationaleSpec = `"rationale": a 2-3 sentence concise explanation; "deep_rationale": a 600-1000 character premium explanation covering pathophysiology, why the correct answer wins, why each wrong option fails, and one clinical pearl; "references": array of 1-2 {"title","citation"} from authoritative sources.`;

  if (type === "sata") {
    return `${common}
Create a SELECT-ALL-THAT-APPLY question with 5 or 6 options where 2-4 are correct. Realistic vignette with concrete vitals/labs where relevant.
Return JSON exactly: {"stem":"...","options":[{"id":"a","text":"..."},{"id":"b","text":"..."},{"id":"c","text":"..."},{"id":"d","text":"..."},{"id":"e","text":"..."}],"answer":["a","c"],${rationaleSpec.replace(/"references"/, '"distractor_rationales":{"b":"why b is wrong"},"references"')}}`;
  }
  if (type === "matrix") {
    return `${common}
Create an NGN MATRIX/grid question. Provide 2 or 3 column headers (e.g., "Expected","Unexpected" or "Anticipated","Contraindicated") and 4-6 row findings, each assigned to exactly one column.
Return JSON exactly: {"stem":"...","matrix_columns":["Col1","Col2"],"matrix_rows":[{"label":"finding","answer":"Col1"}],${rationaleSpec}}`;
  }
  return `${common}
Create a single-best-answer multiple-choice question with 4 options, one correct. Realistic vignette.
Return JSON exactly: {"stem":"...","options":[{"id":"a","text":"..."},{"id":"b","text":"..."},{"id":"c","text":"..."},{"id":"d","text":"..."}],"answer":"b","distractor_rationales":{"a":"why a is wrong","c":"...","d":"..."},${rationaleSpec}}`;
}

function extractJsonObject(text: string): Record<string, unknown> | null {
  if (!text) return null;
  let t = text.replace(/^```(json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  try { return JSON.parse(t); } catch { /* substring */ }
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a >= 0 && b > a) { try { return JSON.parse(t.slice(a, b + 1)); } catch { /* give up */ } }
  return null;
}

const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"];
async function callGemini(key: string, prompt: string): Promise<string> {
  let lastErr = "";
  // Try each model with retry/backoff on transient overload (429/503).
  for (const model of GEMINI_MODELS) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 4096,
            responseMimeType: "application/json",
            // 2.5 Flash thinks by default; thinking tokens ate the output budget
            // and truncated the JSON. Disable for structured generation.
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      });
      if (res.ok) {
        const j = await res.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
        return j.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      }
      lastErr = `gemini ${res.status}: ${(await res.text()).slice(0, 120)}`;
      if (res.status === 429 || res.status === 503) {
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1))); // backoff then retry
        continue;
      }
      break; // non-transient error: move to next model
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
      messages: [
        { role: "system", content: "detailed thinking off. You output only strict JSON." },
        { role: "user", content: prompt },
      ],
      temperature: 0.6, max_tokens: 2048,
    }),
  });
  if (!res.ok) throw new Error(`nemotron ${res.status}: ${(await res.text()).slice(0, 160)}`);
  const j = await res.json() as { choices?: Array<{ message?: { content?: string; reasoning_content?: string } }> };
  return j.choices?.[0]?.message?.content || j.choices?.[0]?.message?.reasoning_content || "";
}

// Validate + normalize a generated object into a draft row, or return null.
function validate(type: GenType, o: Record<string, unknown>): {
  stem: string; options: string; answer: string; rationale: string; deep: string;
  distractors: string | null; refs: string | null; cols: string | null; rows: string | null;
} | null {
  const stem = String(o.stem ?? "").trim();
  const rationale = String(o.rationale ?? "").trim();
  const deep = String(o.deep_rationale ?? "").trim();
  if (stem.length < 40 || rationale.length < 30 || deep.length < 350) return null;
  const refs = Array.isArray(o.references) && o.references.length ? JSON.stringify(o.references) : null;
  const distractors = o.distractor_rationales && typeof o.distractor_rationales === "object"
    ? JSON.stringify(o.distractor_rationales) : null;

  if (type === "matrix") {
    const cols = o.matrix_columns; const rows = o.matrix_rows;
    if (!Array.isArray(cols) || cols.length < 2) return null;
    if (!Array.isArray(rows) || rows.length < 3) return null;
    const colSet = new Set(cols.map((c) => String(c)));
    const answerMap: Record<string, string> = {};
    for (const r of rows as Array<{ label?: unknown; answer?: unknown }>) {
      const label = String(r.label ?? "").trim(); const ans = String(r.answer ?? "").trim();
      if (!label || !colSet.has(ans)) return null;
      answerMap[label] = ans;
    }
    return {
      stem, options: JSON.stringify(cols.map((c, i) => ({ id: String.fromCharCode(97 + i), text: String(c) }))),
      answer: JSON.stringify(answerMap), rationale, deep, distractors: null, refs,
      cols: JSON.stringify(cols), rows: JSON.stringify(rows),
    };
  }

  // sata / mcq
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
    if (!Array.isArray(a) || a.length < 1 || a.length >= opts.length) return null;
    if (!a.every((x) => ids.has(String(x).toLowerCase()))) return null;
    answer = JSON.stringify(a.map((x) => String(x).toLowerCase()));
  } else {
    const a = String(o.answer ?? "").toLowerCase().trim();
    if (!ids.has(a)) return null;
    answer = a;
  }
  return { stem, options: JSON.stringify(opts), answer, rationale, deep, distractors, refs, cols: null, rows: null };
}

export async function POST(request: NextRequest) {
  const env = resolveEnv() as unknown as {
    DB?: D1; GEMINI_API_KEY?: string; GEN_NVIDIA_API_KEY?: string; ADMIN_AUTHOR_SECRET?: string;
  };
  if (!env.ADMIN_AUTHOR_SECRET || request.headers.get("x-author-secret") !== env.ADMIN_AUTHOR_SECRET) {
    return json(401, { success: false, error: "Unauthorized" });
  }
  if (!env.DB) return json(503, { success: false, error: "DB unavailable" });

  const body = (await request.json().catch(() => ({}))) as { count?: number; model?: string; type?: GenType };
  const count = Math.min(Math.max(Number(body.count ?? 6), 1), 12);
  const which = body.model === "gemini" || body.model === "nemotron" ? body.model : "both";
  const gKey = env.GEMINI_API_KEY; const nKey = env.GEN_NVIDIA_API_KEY;
  if (which !== "nemotron" && !gKey) return json(503, { success: false, error: "GEMINI_API_KEY missing" });
  if (which !== "gemini" && !nKey) return json(503, { success: false, error: "GEN_NVIDIA_API_KEY missing" });

  const now = Math.floor(Date.now() / 1000);
  let generated = 0; const byModel: Record<string, number> = { gemini: 0, nemotron: 0 };
  const failures: string[] = []; const draftIds: string[] = [];

  for (let i = 0; i < count; i++) {
    const type = body.type ?? chooseType();
    const subject = pick(SUBJECTS);
    const difficulty = 2 + Math.floor(Math.random() * 3); // 2-4
    const useModel = which === "both" ? (i % 2 === 0 ? "gemini" : "nemotron") : which;
    const prompt = buildPrompt(type, subject, difficulty);
    try {
      const raw = useModel === "gemini" ? await callGemini(gKey!, prompt) : await callNemotron(nKey!, prompt);
      const obj = extractJsonObject(raw);
      if (!obj) { failures.push(`${useModel}/${type}: unparseable`); continue; }
      const v = validate(type, obj);
      if (!v) { failures.push(`${useModel}/${type}: failed validation`); continue; }

      // Dedup by stem prefix vs existing questions.
      const prefix = v.stem.slice(0, 70);
      const dup = await env.DB.prepare("SELECT 1 AS x FROM questions WHERE substr(stem,1,70)=? LIMIT 1").bind(prefix).all<{ x: number }>();
      if (dup.results.length) { failures.push(`${useModel}/${type}: duplicate`); continue; }

      const id = `gen-${useModel}-${now}-${i}-${Math.random().toString(36).slice(2, 7)}`;
      const category = subject.replace(/[^a-z0-9]+/gi, "_").toLowerCase();
      await env.DB.prepare(
        `INSERT INTO questions (id, exam, type, category, subcategory, difficulty, stem, options, answer, rationale, deep_rationale, deep_rationale_authored_at, distractor_rationales, references_json, matrix_columns, matrix_rows, tags, publish_state, review_status, provenance, created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      ).bind(
        id, "nclex", type, category, subject, difficulty, v.stem, v.options, v.answer, v.rationale,
        v.deep, now, v.distractors, v.refs, v.cols, v.rows, JSON.stringify([type, "NGN", "gen"]),
        "draft", "needs_review", `gen:${useModel}`, now,
      ).run();
      generated++; byModel[useModel]++; draftIds.push(id);
    } catch (e) {
      failures.push(`${useModel}/${type}: ${e instanceof Error ? e.message.slice(0, 80) : "err"}`);
    }
  }

  const pend = await env.DB.prepare("SELECT count(*) AS n FROM questions WHERE publish_state='draft' AND review_status='needs_review'").all<{ n: number }>();
  return json(200, { success: true, generated, byModel, failed: failures.length, failures: failures.slice(0, 12), draftsAwaitingReview: pend.results?.[0]?.n ?? null, draftIds });
}
