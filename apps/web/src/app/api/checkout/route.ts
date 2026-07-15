import { resolveEnv, getDB, hasDatabase } from "@/lib/db";
import { z } from "zod";
import { createRequestContext, log, logError } from "@/lib/logger";
import { handleRouteError, jsonError, jsonSuccess } from "@/lib/http";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { ensureHostedUser, getActiveEntitlementForUser, getBillingCustomerForUser } from "@/lib/billing-store";
import { buildCheckoutIdempotencyKey, inspectStripeCheckoutSafety } from "@/lib/checkout-safety";
import { getLaunchOffer, planCodeFromLegacySignals } from "@/lib/launch-offers";
import { recordCurrentPolicyAcceptances } from "@/lib/legal-store";
import { getStripePriceMap } from "@/lib/stripe-config";
import { resolveStripePriceIdForOffer } from "@/lib/stripe-prices";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z.object({
  planCode: z.string().trim().min(3).max(80).optional(),
  examTrack: z.enum(["ccrn", "nclex"]).optional(),
  checkoutMode: z.enum(["subscription", "payment"]).optional(),
  tier: z.enum(["plus", "pro"]).optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
  acceptedTerms: z.literal(true),
  acceptedPrivacy: z.literal(true),
});

function getOfferPriceId(planCode: string | null | undefined) {
  const prices = getStripePriceMap();
  switch (planCode) {
    case "nclex_24h_pass":
      return prices.nclex_24h_pass || null;
    case "ccrn_24h_pass":
      return prices.ccrn_24h_pass || null;
    case "nclex_base_monthly":
      return prices.nclex_base_monthly || null;
    case "ccrn_base_monthly":
      return prices.ccrn_base_monthly || null;
    case "nclex_4day_pass":
      return prices.nclex_4day || null;
    case "ccrn_4day_pass":
      return prices.ccrn_4day || null;
    case "core_monthly":
      return prices.core_monthly || null;
    case "all_access_monthly":
      return prices.all_access_monthly || null;
    default:
      return null;
  }
}

function sameOriginUrl(candidate: string | undefined, appUrl: string, fallbackPath: string) {
  if (!candidate) return `${appUrl}${fallbackPath}`;
  try {
    const url = new URL(candidate);
    return url.origin === appUrl ? url.toString() : `${appUrl}${fallbackPath}`;
  } catch {
    return `${appUrl}${fallbackPath}`;
  }
}

export async function POST(req: Request) {
  const requestContext = createRequestContext(req, { route: "/api/checkout" });
  try {
    const env = resolveEnv();
    const user = await getAuthenticatedUser();
    if (!user?.id || !user.email) {
      return jsonError(401, "AUTH_REQUIRED", "Sign in before starting checkout.", {
        ...requestContext,
        loginUrl: `/auth/login?next=${encodeURIComponent("/upgrade")}`,
      }, {
        requestId: requestContext.requestId,
      });
    }

    if (!env.STRIPE_SECRET_KEY) {
      return jsonError(503, "STRIPE_NOT_CONFIGURED", "Stripe is not configured for checkout yet.", requestContext, {
        requestId: requestContext.requestId,
      });
    }

    if (!hasDatabase(env)) {
      return jsonError(503, "CHECKOUT_STORAGE_UNAVAILABLE", "Hosted checkout storage is not configured.", requestContext, {
        requestId: requestContext.requestId,
      });
    }

    const db = getDB(env);
    await ensureHostedUser(db, {
      userId: user.id,
      email: user.email,
      name: typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null,
    });

    const body = schema.parse(await req.json());
    const requestedPlanCode = planCodeFromLegacySignals({
      planCode: body.planCode ?? null,
      tier: body.tier ?? null,
      examTrack: body.examTrack ?? null,
      checkoutMode: body.checkoutMode ?? null,
    });
    const offer = getLaunchOffer(requestedPlanCode);

    if (!offer) {
      return jsonError(400, "UNKNOWN_PLAN", "That offer is not available for checkout.", requestContext, {
        requestId: requestContext.requestId,
      });
    }

    const existingEntitlement = await getActiveEntitlementForUser(db, {
      userId: user.id,
      email: user.email,
    });
    const duplicatesExistingPurchase = Boolean(existingEntitlement) && (
      existingEntitlement?.planCode === offer.planCode
      || (offer.checkoutMode === "subscription" && Boolean(existingEntitlement?.stripeSubscriptionId))
    );
    if (duplicatesExistingPurchase) {
      return jsonError(409, "PURCHASE_ALREADY_ACTIVE", "This account already has active paid access. Manage the existing purchase instead of starting another charge.", {
        ...requestContext,
        billingUrl: "/account/billing",
      }, {
        requestId: requestContext.requestId,
      });
    }

    const billingCustomer = await getBillingCustomerForUser(db, {
      userId: user.id,
      email: user.email,
    });
    let stripeSafety;
    try {
      stripeSafety = await inspectStripeCheckoutSafety({
        secretKey: env.STRIPE_SECRET_KEY,
        email: user.email,
        userId: user.id,
        knownCustomerId: billingCustomer?.stripe_customer_id,
      });
    } catch (error) {
      logError("Stripe duplicate-purchase safety lookup failed", error, requestContext);
      return jsonError(503, "CHECKOUT_SAFETY_UNAVAILABLE", "Checkout is temporarily paused because existing billing could not be verified. No charge was created.", requestContext, {
        requestId: requestContext.requestId,
      });
    }
    if (stripeSafety.blockingSubscription) {
      return jsonError(409, "SUBSCRIPTION_ALREADY_ACTIVE", "An active subscription already exists for this account. Manage it from billing instead of purchasing again.", {
        ...requestContext,
        billingUrl: "/account/billing",
      }, {
        requestId: requestContext.requestId,
      });
    }

    await recordCurrentPolicyAcceptances(db, {
      email: user.email,
      userId: user.id,
      source: "checkout",
      request: req,
    });

    const configuredAppUrl = env.NEXT_PUBLIC_APP_URL || env.NEXTAUTH_URL || new URL(req.url).origin;
    const appUrl = new URL(configuredAppUrl).origin;
    const successTarget = new URL(sameOriginUrl(body.successUrl, appUrl, "/success"));
    successTarget.searchParams.set("plan", offer.planCode);
    successTarget.searchParams.set("package", offer.label);
    successTarget.searchParams.set("session_id", "{CHECKOUT_SESSION_ID}");
    if (offer.examTrackScope !== "all") {
      successTarget.searchParams.set("exam", offer.examTrackScope);
    }

    const params = new URLSearchParams({
      mode: offer.checkoutMode,
      "line_items[0][quantity]": "1",
      success_url: successTarget.toString(),
      cancel_url: sameOriginUrl(body.cancelUrl, appUrl, "/upgrade"),
      allow_promotion_codes: "true",
      billing_address_collection: "auto",
    });

    if (offer.checkoutMode === "payment") {
      params.set("payment_method_types[0]", "card");
    }

    if (stripeSafety.customerId) {
      params.set("customer", stripeSafety.customerId);
    } else {
      params.set("customer_email", user.email);
      if (offer.checkoutMode === "payment") {
        params.set("customer_creation", "always");
      }
    }

    const preferredPriceId = getOfferPriceId(offer.planCode);
    const priceId = await resolveStripePriceIdForOffer(offer, undefined, preferredPriceId);
    if (priceId) {
      params.set("line_items[0][price]", priceId);
    } else {
      params.set("line_items[0][price_data][currency]", "usd");
      params.set("line_items[0][price_data][unit_amount]", String(Math.round(offer.price * 100)));
      params.set("line_items[0][price_data][product_data][name]", offer.label);
      params.set("line_items[0][price_data][product_data][description]", offer.description);
      if (offer.checkoutMode === "subscription") {
        params.set("line_items[0][price_data][recurring][interval]", "month");
      }
    }

    const metadataEntries = Object.entries({
      supabase_user_id: user.id,
      user_email: user.email,
      tier: offer.billingTier,
      plan_code: offer.planCode,
      plan_type: offer.planType,
      package_label: offer.label,
      exam_track_scope: offer.examTrackScope,
      question_bank_access_percent: String(offer.questionBankAccessPercent),
      practice_exam_limit: String(offer.practiceExamLimit),
      entitlements: offer.entitlements.join(","),
      advanced_analytics: offer.canUseAdvancedAnalytics ? "true" : undefined,
      access_hours: offer.accessHours ? String(offer.accessHours) : undefined,
      purchase_type: offer.checkoutMode === "payment" ? "fixed-term" : "subscription",
      price_id: priceId ?? undefined,
    }).filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].length > 0);

    for (const [key, value] of metadataEntries) {
      params.set(`metadata[${key}]`, value);
      if (offer.checkoutMode === "subscription") {
        params.set(`subscription_data[metadata][${key}]`, value);
      }
    }

    if (offer.examTrackScope !== "all") {
      params.set("client_reference_id", offer.examTrackScope);
    }

    const purchaseFamily = offer.checkoutMode === "subscription" ? "subscription" : offer.planCode;
    const idempotencyKey = await buildCheckoutIdempotencyKey({
      userId: user.id,
      purchaseFamily,
    });
    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Idempotency-Key": idempotencyKey,
      },
      body: params.toString(),
    });

    if (!stripeRes.ok) {
      const err = await stripeRes.json();
      logError("Stripe checkout session creation failed", err, requestContext);
      return jsonError(500, "CHECKOUT_FAILED", "Checkout failed.", requestContext, {
        requestId: requestContext.requestId,
      });
    }

    const session = await stripeRes.json();
    log("info", "Stripe checkout session created", {
      ...requestContext,
      stripeSessionId: session.id,
      planCode: offer.planCode,
      priceId: priceId ?? "inline-price-data",
      userId: user.id,
    });

    return jsonSuccess({
      url: session.url,
      sessionId: session.id,
      planCode: offer.planCode,
      packageLabel: offer.label,
    }, 200, {
      requestId: requestContext.requestId,
    });
  } catch (err) {
    return handleRouteError(err, {
      requestId: requestContext.requestId,
      route: "/api/checkout",
      fallbackMessage: "Internal checkout error.",
    });
  }
}
