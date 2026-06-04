import { NextRequest, NextResponse } from "next/server";
import { resolveEnv } from "@/lib/db";
import { generateDraftBatch, type GenEnv, type GenType } from "@/lib/question-generator";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Manual trigger for dual-model NGN draft generation. Secret-gated. Drafts
// land as publish_state='draft' + review_status='needs_review' for Claude's
// editorial pass — nothing is auto-published.
export async function POST(request: NextRequest) {
  const env = resolveEnv() as unknown as GenEnv & { ADMIN_AUTHOR_SECRET?: string };
  if (!env.ADMIN_AUTHOR_SECRET || request.headers.get("x-author-secret") !== env.ADMIN_AUTHOR_SECRET) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!env.DB) return NextResponse.json({ success: false, error: "DB unavailable" }, { status: 503 });

  const body = (await request.json().catch(() => ({}))) as { count?: number; model?: string; type?: GenType };
  const count = Math.min(Math.max(Number(body.count ?? 6), 1), 12);
  const model = body.model === "gemini" || body.model === "nemotron" ? body.model : "both";

  try {
    const result = await generateDraftBatch(env, { count, model, type: body.type });
    const pend = await env.DB.prepare("SELECT count(*) AS n FROM questions WHERE publish_state='draft' AND review_status='needs_review'").all<{ n: number }>();
    return NextResponse.json({ success: true, ...result, draftsAwaitingReview: pend.results?.[0]?.n ?? null }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "generation failed" }, { status: 500 });
  }
}
