import type { PremiumEntitlement } from "@/lib/premium-access";
import { sanitizePremiumEntitlements } from "@/lib/premium-access";
import { getLaunchOffer, getLaunchOfferDisplayLabel, planCodeFromLegacySignals } from "@/lib/launch-offers";
import type { Tier } from "@/lib/types";
import { getStripePriceMap } from "@/lib/stripe-config";

export type BillingTier = Exclude<Tier, "free">;
export type BillingStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "unpaid"
  | "canceled"
  | "expired"
  | "incomplete"
  | "incomplete_expired";

export type BillingExamTrack = "all" | "nclex" | "ccrn";

const DEFAULT_ENTITLEMENTS: PremiumEntitlement[] = ["live-bank", "rich-modes", "practice-exams"];

export function parseEntitlements(
  value: string | string[] | undefined | null,
  planCode?: string | null,
): PremiumEntitlement[] {
  const items = Array.isArray(value) ? value : (value ?? "").split(",");
  const entitlements = sanitizePremiumEntitlements(items.map((item) => item.trim()));

  if (entitlements.length > 0) {
    return entitlements;
  }

  return getLaunchOffer(planCode)?.entitlements ?? [...DEFAULT_ENTITLEMENTS];
}

export function sanitizeExamTrack(value: string | undefined | null): BillingExamTrack {
  return value === "nclex" || value === "ccrn" ? value : "all";
}

export function tierFromPriceId(priceId: string | null | undefined): BillingTier {
  const prices = getStripePriceMap();
  switch (priceId) {
    case prices.all_access_monthly:
      return "pro";
    case prices.nclex_24h_pass:
    case prices.ccrn_24h_pass:
    case prices.nclex_base_monthly:
    case prices.ccrn_base_monthly:
    case prices.nclex_4day:
    case prices.ccrn_4day:
    case prices.core_monthly:
    case prices.legacy_plus_monthly:
    case prices.legacy_pro_monthly:
    default:
      return priceId === prices.legacy_pro_monthly ? "pro" : "plus";
  }
}

export function tierFromMetadata(metadata: Record<string, string | undefined> | undefined, priceId?: string | null): BillingTier {
  const planCode = planCodeFromMetadata(metadata, "plus");
  const launchOffer = getLaunchOffer(planCode);
  if (launchOffer) {
    return launchOffer.billingTier;
  }
  if (metadata?.tier === "pro") return "pro";
  if (metadata?.tier === "plus") return "plus";
  return tierFromPriceId(priceId);
}

export function planCodeFromMetadata(metadata: Record<string, string | undefined> | undefined, tier: BillingTier) {
  const examTrack = sanitizeExamTrack(metadata?.exam_track_scope ?? metadata?.exam_track ?? metadata?.unlock_scope);
  const planCode = planCodeFromLegacySignals({
    planCode: metadata?.plan_code ?? null,
    tier: metadata?.tier ?? tier,
    examTrack,
    checkoutMode: metadata?.plan_type === "track-pass" || metadata?.package_type === "cram-pass" ? "payment" : "subscription",
  });

  if (planCode) {
    return planCode;
  }

  if (tier === "pro") {
    return "all_access_monthly";
  }

  if (examTrack === "nclex" || examTrack === "ccrn") {
    return `${examTrack}_base_monthly`;
  }

  return "core_monthly";
}

export function billingStatusFromSubscription(status: string | undefined | null): BillingStatus {
  switch (status) {
    case "trialing":
      return "trialing";
    case "past_due":
      return "past_due";
    case "unpaid":
      return "unpaid";
    case "canceled":
      return "canceled";
    case "incomplete":
      return "incomplete";
    case "incomplete_expired":
      return "incomplete_expired";
    case "active":
    default:
      return "active";
  }
}

export function examTrackScopeFromMetadata(metadata: Record<string, string | undefined> | undefined, planCode?: string | null) {
  return getLaunchOffer(planCode)?.examTrackScope ?? sanitizeExamTrack(metadata?.exam_track_scope ?? metadata?.unlock_scope ?? metadata?.exam_track);
}

export function getPlanDisplayLabel(planCode: string | null | undefined) {
  return getLaunchOfferDisplayLabel(planCode);
}
