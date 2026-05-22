import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Session } from "@supabase/supabase-js";
import { enrollNewsletter } from "@/lib/email/newsletter";
import { getServerEnv } from "@/lib/env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  newsletterOptIn: z.boolean().default(true),
  nextPath: z.string().startsWith("/").default("/dashboard?welcome=1"),
});

function getSupabaseAuthCookieName(supabaseUrl: string) {
  const hostname = new URL(supabaseUrl).hostname;
  const projectRef = hostname.split(".")[0];
  return `sb-${projectRef}-auth-token`;
}

function persistSupabaseSession(response: NextResponse, supabaseUrl: string, session: Session) {
  const cookieName = getSupabaseAuthCookieName(supabaseUrl);
  const cookieValue = `base64-${Buffer.from(JSON.stringify(session), "utf8").toString("base64url")}`;
  response.cookies.set(cookieName, cookieValue, {
    path: "/",
    sameSite: "lax",
    httpOnly: false,
    maxAge: 400 * 24 * 60 * 60,
  });
}

function json(status: number, payload: unknown) {
  return NextResponse.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      Pragma: "no-cache",
    },
  });
}

export async function POST(request: NextRequest) {
  const env = getServerEnv();
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return json(503, {
      success: false,
      error: { code: "AUTH_UNAVAILABLE", message: "Signup is temporarily unavailable." },
    });
  }

  const body = await request.json().catch(() => ({}));
  const payload = schema.parse(body);
  const { createClient } = await import("@supabase/supabase-js");

  const authClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (env.SUPABASE_SERVICE_ROLE_KEY) {
    const adminClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    await adminClient.auth.admin.createUser({
      email: payload.email,
      password: payload.password,
      email_confirm: true,
    });
  }

  let session: Session | null = null;
  const signIn = await authClient.auth.signInWithPassword({
    email: payload.email,
    password: payload.password,
  });

  if (signIn.data.session) {
    session = signIn.data.session;
  } else if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    const signUp = await authClient.auth.signUp({
      email: payload.email,
      password: payload.password,
    });
    session = signUp.data.session;
  }

  if (!session) {
    return json(400, {
      success: false,
      error: {
        code: "SIGNUP_FAILED",
        message: signIn.error?.message ?? "Could not create the account. Try sign in or request a fresh magic link.",
      },
    });
  }

  let newsletter = null;
  if (payload.newsletterOptIn) {
    newsletter = await enrollNewsletter({
      email: payload.email,
      list: "qotd-daily",
      source: "signup",
    });
  }

  const response = json(200, {
    success: true,
    data: {
      redirectPath: payload.nextPath,
      message: "Account created.",
      newsletter,
    },
  });
  persistSupabaseSession(response, env.NEXT_PUBLIC_SUPABASE_URL, session);
  return response;
}
