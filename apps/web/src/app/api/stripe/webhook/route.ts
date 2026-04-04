import { NextRequest } from "next/server";
import { getDB, hasDatabase, resolveEnv } from "@/lib/db";
import { users } from "@chapai/db/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { STRIPE_PRICES } from "@/lib/types";

type Tier = "free" | "trial" | "base" | "vip" | "unlimited";

/** Map a Stripe price ID to the corresponding access tier */
function tierFromPriceId(priceId: string | null | undefined): Tier {
  switch (priceId) {
    case STRIPE_PRICES.trial_7day:    return "trial";
    case STRIPE_PRICES.base_monthly:  return "base";
    case STRIPE_PRICES.vip_monthly:   return "vip";
    case STRIPE_PRICES.unlimited_vip: return "unlimited";
    default:                          return "base"; // safe fallback
  }
}


// Stripe sends events as raw body — do NOT parse JSON with Next.js body parser
export async function POST(req: NextRequest) {
  const env = resolveEnv();
  if (!env.STRIPE_WEBHOOK_SECRET) {
    console.error("Stripe webhook secret is missing.");
    return new Response("Webhook secret not configured", { status: 503 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    // Cloudflare Workers compatible signature verification
    event = await verifyStripeWebhook(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature error:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  if (!hasDatabase(env)) {
    console.warn("Stripe webhook received without database binding. Skipping persistence update.");
    return new Response("OK", { status: 200 });
  }

  const db = getDB(env);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (!session.customer_email) break;

        const lineItems = session.line_items?.data;
        const priceId = lineItems?.[0]?.price?.id ?? session.metadata?.price_id;
        const tier = tierFromPriceId(priceId);

        if (session.mode === "payment") {
          // One-time purchase (7-day trial) — grant trial tier, set expiry 7 days out
          await db.update(users)
            .set({
              tier,
              stripeCustomerId: session.customer as string,
              stripeCurrentPeriodEnd: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
              updatedAt: Math.floor(Date.now() / 1000),
            })
            .where(eq(users.email, session.customer_email));
        } else if (session.mode === "subscription") {
          await db.update(users)
            .set({
              tier,
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              updatedAt: Math.floor(Date.now() / 1000),
            })
            .where(eq(users.email, session.customer_email));
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const priceId = sub.items.data[0]?.price?.id;
        const tier = tierFromPriceId(priceId);
        const periodEnd = sub.current_period_end;

        await db.update(users)
          .set({
            tier: sub.status === "active" ? tier : "free",
            stripeCurrentPeriodEnd: periodEnd,
            updatedAt: Math.floor(Date.now() / 1000),
          })
          .where(eq(users.stripeCustomerId, customerId));
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await db.update(users)
          .set({
            tier: "free",
            stripeSubscriptionId: null,
            updatedAt: Math.floor(Date.now() / 1000),
          })
          .where(eq(users.stripeCustomerId, sub.customer as string));
        break;
      }
    }

    return new Response("OK", { status: 200 });

  } catch (err) {
    console.error("Webhook handler error:", err);
    return new Response("Internal error", { status: 500 });
  }
}

/** Cloudflare Workers compatible Stripe webhook verification */
async function verifyStripeWebhook(
  payload: string,
  signature: string,
  secret: string
): Promise<Stripe.Event> {
  const parts = signature.split(",");
  const timestamp = parts.find((p) => p.startsWith("t="))?.slice(2);
  const v1 = parts.find((p) => p.startsWith("v1="))?.slice(3);

  if (!timestamp || !v1) throw new Error("Malformed signature");

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const data = new TextEncoder().encode(`${timestamp}.${payload}`);
  const sig = await crypto.subtle.sign("HMAC", key, data);
  const expected = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (expected !== v1) throw new Error("Signature mismatch");

  // Reject events older than 5 minutes
  if (Math.abs(Date.now() / 1000 - parseInt(timestamp)) > 300) {
    throw new Error("Timestamp too old");
  }

  return JSON.parse(payload) as Stripe.Event;
}
