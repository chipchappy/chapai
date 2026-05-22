import { getServerEnv } from "@/lib/env";
import type { LaunchOfferPolicy } from "@/lib/launch-offers";

type StripePriceListResponse = {
  data?: Array<{ id?: string }>;
};

function toLookupKey(planCode: string) {
  return `chapai_${planCode}`;
}

function stripeHeaders(secretKey: string) {
  return {
    Authorization: `Bearer ${secretKey}`,
    "Content-Type": "application/x-www-form-urlencoded",
    "Stripe-Version": "2026-02-25.clover",
  };
}

async function lookupPriceId(secretKey: string, lookupKey: string) {
  const params = new URLSearchParams();
  params.set("lookup_keys[0]", lookupKey);
  params.set("active", "true");
  params.set("limit", "1");

  const response = await fetch(`https://api.stripe.com/v1/prices?${params.toString()}`, {
    method: "GET",
    headers: stripeHeaders(secretKey),
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as StripePriceListResponse;
  return payload.data?.[0]?.id ?? null;
}

async function createPrice(secretKey: string, offer: LaunchOfferPolicy, lookupKey: string) {
  const params = new URLSearchParams();
  params.set("currency", "usd");
  params.set("unit_amount", String(Math.round(offer.price * 100)));
  params.set("lookup_key", lookupKey);
  params.set("nickname", offer.label);
  params.set("metadata[plan_code]", offer.planCode);
  params.set("metadata[exam_track_scope]", offer.examTrackScope);
  params.set("metadata[billing_tier]", offer.billingTier);
  params.set("product_data[name]", offer.label);
  params.set("product_data[description]", offer.description);
  params.set("product_data[metadata][plan_code]", offer.planCode);

  if (offer.checkoutMode === "subscription") {
    params.set("recurring[interval]", "month");
  }

  const response = await fetch("https://api.stripe.com/v1/prices", {
    method: "POST",
    headers: stripeHeaders(secretKey),
    body: params.toString(),
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { id?: string };
  return payload.id ?? null;
}

export async function resolveStripePriceIdForOffer(
  offer: LaunchOfferPolicy,
  env = getServerEnv(),
  preferredPriceId?: string | null,
) {
  if (preferredPriceId) {
    return preferredPriceId;
  }

  if (!env.STRIPE_SECRET_KEY) {
    return null;
  }

  const lookupKey = toLookupKey(offer.planCode);
  const existing = await lookupPriceId(env.STRIPE_SECRET_KEY, lookupKey);
  if (existing) {
    return existing;
  }

  return createPrice(env.STRIPE_SECRET_KEY, offer, lookupKey);
}
