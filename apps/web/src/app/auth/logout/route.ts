import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getServerEnv } from "@/lib/env";
import { clearLocalAuthCookie, getSharedAuthCookieDomain } from "@/lib/local-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function clearSupabaseAuthCookies(request: NextRequest, response: NextResponse, supabaseUrl: string) {
  const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
  const cookiePrefix = `sb-${projectRef}`;
  const sharedDomain = getSharedAuthCookieDomain(request.nextUrl.hostname);

  request.cookies
    .getAll()
    .filter((cookie) => cookie.name.startsWith(cookiePrefix))
    .forEach((cookie) => {
      const options = {
        path: "/",
        sameSite: "lax",
        maxAge: 0,
      } as const;
      response.cookies.set(cookie.name, "", options);
      if (sharedDomain) {
        response.cookies.set(cookie.name, "", {
          ...options,
          domain: sharedDomain,
        });
      }
    });
}

export async function GET(request: NextRequest) {
  const env = getServerEnv();
  const nextPath = request.nextUrl.searchParams.get("next");
  const redirectTarget = new URL(nextPath?.startsWith("/") ? nextPath : "/", request.url);

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const response = NextResponse.redirect(redirectTarget);
    clearLocalAuthCookie(response, request.nextUrl.hostname);
    return response;
  }

  let response = NextResponse.redirect(redirectTarget);
  clearLocalAuthCookie(response, request.nextUrl.hostname);
  clearSupabaseAuthCookies(request, response, env.NEXT_PUBLIC_SUPABASE_URL);
  const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  await supabase.auth.signOut();
  clearSupabaseAuthCookies(request, response, env.NEXT_PUBLIC_SUPABASE_URL);
  return response;
}
