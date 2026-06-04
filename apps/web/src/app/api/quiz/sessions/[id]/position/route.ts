import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { quizSessions } from "@chapai/db/schema";
import { getDB, hasDatabase, resolveEnv } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { ensureHostedUser } from "@/lib/billing-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z.object({
  currentIndex: z.number().int().min(0).max(500),
});

function json(status: number, payload: unknown) {
  return NextResponse.json(payload, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0", Pragma: "no-cache" },
  });
}

// Cross-device session resume: persist `currentIndex` for the practice-exam
// session so a student can pick up where they left off on another device.
// Ownership-scoped — only the session's own user can update its position.
export async function PUT(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const env = resolveEnv();
  if (!hasDatabase(env)) {
    return json(503, { success: false, error: "Database unavailable" });
  }

  const { id } = await ctx.params;
  if (!id || id.length > 64 || !/^[a-z0-9_\-]+$/i.test(id)) {
    return json(400, { success: false, error: "Invalid session id" });
  }

  const user = await getAuthenticatedUser();
  if (!user?.id) {
    return json(401, { success: false, error: "Sign in to save session position" });
  }

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return json(400, { success: false, error: "Invalid payload" });
  }

  try {
    const db = getDB(env);
    const hostedUser = user.email
      ? await ensureHostedUser(db, {
          userId: user.id,
          email: user.email,
          name: typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null,
        })
      : null;

    const session = await db
      .select({
        id: quizSessions.id,
        userId: quizSessions.userId,
        totalQuestions: quizSessions.totalQuestions,
      })
      .from(quizSessions)
      .where(eq(quizSessions.id, id))
      .get();

    if (!session) {
      return json(404, { success: false, error: "Session not found" });
    }
    if (session.userId && session.userId !== hostedUser?.id) {
      return json(403, { success: false, error: "Session belongs to a different account" });
    }
    if (parsed.data.currentIndex > session.totalQuestions) {
      return json(400, { success: false, error: "Index out of range" });
    }

    await db
      .update(quizSessions)
      .set({ currentIndex: parsed.data.currentIndex })
      .where(eq(quizSessions.id, id));

    return json(200, { success: true, data: { currentIndex: parsed.data.currentIndex } });
  } catch {
    return json(500, { success: false, error: "Position save failed" });
  }
}
