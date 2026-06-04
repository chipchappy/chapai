import { NextRequest, NextResponse } from "next/server";
import { resolveEnv } from "@/lib/db";
import { generateDraftBatch, type GenEnv } from "@/lib/question-generator";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Cron-driven 24/7 draft accrual toward the 5,000-question target. Dispatched
// by the scheduled() handler (cf-cron header). Generates a small dual-model
// batch each tick into the draft pool for Claude's editorial pass. To avoid
// unbounded growth, it pauses generation once the unreviewed draft backlog is
// large (Claude clears it in review sessions).
const MAX_DRAFT_BACKLOG = 120;
const BATCH_PER_TICK = 6;

export async function POST(request: NextRequest) {
  const env = resolveEnv() as unknown as GenEnv & { CRON_SECRET?: string };
  // Accept either the cron dispatcher header or the CRON_SECRET bearer.
  const isCron = request.headers.get("cf-cron") === "1";
  const auth = request.headers.get("authorization");
  const okSecret = env.CRON_SECRET && auth === `Bearer ${env.CRON_SECRET}`;
  if (!isCron && !okSecret) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!env.DB) return NextResponse.json({ success: false, error: "DB unavailable" }, { status: 503 });

  try {
    const backlogRow = await env.DB.prepare(
      "SELECT count(*) AS n FROM questions WHERE publish_state='draft' AND review_status='needs_review'",
    ).all<{ n: number }>();
    const backlog = backlogRow.results?.[0]?.n ?? 0;
    if (backlog >= MAX_DRAFT_BACKLOG) {
      return NextResponse.json({ success: true, skipped: true, reason: "draft backlog full", backlog });
    }
    const result = await generateDraftBatch(env, { count: BATCH_PER_TICK, model: "both" });
    return NextResponse.json({ success: true, ...result, backlogBefore: backlog });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "cron generation failed" }, { status: 500 });
  }
}
