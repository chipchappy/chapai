import { NextRequest, NextResponse } from "next/server";
import { getDB, hasDatabase, resolveEnv } from "@/lib/db";
import { recommendDrugCardForQuestion } from "@/lib/drug-cards";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function json(status: number, payload: unknown) {
  return NextResponse.json(payload, {
    status,
    headers: { "Cache-Control": "public, max-age=120", Pragma: "no-cache" },
  });
}

// GET /api/drug-cards/recommend?category=…&tags=tag1,tag2
// Returns the single best-matching drug card for the given question context,
// or null if nothing matches. Safe to call from the client after a missed
// question to surface a "Brush up" link on the result screen.
export async function GET(request: NextRequest) {
  const env = resolveEnv();
  if (!hasDatabase(env)) {
    return json(503, { success: false, error: "Storage offline" });
  }
  const url = new URL(request.url);
  const category = url.searchParams.get("category") ?? "";
  const tagsRaw = url.searchParams.get("tags") ?? "";
  if (!category && !tagsRaw) {
    return json(400, { success: false, error: "Provide category or tags" });
  }
  if (category.length > 64 || tagsRaw.length > 256) {
    return json(400, { success: false, error: "Inputs too long" });
  }
  const tags = tagsRaw
    .split(/[,;]/)
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0 && t.length < 48)
    .slice(0, 8);

  const db = getDB(env);
  const card = await recommendDrugCardForQuestion(db, { category, tags });
  return json(200, { success: true, data: card });
}
