import CheckoutButton from "@/components/billing/CheckoutButton";
import { STRIPE_PRICES } from "@/lib/types";

export const metadata = {
  title: "Plans | Clarity Clinical Prep",
  description: "Choose a Clarity plan for CCRN and NCLEX exam prep.",
};

const PLANS = [
  {
    key: "trial_7day" as const,
    name: "7-Day Trial",
    price: 9,
    interval: "one-time",
    badge: "Try it first",
    priceId: STRIPE_PRICES.trial_7day,
    tier: "trial" as const,
    checkoutMode: "payment" as const,
    features: [
      "Full access to CCRN + NCLEX question banks",
      "AI tutor + detailed rationales",
      "Practice exams included",
    ],
  },
  {
    key: "base_monthly" as const,
    name: "Base Monthly",
    price: 29,
    interval: "/mo",
    badge: "Most popular",
    priceId: STRIPE_PRICES.base_monthly,
    tier: "base" as const,
    checkoutMode: "subscription" as const,
    features: [
      "1 full practice exam per month",
      "Core question bank access",
      "Detailed rationales",
    ],
  },
  {
    key: "vip_monthly" as const,
    name: "VIP Monthly",
    price: 39,
    interval: "/mo",
    badge: "Best value",
    priceId: STRIPE_PRICES.vip_monthly,
    tier: "vip" as const,
    checkoutMode: "subscription" as const,
    features: [
      "5 full practice exams",
      "AI tutor with superior rationales",
      "CCRN + NCLEX full question banks",
    ],
  },
  {
    key: "unlimited_vip" as const,
    name: "Unlimited VIP",
    price: 50,
    interval: "/mo",
    badge: "Full access",
    priceId: STRIPE_PRICES.unlimited_vip,
    tier: "unlimited" as const,
    checkoutMode: "subscription" as const,
    features: [
      "Unlimited CCRN + NCLEX question sets",
      "Advanced analytics + performance tracking",
      "Clinical simulations — real-world nursing scenarios",
      "Everything VIP includes, plus more",
    ],
  },
] as const;

export default async function UpgradePage() {
  return (
    <main className="min-h-screen bg-bg px-4 py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <span className="text-[11px] font-semibold uppercase tracking-[0.26em] text-muted">Plans</span>
          <h1 className="mt-4 font-serif text-[3rem] leading-tight text-dark md:text-[4rem]">
            Pass your boards with confidence.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-muted">
            CCRN and NCLEX prep built by nurses, for nurses. Start with a 7-day trial or go all-in.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan, i) => (
            <div
              key={plan.key}
              className={`card flex flex-col rounded-[24px] border p-6 ${
                i === 2
                  ? "border-[rgba(101,133,140,0.5)] bg-[rgba(240,247,246,0.8)]"
                  : "border-[rgba(214,205,189,0.6)] bg-[rgba(255,251,245,0.78)]"
              }`}
            >
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">{plan.badge}</div>
              <h2 className="mt-2 text-xl font-semibold text-dark">{plan.name}</h2>
              <div className="mt-3 flex items-end gap-1">
                <strong className="font-serif text-4xl leading-none text-dark">${plan.price}</strong>
                <span className="mb-1 text-xs uppercase tracking-wide text-muted">{plan.interval}</span>
              </div>

              <ul className="mt-5 flex-1 space-y-2 text-sm text-dark">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="mt-0.5 text-[#2e7d8c]">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                <CheckoutButton
                  priceId={plan.priceId}
                  tier={plan.tier}
                  checkoutMode={plan.checkoutMode}
                  packageLabel={plan.name}
                  planCode={plan.key}
                  className={`w-full rounded-xl py-2.5 text-sm font-semibold transition-colors ${
                    i === 2
                      ? "bg-[#2e7d8c] text-white hover:bg-[#265f6e]"
                      : "btn-secondary"
                  }`}
                >
                  {plan.checkoutMode === "payment" ? "Start trial" : "Get started"}
                </CheckoutButton>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-muted">
          All plans include a 30-day money-back guarantee. Cancel anytime.
        </p>
      </div>
    </main>
  );
}
