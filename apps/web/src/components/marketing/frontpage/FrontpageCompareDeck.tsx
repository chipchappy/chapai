import type { MarketingRouteKey } from "../marketingArtwork";
import { LAUNCH_OFFERS } from "@/lib/launch-offers";

type LaunchOffer = (typeof LAUNCH_OFFERS)[number];
type LaunchPlanCode = LaunchOffer["planCode"];

const offerByCode = Object.fromEntries(LAUNCH_OFFERS.map((offer) => [offer.planCode, offer])) as Partial<Record<LaunchPlanCode, LaunchOffer>>;

const plans = [
  {
    label: "24-hour access",
    price: `$${offerByCode.nclex_24h_pass?.price ?? "4.99"}`,
    detail: "Half of the selected qbank, 1 practice exam, rationales, diagrams, citations, and sources.",
  },
  {
    label: "base plan",
    price: `$${offerByCode.nclex_base_monthly?.price ?? "9.99"}`,
    detail: "Full NCLEX or CCRN qbank, 2 practice exams, and the full review stack on one route.",
  },
  {
    label: "dual premium",
    price: `$${offerByCode.all_access_monthly?.price ?? "15.99"}`,
    detail: "Full NCLEX + CCRN access, 5 practice exams, AI tutor, and advanced analytics.",
  },
];

const compareBadges = [
  { label: "clarity", value: "$4.99 start", note: "dual-track option available" },
  { label: "competitors", value: "snapshot required", note: "verify before publishing claims" },
  { label: "positioning", value: "premium low-cost", note: "value without a bloated plan ladder" },
  { label: "buyer proof", value: "demo first", note: "practice flow visible before checkout" },
];

const routeCopy: Record<
  MarketingRouteKey,
  {
    title: string;
    body: string;
    note: string;
  }
> = {
  home: {
    title: "clean pricing, one calmer product, and a real demo before anyone pays.",
    body:
      "Clarity shows the workflow first, then keeps the plans simple. That means buyers can compare price against Archer, UWorld, and Kaplan without digging through clutter.",
    note: "Subtle competitor context, direct pricing, and one integrated qbank workflow.",
  },
  nclex: {
    title: "the nclex qbank, pricing, and review stack are all visible up front.",
    body:
      "Students can see the NCLEX demo, the testing interface, and the plan ladder in one pass. The comparison stays factual and secondary instead of taking over the page.",
    note: "NCLEX first, but still clearly cheaper and cleaner than bloated prep tools.",
  },
  ccrn: {
    title: "critical-care pricing and bedside review, presented without the noise.",
    body:
      "ICU buyers can preview the live workflow, understand the tier differences quickly, and still see where Clarity undercuts larger prep products.",
    note: "CCRN-first messaging with the same premium pricing system across the platform.",
  },
};

type FrontpageCompareDeckProps = {
  route?: MarketingRouteKey;
};

export default function FrontpageCompareDeck({ route = "home" }: FrontpageCompareDeckProps) {
  const copy = routeCopy[route];

  return (
    <section className="px-4 py-10 md:px-6 lg:px-8">
      <div className="mx-auto max-w-[1180px]">
        <div className="frontpage-compare-head">
          <div className="max-w-[42rem]">
            <p className="section-label">plans</p>
            <h2 className="frontpage-compare-title">{copy.title}</h2>
            <p className="frontpage-compare-copy">{copy.body}</p>
          </div>
          <div className="frontpage-compare-note">
            <strong>competitor context</strong>
            <span>{copy.note}</span>
          </div>
        </div>

        <div className="frontpage-pricing-row">
          {plans.map((plan) => (
            <article key={plan.label} className="frontpage-pricing-card">
              <p className="frontpage-pricing-label">{plan.label}</p>
              <p className="frontpage-pricing-value">{plan.price}</p>
              <p className="frontpage-pricing-detail">{plan.detail}</p>
            </article>
          ))}
        </div>

        <div className="frontpage-compare-strip">
          {compareBadges.map((item) => (
            <div key={item.label} className={`frontpage-compare-badge ${item.label === "clarity" ? "is-clarity" : ""}`}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <small>{item.note}</small>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
