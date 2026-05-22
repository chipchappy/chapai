import "server-only";

import type { User } from "@supabase/supabase-js";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service";
import type { PremiumEntitlement } from "@/lib/premium-access";
import { sanitizePremiumEntitlements } from "@/lib/premium-access";

export type HostedBillingStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "unpaid"
  | "canceled"
  | "expired"
  | "incomplete"
  | "incomplete_expired";

export type HostedTier = "plus" | "pro";
export type HostedExamTrack = "all" | "nclex" | "ccrn";

export type HostedEntitlementRow = {
  id: string;
  userId: string | null;
  email: string | null;
  tier: HostedTier;
  planCode: string;
  status: HostedBillingStatus;
  examTrack: HostedExamTrack;
  entitlements: PremiumEntitlement[];
  stripeCheckoutSessionId: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  expiresAt: string | null;
  currentPeriodEnd: string | null;
  sourceEventId: string | null;
  updatedAt: string | null;
};

type BillingStateInput = {
  userId?: string | null;
  email?: string | null;
  tier: HostedTier;
  planCode: string;
  status: HostedBillingStatus;
  examTrack: HostedExamTrack;
  entitlements: PremiumEntitlement[];
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripeCheckoutSessionId?: string | null;
  currentPeriodEnd?: string | null;
  expiresAt?: string | null;
  canceledAt?: string | null;
  sourceEventId?: string | null;
};

type BillingEventRow = {
  id: string;
  stripe_event_id: string;
  type: string;
  processed_at: string;
  payload: unknown;
};

type BillingSubscriptionRow = {
  id: string;
  user_id: string | null;
  email: string | null;
  tier: HostedTier;
  plan_code: string;
  status: HostedBillingStatus;
  exam_track: HostedExamTrack;
  entitlements: PremiumEntitlement[];
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_checkout_session_id: string | null;
  current_period_end: string | null;
  expires_at: string | null;
  canceled_at: string | null;
  updated_at: string | null;
};

function mapEntitlementRow(row: Record<string, unknown>): HostedEntitlementRow {
  return {
    id: String(row.id),
    userId: row.user_id ? String(row.user_id) : null,
    email: row.email ? String(row.email) : null,
    tier: row.tier === "pro" ? "pro" : "plus",
    planCode: String(row.plan_code),
    status: String(row.status) as HostedBillingStatus,
    examTrack: row.exam_track === "ccrn" || row.exam_track === "nclex" ? row.exam_track : "all",
    entitlements: sanitizePremiumEntitlements(
      Array.isArray(row.entitlements)
        ? (row.entitlements.filter((value): value is PremiumEntitlement => typeof value === "string") as PremiumEntitlement[])
        : undefined,
    ),
    stripeCheckoutSessionId: row.stripe_checkout_session_id ? String(row.stripe_checkout_session_id) : null,
    stripeCustomerId: row.stripe_customer_id ? String(row.stripe_customer_id) : null,
    stripeSubscriptionId: row.stripe_subscription_id ? String(row.stripe_subscription_id) : null,
    expiresAt: row.expires_at ? String(row.expires_at) : null,
    currentPeriodEnd: row.current_period_end ? String(row.current_period_end) : null,
    sourceEventId: row.source_event_id ? String(row.source_event_id) : null,
    updatedAt: row.updated_at ? String(row.updated_at) : null,
  };
}

function normalizeTimestamp(value?: string | null) {
  return value ?? null;
}

function mapBillingSubscriptionRow(row: Record<string, unknown>): BillingSubscriptionRow {
  return {
    id: String(row.id),
    user_id: row.user_id ? String(row.user_id) : null,
    email: row.email ? String(row.email) : null,
    tier: row.tier === "pro" ? "pro" : "plus",
    plan_code: String(row.plan_code),
    status: String(row.status) as HostedBillingStatus,
    exam_track: row.exam_track === "ccrn" || row.exam_track === "nclex" ? row.exam_track : "all",
    entitlements: sanitizePremiumEntitlements(
      Array.isArray(row.entitlements)
        ? (row.entitlements.filter((value): value is PremiumEntitlement => typeof value === "string") as PremiumEntitlement[])
        : undefined,
    ),
    stripe_customer_id: row.stripe_customer_id ? String(row.stripe_customer_id) : null,
    stripe_subscription_id: row.stripe_subscription_id ? String(row.stripe_subscription_id) : null,
    stripe_checkout_session_id: row.stripe_checkout_session_id ? String(row.stripe_checkout_session_id) : null,
    current_period_end: row.current_period_end ? String(row.current_period_end) : null,
    expires_at: row.expires_at ? String(row.expires_at) : null,
    canceled_at: row.canceled_at ? String(row.canceled_at) : null,
    updated_at: row.updated_at ? String(row.updated_at) : null,
  };
}

export async function ensureSupabaseProfile(user: User) {
  const supabase = createServiceRoleSupabaseClient();
  const now = new Date().toISOString();

  const payload = {
    user_id: user.id,
    email: user.email ?? null,
    full_name: typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null,
    updated_at: now,
  };

  const { error } = await supabase
    .from("user_profiles")
    .upsert({
      ...payload,
      created_at: now,
    }, {
      onConflict: "user_id",
    });

  if (error) {
    throw error;
  }
}

export async function recordBillingEventOnce(input: {
  stripeEventId: string;
  type: string;
  payload: string;
}) {
  const supabase = createServiceRoleSupabaseClient();
  const insert = await supabase
    .from("billing_events")
    .insert({
      stripe_event_id: input.stripeEventId,
      type: input.type,
      payload: JSON.parse(input.payload),
    })
    .select("*")
    .single();

  if (!insert.error) {
    return {
      alreadyProcessed: false,
      event: insert.data as BillingEventRow,
    };
  }

  if (insert.error.code !== "23505") {
    throw insert.error;
  }

  const existing = await supabase
    .from("billing_events")
    .select("*")
    .eq("stripe_event_id", input.stripeEventId)
    .single();

  if (existing.error) {
    throw existing.error;
  }

  return {
    alreadyProcessed: true,
    event: existing.data as BillingEventRow,
  };
}

export async function findBillingEvent(stripeEventId: string) {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("billing_events")
    .select("*")
    .eq("stripe_event_id", stripeEventId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as BillingEventRow | null;
}

export async function findEntitlementByCheckoutSessionId(checkoutSessionId: string) {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("user_entitlements")
    .select("*")
    .eq("stripe_checkout_session_id", checkoutSessionId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapEntitlementRow(data as Record<string, unknown>) : null;
}

export async function getBillingCustomerForUser(userId: string) {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("billing_customers")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as {
    id: string;
    user_id: string;
    email: string | null;
    stripe_customer_id: string | null;
    updated_at: string | null;
  } | null;
}

export async function getLatestBillingSnapshotForUser(userId: string) {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("billing_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapBillingSubscriptionRow(data as Record<string, unknown>) : null;
}

export async function getActiveEntitlementForUser(userId: string) {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("user_entitlements")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  const now = Date.now();
  const row = (data ?? []).find((candidate) => {
    const status = String(candidate.status);
    const expiresAt = candidate.expires_at ? Date.parse(String(candidate.expires_at)) : null;
    const activeStatus = status === "active" || status === "trialing" || status === "past_due";
    return activeStatus && (!expiresAt || expiresAt > now);
  });

  return row ? mapEntitlementRow(row as Record<string, unknown>) : null;
}

export async function upsertBillingState(input: BillingStateInput) {
  const supabase = createServiceRoleSupabaseClient();
  const now = new Date().toISOString();

  if (input.userId) {
    await supabase
      .from("billing_customers")
      .upsert({
        user_id: input.userId,
        email: input.email ?? null,
        stripe_customer_id: input.stripeCustomerId ?? null,
        updated_at: now,
        created_at: now,
      }, {
        onConflict: "user_id",
      });
  }

  const subscriptionPayload = {
    user_id: input.userId ?? null,
    email: input.email ?? null,
    tier: input.tier,
    plan_code: input.planCode,
    status: input.status,
    exam_track: input.examTrack,
    entitlements: input.entitlements,
    stripe_customer_id: input.stripeCustomerId ?? null,
    stripe_subscription_id: input.stripeSubscriptionId ?? null,
    stripe_checkout_session_id: input.stripeCheckoutSessionId ?? null,
    current_period_end: normalizeTimestamp(input.currentPeriodEnd),
    expires_at: normalizeTimestamp(input.expiresAt),
    canceled_at: normalizeTimestamp(input.canceledAt),
    updated_at: now,
    created_at: now,
  };

  const subscriptionMatch = input.stripeSubscriptionId
    ? await supabase
        .from("billing_subscriptions")
        .select("*")
        .eq("stripe_subscription_id", input.stripeSubscriptionId)
        .maybeSingle()
    : input.stripeCheckoutSessionId
      ? await supabase
          .from("billing_subscriptions")
          .select("*")
          .eq("stripe_checkout_session_id", input.stripeCheckoutSessionId)
          .maybeSingle()
      : null;

  if (subscriptionMatch?.error) {
    throw subscriptionMatch.error;
  }

  if (subscriptionMatch?.data?.id) {
    const { error } = await supabase
      .from("billing_subscriptions")
      .update(subscriptionPayload)
      .eq("id", subscriptionMatch.data.id);
    if (error) {
      throw error;
    }
  } else {
    const { error } = await supabase
      .from("billing_subscriptions")
      .insert(subscriptionPayload);
    if (error) {
      throw error;
    }
  }

  const entitlementPayload = {
    user_id: input.userId ?? null,
    email: input.email ?? null,
    tier: input.tier,
    plan_code: input.planCode,
    status: input.status,
    exam_track: input.examTrack,
    entitlements: input.entitlements,
    stripe_checkout_session_id: input.stripeCheckoutSessionId ?? null,
    stripe_customer_id: input.stripeCustomerId ?? null,
    stripe_subscription_id: input.stripeSubscriptionId ?? null,
    expires_at: normalizeTimestamp(input.expiresAt),
    current_period_end: normalizeTimestamp(input.currentPeriodEnd),
    source_event_id: input.sourceEventId ?? null,
    updated_at: now,
    created_at: now,
  };

  const entitlementMatch = input.stripeSubscriptionId
    ? await supabase
        .from("user_entitlements")
        .select("*")
        .eq("stripe_subscription_id", input.stripeSubscriptionId)
        .maybeSingle()
    : input.stripeCheckoutSessionId
      ? await supabase
          .from("user_entitlements")
          .select("*")
          .eq("stripe_checkout_session_id", input.stripeCheckoutSessionId)
          .maybeSingle()
      : input.userId
        ? await supabase
            .from("user_entitlements")
            .select("*")
            .eq("user_id", input.userId)
            .eq("plan_code", input.planCode)
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle()
        : null;

  if (entitlementMatch?.error) {
    throw entitlementMatch.error;
  }

  if (entitlementMatch?.data?.id) {
    const { error } = await supabase
      .from("user_entitlements")
      .update(entitlementPayload)
      .eq("id", entitlementMatch.data.id);
    if (error) {
      throw error;
    }
  } else {
    const { error } = await supabase
      .from("user_entitlements")
      .insert(entitlementPayload);
    if (error) {
      throw error;
    }
  }
}
