import { NextRequest } from "next/server";
import Stripe from "stripe";
import {
  findBillingEvent,
  recordBillingEventOnce,
  upsertBillingState,
} from "@/lib/billing-store";
import {
  buildBillingStateFromCheckout,
  buildBillingStateFromSubscription,
} from "@/lib/stripe-billing";
import { createRequestContext, log, logError } from "@/lib/logger";
import { getServerEnv } from "@/lib/env";
import { getDB, hasDatabase, resolveEnv } from "@/lib/db";
import type { DB } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type StripeSubscriptionSnapshot = Stripe.Subscription & {
  current_period_end?: number | null;
};

async function handleCheckoutCompleted(eventId: string, session: Stripe.Checkout.Session, db: DB) {
  const billingState = buildBillingStateFromCheckout(eventId, {
    ...session,
    customer: typeof session.customer === "string" ? session.customer : null,
    subscription: typeof session.subscription === "object" && session.subscription
      ? {
          ...(session.subscription as StripeSubscriptionSnapshot),
          customer: typeof (session.subscription as StripeSubscriptionSnapshot).customer === "string"
            ? (session.subscription as StripeSubscriptionSnapshot).customer
            : null,
        }
      : (typeof session.subscription === "string" ? session.subscription : null),
  });

  await upsertBillingState(db, billingState);
}

async function handleSubscriptionUpdated(eventId: string, subscription: StripeSubscriptionSnapshot, db: DB) {
  await upsertBillingState(db, buildBillingStateFromSubscription(eventId, {
    ...subscription,
    customer: typeof subscription.customer === "string" ? subscription.customer : null,
  }));
}

async function handleSubscriptionDeleted(eventId: string, subscription: StripeSubscriptionSnapshot, db: DB) {
  await upsertBillingState(db, {
    ...buildBillingStateFromSubscription(eventId, {
      ...subscription,
      customer: typeof subscription.customer === "string" ? subscription.customer : null,
    }),
    status: "canceled",
    expiresAt: subscription.current_period_end ?? subscription.ended_at ?? null,
    canceledAt: subscription.canceled_at ?? subscription.ended_at ?? null,
  });
}

export async function POST(req: NextRequest) {
  const requestContext = createRequestContext(req, { route: "/api/stripe/webhook" });
  const env = getServerEnv();
  const runtimeEnv = resolveEnv();

  if (!env.STRIPE_WEBHOOK_SECRET) {
    log("error", "Stripe webhook secret is missing", requestContext);
    return new Response("Webhook secret not configured", { status: 503 });
  }

  if (!hasDatabase(runtimeEnv)) {
    log("error", "Stripe webhook storage is unavailable", requestContext);
    return new Response("Webhook storage unavailable", { status: 503 });
  }

  const db = getDB(runtimeEnv);

  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = await verifyStripeWebhook(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    logError("Stripe webhook signature verification failed", error, requestContext);
    return new Response("Invalid signature", { status: 400 });
  }

  const existing = await findBillingEvent(db, event.id);
  if (existing) {
    log("info", "Duplicate Stripe webhook ignored", {
      ...requestContext,
      stripeEventId: event.id,
      stripeEventType: event.type,
    });
    return new Response("OK", { status: 200 });
  }

  try {
    const recorded = await recordBillingEventOnce(db, {
      stripeEventId: event.id,
      type: event.type,
      payload: rawBody,
    });
    const eventRowId = recorded.event?.id ?? event.id;

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(eventRowId, event.data.object as Stripe.Checkout.Session, db);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(eventRowId, event.data.object as StripeSubscriptionSnapshot, db);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(eventRowId, event.data.object as StripeSubscriptionSnapshot, db);
        break;
      default:
        log("info", "Stripe webhook event ignored", {
          ...requestContext,
          stripeEventId: event.id,
          stripeEventType: event.type,
        });
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    logError("Stripe webhook handler failed", error, {
      ...requestContext,
      stripeEventId: event.id,
      stripeEventType: event.type,
    });
    return new Response("Internal error", { status: 500 });
  }
}

async function verifyStripeWebhook(
  payload: string,
  signature: string,
  secret: string,
): Promise<Stripe.Event> {
  const parts = signature.split(",");
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
  const v1 = parts.find((part) => part.startsWith("v1="))?.slice(3);

  if (!timestamp || !v1) {
    throw new Error("Malformed signature");
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const data = new TextEncoder().encode(`${timestamp}.${payload}`);
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, data);
  const expected = Array.from(new Uint8Array(signatureBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  if (expected !== v1) {
    throw new Error("Signature mismatch");
  }

  if (Math.abs(Date.now() / 1000 - Number.parseInt(timestamp, 10)) > 300) {
    throw new Error("Timestamp too old");
  }

  return JSON.parse(payload) as Stripe.Event;
}
