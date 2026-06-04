import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { drugCardBookmarks, drugCards } from "@chapai/db/schema";
import { getDB, hasDatabase, resolveEnv } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { calculateSM2 } from "@/lib/sm2";
import type { SM2Quality } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SECONDS_PER_DAY = 24 * 60 * 60;

const schema = z.object({
  action: z.enum(["bookmark", "unbookmark", "review"]),
  quality: z.number().int().min(0).max(5).optional(),
});

function json(status: number, payload: unknown) {
  return NextResponse.json(payload, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0", Pragma: "no-cache" },
  });
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const env = resolveEnv();
  if (!hasDatabase(env)) {
    return json(503, { success: false, error: "Storage offline" });
  }
  const user = await getAuthenticatedUser();
  if (!user?.id) {
    return json(401, { success: false, error: "Sign in to save drug cards" });
  }

  const { id } = await ctx.params;
  if (!id || id.length > 64 || !/^[a-z0-9_\-]+$/i.test(id)) {
    return json(400, { success: false, error: "Invalid card id" });
  }

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return json(400, { success: false, error: "Invalid payload" });
  }

  const db = getDB(env);

  // Confirm the card exists and is published before allowing a bookmark.
  const card = await db
    .select({ id: drugCards.id })
    .from(drugCards)
    .where(and(eq(drugCards.id, id), eq(drugCards.publishState, "published")))
    .get();
  if (!card) {
    return json(404, { success: false, error: "Drug card not found" });
  }

  if (parsed.data.action === "unbookmark") {
    await db
      .delete(drugCardBookmarks)
      .where(and(eq(drugCardBookmarks.userId, user.id), eq(drugCardBookmarks.drugCardId, id)));
    return json(200, { success: true, data: { bookmarked: false } });
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const existing = await db
    .select()
    .from(drugCardBookmarks)
    .where(and(eq(drugCardBookmarks.userId, user.id), eq(drugCardBookmarks.drugCardId, id)))
    .get();

  if (parsed.data.action === "bookmark") {
    if (existing) {
      return json(200, { success: true, data: { bookmarked: true, alreadySaved: true } });
    }
    // Initial SM-2 state: due tomorrow.
    await db.insert(drugCardBookmarks).values({
      userId: user.id,
      drugCardId: id,
      easeFactor: 2.5,
      intervalDays: 1,
      repetitions: 0,
      nextReviewAt: nowSec + SECONDS_PER_DAY,
    });
    return json(200, { success: true, data: { bookmarked: true } });
  }

  // action === "review" — SM-2 update with explicit quality.
  if (typeof parsed.data.quality !== "number") {
    return json(400, { success: false, error: "Quality 0-5 required for review action" });
  }
  if (!existing) {
    return json(404, { success: false, error: "Bookmark not found" });
  }
  const result = calculateSM2(
    parsed.data.quality as SM2Quality,
    existing.repetitions ?? 0,
    existing.easeFactor ?? 2.5,
    existing.intervalDays ?? 1,
  );
  await db
    .update(drugCardBookmarks)
    .set({
      easeFactor: result.newEaseFactor,
      intervalDays: result.nextIntervalDays,
      repetitions: result.newRepetitions,
      lastReviewedAt: nowSec,
      nextReviewAt: nowSec + result.nextIntervalDays * SECONDS_PER_DAY,
    })
    .where(and(eq(drugCardBookmarks.userId, user.id), eq(drugCardBookmarks.drugCardId, id)));
  return json(200, {
    success: true,
    data: {
      reviewed: true,
      nextReviewAt: nowSec + result.nextIntervalDays * SECONDS_PER_DAY,
      intervalDays: result.nextIntervalDays,
    },
  });
}

export async function GET(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const env = resolveEnv();
  if (!hasDatabase(env)) {
    return json(503, { success: false, error: "Storage offline" });
  }
  const user = await getAuthenticatedUser();
  if (!user?.id) {
    return json(200, { success: true, data: { bookmarked: false, signedIn: false } });
  }
  const { id } = await ctx.params;
  if (!id || id.length > 64) {
    return json(400, { success: false, error: "Invalid card id" });
  }
  const db = getDB(env);
  const row = await db
    .select({ drugCardId: drugCardBookmarks.drugCardId, nextReviewAt: drugCardBookmarks.nextReviewAt })
    .from(drugCardBookmarks)
    .where(and(eq(drugCardBookmarks.userId, user.id), eq(drugCardBookmarks.drugCardId, id)))
    .get();
  return json(200, {
    success: true,
    data: {
      bookmarked: Boolean(row),
      signedIn: true,
      nextReviewAt: row?.nextReviewAt ?? null,
    },
  });
}
