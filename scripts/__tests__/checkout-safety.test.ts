import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCheckoutIdempotencyKey,
  inspectStripeCheckoutSafety,
  isBlockingSubscriptionStatus,
} from "../../apps/web/src/lib/checkout-safety";

test("checkout idempotency is stable per account and purchase family", async () => {
  const first = await buildCheckoutIdempotencyKey({ userId: "user-1", purchaseFamily: "subscription" });
  const retry = await buildCheckoutIdempotencyKey({ userId: "user-1", purchaseFamily: "subscription" });
  const otherUser = await buildCheckoutIdempotencyKey({ userId: "user-2", purchaseFamily: "subscription" });
  const pass = await buildCheckoutIdempotencyKey({ userId: "user-1", purchaseFamily: "nclex_24h_pass" });

  assert.equal(first, retry);
  assert.notEqual(first, otherUser);
  assert.notEqual(first, pass);
  assert.match(first, /^clarity-checkout-v3-[a-f0-9]{64}$/);
});

test("billable and unresolved subscription states block a second checkout", () => {
  for (const status of ["active", "trialing", "past_due", "unpaid", "paused", "incomplete"]) {
    assert.equal(isBlockingSubscriptionStatus(status), true, status);
  }
  for (const status of ["canceled", "incomplete_expired", null, undefined]) {
    assert.equal(isBlockingSubscriptionStatus(status), false, String(status));
  }
});

test("Stripe safety checks every customer sharing the account email", async () => {
  const requests: string[] = [];
  const fetchImpl = (async (url: string | URL | Request) => {
    const href = String(url);
    requests.push(href);
    if (href.includes("/v1/customers?")) {
      return Response.json({
        data: [
          { id: "cus-old", metadata: {} },
          { id: "cus-account", metadata: { supabase_user_id: "user-1" } },
        ],
      });
    }
    if (href.includes("customer=cus-old")) {
      return Response.json({ data: [{ id: "sub-duplicate", status: "active", metadata: { plan_code: "nclex_base_monthly" } }] });
    }
    return Response.json({ data: [] });
  }) as typeof fetch;

  const result = await inspectStripeCheckoutSafety({
    secretKey: "sk_test_redacted",
    email: "student@example.com",
    userId: "user-1",
    fetchImpl,
  });

  assert.equal(result.customerId, "cus-account");
  assert.deepEqual(result.blockingSubscription, {
    id: "sub-duplicate",
    status: "active",
    planCode: "nclex_base_monthly",
  });
  assert.equal(requests.filter((url) => url.includes("/v1/subscriptions?")).length, 2);
});

test("Stripe safety fails closed when the lookup is unavailable", async () => {
  const fetchImpl = (async () => new Response("unavailable", { status: 503 })) as typeof fetch;
  await assert.rejects(
    inspectStripeCheckoutSafety({
      secretKey: "sk_test_redacted",
      email: "student@example.com",
      userId: "user-1",
      fetchImpl,
    }),
    /status 503/,
  );
});
