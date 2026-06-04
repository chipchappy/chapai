import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { streakEmailOptouts } from "@chapai/db/schema";
import { getDB, hasDatabase, resolveEnv } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z.object({
  optedOut: z.boolean(),
});

function json(status: number, payload: unknown) {
  return NextResponse.json(payload, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0", Pragma: "no-cache" },
  });
}

export async function GET() {
  const env = resolveEnv();
  if (!hasDatabase(env)) {
    return json(503, { success: false, error: "Database unavailable" });
  }
  const user = await getAuthenticatedUser();
  if (!user?.email) {
    return json(401, { success: false, error: "Sign in to view settings" });
  }
  const email = user.email.toLowerCase().trim();
  const db = getDB(env);
  try {
    const row = await db
      .select({ email: streakEmailOptouts.email })
      .from(streakEmailOptouts)
      .where(eq(streakEmailOptouts.email, email))
      .get();
    return json(200, { success: true, data: { optedOut: Boolean(row) } });
  } catch {
    return json(500, { success: false, error: "Lookup failed" });
  }
}

export async function POST(request: NextRequest) {
  const env = resolveEnv();
  if (!hasDatabase(env)) {
    return json(503, { success: false, error: "Database unavailable" });
  }
  const user = await getAuthenticatedUser();
  if (!user?.email) {
    return json(401, { success: false, error: "Sign in to change settings" });
  }
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return json(400, { success: false, error: "Invalid payload" });
  }
  const email = user.email.toLowerCase().trim();
  const db = getDB(env);
  try {
    if (parsed.data.optedOut) {
      await db.insert(streakEmailOptouts).values({ email, source: "settings" }).onConflictDoNothing();
    } else {
      await db.delete(streakEmailOptouts).where(eq(streakEmailOptouts.email, email));
    }
    return json(200, { success: true, data: { optedOut: parsed.data.optedOut } });
  } catch {
    return json(500, { success: false, error: "Write failed" });
  }
}
