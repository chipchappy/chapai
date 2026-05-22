import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { type Session, type User } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/env";
import { jsonError, jsonSuccess } from "@/lib/http";
import { createRequestContext } from "@/lib/logger";
import { resolveSiteOriginFromHost } from "@/lib/site-origin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email(),
  nextPath: z.string().startsWith("/").default("/account/billing"),
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

function resolveOrigin(request: NextRequest) {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (host) {
    return resolveSiteOriginFromHost(host);
  }

  const env = getServerEnv();
  return env.NEXT_PUBLIC_APP_URL ?? env.NEXTAUTH_URL ?? new URL(request.url).origin;
}

function buildCanonicalCallbackLink(request: NextRequest, nextPath: string, rawToken: string | null | undefined, rawType: string | null | undefined) {
  if (!rawToken) {
    return null;
  }

  const callbackUrl = new URL("/auth/callback", resolveOrigin(request));
  callbackUrl.searchParams.set("token_hash", rawToken);
  callbackUrl.searchParams.set("type", rawType || "magiclink");
  callbackUrl.searchParams.set("next", nextPath);
  return callbackUrl.toString();
}

function buildBridgeCallbackLink(request: NextRequest, nextPath: string, rawToken: string | null | undefined, rawType: string | null | undefined) {
  if (!rawToken) {
    return null;
  }

  const callbackUrl = new URL("/auth/callback", resolveOrigin(request));
  callbackUrl.searchParams.set("token", rawToken);
  callbackUrl.searchParams.set("type", rawType || "magiclink");
  callbackUrl.searchParams.set("next", nextPath);
  return callbackUrl.toString();
}

function normalizeActionLink(actionLink: string | null | undefined, redirectTarget: URL) {
  if (!actionLink) {
    return null;
  }

  try {
    const resolved = new URL(actionLink);
    if (resolved.searchParams.has("redirect_to")) {
      resolved.searchParams.set("redirect_to", redirectTarget.toString());
    }
    return resolved.toString();
  } catch {
    return actionLink;
  }
}

async function exchangeRawMagicLinkToken(
  supabaseUrl: string,
  anonKey: string,
  token: string,
  type: string | null | undefined,
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

type AdminLinkBundle = {
  directCallbackUrl: string | null;
  bridgeCallbackUrl: string | null;
  normalizedActionLink: string | null;
  rawToken: string | null;
  rawType: string | null;
};

async function generateAdminMagicLink(
  request: NextRequest,
  env: ReturnType<typeof getServerEnv>,
  payload: z.infer<typeof schema>,
  redirectTarget: URL,
): Promise<AdminLinkBundle | null> {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  const { createClient } = await import("@supabase/supabase-js");
  const adminClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await adminClient.auth.admin.generateLink({
    type: "magiclink",
    email: payload.email,
    options: {
      redirectTo: redirectTarget.toString(),
    },
  });

  if (error) {
    return null;
  }

  const actionLink = data?.properties?.action_link ? new URL(data.properties.action_link) : null;
  const normalizedActionLink = normalizeActionLink(data?.properties?.action_link, redirectTarget);
  const bridgeCallbackUrl =
    buildBridgeCallbackLink(request, payload.nextPath, actionLink?.searchParams.get("token"), actionLink?.searchParams.get("type"));
  const directCallbackUrl =
    buildCanonicalCallbackLink(request, payload.nextPath, data?.properties?.hashed_token, data?.properties?.verification_type)
    || buildCanonicalCallbackLink(request, payload.nextPath, actionLink?.searchParams.get("token_hash"), actionLink?.searchParams.get("type"));

  return {
    directCallbackUrl,
    bridgeCallbackUrl,
    normalizedActionLink,
    rawToken: actionLink?.searchParams.get("token") ?? null,
    rawType: actionLink?.searchParams.get("type") ?? data?.properties?.verification_type ?? null,
  };
}

export async function POST(req: NextRequest) {
  const requestContext = createRequestContext(req, { route: "/api/auth/magic-link" });

  try {
    const env = getServerEnv();
    if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return jsonError(503, "AUTH_UNAVAILABLE", "Sign-in is temporarily unavailable.", requestContext, {
        requestId: requestContext.requestId,
      });
    }

    const body = await req.json().catch(() => ({}));
    const payload = schema.parse(body);

    const redirectTarget = new URL("/auth/callback", resolveOrigin(req));
    redirectTarget.searchParams.set("next", payload.nextPath);

    const adminLinkBundle = await generateAdminMagicLink(req, env, payload, redirectTarget);
    if (adminLinkBundle?.rawToken) {
      const tokenBundle = await exchangeRawMagicLinkToken(
        env.NEXT_PUBLIC_SUPABASE_URL,
        env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        adminLinkBundle.rawToken,
        adminLinkBundle.rawType,
        redirectTarget,
      );
      const session = await buildSessionFromVerifiedTokens(
        env.NEXT_PUBLIC_SUPABASE_URL,
        env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        tokenBundle,
      );
      const response = NextResponse.json(
        {
          success: true,
          data: {
            message: "Signed in. Continuing to your account.",
            redirectPath: payload.nextPath,
          },
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "no-store, max-age=0",
            Pragma: "no-cache",
            "X-Request-Id": requestContext.requestId,
          },
        },
      );
      persistSupabaseSession(response, env.NEXT_PUBLIC_SUPABASE_URL, session);
      return response;
    }

    const adminLinkUrl =
      adminLinkBundle?.directCallbackUrl
      || adminLinkBundle?.bridgeCallbackUrl
      || adminLinkBundle?.normalizedActionLink;

    if (adminLinkUrl) {
      return jsonSuccess(
        {
          message: "Continuing with a secure sign-in link.",
          linkUrl: adminLinkUrl,
        },
        200,
        { requestId: requestContext.requestId },
      );
    }

    const otpResponse = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/otp`, {
      method: "POST",
      headers: {
        apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: payload.email,
        create_user: true,
        email_redirect_to: redirectTarget.toString(),
      }),
    });

    if (!otpResponse.ok) {
      const raw = await otpResponse.text().catch(() => "");
      const rateLimited = otpResponse.status === 429 || raw.includes("over_email_send_rate_limit");
      const fallbackAdminLinkBundle = await generateAdminMagicLink(req, env, payload, redirectTarget);
      const fallbackAdminLinkUrl =
        fallbackAdminLinkBundle?.directCallbackUrl
        || fallbackAdminLinkBundle?.bridgeCallbackUrl
        || fallbackAdminLinkBundle?.normalizedActionLink;
      if (fallbackAdminLinkUrl) {
        return jsonSuccess(
          {
            message: "Continuing with a secure sign-in link.",
            linkUrl: fallbackAdminLinkUrl,
          },
          200,
          { requestId: requestContext.requestId },
        );
      }

      return jsonError(rateLimited ? 429 : 400, rateLimited ? "AUTH_RATE_LIMITED" : "AUTH_SEND_FAILED", raw || "Could not send sign-in link.", requestContext, {
        requestId: requestContext.requestId,
      });
    }

    return jsonSuccess(
      {
        message: "Check your email for the sign-in link.",
      },
      200,
      { requestId: requestContext.requestId },
    );
  } catch (error) {
    console.warn("magic-link route failed", error);
    return jsonError(503, "AUTH_UNAVAILABLE", "Could not send sign-in link.", {
      requestId: requestContext.requestId,
      error: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
    }, {
      requestId: requestContext.requestId,
    });
  }
}
