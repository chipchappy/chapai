import { ACCESS_KEY_COOKIE, redeemAccessKey } from "@/lib/access-keys";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function readPayload(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      const payload = (await request.json()) as { code?: string; next?: string };
      return {
        code: String(payload.code ?? ""),
        nextPath: String(payload.next ?? "/demo-access?unlocked=1"),
      };
    } catch {
      return { code: "", nextPath: "/demo-access?unlocked=1" };
    }
  }

  const formData = await request.formData();
  return {
    code: String(formData.get("code") ?? ""),
    nextPath: String(formData.get("next") ?? "/demo-access?unlocked=1"),
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
  const { code, nextPath } = await readPayload(request);
  const safeNext = nextPath.startsWith("/") ? nextPath : "/demo-access?unlocked=1";
  const redeemed = redeemAccessKey(code);
  const origin = resolveOrigin(request);

  if (!redeemed.ok) {
    const target = new URL(`/demo-access?error=${encodeURIComponent(redeemed.reason)}&next=${encodeURIComponent(safeNext)}`, origin);
    return NextResponse.redirect(target);
  }

  const response = NextResponse.redirect(new URL(safeNext, origin));
  response.cookies.set(ACCESS_KEY_COOKIE, redeemed.record.code, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
