import { and, desc, eq, or } from "drizzle-orm";
import type { DB } from "@/lib/db";
import { billingEvents, billingSubscriptions, userEntitlements, users } from "@chapai/db/schema";
import type { BillingExamTrack, BillingStatus, BillingTier } from "@/lib/billing";
import type { PremiumEntitlement } from "@/lib/premium-access";
import { sanitizePremiumEntitlements } from "@/lib/premium-access";

type UpsertBillingRecordInput = {
  userId?: string | null;
  email?: string | null;
  name?: string | null;
  tier: BillingTier;
  planCode: string;
  status: BillingStatus;
  examTrack: BillingExamTrack;
  entitlements: PremiumEntitlement[];
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripeCheckoutSessionId?: string | null;
  currentPeriodEnd?: number | null;
  expiresAt?: number | null;
  canceledAt?: number | null;
  sourceEventId?: string | null;
};

export type HostedBillingCustomerRecord = {
  id: string;
  user_id: string;
  email: string | null;
  stripe_customer_id: string | null;
  updated_at: string | null;
};

export type HostedBillingSnapshotRecord = {
  id: string;
  user_id: string | null;
  email: string | null;
  tier: BillingTier;
  plan_code: string;
  status: BillingStatus;
  exam_track: BillingExamTrack;
  entitlements: PremiumEntitlement[];
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_checkout_session_id: string | null;
  current_period_end: string | null;
  expires_at: string | null;
  canceled_at: string | null;
  updated_at: string | null;
};

export type HostedEntitlementRecord = {
  id: string;
  userId: string | null;
  email: string | null;
  tier: BillingTier;
  planCode: string;
  status: BillingStatus;
  examTrack: BillingExamTrack;
  entitlements: PremiumEntitlement[];
  stripeCheckoutSessionId: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  expiresAt: string | null;
  currentPeriodEnd: string | null;
  sourceEventId: string | null;
  updatedAt: string | null;
};

function toIso(value: number | null | undefined) {
  return value ? new Date(value * 1000).toISOString() : null;
}

function parseStoredEntitlements(value: string | null | undefined) {
  if (!value) {
    return [] as PremiumEntitlement[];
  }

  return sanitizePremiumEntitlements(
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  );
}

export async function getHostedUserByAccount(
  db: DB,
  input: { userId?: string | null; email?: string | null },
) {
  if (input.userId) {
    const byId = await db.select().from(users).where(eq(users.id, input.userId)).get();
    if (byId) {
      return byId;
    }
  }

  if (input.email) {
    const byEmail = await db.select().from(users).where(eq(users.email, input.email)).get();
    if (byEmail) {
      return byEmail;
    }
  }

  return null;
}

export async function ensureHostedUser(
  db: DB,
  input: {
    userId?: string | null;
    email?: string | null;
    name?: string | null;
    tier?: "free" | "plus" | "pro";
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    stripeCurrentPeriodEnd?: number | null;
  },
) {
  if (!input.userId && !input.email) {
    return null;
  }

  const existing = await getHostedUserByAccount(db, input);
  const now = Math.floor(Date.now() / 1000);
  const email = input.email ?? existing?.email ?? null;

  if (!email) {
    return existing ?? null;
  }

  const payload = {
    email,
    name: input.name ?? existing?.name ?? null,
    tier: input.tier ?? existing?.tier ?? "free",
    stripeCustomerId: input.stripeCustomerId ?? existing?.stripeCustomerId ?? null,
    stripeSubscriptionId: input.stripeSubscriptionId ?? existing?.stripeSubscriptionId ?? null,
    stripeCurrentPeriodEnd: input.stripeCurrentPeriodEnd ?? existing?.stripeCurrentPeriodEnd ?? null,
    updatedAt: now,
  } as const;

  if (existing) {
    await db.update(users).set(payload).where(eq(users.id, existing.id));
    return {
      ...existing,
      ...payload,
    };
  }

  const hostedUserId = input.userId ?? crypto.randomUUID();
  await db.insert(users).values({
    id: hostedUserId,
    createdAt: now,
    ...payload,
  });

  return db.select().from(users).where(eq(users.id, hostedUserId)).get();
}

export async function recordBillingEventOnce(db: DB, input: {
  stripeEventId: string;
  type: string;
  payload: string;
}) {
  await db.insert(billingEvents).values({
    stripeEventId: input.stripeEventId,
    type: input.type,
    payload: input.payload,
  }).onConflictDoNothing({ target: billingEvents.stripeEventId });

  const event = await db
    .select()
    .from(billingEvents)
    .where(eq(billingEvents.stripeEventId, input.stripeEventId))
    .get();

  return {
    alreadyProcessed: Boolean(event && event.type !== input.type),
    event,
  };
}

export async function findBillingEvent(db: DB, stripeEventId: string) {
  return db.select().from(billingEvents).where(eq(billingEvents.stripeEventId, stripeEventId)).get();
}

export async function findEntitlementByCheckoutSessionId(db: DB, stripeCheckoutSessionId: string): Promise<HostedEntitlementRecord | null> {
  const row = await db
    .select()
    .from(userEntitlements)
    .where(eq(userEntitlements.stripeCheckoutSessionId, stripeCheckoutSessionId))
    .get();

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    userId: row.userId ?? null,
    email: row.email ?? null,
    tier: row.tier,
    planCode: row.planCode,
    status: row.status as BillingStatus,
    examTrack: row.examTrack,
    entitlements: parseStoredEntitlements(row.entitlements),
    stripeCheckoutSessionId: row.stripeCheckoutSessionId ?? null,
    stripeCustomerId: row.stripeCustomerId ?? null,
    stripeSubscriptionId: row.stripeSubscriptionId ?? null,
    expiresAt: toIso(row.expiresAt),
    currentPeriodEnd: toIso(row.currentPeriodEnd),
    sourceEventId: row.sourceEventId ?? null,
    updatedAt: toIso(row.updatedAt),
  };
}

export async function getBillingCustomerForUser(
  db: DB,
  input: { userId?: string | null; email?: string | null },
): Promise<HostedBillingCustomerRecord | null> {
  const user = await getHostedUserByAccount(db, input);
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    user_id: user.id,
    email: user.email,
    stripe_customer_id: user.stripeCustomerId ?? null,
    updated_at: toIso(user.updatedAt),
  };
}

export async function getLatestBillingSnapshotForUser(
  db: DB,
  input: { userId?: string | null; email?: string | null },
): Promise<HostedBillingSnapshotRecord | null> {
  const user = await getHostedUserByAccount(db, input);
  if (!user && !input.email) {
    return null;
  }

  const rows = await db
    .select()
    .from(billingSubscriptions)
    .where(
      user
        ? or(eq(billingSubscriptions.userId, user.id), eq(billingSubscriptions.email, user.email))
        : eq(billingSubscriptions.email, input.email!),
    )
    .orderBy(desc(billingSubscriptions.updatedAt))
    .limit(1);

  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    user_id: row.userId ?? null,
    email: row.email ?? null,
    tier: row.tier,
    plan_code: row.planCode,
    status: row.status as BillingStatus,
    exam_track: row.examTrack,
    entitlements: parseStoredEntitlements(row.entitlements),
    stripe_customer_id: row.stripeCustomerId ?? null,
    stripe_subscription_id: row.stripeSubscriptionId ?? null,
    stripe_checkout_session_id: row.stripeCheckoutSessionId ?? null,
    current_period_end: toIso(row.currentPeriodEnd),
    expires_at: toIso(row.expiresAt),
    canceled_at: toIso(row.canceledAt),
    updated_at: toIso(row.updatedAt),
  };
}

export async function getActiveEntitlementForUser(
  db: DB,
  input: { userId?: string | null; email?: string | null },
): Promise<HostedEntitlementRecord | null> {
  const user = await getHostedUserByAccount(db, input);
  if (!user && !input.email) {
    return null;
  }

  const rowsById = user?.id
    ? await db
      .select()
      .from(userEntitlements)
      .where(eq(userEntitlements.userId, user.id))
      .orderBy(desc(userEntitlements.updatedAt))
      .limit(10)
    : [];
  const lookupEmail = user?.email ?? input.email ?? null;
  const rowsByEmail = lookupEmail
    ? await db
      .select()
      .from(userEntitlements)
      .where(eq(userEntitlements.email, lookupEmail))
      .orderBy(desc(userEntitlements.updatedAt))
      .limit(10)
    : [];
  const rows = [...new Map([...rowsById, ...rowsByEmail].map((row) => [row.id, row])).values()]
    .sort((left, right) => right.updatedAt - left.updatedAt);

  const now = Math.floor(Date.now() / 1000);
  const row = rows.find((candidate) => {
    const activeStatus = candidate.status === "active" || candidate.status === "trialing" || candidate.status === "past_due";
    return activeStatus && (!candidate.expiresAt || candidate.expiresAt > now);
  });

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    userId: row.userId ?? null,
    email: row.email ?? null,
    tier: row.tier,
    planCode: row.planCode,
    status: row.status as BillingStatus,
    examTrack: row.examTrack,
    entitlements: parseStoredEntitlements(row.entitlements),
    stripeCheckoutSessionId: row.stripeCheckoutSessionId ?? null,
    stripeCustomerId: row.stripeCustomerId ?? null,
    stripeSubscriptionId: row.stripeSubscriptionId ?? null,
    expiresAt: toIso(row.expiresAt),
    currentPeriodEnd: toIso(row.currentPeriodEnd),
    sourceEventId: row.sourceEventId ?? null,
    updatedAt: toIso(row.updatedAt),
  };
}

async function upsertUserFromBilling(db: DB, input: UpsertBillingRecordInput) {
  const now = Math.floor(Date.now() / 1000);
  const preserveAccess = Boolean(input.currentPeriodEnd && input.currentPeriodEnd > now) || Boolean(input.expiresAt && input.expiresAt > now);
  const user = await ensureHostedUser(db, {
    userId: input.userId ?? null,
    email: input.email ?? null,
    tier: input.status === "active" || input.status === "trialing" || preserveAccess ? input.tier : "free",
    stripeCustomerId: input.stripeCustomerId ?? null,
    stripeSubscriptionId: input.stripeSubscriptionId ?? null,
    stripeCurrentPeriodEnd: input.currentPeriodEnd ?? input.expiresAt ?? null,
  });

  return user?.id ?? null;
}

export async function upsertBillingState(db: DB, input: UpsertBillingRecordInput) {
  const userId = await upsertUserFromBilling(db, input);
  const entitlementsText = input.entitlements.join(",");
  const timestamp = Math.floor(Date.now() / 1000);

  const subscriptionMatch = input.stripeSubscriptionId
    ? await db
        .select()
        .from(billingSubscriptions)
        .where(eq(billingSubscriptions.stripeSubscriptionId, input.stripeSubscriptionId))
        .get()
    : input.stripeCheckoutSessionId
      ? await db
          .select()
          .from(billingSubscriptions)
          .where(eq(billingSubscriptions.stripeCheckoutSessionId, input.stripeCheckoutSessionId))
          .get()
      : null;

  const subscriptionPayload = {
    userId: userId ?? subscriptionMatch?.userId ?? null,
    email: input.email ?? subscriptionMatch?.email ?? null,
    tier: input.tier,
    planCode: input.planCode,
    status: input.status,
    examTrack: input.examTrack,
    entitlements: entitlementsText,
    stripeCustomerId: input.stripeCustomerId ?? subscriptionMatch?.stripeCustomerId ?? null,
    stripeSubscriptionId: input.stripeSubscriptionId ?? subscriptionMatch?.stripeSubscriptionId ?? null,
    stripeCheckoutSessionId: input.stripeCheckoutSessionId ?? subscriptionMatch?.stripeCheckoutSessionId ?? null,
    currentPeriodEnd: input.currentPeriodEnd ?? subscriptionMatch?.currentPeriodEnd ?? null,
    expiresAt: input.expiresAt ?? subscriptionMatch?.expiresAt ?? null,
    canceledAt: input.canceledAt ?? subscriptionMatch?.canceledAt ?? null,
    updatedAt: timestamp,
  } as const;

  if (subscriptionMatch) {
    await db.update(billingSubscriptions).set(subscriptionPayload).where(eq(billingSubscriptions.id, subscriptionMatch.id));
  } else {
    await db.insert(billingSubscriptions).values({
      createdAt: timestamp,
      ...subscriptionPayload,
    });
  }

  const entitlementMatch = input.stripeCheckoutSessionId
    ? await db
        .select()
        .from(userEntitlements)
        .where(eq(userEntitlements.stripeCheckoutSessionId, input.stripeCheckoutSessionId))
        .get()
    : input.stripeSubscriptionId
      ? await db
          .select()
          .from(userEntitlements)
          .where(eq(userEntitlements.stripeSubscriptionId, input.stripeSubscriptionId))
          .get()
      : input.email
        ? await db
            .select()
            .from(userEntitlements)
            .where(and(eq(userEntitlements.email, input.email), eq(userEntitlements.planCode, input.planCode)))
            .get()
        : null;

  const entitlementPayload = {
    userId: userId ?? entitlementMatch?.userId ?? null,
    email: input.email ?? entitlementMatch?.email ?? null,
    tier: input.tier,
    planCode: input.planCode,
    status: input.status,
    examTrack: input.examTrack,
    entitlements: entitlementsText,
    stripeCheckoutSessionId: input.stripeCheckoutSessionId ?? entitlementMatch?.stripeCheckoutSessionId ?? null,
    stripeCustomerId: input.stripeCustomerId ?? entitlementMatch?.stripeCustomerId ?? null,
    stripeSubscriptionId: input.stripeSubscriptionId ?? entitlementMatch?.stripeSubscriptionId ?? null,
    expiresAt: input.expiresAt ?? entitlementMatch?.expiresAt ?? null,
    currentPeriodEnd: input.currentPeriodEnd ?? entitlementMatch?.currentPeriodEnd ?? null,
    sourceEventId: input.sourceEventId ?? entitlementMatch?.sourceEventId ?? null,
    updatedAt: timestamp,
  } as const;

  if (entitlementMatch) {
    await db.update(userEntitlements).set(entitlementPayload).where(eq(userEntitlements.id, entitlementMatch.id));
    return entitlementMatch.id;
  }

  await db.insert(userEntitlements).values({
    createdAt: timestamp,
    ...entitlementPayload,
  });

  const created = input.stripeCheckoutSessionId
    ? await db
        .select()
        .from(userEntitlements)
        .where(eq(userEntitlements.stripeCheckoutSessionId, input.stripeCheckoutSessionId))
        .get()
    : null;

  return created?.id ?? null;
}
