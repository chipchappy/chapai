import { NextRequest } from "next/server";
import { z } from "zod";
import { createRequestContext, log, logError } from "@/lib/logger";
import { getDB, hasDatabase, resolveEnv } from "@/lib/db";
import { getServerEnv } from "@/lib/env";
import { jsonError, jsonSuccess } from "@/lib/http";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { ensureHostedUser, findEntitlementByCheckoutSessionId, upsertBillingState } from "@/lib/billing-store";
import { getLaunchOfferDisplayLabel, planCodeFromLegacySignals } from "@/lib/launch-offers";
import { buildBillingStateFromCheckout, subscriptionIsActive, type StripeCheckoutSessionSnapshot, type StripeSubscriptionSnapshot } from "@/lib/stripe-billing";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z.object({
  sessionId: z.string().trim().min(10),
});

function buildLoginUrl(sessionId: string) {
  return `/auth/login?next=${encodeURIComponent(`/success?session_id=${encodeURIComponent(sessionId)}`)}`;
}

export async function POST(request: NextRequest) {
  const requestContext = createRequestContext(request, { route: "/api/checkout/activate" });

  try {
    const env = getServerEnv();
    if (!env.STRIPE_SECRET_KEY) {
      return jsonError(503, "STRIPE_NOT_CONFIGURED", "Stripe is not configured yet.", requestContext, {
        requestId: requestContext.requestId,
      });
    }

    const runtimeEnv = resolveEnv();
    if (!hasDatabase(runtimeEnv)) {
      return jsonError(503, "CHECKOUT_STORAGE_UNAVAILABLE", "Hosted entitlement storage is unavailable.", requestContext, {
        requestId: requestContext.requestId,
      });
    }

    const body = await request.json();
    const { sessionId } = schema.parse(body);
    let user = null;
    try {
      user = await getAuthenticatedUser();
    } catch (error) {
      logError("checkout/activate auth lookup failed", error, requestContext);
    }
    if (!user?.id || !user.email) {
      return jsonError(401, "AUTH_REQUIRED", "Sign in to finalize account access.", {
        ...requestContext,
        loginUrl: buildLoginUrl(sessionId),
      }, {
        requestId: requestContext.requestId,
      });
    }

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
      logError("Stripe checkout activation lookup failed", detail, requestContext);
      return jsonError(502, "STRIPE_LOOKUP_FAILED", "Could not verify this checkout session.", requestContext, {
        requestId: requestContext.requestId,
      });
    }

    const session = (await stripeResponse.json()) as StripeCheckoutSessionSnapshot;
    if (session.status !== "complete") {
      return jsonError(409, "CHECKOUT_INCOMPLETE", "Checkout is not complete yet.", requestContext, {
        requestId: requestContext.requestId,
      });
    }

    const paid =
      session.mode === "payment"
        ? session.payment_status === "paid"
        : session.payment_status === "paid" || subscriptionIsActive(session.subscription);

    if (!paid) {
      return jsonError(409, "PAYMENT_PENDING", "Payment has not settled yet.", requestContext, {
        requestId: requestContext.requestId,
      });
    }

    const metadata = session.metadata ?? {};
    if (metadata.supabase_user_id && metadata.supabase_user_id !== user.id) {
      return jsonError(403, "SESSION_OWNERSHIP_MISMATCH", "This checkout session belongs to a different account.", requestContext, {
        requestId: requestContext.requestId,
      });
    }

    const db = getDB(runtimeEnv);
    let entitlement = await findEntitlementByCheckoutSessionId(db, session.id);
    if (!entitlement) {
      await ensureHostedUser(db, {
        userId: user.id,
        email: user.email,
        name: typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null,
      });
      await upsertBillingState(db, buildBillingStateFromCheckout(session.id, {
        ...session,
        customer: typeof session.customer === "string" ? session.customer : null,
        customer_details: session.customer_details ?? null,
        subscription: typeof session.subscription === "object" && session.subscription
          ? {
              ...(session.subscription as StripeSubscriptionSnapshot),
              customer: typeof (session.subscription as StripeSubscriptionSnapshot).customer === "string"
                ? (session.subscription as StripeSubscriptionSnapshot).customer
                : null,
            }
          : (typeof session.subscription === "string" ? session.subscription : null),
      }));
      entitlement = await findEntitlementByCheckoutSessionId(db, session.id);
    }

    if (!entitlement) {
      log("warn", "Checkout activation requested before entitlement was written", {
        ...requestContext,
        stripeSessionId: session.id,
        userId: user.id,
      });
      return jsonSuccess({
        status: "pending" as const,
        packageLabel: metadata.package_label ?? "Clarity access",
        displayLabel: getLaunchOfferDisplayLabel(metadata.plan_code),
      }, 202, { requestId: requestContext.requestId });
    }

    if (entitlement.userId && entitlement.userId !== user.id) {
      return jsonError(403, "ENTITLEMENT_OWNERSHIP_MISMATCH", "The verified entitlement belongs to a different account.", requestContext, {
        requestId: requestContext.requestId,
      });
    }

    const planCode = planCodeFromLegacySignals({
      planCode: entitlement.planCode,
      tier: entitlement.tier,
      examTrack: entitlement.examTrack,
      checkoutMode: session.mode === "payment" || session.mode === "subscription" ? session.mode : null,
    });

    return jsonSuccess({
      tier: entitlement.tier,
      packageLabel: metadata.package_label ?? "Clarity premium access",
      displayLabel: getLaunchOfferDisplayLabel(planCode),
      expiresAt: entitlement.expiresAt,
      status: "active" as const,
      planCode,
    }, 200, { requestId: requestContext.requestId });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(400, "VALIDATION_ERROR", "Invalid checkout activation request.", requestContext, {
        requestId: requestContext.requestId,
      });
    }

    logError("checkout/activate error", error, requestContext);
    return jsonError(500, "INTERNAL_ERROR", "Internal server error.", requestContext, {
      requestId: requestContext.requestId,
    });
  }
}
