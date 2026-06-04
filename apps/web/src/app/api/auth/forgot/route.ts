import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerEnv } from "@/lib/env";
import { logError } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email(),
});

function json(status: number, payload: unknown) {
  return NextResponse.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      Pragma: "no-cache",
    },
  });
}

const GENERIC_MESSAGE =
  "If an account exists for that email, we just sent a password reset link. Check your inbox (and spam folder).";

export async function POST(request: NextRequest) {
  const env = getServerEnv();
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return json(400, {
      success: false,
      error: { code: "FORGOT_INVALID", message: "Enter a valid email address." },
    });
  }

  const { email } = parsed.data;

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return json(503, {
      success: false,
      error: {
        code: "AUTH_UNAVAILABLE",
        message: "Password reset is temporarily unavailable. Try again in a moment.",
      },
    });
  }

  const origin = request.nextUrl.origin;
  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent("/auth/reset")}`;

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const authClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const result = await authClient.auth.resetPasswordForEmail(email, { redirectTo });
    if (result.error) {
      // Don't reveal whether the email exists. Still log for ops.
      logError("password reset request failed", result.error, { email_domain: email.split("@")[1] });
    }
  } catch (error) {
    logError("password reset request threw", error, { email_domain: email.split("@")[1] });
  }

  return json(200, {
    success: true,
    data: { message: GENERIC_MESSAGE },
  });
}
