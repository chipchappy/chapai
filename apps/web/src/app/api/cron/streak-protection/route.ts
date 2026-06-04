import { NextRequest, NextResponse } from "next/server";
import { and, eq, gte, isNotNull, sql } from "drizzle-orm";
import { quizAnswers, streakEmailOptouts, users } from "@chapai/db/schema";
import { getDB, hasDatabase, resolveEnv } from "@/lib/db";
import { createRequestContext, logError } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SECONDS_PER_DAY = 24 * 60 * 60;
const STREAK_MIN_DAYS = 5;
const HOURS_SINCE_LAST_MIN = 22;
const HOURS_SINCE_LAST_MAX = 30; // gate against double-sends — only "fresh risk" today

function json(status: number, payload: unknown) {
  return NextResponse.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      Pragma: "no-cache",
    },
  });
}

function streakEmailHtml(opts: { streakDays: number; unsubscribeUrl: string; ctaUrl: string }) {
  return `<!doctype html>
<html><body style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:32px 20px;color:#1e2a24;background:#efe2c4">
  <div style="background:#fffdf7;border-radius:18px;padding:28px;border:1px solid rgba(149,116,65,0.18)">
    <p style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#8d6a2e;margin:0">Streak alert</p>
    <h1 style="font-size:28px;margin:10px 0 0;line-height:1.1;color:#1e2a24">🔥 Your ${opts.streakDays}-day streak is at risk.</h1>
    <p style="font-size:15px;line-height:1.6;color:#303a35;margin-top:16px">
      You haven't answered a question in the last 24 hours. One quick set saves your streak — even 10 questions takes 8 minutes.
    </p>
    <a href="${opts.ctaUrl}" style="display:inline-block;margin-top:22px;padding:14px 24px;border-radius:999px;background:#6f8672;color:#fcf8ee;font-weight:700;text-decoration:none">Keep your streak alive →</a>
  </div>
  <p style="font-size:12px;color:#6b6f6b;margin-top:18px;line-height:1.5">
    Want to stop streak emails? <a href="${opts.unsubscribeUrl}" style="color:#8d6a2e">Unsubscribe</a>.
    <br/>Clarity Clinical Prep · NCLEX & CCRN practice
  </p>
</body></html>`;
}

async function sendStreakEmail(opts: {
  to: string;
  streakDays: number;
  ctaUrl: string;
  unsubscribeUrl: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.STREAK_EMAIL_FROM ?? "Clarity Streaks <streaks@claritynclex.com>",
      to: [opts.to],
      subject: `🔥 Your ${opts.streakDays}-day streak is at risk`,
      html: streakEmailHtml(opts),
      headers: {
        "List-Unsubscribe": `<${opts.unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    }),
    signal: AbortSignal.timeout(10_000),
  });
  return response.ok;
}

function makeUnsubscribeUrl(origin: string, email: string, token: string) {
  const url = new URL("/api/cron/streak-protection/unsubscribe", origin);
  url.searchParams.set("email", email);
  url.searchParams.set("token", token);
  return url.toString();
}

// Quick HMAC-lite signature using a shared secret + email. Not cryptographic-strength
// (no constant-time compare on Workers), but prevents trivial enumeration.
async function makeUnsubscribeToken(email: string, secret: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(email.toLowerCase()));
  const bytes = Array.from(new Uint8Array(sig));
  return bytes.slice(0, 16).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function computeStreakFromAnswers(timestamps: number[]) {
  if (timestamps.length === 0) return { streakDays: 0, lastAnsweredAt: null as number | null };
  const days = new Set(
    timestamps.map((sec) => new Date(sec * 1000).toISOString().slice(0, 10)),
  );
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let current = 0;
  for (let i = 0; i < 60; i += 1) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);
    const key = day.toISOString().slice(0, 10);
    if (days.has(key)) {
      current += 1;
    } else if (i === 0) {
      continue; // allow missing today
    } else {
      break;
    }
  }
  const lastAnsweredAt = Math.max(...timestamps);
  return { streakDays: current, lastAnsweredAt };
}

export async function POST(request: NextRequest) {
  const requestContext = createRequestContext(request, { route: "/api/cron/streak-protection" });
  const env = resolveEnv();

  // Authentication: require either a Cloudflare cron trigger OR a bearer token match.
  const cronSecret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization") ?? "";
  const isCronTrigger = request.headers.get("cf-cron") || request.headers.get("x-vercel-cron");
  const tokenMatches = cronSecret && auth === `Bearer ${cronSecret}`;
  if (!isCronTrigger && !tokenMatches) {
    return json(401, { success: false, error: "Unauthorized" });
  }

  if (!hasDatabase(env)) {
    return json(503, { success: false, error: "Database unavailable" });
  }
  if (!process.env.RESEND_API_KEY) {
    return json(503, { success: false, error: "Email provider not configured" });
  }
  const unsubscribeSecret = process.env.STREAK_UNSUBSCRIBE_SECRET ?? cronSecret ?? "fallback-secret-rotate-me";

  const db = getDB(env);
  const nowSec = Math.floor(Date.now() / 1000);
  const since14Sec = nowSec - 14 * SECONDS_PER_DAY;

  // Pull last-14-day answers for all users, then bucket per user to compute streaks.
  let answerRows: Array<{ userId: string | null; answeredAt: number }>;
  try {
    answerRows = await db
      .select({ userId: quizAnswers.userId, answeredAt: quizAnswers.answeredAt })
      .from(quizAnswers)
      .where(and(isNotNull(quizAnswers.userId), gte(quizAnswers.answeredAt, since14Sec)));
  } catch (error) {
    logError("streak cron: answer fetch failed", error, requestContext);
    return json(500, { success: false, error: "Query failed" });
  }

  const byUser = new Map<string, number[]>();
  for (const row of answerRows) {
    if (!row.userId) continue;
    const list = byUser.get(row.userId) ?? [];
    list.push(row.answeredAt);
    byUser.set(row.userId, list);
  }

  const atRiskUserIds: string[] = [];
  for (const [userId, timestamps] of byUser.entries()) {
    const { streakDays, lastAnsweredAt } = computeStreakFromAnswers(timestamps);
    if (streakDays < STREAK_MIN_DAYS) continue;
    if (!lastAnsweredAt) continue;
    const hoursSinceLast = (nowSec - lastAnsweredAt) / 3600;
    if (hoursSinceLast >= HOURS_SINCE_LAST_MIN && hoursSinceLast <= HOURS_SINCE_LAST_MAX) {
      atRiskUserIds.push(userId);
    }
  }

  if (atRiskUserIds.length === 0) {
    return json(200, { success: true, data: { evaluated: byUser.size, atRisk: 0, sent: 0 } });
  }

  // Resolve emails for at-risk users + check opt-outs
  const userRows = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(sql`${users.id} in (${sql.join(atRiskUserIds.map((id) => sql`${id}`), sql`, `)})`);

  let sent = 0;
  let skippedOptout = 0;
  let failed = 0;
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "https://claritynclex.com";
  for (const userRow of userRows) {
    if (!userRow.email) continue;
    const normalized = userRow.email.toLowerCase().trim();
    try {
      const optoutHit = await db
        .select({ email: streakEmailOptouts.email })
        .from(streakEmailOptouts)
        .where(eq(streakEmailOptouts.email, normalized))
        .get();
      if (optoutHit) {
        skippedOptout += 1;
        continue;
      }
    } catch {
      // Treat opt-out lookup failure as a soft skip — better than spamming.
      skippedOptout += 1;
      continue;
    }

    const token = await makeUnsubscribeToken(normalized, unsubscribeSecret);
    const unsubscribeUrl = makeUnsubscribeUrl(origin, normalized, token);
    const ctaUrl = `${origin}/quiz?utm_source=streak_email&utm_medium=email`;
    const streakDays = computeStreakFromAnswers(byUser.get(userRow.id) ?? []).streakDays;

    try {
      const ok = await sendStreakEmail({
        to: userRow.email,
        streakDays,
        ctaUrl,
        unsubscribeUrl,
      });
      if (ok) sent += 1;
      else failed += 1;
    } catch (error) {
      failed += 1;
      logError("streak cron: send failed", error, requestContext);
    }
  }

  return json(200, {
    success: true,
    data: { evaluated: byUser.size, atRisk: atRiskUserIds.length, sent, skippedOptout, failed },
  });
}

// Allow GET for manual cron-job.org-style triggers (still requires bearer auth).
export async function GET(request: NextRequest) {
  return POST(request);
}
