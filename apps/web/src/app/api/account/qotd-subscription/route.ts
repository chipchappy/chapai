import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { enrollNewsletter } from "@/lib/email/newsletter";
import { resolveEnv } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z.object({
  subscribed: z.boolean(),
});

const KV_PREFIX = "qotd-sub:";
const KV_TTL_SECONDS = 300; // 5 minutes

function json(status: number, payload: unknown) {
  return NextResponse.json(payload, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0", Pragma: "no-cache" },
  });
}

type KvBinding = {
  get: (key: string) => Promise<string | null>;
  put: (key: string, value: string, options?: { expirationTtl?: number }) => Promise<void>;
  delete: (key: string) => Promise<void>;
};

function getKv(): KvBinding | null {
  // OpenNext exposes the Cloudflare env as process.env entries at runtime
  // and as the bound `KV` global through the worker init. Use whichever is present.
  const env = resolveEnv() as unknown as { KV?: KvBinding };
  return env.KV ?? null;
}

async function readCachedState(email: string): Promise<boolean | null> {
  const kv = getKv();
  if (!kv) return null;
  try {
    const raw = await kv.get(`${KV_PREFIX}${email}`);
    if (raw === "1") return true;
    if (raw === "0") return false;
    return null;
  } catch {
    return null;
  }
}

async function writeCachedState(email: string, subscribed: boolean): Promise<void> {
  const kv = getKv();
  if (!kv) return;
  try {
    await kv.put(`${KV_PREFIX}${email}`, subscribed ? "1" : "0", {
      expirationTtl: KV_TTL_SECONDS,
    });
  } catch {
    // ignore
  }
}

async function lookupResendMembership(email: string): Promise<boolean | null> {
  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_QOTD_AUDIENCE_ID;
  if (!apiKey || !audienceId) return null;
  try {
    const url = `https://api.resend.com/audiences/${audienceId}/contacts/${encodeURIComponent(email)}`;
    const response = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(6000),
    });
    if (response.status === 404) return false;
    if (!response.ok) return null;
    const payload = (await response.json().catch(() => null)) as { unsubscribed?: boolean } | null;
    if (!payload) return null;
    return payload.unsubscribed === true ? false : true;
  } catch {
    return null;
  }
}

async function removeFromResendAudience(email: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_QOTD_AUDIENCE_ID;
  if (!apiKey || !audienceId) return false;
  try {
    // Resend exposes DELETE /audiences/:id/contacts/:email for removal.
    const url = `https://api.resend.com/audiences/${audienceId}/contacts/${encodeURIComponent(email)}`;
    const response = await fetch(url, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(8000),
    });
    return response.ok || response.status === 404;
  } catch {
    return false;
  }
}

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user?.email) {
    return json(401, { success: false, error: "Sign in to view email preferences" });
  }
  const email = user.email.toLowerCase().trim();
  const cached = await readCachedState(email);
  if (cached !== null) {
    return json(200, { success: true, data: { subscribed: cached, source: "cache" } });
  }
  const live = await lookupResendMembership(email);
  if (live !== null) {
    await writeCachedState(email, live);
    return json(200, { success: true, data: { subscribed: live, source: "live" } });
  }
  return json(200, { success: true, data: { subscribed: false, source: "default" } });
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user?.email) {
    return json(401, { success: false, error: "Sign in to change email preferences" });
  }
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return json(400, { success: false, error: "Invalid payload" });
  }
  const email = user.email.toLowerCase().trim();

  if (parsed.data.subscribed) {
    const result = await enrollNewsletter({
      email,
      list: "qotd-daily",
      source: "account_settings",
    });
    if (!result.enrolled) {
      return json(502, {
        success: false,
        error: `Could not enroll (${result.reason ?? "unknown"})`,
      });
    }
    await writeCachedState(email, true);
    return json(200, { success: true, data: { subscribed: true } });
  }

  const removed = await removeFromResendAudience(email);
  if (removed) await writeCachedState(email, false);
  return json(removed ? 200 : 502, {
    success: removed,
    data: { subscribed: false },
    ...(removed ? {} : { error: "Could not remove subscription" }),
  });
}
