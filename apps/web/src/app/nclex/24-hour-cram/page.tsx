import type { Metadata } from "next";
import IntentLanding from "@/components/marketing/IntentLanding";
import { getLiveContentSummary } from "@/lib/live-content-summary";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "NCLEX 24-hour cram pass",
  description:
    "Need a last-minute NCLEX cram sprint? Get 24 hours of focused safety, prioritization, delegation, and AI-guided review for $10.",
  alternates: {
    canonical: "/nclex/24-hour-cram",
  },
};

export default function Nclex24HourCramPage() {
  const summary = getLiveContentSummary();

  return (
    <IntentLanding
      eyebrow="NCLEX cram page"
      examPill="NCLEX"
      title="Need to cram for NCLEX in one day? Start with a focused 24-hour sprint."
      body="This page is for high-urgency buyers who need a cheaper first step. If they want one hard day of safety, delegation, prioritization, and pharmacology review, the best conversion path is a one-time sprint offer."
      stats={[
        { label: "Sprint price", value: "$10 one time" },
        { label: "NCLEX draft lane", value: `${summary.nclex.draft} staged` },
        { label: "Why it converts", value: "Fast first yes" },
      ]}
      accentLabel="24-hour sprint"
      primaryHref="/upgrade#cram-pass"
      primaryLabel="Start NCLEX cram pass"
      secondaryHref="/upgrade#nclex"
      secondaryLabel="See full NCLEX package"
      whyTitle="A low-friction cram offer catches buyers who would bounce from a full-plan page."
      whyBody="High-urgency NCLEX buyers are not always ready for a monthly plan. A one-day pass gives them a reason to try the product now and upgrade later if the study flow feels right."
      proofPoints={[
        {
          label: "Perfect for urgency",
          text: "This is the right offer for last-minute buyers, repeat test-takers, and anyone who wants one strong cram day before committing further.",
        },
        {
          label: "Direct package logic",
          text: "The sprint page answers the buyer's immediate question and moves them straight to the right low-friction purchase.",
        },
        {
          label: "Natural upgrade path",
          text: "If the cram pass works, the full NCLEX package becomes the next step instead of the first intimidating ask.",
        },
      ]}
      buyerTitle="Students who want one concentrated NCLEX review day without overbuying."
      buyerBody="Best for crammers, repeat test-takers, and high-urgency students who need safety and prioritization to feel cleaner right away."
      packageTitle="A calmer NCLEX review day with cleaner AI teaching."
      packageBody="The sprint still gives access to the same product feel: focused question sessions, rationales, and AI teaching instead of a cluttered qbank-first experience."
      urgencyTitle="Urgency traffic should land on a sprint-ready page."
      urgencyBody="If a buyer is searching for last-minute NCLEX help, this page should turn that urgency into a faster first conversion instead of making them browse."
      faq={[
        {
          question: "Who is the NCLEX cram pass for?",
          answer: "It is for buyers who want one fast, lower-commitment study window before deciding on a full monthly package.",
        },
        {
          question: "What topics is it best for?",
          answer: "It is strongest for safety, prioritization, delegation, and other high-pressure decision patterns that matter most in the final review window.",
        },
        {
          question: "Can I move into the full NCLEX package later?",
          answer: "Yes. The cram pass is designed as the fastest first conversion path, not the end of the funnel.",
        },
      ]}
    />
  );
}
