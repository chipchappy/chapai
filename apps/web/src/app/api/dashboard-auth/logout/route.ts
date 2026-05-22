import { ACCESS_KEY_COOKIE } from "@/lib/access-keys";
import { DASHBOARD_AUTH_COOKIE } from "@/lib/dashboard-auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function resolveOrigin(request: Request) {
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (host) {
    return `${proto}://${host}`;
  }
  return new URL(request.url).origin;
}

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/", resolveOrigin(request)));
  response.cookies.set(DASHBOARD_AUTH_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  response.cookies.set(ACCESS_KEY_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
