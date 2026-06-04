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
  const examLabel = q.exam === "ccrn" ? "CCRN" : "NCLEX-RN";

  // Plain-prose output — far more reliable than asking an LLM for strict JSON
  // (LLM JSON routinely breaks on unescaped newlines/quotes inside the value).
  return `You are an expert ${examLabel} nurse educator writing a premium "deep dive" explanation for a practice question. Write it as one flowing explanation of 600 to 1100 characters in plain text. Do NOT use JSON, markdown headers, bullet points, or code fences — just clear prose.

CATEGORY: ${q.category}
TYPE: ${q.type}   DIFFICULTY: ${q.difficulty ?? 3}/5
STEM: ${q.stem}
OPTIONS:
${optionsText}
CORRECT ANSWER: ${q.answer}
EXISTING SHORT RATIONALE (go deeper than this, do not just repeat it): ${q.rationale}

Cover, in this order, woven into prose: (1) the underlying pathophysiology or mechanism, (2) the decisive clinical reasoning for why the correct answer wins, (3) a brief note on why each wrong option fails (the common test trap), and (4) one memorable clinical pearl a student can carry to other questions. Use a confident clinical exam-prep voice. Cite specific lab values, drug classes, thresholds, and NCSBN/AACN/AHA conventions inline where relevant. Avoid filler phrases like "recognize the cue." Begin the explanation directly.`;
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

  const body = (await request.json().catch(() => ({}))) as { exam?: string; limit?: number; model?: string; debug?: boolean };
  const exam = body.exam === "ccrn" ? "ccrn" : "nclex";

  // Debug: run the model once on a sample prompt and return the raw shape.
  if (body.debug) {
    const dbgModel = body.model || "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
    const out = await env.AI.run(dbgModel, {
      max_tokens: 1024,
      messages: [{ role: "user", content: "Write a 2-sentence clinical note about why a potassium of 6.8 mEq/L is dangerous. Return plain text." }],
    });
    return json(200, {
      debug: true, model: dbgModel,
      typeofOut: typeof out,
      keys: out && typeof out === "object" ? Object.keys(out) : null,
      sample: JSON.stringify(out).slice(0, 800),
    });
  }
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

  // Coerce any Workers AI return shape to a text string.
  function toText(out: unknown): string {
    if (typeof out === "string") return out;
    if (out && typeof out === "object") {
      const o = out as Record<string, unknown>;
      if (typeof o.response === "string") return o.response;
      // Some models nest under response.response or choices[].message.content.
      if (o.response && typeof o.response === "object") {
        const r = o.response as Record<string, unknown>;
        if (typeof r.response === "string") return r.response;
      }
      const choices = o.choices as Array<{ message?: { content?: string }; text?: string }> | undefined;
      if (Array.isArray(choices) && choices[0]) {
        return choices[0].message?.content ?? choices[0].text ?? "";
      }
      if (typeof o.result === "string") return o.result;
    }
    return "";
  }

  // Try the model up to twice; expect plain prose. Returns the deep rationale
  // text, or null if nothing usable.
  async function generate(q: PendingRow): Promise<{ deep: string } | null> {
    for (let attempt = 0; attempt < 2; attempt++) {
      const out = await env.AI!.run(model, {
        max_tokens: 1024,
        messages: [{ role: "user", content: buildPrompt(q) }],
      });
      let raw = toText(out).trim();
      if (!raw) continue;
      // Strip any stray code fences or a leading JSON wrapper if the model
      // ignored the plain-text instruction.
      raw = raw.replace(/^```(json|text)?\s*/i, "").replace(/```\s*$/i, "").trim();
      const jsonMatch = raw.match(/"deep_rationale"\s*:\s*"([\s\S]*?)"\s*[,}]/);
      if (jsonMatch && jsonMatch[1].length >= 350) {
        return { deep: jsonMatch[1].replace(/\\n/g, " ").replace(/\\"/g, '"').trim() };
      }
      if (raw.length >= 350 && !raw.startsWith("{")) {
        return { deep: raw };
      }
    }
    return null;
  }

  // Sequential — keeps us well under the worker CPU/time budget per request.
  for (const q of rows) {
    let result: { deep: string } | null = null;
    try {
      result = await generate(q);
    } catch (error) {
      failures.push({ id: q.id, error: error instanceof Error ? error.message.slice(0, 120) : "unknown" });
    }

    if (result?.deep) {
      await env.DB.prepare(
        `UPDATE questions SET deep_rationale=?, deep_rationale_authored_at=? WHERE id=?`,
      ).bind(result.deep, now, q.id).run();
      authored++;
      continue;
    }

    // Forward-progress guarantee: if the model never produced usable text,
    // fall back to the existing (already vetted) short rationale so the row
    // is marked done and the queue never stalls on it. Still accurate.
    failures.push({ id: q.id, error: "no usable model output; used existing rationale" });
    await env.DB.prepare(
      `UPDATE questions SET deep_rationale=?, deep_rationale_authored_at=? WHERE id=?`,
    ).bind(q.rationale || "See the on-screen rationale and references for this item.", now, q.id).run();
  }

  const remainingRow = await env.DB.prepare(
    `SELECT count(*) AS n FROM questions WHERE publish_state='published' AND deep_rationale_authored_at IS NULL AND exam=?`,
  ).bind(exam).all<{ n: number }>();
  const remaining = remainingRow.results?.[0]?.n ?? null;

  return json(200, { success: true, exam, authored, failed: failures.length, failures: failures.slice(0, 10), remaining });
}
