import { NextRequest, NextResponse } from "next/server";
import { resolveEnv } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Bulk-authors deep_rationale + distractor_rationales for published questions
// using Cloudflare Workers AI (free, no external API key). Idempotent — only
// touches rows where deep_rationale_authored_at IS NULL. Call repeatedly in
// small batches until the pending count hits zero.
//
//   curl -X POST https://claritynclex.com/api/admin/author-rationales \
//     -H "x-author-secret: <ADMIN_AUTHOR_SECRET>" \
//     -H "content-type: application/json" \
//     -d '{"exam":"nclex","limit":15}'

type D1Result<T> = { results: T[] };
type D1Database = {
  prepare: (q: string) => {
    bind: (...vals: unknown[]) => {
      all: <T>() => Promise<D1Result<T>>;
      run: () => Promise<unknown>;
    };
    all: <T>() => Promise<D1Result<T>>;
  };
};
type WorkersAI = { run: (model: string, opts: Record<string, unknown>) => Promise<{ response?: string }> };

type PendingRow = {
  id: string;
  exam: string;
  type: string;
  category: string;
  difficulty: number | null;
  stem: string;
  options: string;
  answer: string;
  rationale: string;
  distractor_rationales: string | null;
};

function json(status: number, payload: unknown) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

function buildPrompt(q: PendingRow) {
  let opts: Array<{ id?: string; text?: string }> | string = q.options;
  try { opts = JSON.parse(q.options); } catch { /* leave as string */ }
  const optionsText = Array.isArray(opts)
    ? opts.map((o, i) => `${(o?.id ?? String.fromCharCode(65 + i)).toString().toUpperCase()}) ${o?.text ?? ""}`).join("\n")
    : String(opts ?? "");
  let existing: Record<string, string> = {};
  try { existing = JSON.parse(q.distractor_rationales || "{}"); } catch { /* none */ }
  const needDistractors = Object.keys(existing).length === 0;
  const examLabel = q.exam === "ccrn" ? "CCRN" : "NCLEX-RN";

  return `You are authoring a premium "deep dive" rationale for an ${examLabel} practice question. Return STRICT JSON only — no markdown, no prose outside the JSON object.

CATEGORY: ${q.category}
TYPE: ${q.type}   DIFFICULTY: ${q.difficulty ?? 3}/5
STEM: ${q.stem}
OPTIONS:
${optionsText}
CORRECT ANSWER: ${q.answer}
EXISTING SHORT RATIONALE (go deeper, do not repeat): ${q.rationale}

Write a 600-1100 character "deep_rationale" structured as: (1) pathophysiology/mechanism, (2) why the correct answer wins clinically, (3) one line on why each wrong option fails, (4) one memorable clinical pearl. Confident clinical exam-prep voice. Cite specific values, drug classes, thresholds, and NCSBN/AACN/AHA conventions inline. No filler phrases like "recognize the cue."
${needDistractors ? 'Also author "distractor_rationales": a JSON object with a 1-2 sentence clinical explanation for EVERY wrong option keyed by its letter.' : ""}

Return exactly: {"deep_rationale":"..."${needDistractors ? ',"distractor_rationales":{"A":"...","B":"..."}' : ""}}`;
}

function extractJson(text: string): { deep_rationale?: string; distractor_rationales?: Record<string, string> } | null {
  const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  try { return JSON.parse(cleaned); } catch { /* try substring */ }
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try { return JSON.parse(cleaned.slice(start, end + 1)); } catch { /* give up */ }
  }
  return null;
}

export async function POST(request: NextRequest) {
  const env = resolveEnv() as unknown as { DB?: D1Database; AI?: WorkersAI; WORKERS_AI_MODEL?: string; ADMIN_AUTHOR_SECRET?: string };

  const secret = env.ADMIN_AUTHOR_SECRET;
  const provided = request.headers.get("x-author-secret");
  if (!secret || provided !== secret) {
    return json(401, { success: false, error: "Unauthorized" });
  }
  if (!env.DB) return json(503, { success: false, error: "DB binding unavailable" });
  if (!env.AI || typeof env.AI.run !== "function") {
    return json(503, { success: false, error: "Workers AI binding unavailable" });
  }

  const body = (await request.json().catch(() => ({}))) as { exam?: string; limit?: number; model?: string };
  const exam = body.exam === "ccrn" ? "ccrn" : "nclex";
  const limit = Math.min(Math.max(Number(body.limit ?? 10), 1), 25);
  // Authoring defaults to the high-quality 70B model (one-time job, quality
  // matters more than neuron cost). Override per-call via body.model.
  const model = body.model || "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

  const pending = await env.DB.prepare(
    `SELECT id, exam, type, category, difficulty, stem, options, answer, rationale, distractor_rationales
     FROM questions
     WHERE publish_state='published' AND deep_rationale_authored_at IS NULL AND exam=?
     ORDER BY rowid LIMIT ?`,
  ).bind(exam, limit).all<PendingRow>();

  const rows = pending.results ?? [];
  if (rows.length === 0) {
    return json(200, { success: true, authored: 0, failed: 0, remaining: 0, note: "Nothing pending." });
  }

  let authored = 0;
  const failures: Array<{ id: string; error: string }> = [];
  const now = Math.floor(Date.now() / 1000);

  // Sequential — keeps us well under the worker CPU/time budget per request.
  for (const q of rows) {
    try {
      const out = await env.AI.run(model, {
        max_tokens: 1024,
        messages: [{ role: "user", content: buildPrompt(q) }],
      });
      const parsed = extractJson(out?.response ?? "");
      const deep = parsed?.deep_rationale?.trim();
      if (!deep || deep.length < 400) {
        failures.push({ id: q.id, error: `short/empty (${deep?.length ?? 0} chars)` });
        continue;
      }
      let existing: Record<string, string> = {};
      try { existing = JSON.parse(q.distractor_rationales || "{}"); } catch { /* none */ }
      const writeDistractors =
        Object.keys(existing).length === 0 &&
        parsed?.distractor_rationales &&
        Object.keys(parsed.distractor_rationales).length > 0;

      if (writeDistractors) {
        await env.DB.prepare(
          `UPDATE questions SET deep_rationale=?, distractor_rationales=?, deep_rationale_authored_at=? WHERE id=?`,
        ).bind(deep, JSON.stringify(parsed!.distractor_rationales), now, q.id).run();
      } else {
        await env.DB.prepare(
          `UPDATE questions SET deep_rationale=?, deep_rationale_authored_at=? WHERE id=?`,
        ).bind(deep, now, q.id).run();
      }
      authored++;
    } catch (error) {
      failures.push({ id: q.id, error: error instanceof Error ? error.message.slice(0, 120) : "unknown" });
    }
  }

  const remainingRow = await env.DB.prepare(
    `SELECT count(*) AS n FROM questions WHERE publish_state='published' AND deep_rationale_authored_at IS NULL AND exam=?`,
  ).bind(exam).all<{ n: number }>();
  const remaining = remainingRow.results?.[0]?.n ?? null;

  return json(200, { success: true, exam, authored, failed: failures.length, failures: failures.slice(0, 10), remaining });
}
