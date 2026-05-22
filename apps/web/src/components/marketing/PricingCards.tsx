import Link from "next/link";
import CheckoutButton from "@/components/billing/CheckoutButton";
import { competitorPricing } from "@/lib/brand/competitorPricing";
import { getLaunchOffer, type LaunchPlanCode } from "@/lib/launch-offers";
import styles from "./PricingCards.module.css";

type PaidTier = {
  code: LaunchPlanCode;
  name: string;
  cadence: string;
  badge: string;
  tagline: string;
  highlight?: boolean;
  features: string[];
  cta: string;
};

const paidTiers: PaidTier[] = [
  {
    code: "nclex_24h_pass",
    name: "7-Day Pass",
    cadence: "/ 7 days",
    badge: "Cram sprint",
    tagline: "The crunch week before your exam.",
    features: [
      "Full NCLEX NGN bank — 7 days",
      "Every NGN question type",
      "1 readiness exam",
      "Elite rationales + citations",
    ],
    cta: "Get the 7-day pass",
  },
  {
    code: "nclex_base_monthly",
    name: "NCLEX Monthly",
    cadence: "/mo",
    badge: "Most popular",
    tagline: "The full NCLEX-RN bank, every month.",
    highlight: true,
    features: [
      "Full NCLEX NGN question bank",
      "All 5 readiness exams",
      "Personalized weak-area analytics",
      "Rationales, citations & diagrams",
    ],
    cta: "Start NCLEX Monthly",
  },
  {
    code: "all_access_monthly",
    name: "Premium",
    cadence: "/mo",
    badge: "Best overall value",
    tagline: "NCLEX + CCRN + AI tutor.",
    features: [
      "Everything in NCLEX Monthly",
      "CCRN study bank included",
      "AI tutor on every question",
      "Clinical simulations — coming soon",
      "Advanced analytics",
    ],
    cta: "Go Premium",
  },
];

export default function PricingCards() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.intro}>
          <span className={styles.eyebrow}>Pricing</span>
          <h2 className={styles.title}>Premium prep, priced on your side.</h2>
          <p className={styles.body}>
            Start free with real practice. Upgrade only when you&apos;re ready. Every plan is original NGN content with
            elite rationales — never a $300+ question-bank tax.
          </p>
        </div>

        <div className={styles.cards}>
          {/* FREE — stands out */}
          <article className={styles.card} data-tone="free" data-highlight="true">
            <div className={styles.cardHeader}>
              <span className={styles.badge}>Start free</span>
              <h3 className={styles.name}>Free</h3>
              <div className={styles.price}>
                <strong>$0</strong>
                <span>forever</span>
              </div>
              <p className={styles.tagline}>Real practice before you pay a cent.</p>
            </div>
            <ul className={styles.features}>
              <li>1,000 NCLEX NGN questions</li>
              <li>1 readiness exam</li>
              <li>Elite rationales + citations</li>
              <li className={styles.locked}>Personalized analysis — unlocks with any paid plan</li>
            </ul>
            <div className={styles.actions}>
              <Link
                href="/auth/signup"
                className="inline-flex w-full items-center justify-center rounded-[8px] border border-[var(--c-sage-deep)] px-5 py-3 text-sm font-semibold text-[var(--c-sage-deep)] transition hover:bg-[var(--c-sage-deep)] hover:text-white"
              >
                Start free
              </Link>
            </div>
          </article>

          {paidTiers.map((tier) => {
            const offer = getLaunchOffer(tier.code);
            if (!offer) return null;
            return (
              <article
                className={styles.card}
                data-tone={tier.code === "all_access_monthly" ? "ocean" : "sage"}
                data-highlight={tier.highlight ? "true" : undefined}
                key={tier.code}
              >
                <div className={styles.cardHeader}>
                  <span className={styles.badge}>{tier.badge}</span>
                  <h3 className={styles.name}>{tier.name}</h3>
                  <div className={styles.price}>
                    <strong>${offer.price}</strong>
                    <span>{tier.cadence}</span>
                  </div>
                  <p className={styles.tagline}>{tier.tagline}</p>
                </div>
                <ul className={styles.features}>
                  {tier.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <div className={styles.actions}>
                  <CheckoutButton
                    checkoutMode={offer.checkoutMode}
                    planCode={offer.planCode}
                    examTrack={offer.examTrackScope === "all" ? undefined : offer.examTrackScope}
                    packageLabel={offer.label}
                    className="inline-flex w-full items-center justify-center rounded-[8px] bg-[var(--c-sage-deep)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--c-sage-deep-hover)]"
                  >
                    {tier.cta}
                  </CheckoutButton>
                </div>
              </article>
            );
          })}
        </div>

        {/* Direct competitor comparison */}
        <div className={styles.compare}>
          <p className={styles.compareTitle}>What students pay everywhere else</p>
          <div className={styles.compareRow}>
            <span className={styles.compareItem}>UWorld 30-day<strong>${competitorPricing.UWorld_30}</strong></span>
            <span className={styles.compareItem}>Bootcamp 6-mo<strong>${competitorPricing.Bootcamp_6mo}</strong></span>
            <span className={styles.compareItem}>ATI 3-mo<strong>${competitorPricing.ATI_3mo}</strong></span>
            <span className={styles.compareItem}>Kaplan 6-mo<strong>${competitorPricing.Kaplan_6mo}</strong></span>
            <span className={`${styles.compareItem} ${styles.compareUs}`}>Clarity<strong>free → $15.99/mo</strong></span>
          </div>
        </div>
      </div>
    </section>
  );
}
