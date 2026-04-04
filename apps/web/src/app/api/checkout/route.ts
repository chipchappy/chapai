import { resolveEnv } from "@/lib/db";
import { z } from "zod";


const schema = z.object({
  priceId: z.string().startsWith("price_").optional(),
  examTrack: z.enum(["ccrn", "nclex"]).optional(),
  packageLabel: z.string().max(120).optional(),
  checkoutMode: z.enum(["subscription", "payment"]).default("subscription"),
  unitAmount: z.number().int().positive().max(100000).optional(),
  accessHours: z.number().int().positive().max(72).optional(),
  tier: z.enum(["plus", "pro"]).optional(),
  planCode: z.string().trim().min(3).max(80).optional(),
  entitlements: z.array(z.string().trim().min(2).max(40)).max(12).optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
}).superRefine((value, ctx) => {
  if (value.checkoutMode === "subscription" && !value.priceId && !value.unitAmount) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["priceId"],
      message: "Subscription checkout requires a Stripe price ID or inline monthly price.",
    });
  }

  if (value.checkoutMode === "payment" && !value.unitAmount) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["unitAmount"],
      message: "One-time checkout requires a unit amount.",
    });
  }
});

export async function POST(req: Request) {
  try {
    const env = resolveEnv();
    if (!env.STRIPE_SECRET_KEY) {
      return Response.json({ error: "Stripe is not configured for checkout yet." }, { status: 503 });
    }

    const body = await req.json();
    const {
      priceId,
      examTrack,
      packageLabel,
      checkoutMode,
      unitAmount,
      accessHours,
      tier,
      planCode,
      entitlements,
      successUrl,
      cancelUrl,
    } = schema.parse(body);

    const appUrl = env.NEXT_PUBLIC_APP_URL || "https://chapaisolutions.com";
    const successTarget = new URL(successUrl || `${appUrl}/success`);
    if (examTrack) {
      successTarget.searchParams.set("exam", examTrack);
    }
    if (packageLabel) {
      successTarget.searchParams.set("package", packageLabel);
    }
    if (checkoutMode === "payment" && accessHours) {
      successTarget.searchParams.set("offer", "cram-pass");
      successTarget.searchParams.set("access_hours", String(accessHours));
    }
    successTarget.searchParams.set("session_id", "{CHECKOUT_SESSION_ID}");

    // Create Stripe checkout session via API
    const params = new URLSearchParams({
      mode: checkoutMode,
      "line_items[0][quantity]": "1",
      success_url: successTarget.toString(),
      cancel_url: cancelUrl || `${appUrl}/upgrade`,
      allow_promotion_codes: "true",
      billing_address_collection: "auto",
    });

    if (checkoutMode === "subscription" && priceId) {
      params.set("line_items[0][price]", priceId);
    }

    if (checkoutMode === "subscription" && unitAmount) {
      params.set("line_items[0][price_data][currency]", "usd");
      params.set("line_items[0][price_data][unit_amount]", String(unitAmount));
      params.set("line_items[0][price_data][recurring][interval]", "month");
      params.set(
        "line_items[0][price_data][product_data][name]",
        packageLabel || `${examTrack ? examTrack.toUpperCase() : "Clarity"} monthly access`,
      );
      params.set(
        "line_items[0][price_data][product_data][description]",
        "Monthly premium access to the Clarity practice center, including tutor support, rich modes, and practice exams.",
      );
    }

    if (checkoutMode === "payment" && unitAmount) {
      params.set("line_items[0][price_data][currency]", "usd");
      params.set("line_items[0][price_data][unit_amount]", String(unitAmount));
      params.set(
        "line_items[0][price_data][product_data][name]",
        packageLabel || `${examTrack ? examTrack.toUpperCase() : "Clarity"} 24-hour cram pass`,
      );
      params.set(
        "line_items[0][price_data][product_data][description]",
        `24-hour intensive access${examTrack ? ` for ${examTrack.toUpperCase()}` : ""} with focused question sessions, tutor access, and cram-mode review.`,
      );
    }

    const metadataEntries = Object.entries({
      exam_track: examTrack,
      package_label: packageLabel,
      package_type: checkoutMode === "payment" ? "cram-pass" : "subscription",
      access_hours: checkoutMode === "payment" && accessHours ? String(accessHours) : undefined,
      tier,
      plan_code: planCode,
      entitlements: entitlements?.join(","),
      unlock_scope: checkoutMode === "subscription" ? "all" : examTrack ?? "all",
    }).filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].length > 0);

    for (const [key, value] of metadataEntries) {
      params.set(`metadata[${key}]`, value);
      if (checkoutMode === "subscription") {
        params.set(`subscription_data[metadata][${key}]`, value);
      }
    }

    if (examTrack) {
      params.set("client_reference_id", examTrack);
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
      console.error("Stripe error:", err);
      return Response.json({ error: "Checkout failed" }, { status: 500 });
    }

    const session = await stripeRes.json();
    return Response.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: "Invalid checkout request." }, { status: 400 });
    }
    console.error("checkout error:", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
