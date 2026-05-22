import { NextRequest, NextResponse } from "next/server";
import { createClient, type EmailOtpType, type Session, type User } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/env";
import { logError } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SUPPORTED_EMAIL_OTP_TYPES = new Set<EmailOtpType>([
  "magiclink",
  "recovery",
  "invite",
  "signup",
  "email_change",
  "email",
]);

function getOtpAttemptTypes(type: EmailOtpType | null) {
  if (!type) {
    return ["magiclink", "email"] as const;
  }

  if (type === "magiclink") {
    return ["magiclink", "email"] as const;
  }

  if (type === "email") {
    return ["email", "magiclink"] as const;
  }

  return [type] as const;
}

function setAuthState(target: URL, state: string) {
  target.searchParams.set("auth", state);
}

function setAuthDetail(target: URL, detail: string) {
  target.searchParams.set("auth_detail", detail);
}

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

async function exchangeRawMagicLinkToken(
  supabaseUrl: string,
  anonKey: string,
  token: string,
  type: EmailOtpType | null,
  redirectTarget: URL,
) {
  const verifyUrl = new URL("/auth/v1/verify", supabaseUrl);
  verifyUrl.searchParams.set("token", token);
  verifyUrl.searchParams.set("type", type ?? "magiclink");
  verifyUrl.searchParams.set("redirect_to", redirectTarget.toString());

  const response = await fetch(verifyUrl.toString(), {
    method: "GET",
    headers: {
      apikey: anonKey,
    },
    redirect: "manual",
  });

  const location = response.headers.get("location");
  if (!location) {
    throw new Error("Auth verification did not return a redirect location.");
  }

  const parsed = new URL(location);
  const hashParams = new URLSearchParams(parsed.hash.startsWith("#") ? parsed.hash.slice(1) : "");
  const accessToken = hashParams.get("access_token");
  const refreshToken = hashParams.get("refresh_token");
  const expiresAt = hashParams.get("expires_at");
  const expiresIn = hashParams.get("expires_in");
  const tokenType = hashParams.get("token_type");

  if (!accessToken || !refreshToken) {
    throw new Error("Auth verification did not return session tokens.");
  }

  return {
    accessToken,
    refreshToken,
    expiresAt: expiresAt ? Number(expiresAt) : null,
    expiresIn: expiresIn ? Number(expiresIn) : null,
    tokenType: "bearer" as const,
  };
}

function decodeJwtPayload<T>(token: string): T | null {
  const [, payload] = token.split(".");
  if (!payload) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

async function fetchSupabaseUser(supabaseUrl: string, anonKey: string, accessToken: string) {
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    method: "GET",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as User;
}

async function buildSessionFromVerifiedTokens(
  supabaseUrl: string,
  anonKey: string,
  tokenBundle: Awaited<ReturnType<typeof exchangeRawMagicLinkToken>>,
): Promise<Session> {
  const jwtPayload = decodeJwtPayload<{
    exp?: number;
    sub?: string;
    email?: string;
    role?: string;
    aud?: string;
    app_metadata?: Record<string, unknown>;
    user_metadata?: Record<string, unknown>;
    is_anonymous?: boolean;
  }>(tokenBundle.accessToken);

  const user = (await fetchSupabaseUser(supabaseUrl, anonKey, tokenBundle.accessToken)) ?? ({
    id: jwtPayload?.sub ?? "",
    aud: jwtPayload?.aud ?? "authenticated",
    role: jwtPayload?.role ?? "authenticated",
    email: jwtPayload?.email ?? "",
    app_metadata: jwtPayload?.app_metadata ?? {},
    user_metadata: jwtPayload?.user_metadata ?? {},
    is_anonymous: jwtPayload?.is_anonymous ?? false,
    created_at: new Date().toISOString(),
  } satisfies Partial<User> as User);

  const expiresAt = tokenBundle.expiresAt ?? jwtPayload?.exp ?? null;
  const expiresIn = tokenBundle.expiresIn ?? (expiresAt ? Math.max(expiresAt - Math.floor(Date.now() / 1000), 0) : 3600);

  return {
    access_token: tokenBundle.accessToken,
    refresh_token: tokenBundle.refreshToken,
    token_type: tokenBundle.tokenType,
    expires_at: expiresAt ?? Math.floor(Date.now() / 1000) + expiresIn,
    expires_in: expiresIn,
    user,
  };
}

export async function GET(request: NextRequest) {
  const env = getServerEnv();
  const code = request.nextUrl.searchParams.get("code");
  const token = request.nextUrl.searchParams.get("token");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const otpType = request.nextUrl.searchParams.get("type");
  const authErrorCode = request.nextUrl.searchParams.get("error_code") ?? "";
  const authErrorDescription = request.nextUrl.searchParams.get("error_description") ?? "";
  const nextPath = request.nextUrl.searchParams.get("next");
  const redirectTarget = new URL(nextPath?.startsWith("/") ? nextPath : "/account/billing", request.url);
  const upstreamAuthError = `${authErrorCode} ${authErrorDescription}`.toLowerCase();

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    setAuthState(redirectTarget, "unavailable");
    return NextResponse.redirect(redirectTarget);
  }

  if (upstreamAuthError) {
    setAuthState(redirectTarget, upstreamAuthError.includes("expired") ? "expired" : "failed");
    return NextResponse.redirect(redirectTarget);
  }

  const resolvedOtpType = otpType && SUPPORTED_EMAIL_OTP_TYPES.has(otpType as EmailOtpType)
    ? (otpType as EmailOtpType)
    : null;

  if (!code && !token && !(tokenHash && resolvedOtpType)) {
    setAuthState(redirectTarget, "missing-link");
    return NextResponse.redirect(redirectTarget);
  }

  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  let error = null;
  let session: Session | null = null;
  let failureStage = "unknown";

  if (code) {
    failureStage = "exchange-code";
    const result = await supabase.auth.exchangeCodeForSession(code);
    error = result.error;
    session = result.data.session;
  } else if (token) {
    try {
      failureStage = "verify-token";
      const sessionTokens = await exchangeRawMagicLinkToken(
        env.NEXT_PUBLIC_SUPABASE_URL,
        env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        token,
        resolvedOtpType,
        redirectTarget,
      );
      failureStage = "build-session";
      session = await buildSessionFromVerifiedTokens(
        env.NEXT_PUBLIC_SUPABASE_URL,
        env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        sessionTokens,
      );
      error = null;
    } catch (exchangeError) {
      error = exchangeError instanceof Error ? exchangeError : new Error("Could not exchange the secure sign-in link.");
    }
  } else {
    for (const attemptType of getOtpAttemptTypes(resolvedOtpType)) {
      failureStage = `verify-otp-${attemptType}`;
      const result = await supabase.auth.verifyOtp({
        token_hash: tokenHash ?? "",
        type: attemptType,
      });
      if (!result.error) {
        error = null;
        session = result.data.session;
        break;
      }
      error = result.error;
    }
  }

  if (error) {
    logError("auth callback exchange failed", error, {
      type: resolvedOtpType,
      hasCode: Boolean(code),
      hasToken: Boolean(token),
      hasTokenHash: Boolean(tokenHash),
    });
    setAuthState(redirectTarget, error.message.toLowerCase().includes("expired") ? "expired" : "failed");
    setAuthDetail(redirectTarget, failureStage);
    const errorResponse = NextResponse.redirect(redirectTarget);
    return errorResponse;
  }

  const response = NextResponse.redirect(redirectTarget);
  if (session) {
    failureStage = "persist-session";
    persistSupabaseSession(response, env.NEXT_PUBLIC_SUPABASE_URL, session);
  }
  return response;
}
