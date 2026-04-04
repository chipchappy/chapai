import { NextResponse } from "next/server";
import { resolveEnv } from "@/lib/db";
import { createPaidAccessToken, PAID_ACCESS_COOKIE, type PremiumEntitlement } from "@/lib/premium-access";
import { z } from "zod";

const schema = z.object({
  sessionId: z.string().trim().min(10),
});

type StripeSubscription = {
  status?: string;
  current_period_end?: number;
};

type StripeCheckoutSession = {
  id: string;
  mode: "payment" | "subscription";
  status?: string;
  payment_status?: string;
  metadata?: Record<string, string | undefined>;
  subscription?: StripeSubscription | string | null;
};

function parseEntitlements(value: string | undefined): PremiumEntitlement[] {
  const items = (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const allowed = items.filter((item): item is PremiumEntitlement => (
    item === "live-bank" || item === "rich-modes" || item === "practice-exams" || item === "tutor"
  ));

  return allowed.length > 0 ? allowed : ["live-bank", "rich-modes", "practice-exams", "tutor"];
}

function subscriptionIsActive(subscription: StripeSubscription | string | null | undefined) {
  if (!subscription || typeof subscription === "string") {
    return false;
  }

  return subscription.status === "active" || subscription.status === "trialing";
}

function getExpiresAt(session: StripeCheckoutSession) {
  const metadata = session.metadata ?? {};

  if (session.mode === "payment") {
    const accessHours = Number(metadata.access_hours ?? 24);
    return Date.now() + Math.max(1, accessHours) * 60 * 60 * 1000;
  }

  if (session.subscription && typeof session.subscription !== "string" && session.subscription.current_period_end) {
    return session.subscription.current_period_end * 1000;
  }

  return Date.now() + 30 * 24 * 60 * 60 * 1000;
}

export async function POST(request: Request) {
  try {
    const env = resolveEnv();
    if (!env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ success: false, error: "Stripe is not configured yet." }, { status: 503 });
    }

    const body = await request.json();
    const { sessionId } = schema.parse(body);

    const stripeResponse = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}?expand[]=subscription`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        },
      },
    );

    if (!stripeResponse.ok) {
      const detail = await stripeResponse.text();
      console.error("checkout/activate stripe error:", detail);
      return NextResponse.json({ success: false, error: "Could not verify this checkout session." }, { status: 502 });
    }

    const session = (await stripeResponse.json()) as StripeCheckoutSession;
    if (session.status !== "complete") {
      return NextResponse.json({ success: false, error: "Checkout is not complete yet." }, { status: 409 });
    }

    const paid =
      session.mode === "payment"
        ? session.payment_status === "paid"
        : session.payment_status === "paid" || subscriptionIsActive(session.subscription);

    if (!paid) {
      return NextResponse.json({ success: false, error: "Payment has not settled yet." }, { status: 409 });
    }

    const metadata = session.metadata ?? {};
    const tier = metadata.tier === "pro" ? "pro" : "plus";
    const planCode = metadata.plan_code ?? `${tier}-launch`;
    const packageLabel = metadata.package_label ?? "Clarity premium access";
    const examTrack = metadata.unlock_scope === "all"
      ? "all"
      : metadata.exam_track === "ccrn" || metadata.exam_track === "nclex"
        ? metadata.exam_track
        : "all";
    const entitlements = parseEntitlements(metadata.entitlements);
    const expiresAt = getExpiresAt(session);

    const token = createPaidAccessToken({
      tier,
      planCode,
      packageLabel,
      examTrack,
      entitlements,
      sessionId: session.id,
      expiresAt,
    });

    const secure = (request.headers.get("x-forwarded-proto") ?? new URL(request.url).protocol.replace(":", "")) === "https";
    const response = NextResponse.json({
      success: true,
      data: {
        tier,
        packageLabel,
        displayLabel: tier === "pro" ? "Pro access active" : "Plus access active",
        expiresAt: new Date(expiresAt).toISOString(),
      },
    });

    response.cookies.set(PAID_ACCESS_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: Math.max(60 * 60, Math.floor((expiresAt - Date.now()) / 1000)),
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: "Invalid checkout activation request." }, { status: 400 });
    }

    console.error("checkout/activate error:", error);
    return NextResponse.json({ success: false, error: "Internal server error." }, { status: 500 });
  }
}
