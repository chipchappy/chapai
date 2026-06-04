import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { achievementEvents } from "@chapai/db/schema";
import { getDB, hasDatabase, resolveEnv } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z.object({
  achievementKey: z.string().min(1).max(96).regex(/^[a-z0-9:_\-.]+$/i),
  metadata: z.record(z.string(), z.string().or(z.number()).or(z.boolean())).optional(),
});

function json(status: number, payload: unknown) {
  return NextResponse.json(payload, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0", Pragma: "no-cache" },
  });
}

// Mirror of the client-side toast "seen" flags. UNIQUE(user_id, achievement_key)
// in the schema makes double-logging a no-op via ON CONFLICT DO NOTHING.
export async function POST(request: NextRequest) {
  const env = resolveEnv();
  if (!hasDatabase(env)) {
    return json(503, { success: false, error: "Database unavailable" });
  }
  const user = await getAuthenticatedUser();
  if (!user?.id) {
    return json(401, { success: false, error: "Sign in to log milestones" });
  }
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return json(400, { success: false, error: "Invalid payload" });
  }
  try {
    const db = getDB(env);
    await db
      .insert(achievementEvents)
      .values({
        userId: user.id,
        achievementKey: parsed.data.achievementKey,
        metadata: parsed.data.metadata ? JSON.stringify(parsed.data.metadata) : null,
      })
      .onConflictDoNothing();
    return json(200, { success: true });
  } catch {
    // Soft-fail: client UI doesn't depend on this round-tripping.
    return json(200, { success: true, data: { logged: false } });
  }
}
