import {
  billingStatusFromSubscription,
  examTrackScopeFromMetadata,
  parseEntitlements,
  planCodeFromMetadata,
  tierFromMetadata,
} from "@/lib/billing";
import type { BillingStatus } from "@/lib/billing";

export type StripeSubscriptionSnapshot = {
  id: string;
  status?: string;
  current_period_end?: number | null;
  canceled_at?: number | null;
  ended_at?: number | null;
  metadata?: Record<string, string | undefined> | null;
  customer?: unknown;
  items?: {
    data?: Array<{
      price?: {
        id?: string | null;
      };
    }>;
  };
};

export type StripeCheckoutSessionSnapshot = {
  id: string;
  mode: "payment" | "subscription" | "setup";
  status?: string | null;
  payment_status?: string;
  customer?: unknown;
  customer_email?: string | null;
  customer_details?: {
    email?: string | null;
  } | null;
  subscription?: StripeSubscriptionSnapshot | string | null;
  metadata?: Record<string, string | undefined> | null;
};

export function subscriptionIsActive(subscription: StripeSubscriptionSnapshot | string | null | undefined) {
  if (!subscription || typeof subscription === "string") {
    return false;
  }

  return subscription.status === "active" || subscription.status === "trialing";
}

export function getAccessExpiryFromCheckout(session: StripeCheckoutSessionSnapshot) {
  const accessHours = Number(session.metadata?.access_hours ?? 24);
  return Math.floor(Date.now() / 1000) + Math.max(1, accessHours) * 60 * 60;
}

export function buildBillingStateFromCheckout(eventId: string, session: StripeCheckoutSessionSnapshot) {
  const metadata = session.metadata ?? {};
  const priceId = metadata.price_id ?? null;
  const tier = tierFromMetadata(metadata, priceId);
  const planCode = planCodeFromMetadata(metadata, tier);
  const examTrack = examTrackScopeFromMetadata(metadata, planCode);
  const entitlements = parseEntitlements(metadata.entitlements, planCode);
  const isPaymentMode = session.mode === "payment";
  const isSubscriptionMode = session.mode === "subscription";
  const paid = isPaymentMode
    ? session.payment_status === "paid"
    : isSubscriptionMode && (session.payment_status === "paid" || subscriptionIsActive(session.subscription));

  const status: BillingStatus = session.mode === "payment"
    ? (paid ? "active" : "incomplete")
    : session.mode === "subscription"
      ? (subscriptionIsActive(session.subscription) ? "active" : "incomplete")
      : "incomplete";

  return {
    userId: metadata.supabase_user_id ?? null,
    email: session.customer_details?.email ?? session.customer_email ?? metadata.user_email ?? null,
    tier,
    planCode,
    status,
    examTrack,
    entitlements,
    stripeCustomerId: typeof session.customer === "string" ? session.customer : null,
    stripeSubscriptionId: typeof session.subscription === "string" ? session.subscription : session.subscription?.id ?? null,
    stripeCheckoutSessionId: session.id,
    expiresAt: isPaymentMode && paid ? getAccessExpiryFromCheckout(session) : null,
    currentPeriodEnd: typeof session.subscription === "object" && session.subscription
      ? (session.subscription.current_period_end ?? null)
      : null,
    sourceEventId: eventId,
  };
}

export function buildBillingStateFromSubscription(eventId: string, subscription: StripeSubscriptionSnapshot) {
  const metadata = subscription.metadata ?? {};
  const priceId = subscription.items?.data?.[0]?.price?.id ?? metadata.price_id ?? null;
  const tier = tierFromMetadata(metadata, priceId);
  const planCode = planCodeFromMetadata(metadata, tier);
  const examTrack = examTrackScopeFromMetadata(metadata, planCode);
  const entitlements = parseEntitlements(metadata.entitlements, planCode);

  const status = billingStatusFromSubscription(subscription.status) as BillingStatus;

  return {
    userId: metadata.supabase_user_id ?? null,
    email: metadata.user_email ?? null,
    tier,
    planCode,
    status,
    examTrack,
    entitlements,
    stripeCustomerId: typeof subscription.customer === "string" ? subscription.customer : null,
    stripeSubscriptionId: subscription.id,
    currentPeriodEnd: subscription.current_period_end ?? null,
    expiresAt: subscription.current_period_end ?? null,
    canceledAt: subscription.canceled_at ?? null,
    sourceEventId: eventId,
  };
}
