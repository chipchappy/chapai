import type { Metadata } from "next";
import IntentLanding from "@/components/marketing/IntentLanding";
import { getLiveContentSummary } from "@/lib/live-content-summary";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Best CCRN study tool",
  description:
    "Looking for the best CCRN study tool? Compare a calmer, more premium critical-care system with original questions and AI-guided rationale.",
  alternates: {
    canonical: "/ccrn/best-study-tool",
  },
};

export default function BestCcrnStudyToolPage() {
  const summary = getLiveContentSummary();

  return (
    <IntentLanding
      eyebrow="CCRN buyer-intent page"
      examPill="CCRN"
      title="The best CCRN study tool should feel clinically sharp, not just crowded."
      body="If someone is searching for the best CCRN study tool, they are usually trying to avoid wasted time. ChapAI is designed for that exact buyer: cleaner design, original ICU scenarios, AI teaching, and a bank that keeps compounding."
      stats={[
        { label: "Live questions", value: `${summary.ccrn.live}` },
        { label: "Critical-care drafts", value: `${summary.ccrn.draft}` },
        { label: "Teaching style", value: "Trend-first rationale" },
      ]}
      accentLabel="Buyer intent"
      primaryHref="/upgrade#ccrn"
      primaryLabel="Start CCRN package"
      secondaryHref="/ccrn"
      secondaryLabel="See CCRN product"
      whyTitle="The strongest study tool wins on signal, trust, and reusability."
      whyBody="For working ICU nurses, the best tool is not the one with the loudest dashboard. It is the one that makes hemodynamics, vents, shock, neuro change, and multisystem review feel faster and more believable."
      proofPoints={[
        {
          label: "Cleaner design",
          text: "The interface is built to feel calm and premium instead of cluttered, which matters when people are studying before shifts or after long stretches.",
        },
        {
          label: "Original question growth",
          text: "The cheap local generation lane keeps adding new original batches so the product does not freeze after the first launch.",
        },
        {
          label: "AI teaching",
          text: "The tutor can guide the learner through why an answer is right, what pattern mattered, and what to remember next time.",
        },
      ]}
      buyerTitle="Nurses who want fewer wasted clicks and better bedside signal."
      buyerBody="Best for critical-care nurses who do not need another generic qbank. They need stronger pattern recognition and a product that feels more premium and believable."
      packageTitle="One focused CCRN package instead of a blended generic product."
      packageBody="The CCRN package gets its own language, proof points, and study flow. That matters because ICU buyers are not shopping for NCLEX-style review."
      urgencyTitle="Buy while the price still reflects early access."
      urgencyBody="The current product already works, but it is still improving week by week. Early buyers get the cleaner package while the bank and rationale layer continue to sharpen."
      faq={[
        {
          question: "What should I look for in a CCRN study tool?",
          answer: "Look for realistic clinical scenarios, clearer rationales, a trustworthy visual design, and enough growth in the content bank that the product keeps getting better over time.",
        },
        {
          question: "Why not just use a generic question bank?",
          answer: "Because generic tools often blur together. A focused critical-care package can teach the bedside pattern faster and build more trust with the buyer.",
        },
        {
          question: "Can I try it before paying?",
          answer: "Yes. The free path lets someone sample the product, then the package page moves them into a stronger paid study flow if it feels right.",
        },
      ]}
    />
  );
}
