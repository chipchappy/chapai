import { ACCESS_KEY_COOKIE, validateAccessKeyRuntime } from "@/lib/access-keys";
import { compareDashboardAccessKey, DASHBOARD_AUTH_COOKIE } from "@/lib/dashboard-auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function readLoginPayload(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      const payload = (await request.json()) as { key?: string; next?: string };
      return {
        key: String(payload.key ?? ""),
        nextPath: String(payload.next ?? "/dashboard"),
      };
    } catch {
      return { key: "", nextPath: "/dashboard" };
    }
  }

  const formData = await request.formData();
  return {
    key: String(formData.get("key") ?? ""),
    nextPath: String(formData.get("next") ?? "/dashboard"),
  };
}

function resolveOrigin(request: Request) {
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (host) {
    return `${proto}://${host}`;
  }
  return new URL(request.url).origin;
}

export async function POST(request: Request) {
  const { key, nextPath } = await readLoginPayload(request);
  const safeNext = nextPath.startsWith("/") ? nextPath : "/dashboard";
  const previewKey = await validateAccessKeyRuntime(key);
  const authenticated = Boolean(previewKey) || compareDashboardAccessKey(key);
  const origin = resolveOrigin(request);
  const target = new URL(authenticated ? safeNext : `/guild-access?error=1&next=${encodeURIComponent(safeNext)}`, origin);
  const response = NextResponse.redirect(target);

  if (authenticated) {
    if (previewKey) {
      response.cookies.set(ACCESS_KEY_COOKIE, previewKey.code, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    } else {
      response.cookies.set(DASHBOARD_AUTH_COOKIE, key, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 14,
      });
    }
  }

  return response;
}
