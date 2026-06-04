import { NextRequest, NextResponse } from "next/server";
import { getDB, hasDatabase, resolveEnv } from "@/lib/db";
import { getDrugCardById } from "@/lib/drug-cards";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function json(status: number, payload: unknown) {
  return NextResponse.json(payload, {
    status,
    headers: { "Cache-Control": "public, max-age=300", Pragma: "no-cache" },
  });
}

export async function GET(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!id || id.length > 64 || !/^[a-z0-9_\-]+$/i.test(id)) {
    return json(400, { success: false, error: "Invalid card id" });
  }
  const env = resolveEnv();
  if (!hasDatabase(env)) {
    return json(503, { success: false, error: "Storage offline" });
  }
  const db = getDB(env);
  const card = await getDrugCardById(db, id);
  if (!card) {
    return json(404, { success: false, error: "Drug card not found" });
  }
  return json(200, { success: true, data: card });
}
