import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Session } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/env";
import { createLocalAuthAccount, createLocalSessionToken, getSharedAuthCookieDomain, setLocalAuthCookie, verifyLocalAuthAccount } from "@/lib/local-auth";
import { getDB, hasDatabase } from "@/lib/db";
import { recordCurrentPolicyAcceptances } from "@/lib/legal-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  acceptedTerms: z.literal(true),
  acceptedPrivacy: z.literal(true),
  nextPath: z.string().startsWith("/").default("/quiz"),
});

function getSupabaseAuthCookieName(supabaseUrl: string) {
  const hostname = new URL(supabaseUrl).hostname;
  const projectRef = hostname.split(".")[0];
  return `sb-${projectRef}-auth-token`;
}

function persistSupabaseSession(response: NextResponse, supabaseUrl: string, session: Session, requestHost?: string | null) {
  const cookieName = getSupabaseAuthCookieName(supabaseUrl);
  const cookieValue = `base64-${Buffer.from(JSON.stringify(session), "utf8").toString("base64url")}`;
  const sharedDomain = getSharedAuthCookieDomain(requestHost);
  response.cookies.set(cookieName, cookieValue, {
    path: "/",
    sameSite: "lax",
    httpOnly: false,
    secure: Boolean(sharedDomain),
    maxAge: 400 * 24 * 60 * 60,
    ...(sharedDomain ? { domain: sharedDomain } : {}),
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

async function attachLocalSession(response: NextResponse, env: ReturnType<typeof getServerEnv>, input: { email: string; password: string; requestHost?: string | null }) {
  if (!hasDatabase(env)) {
    return;
  }

  try {
    const db = getDB(env);
    const result = await createLocalAuthAccount(db, {
      email: input.email,
      password: input.password,
    });
    const token = createLocalSessionToken({ userId: result.account.userId, email: result.account.email });
    if (token) {
      setLocalAuthCookie(response, token, input.requestHost);
    }
  } catch {
    // Supabase remains the primary session if the local app session cannot be mirrored.
  }
}

export async function POST(request: NextRequest) {
  const env = getServerEnv();
  const requestHost = request.nextUrl.hostname;
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return json(400, {
      success: false,
      error: {
        code: "LOGIN_INVALID",
        message: "Enter a valid email, password, and accept the Terms and Privacy Policy.",
      },
    });
  }
  const payload = parsed.data;
  let supabaseError: string | null = null;

  async function recordLegalAcceptance(userId?: string | null) {
    if (!hasDatabase(env)) {
      return;
    }

    try {
      await recordCurrentPolicyAcceptances(getDB(env), {
        email: payload.email,
        userId: userId ?? null,
        source: "auth_login",
        request,
      });
    } catch {
      // Legal acceptance is required by payload; audit persistence should not block a valid sign-in.
    }
  }

  if (env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const authClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const signIn = await authClient.auth.signInWithPassword({
        email: payload.email,
        password: payload.password,
      });
      if (signIn.data.session) {
        const response = json(200, {
          success: true,
          data: { redirectPath: payload.nextPath, message: "Signed in." },
        });
        persistSupabaseSession(response, env.NEXT_PUBLIC_SUPABASE_URL, signIn.data.session, requestHost);
        await attachLocalSession(response, env, { email: payload.email, password: payload.password, requestHost });
        await recordLegalAcceptance(signIn.data.session.user.id);
        return response;
      }
      supabaseError = signIn.error?.message ?? null;
    } catch (error) {
      supabaseError = error instanceof Error ? error.message : "Supabase sign-in unavailable.";
    }
  }

  if (hasDatabase(env)) {
    const db = getDB(env);
    const account = await verifyLocalAuthAccount(db, {
      email: payload.email,
      password: payload.password,
    });
    if (account) {
      const token = createLocalSessionToken({ userId: account.userId, email: account.email });
      if (!token) {
        return json(503, {
          success: false,
          error: { code: "AUTH_SECRET_MISSING", message: "Sign-in session storage is not configured." },
        });
      }
      const response = json(200, {
        success: true,
        data: { redirectPath: payload.nextPath, message: "Signed in." },
      });
      setLocalAuthCookie(response, token, requestHost);
      await recordLegalAcceptance(account.userId);
      return response;
    }
  }

  return json(401, {
    success: false,
    error: {
      code: "INVALID_CREDENTIALS",
      message: supabaseError ?? "Email or password did not match an account.",
    },
  });
}
