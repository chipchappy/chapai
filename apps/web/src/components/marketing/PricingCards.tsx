import CheckoutButton from "@/components/billing/CheckoutButton";
import { competitorComparisonLine } from "@/lib/brand/competitorPricing";
import { getLaunchOffer, type LaunchPlanCode } from "@/lib/launch-offers";
import styles from "./PricingCards.module.css";

type PlanCard = {
  code: LaunchPlanCode;
  name: string;
  cadence: string;
  badge: string;
  tone: "sage" | "ocean" | "plain";
  features: string[];
};

const cards: PlanCard[] = [
  {
    code: "nclex_base_monthly",
    name: "NCLEX Base",
    cadence: "/mo",
    badge: "Most popular",
    tone: "sage",
    features: ["Full NCLEX question bank", "NGN and case-study modes", "2 readiness exams", "Rationales, citations, diagrams"],
  },
  {
    code: "all_access_monthly",
    name: "Dual Premium",
    cadence: "/mo",
    badge: "Best value if you'll take both",
    tone: "ocean",
    features: ["NCLEX + CCRN banks", "All 5 readiness exams", "AI tutor unlocked", "Advanced weak-area analytics"],
  },
  {
    code: "ccrn_base_monthly",
    name: "CCRN Base",
    cadence: "/mo",
    badge: "Critical-care route",
    tone: "plain",
    features: ["Full CCRN bank", "Hemodynamics and ICU systems", "2 readiness exams", "Rationales, citations, diagrams"],
  },
];

export default function PricingCards() {
  const comparison = competitorComparisonLine();

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.intro}>
          <span className={styles.eyebrow}>Pricing</span>
          <h1 className={styles.title}>Premium prep without premium-price theater.</h1>
          <p className={styles.body}>
            Choose a single route or unlock both. The main NCLEX plan stays at $9.99/mo so students can practice deeply without turning the test into another bill.
          </p>
        </div>

        <div className={styles.cards}>
          {cards.map((card) => {
            const offer = getLaunchOffer(card.code);
            if (!offer) {
              return null;
            }
            return (
              <article className={styles.card} data-tone={card.tone} key={card.code}>
                <div>
                  <div className={styles.cardHeader}>
                    <div>
                      <span className={styles.badge}>{card.badge}</span>
                      <h2 className={styles.name}>{card.name}</h2>
                    </div>
                    <div className={styles.price}>
                      <strong>${offer.price}</strong>
                      <span>{card.cadence}</span>
                    </div>
                  </div>
                  <p className={styles.compare}>{comparison}</p>
                </div>
                <div className={styles.actions}>
                  <CheckoutButton
                    checkoutMode={offer.checkoutMode}
                    planCode={offer.planCode}
                    examTrack={offer.examTrackScope === "all" ? undefined : offer.examTrackScope}
                    packageLabel={offer.label}
                    className="inline-flex w-full items-center justify-center rounded-[8px] bg-[var(--c-sage-deep)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--c-sage-deep-hover)]"
                  >
                    Start {offer.shortLabel}
                  </CheckoutButton>
                </div>
                <ul className={`${styles.features} ${styles.cardBody}`}>
                  {card.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>

        <details className={`${styles.card} ${styles.pass}`}>
          <summary>Just need a sprint? 24-hour passes -- $4.99</summary>
          <div className={styles.cardBody}>
            <p className={styles.compare}>{comparison}</p>
            <ul className={styles.features}>
              <li>One-time 24-hour access</li>
              <li>NCLEX or CCRN route</li>
              <li>Half-bank sprint plus 1 readiness exam</li>
            </ul>
          </div>
        </details>
      </div>
    </section>
  );
}
