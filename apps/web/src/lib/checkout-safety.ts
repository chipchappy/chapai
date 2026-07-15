const BLOCKING_SUBSCRIPTION_STATUSES = new Set([
  "active",
  "trialing",
  "past_due",
  "unpaid",
  "paused",
  "incomplete",
]);

type StripeCustomer = {
  id: string;
  metadata?: Record<string, string | undefined> | null;
};

type StripeSubscription = {
  id: string;
  status?: string | null;
  metadata?: Record<string, string | undefined> | null;
};

type StripeList<T> = {
  data?: T[];
  has_more?: boolean;
};

export type StripeCheckoutSafety = {
  customerId: string | null;
  blockingSubscription: {
    id: string;
    status: string;
    planCode: string | null;
  } | null;
};

export function isBlockingSubscriptionStatus(status: string | null | undefined) {
  return BLOCKING_SUBSCRIPTION_STATUSES.has(String(status ?? "").toLowerCase());
}

export async function buildCheckoutIdempotencyKey(input: {
  userId: string;
  purchaseFamily: string;
}) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`clarity-checkout-v3:${input.userId}:${input.purchaseFamily}`),
  );
  const hash = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return `clarity-checkout-v3-${hash}`;
}

async function stripeGet<T>(
  path: string,
  secretKey: string,
  fetchImpl: typeof fetch,
): Promise<T> {
  const response = await fetchImpl(`https://api.stripe.com${path}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${secretKey}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Stripe checkout safety lookup failed with status ${response.status}.`);
  }
  return response.json() as Promise<T>;
}

export async function inspectStripeCheckoutSafety(input: {
  secretKey: string;
  email: string;
  userId: string;
  knownCustomerId?: string | null;
  fetchImpl?: typeof fetch;
}): Promise<StripeCheckoutSafety> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const customerQuery = new URLSearchParams({ email: input.email, limit: "100" });
  const customerList = await stripeGet<StripeList<StripeCustomer>>(
    `/v1/customers?${customerQuery.toString()}`,
    input.secretKey,
    fetchImpl,
  );
  if (customerList.has_more) {
    throw new Error("Stripe customer safety lookup exceeded the supported page size.");
  }
  const customers = customerList.data ?? [];
  const customerIds = new Set(customers.map((customer) => customer.id));
  if (input.knownCustomerId) {
    customerIds.add(input.knownCustomerId);
  }

  const subscriptionLists = await Promise.all(
    Array.from(customerIds).map(async (customerId) => {
      const query = new URLSearchParams({ customer: customerId, status: "all", limit: "100" });
      const list = await stripeGet<StripeList<StripeSubscription>>(
        `/v1/subscriptions?${query.toString()}`,
        input.secretKey,
        fetchImpl,
      );
      if (list.has_more) {
        throw new Error("Stripe subscription safety lookup exceeded the supported page size.");
      }
      return list.data ?? [];
    }),
  );
  const blocking = subscriptionLists.flat().find((subscription) => isBlockingSubscriptionStatus(subscription.status));

  const metadataCustomer = customers.find(
    (customer) => customer.metadata?.supabase_user_id === input.userId,
  );
  const customerId = input.knownCustomerId ?? metadataCustomer?.id ?? customers[0]?.id ?? null;

  return {
    customerId,
    blockingSubscription: blocking
      ? {
          id: blocking.id,
          status: String(blocking.status),
          planCode: blocking.metadata?.plan_code ?? null,
        }
      : null,
  };
}
