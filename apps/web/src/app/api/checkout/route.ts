import { resolveEnv, getDB, hasDatabase } from "@/lib/db";
import { z } from "zod";
import { createRequestContext, log, logError } from "@/lib/logger";
import { handleRouteError, jsonError, jsonSuccess } from "@/lib/http";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { ensureHostedUser, getBillingCustomerForUser } from "@/lib/billing-store";
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

    await recordCurrentPolicyAcceptances(db, {
      email: user.email,
      userId: user.id,
      source: "checkout",
      request: req,
    });

    const appUrl = new URL(req.url).origin;
    // Default to the dashboard celebration view; legacy callers can still pass
    // a custom `successUrl` for one-off flows.
    const successTarget = new URL(body.successUrl || `${appUrl}/dashboard?upgrade=success`);
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
      cancel_url: body.cancelUrl || `${appUrl}/upgrade`,
      allow_promotion_codes: "true",
      billing_address_collection: "auto",
    });

    if (offer.checkoutMode === "payment") {
      params.set("payment_method_types[0]", "card");
    }

    const billingCustomer = await getBillingCustomerForUser(db, {
      userId: user.id,
      email: user.email,
    });
    if (billingCustomer?.stripe_customer_id) {
      params.set("customer", billingCustomer.stripe_customer_id);
    } else {
      params.set("customer_email", user.email);
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

    const expiresAt = offer.accessHours
      ? new Date(Date.now() + offer.accessHours * 60 * 60 * 1000).toISOString()
      : undefined;

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
      expires_at: expiresAt,
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

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
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
