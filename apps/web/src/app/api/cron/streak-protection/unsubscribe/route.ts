import { NextRequest, NextResponse } from "next/server";
import { streakEmailOptouts } from "@chapai/db/schema";
import { getDB, hasDatabase, resolveEnv } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function expectedToken(email: string, secret: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(email.toLowerCase()));
  return Array.from(new Uint8Array(sig)).slice(0, 16).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function pageHtml(message: string, accent = "#6f8672") {
  return `<!doctype html><html><head><title>Streak emails</title>
<meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#efe2c4;color:#1e2a24;margin:0;padding:48px 16px">
  <div style="max-width:520px;margin:0 auto;background:#fffdf7;border-radius:18px;padding:28px;border:1px solid rgba(149,116,65,0.18)">
    <h1 style="margin:0 0 10px;font-size:24px;color:${accent}">${message}</h1>
    <p style="font-size:14px;line-height:1.6;color:#303a35">
      You'll still get product updates if you opted into those separately.
      Re-enable streak emails anytime from your account.
    </p>
    <a href="/" style="display:inline-block;margin-top:16px;padding:10px 18px;border-radius:999px;background:${accent};color:#fcf8ee;font-weight:700;text-decoration:none">Back to Clarity</a>
  </div>
</body></html>`;
}

async function handle(request: NextRequest) {
  const url = new URL(request.url);
  const emailRaw = url.searchParams.get("email") ?? "";
  const token = url.searchParams.get("token") ?? "";
  const email = emailRaw.toLowerCase().trim();
  if (!email || !token) {
    return new NextResponse(pageHtml("That unsubscribe link is incomplete.", "#c0633f"), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    });
  }

  const env = resolveEnv();
  const secret = process.env.STREAK_UNSUBSCRIBE_SECRET ?? process.env.CRON_SECRET ?? "fallback-secret-rotate-me";
  const expected = await expectedToken(email, secret);
  if (expected !== token) {
    return new NextResponse(pageHtml("That unsubscribe link is invalid or expired.", "#c0633f"), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    });
  }

  if (!hasDatabase(env)) {
    return new NextResponse(pageHtml("Try again in a moment.", "#c0633f"), {
      status: 503,
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    });
  }
  try {
    const db = getDB(env);
    await db.insert(streakEmailOptouts).values({ email, source: "email_link" }).onConflictDoNothing();
  } catch {
    // Already opted out (or insert failed); treat as success.
  }
  return new NextResponse(pageHtml("Streak emails are off.", "#6f8672"), {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}
