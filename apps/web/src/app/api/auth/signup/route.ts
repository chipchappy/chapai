import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Session } from "@supabase/supabase-js";
import { enrollNewsletter } from "@/lib/email/newsletter";
import { getServerEnv } from "@/lib/env";
import { createLocalAuthAccount, createLocalSessionToken, getSharedAuthCookieDomain, setLocalAuthCookie } from "@/lib/local-auth";
import { getDB, hasDatabase } from "@/lib/db";
import { recordCurrentPolicyAcceptances } from "@/lib/legal-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  newsletterOptIn: z.boolean().default(false),
  acceptedTerms: z.literal(true),
  acceptedPrivacy: z.literal(true),
  nextPath: z.string().startsWith("/").default("/study?welcome=1"),
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
  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return json(400, {
      success: false,
      error: {
        code: "SIGNUP_INVALID",
        message: "Enter a valid email, password, and accept the Terms and Privacy Policy.",
      },
    });
  }
  const payload = parsed.data;

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
      // Do not block a valid signup on a secondary audit record; the endpoint requires the user acceptance payload.
    }
  }

  let session: Session | null = null;
  let supabaseError: string | null = null;
  let supabaseAccountMayExist = false;

  if (env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const authClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      if (env.SUPABASE_SERVICE_ROLE_KEY) {
        const adminClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const created = await adminClient.auth.admin.createUser({
          email: payload.email,
          password: payload.password,
          email_confirm: true,
        });
        if (created.error) {
          supabaseAccountMayExist = /already|exist|registered/i.test(created.error.message);
          supabaseError = created.error.message;
        }
      }

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
        supabaseError = signUp.error?.message ?? signIn.error?.message ?? null;
        supabaseAccountMayExist = /already|exist|registered/i.test(supabaseError ?? "");
      } else {
        supabaseError = signIn.error?.message ?? null;
      }
    } catch (error) {
      supabaseError = error instanceof Error ? error.message : "Supabase signup unavailable.";
    }
  }

  if (!session && hasDatabase(env)) {
    if (supabaseAccountMayExist) {
      return json(409, {
        success: false,
        error: {
          code: "ACCOUNT_EXISTS",
          message: "An account already exists for this email. Sign in instead.",
        },
      });
    }

    const db = getDB(env);
    const result = await createLocalAuthAccount(db, {
      email: payload.email,
      password: payload.password,
    });

    if (!result.created) {
      return json(409, {
        success: false,
        error: {
          code: "ACCOUNT_EXISTS",
          message: "An account already exists for this email. Sign in instead.",
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

    const token = createLocalSessionToken({ userId: result.account.userId, email: result.account.email });
    if (!token) {
      return json(503, {
        success: false,
        error: { code: "AUTH_SECRET_MISSING", message: "Signup session storage is not configured." },
      });
    }
    await recordLegalAcceptance(result.account.userId);

    const response = json(200, {
      success: true,
      data: {
        redirectPath: payload.nextPath,
        message: "Account created.",
        newsletter,
      },
    });
    setLocalAuthCookie(response, token, requestHost);
    return response;
  }

  if (!session) {
    return json(503, {
      success: false,
      error: {
        code: "AUTH_UNAVAILABLE",
        message: supabaseError ?? "Signup is temporarily unavailable.",
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
  persistSupabaseSession(response, env.NEXT_PUBLIC_SUPABASE_URL!, session, requestHost);
  await attachLocalSession(response, env, { email: payload.email, password: payload.password, requestHost });
  await recordLegalAcceptance(session.user.id);
  return response;
}
