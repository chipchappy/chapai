import CheckoutButton from "@/components/billing/CheckoutButton";
import { STRIPE_PRICES } from "@/lib/types";

export const metadata = {
  title: "Plans | Clarity Clinical Prep",
  description: "Choose the launch-week Clarity plan for CCRN and NCLEX prep.",
};

const PREMIUM_ENTITLEMENTS = ["live-bank", "rich-modes", "practice-exams", "tutor"] as const;

const packageTracks = [
  {
    exam: "ccrn" as const,
    title: "CCRN",
    plans: [
      {
        name: "Plus",
        priceIdMonthly: STRIPE_PRICES.plus_monthly,
        monthlyPrice: 29,
        badge: "Launch-week pick",
        features: [
          "All 5 full simulations included",
          "AI tutor, chart-reading, case studies, and NGN modes",
          "Unlimited premium practice center access",
        ],
      },
      {
        name: "Pro",
        priceIdMonthly: STRIPE_PRICES.pro_monthly,
        monthlyPrice: 59,
        badge: "Best depth",
        features: [
          "Everything in Plus",
          "Unlimited tutor time",
          "Priority content drops and deeper study support",
        ],
      },
    ],
  },
  {
    exam: "nclex" as const,
    title: "NCLEX",
    plans: [
      {
        name: "Plus",
        priceIdMonthly: STRIPE_PRICES.plus_monthly,
        monthlyPrice: 29,
        badge: "Launch-week pick",
        features: [
          "All 5 full simulations included",
          "AI tutor, chart-reading, case studies, and NGN modes",
          "Unlimited premium practice center access",
        ],
      },
      {
        name: "Pro",
        priceIdMonthly: STRIPE_PRICES.pro_monthly,
        monthlyPrice: 59,
        badge: "Best depth",
        features: [
          "Everything in Plus",
          "Unlimited tutor time",
          "Priority content drops and deeper study support",
        ],
      },
    ],
  },
] as const;

const cramTracks = [
  {
    exam: "ccrn" as const,
    title: "CCRN 24-hour sprint",
  },
  {
    exam: "nclex" as const,
    title: "NCLEX 24-hour sprint",
  },
] as const;

export default async function UpgradePage({
  searchParams,
}: {
  searchParams: Promise<{ interval?: string }>;
}) {
  await searchParams;

  return (
    <main className="min-h-screen bg-bg px-4 py-16">
      <div className="mx-auto max-w-6xl">
        <section className="overflow-hidden rounded-[40px] border border-[rgba(214,205,189,0.52)] bg-[linear-gradient(180deg,rgba(252,249,243,0.96),rgba(245,239,229,0.88))] px-6 py-8 shadow-card md:px-10 md:py-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <span className="text-[11px] font-semibold uppercase tracking-[0.26em] text-muted">Plans</span>
              <h1 className="mt-4 font-serif text-[3.5rem] leading-[0.9] text-dark md:text-[4.5rem]">
                Ship with one clean paid path.
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-muted">
                Monthly-only for launch week. Plus now unlocks the full premium practice center, including all 5
                simulations, rich study modes, and tutor access.
              </p>
            </div>

            <div className="rounded-full border border-[rgba(214,205,189,0.72)] bg-[rgba(255,252,247,0.72)] px-5 py-3 text-sm font-semibold text-dark">
              Monthly launch pricing only
            </div>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
            <section id="sprint" className="rounded-[30px] border border-[rgba(214,205,189,0.6)] bg-[rgba(255,251,245,0.74)] p-5 md:p-6">
              <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted">24-hour sprint</div>
              <div className="mt-5 space-y-4">
                {cramTracks.map((track) => (
                  <div
                    key={track.exam}
                    className="rounded-[24px] border border-[rgba(214,205,189,0.52)] bg-[rgba(250,246,239,0.76)] p-5"
                  >
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">
                          {track.exam.toUpperCase()}
                        </div>
                        <h2 className="mt-2 text-xl font-semibold text-dark">{track.title}</h2>
                      </div>
                      <div className="text-right">
                        <strong className="font-serif text-4xl leading-none text-dark">$10</strong>
                        <div className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">one time</div>
                      </div>
                    </div>
                    <ul className="mt-5 space-y-2 text-sm text-dark">
                      <li>Unlimited sessions for 24 hours</li>
                      <li>AI tutor + rationales</li>
                      <li>Fastest low-friction entry</li>
                    </ul>
                    <div className="mt-5">
                      <CheckoutButton
                        checkoutMode="payment"
                        unitAmount={1000}
                        accessHours={24}
                        examTrack={track.exam}
                        packageLabel={`${track.exam.toUpperCase()} 24-hour sprint`}
                        tier="plus"
                        planCode={`${track.exam}-sprint-24h`}
                        entitlements={[...PREMIUM_ENTITLEMENTS]}
                        className="btn-primary w-full text-center"
                      >
                        Start sprint
                      </CheckoutButton>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid gap-6 xl:grid-cols-2">
              {packageTracks.map((track) => (
                <section
                  key={track.exam}
                  className="rounded-[30px] border border-[rgba(214,205,189,0.6)] bg-[rgba(255,251,245,0.78)] p-5 md:p-6"
                >
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted">
                        {track.exam}
                      </div>
                      <h2 className="mt-2 font-serif text-[2.35rem] leading-[0.92] text-dark">{track.title}</h2>
                    </div>
                    <a href={`/${track.exam}`} className="text-sm font-semibold text-muted transition-colors hover:text-dark">
                      View product
                    </a>
                  </div>

                  <div className="mt-6 space-y-4">
                    {track.plans.map((plan, planIndex) => (
                      <div
                        key={plan.name}
                        className={`rounded-[24px] border p-5 ${
                          planIndex === 0
                            ? "border-[rgba(101,133,140,0.34)] bg-[rgba(240,247,246,0.72)]"
                            : "border-[rgba(214,205,189,0.52)] bg-[rgba(250,246,239,0.72)]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">
                              {plan.badge}
                            </div>
                            <h3 className="mt-2 text-2xl font-semibold text-dark">
                              {track.title} {plan.name}
                            </h3>
                          </div>
                          <div className="text-right">
                            <strong className="font-serif text-5xl leading-none text-dark">${plan.monthlyPrice}</strong>
                            <div className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">/mo</div>
                          </div>
                        </div>

                        <ul className="mt-5 space-y-2 text-sm text-dark">
                          {plan.features.map((feature) => (
                            <li key={feature}>{feature}</li>
                          ))}
                        </ul>

                        <div className="mt-5">
                          <CheckoutButton
                            priceId={plan.priceIdMonthly}
                            examTrack={track.exam}
                            packageLabel={`${track.title} ${plan.name}`}
                            tier={plan.name === "Plus" ? "plus" : "pro"}
                            planCode={`${track.exam}-${plan.name.toLowerCase()}-monthly-launch`}
                            entitlements={[...PREMIUM_ENTITLEMENTS]}
                            className="btn-primary w-full text-center"
                          >
                            Start {plan.name}
                          </CheckoutButton>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
