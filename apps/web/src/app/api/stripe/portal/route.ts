import { NextRequest, NextResponse } from "next/server";
import { getDB, hasDatabase, resolveEnv } from "@/lib/db";
import { getBillingCustomerForUser, getLatestBillingSnapshotForUser } from "@/lib/billing-store";
import { createRequestContext, logError } from "@/lib/logger";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { getServerAccessContext } from "@/lib/server-access";
import { getServerEnv } from "@/lib/env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const requestContext = createRequestContext(request, { route: "/api/stripe/portal" });

  try {
    const env = getServerEnv();
    const { access } = await getServerAccessContext();

    if (access.source === "founder-key" || access.source === "preview-key") {
      return NextResponse.redirect(new URL("/account/billing?portal=unavailable", request.url));
    }

    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.redirect(new URL("/auth/login?next=%2Faccount%2Fbilling", request.url));
    }

    const runtimeEnv = resolveEnv();
    if (!hasDatabase(runtimeEnv)) {
      return NextResponse.redirect(new URL("/account/billing?portal=unavailable", request.url));
    }

    if (!env.STRIPE_SECRET_KEY) {
      return NextResponse.redirect(new URL("/account/billing?portal=unavailable", request.url));
    }

    const db = getDB(runtimeEnv);
    const billingCustomer = await getBillingCustomerForUser(db, {
      userId: user.id,
      email: user.email ?? null,
    });
    const billingSnapshot = await getLatestBillingSnapshotForUser(db, {
      userId: user.id,
      email: user.email ?? null,
    });
    const stripeCustomerId = billingCustomer?.stripe_customer_id ?? billingSnapshot?.stripe_customer_id ?? null;

    if (!stripeCustomerId) {
      return NextResponse.redirect(new URL("/account/billing?portal=missing", request.url));
    }

    const response = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        customer: stripeCustomerId,
        return_url: `${new URL(request.url).origin}/account/billing`,
      }).toString(),
    });

    if (!response.ok) {
      const detail = await response.text();
      logError("Stripe portal session creation failed", detail, requestContext);
      return NextResponse.redirect(new URL("/account/billing?portal=error", request.url));
    }

    const payload = await response.json() as { url?: string };
    if (!payload.url) {
      return NextResponse.redirect(new URL("/account/billing?portal=error", request.url));
    }

    return NextResponse.redirect(payload.url);
  } catch (error) {
    logError("stripe/portal route failed", error, requestContext);
    return NextResponse.redirect(new URL("/account/billing?portal=error", request.url));
  }
}
