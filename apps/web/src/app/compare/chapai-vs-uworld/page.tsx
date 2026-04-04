import type { Metadata } from "next";
import IntentLanding from "@/components/marketing/IntentLanding";

export const metadata: Metadata = {
  title: "ChapAI vs UWorld for CCRN and NCLEX | ChapAI",
  description: "Compare ChapAI vs UWorld for cleaner UI, exam-specific package routes, AI tutor support, and a more modern study flow for CCRN and NCLEX.",
  alternates: {
    canonical: "/compare/chapai-vs-uworld",
  },
};

export default function ChapAiVsUworldPage() {
  return (
    <IntentLanding
      eyebrow="Comparison intent"
      title="ChapAI vs UWorld should feel like modern clinical study design versus older qbank sprawl."
      body="ChapAI is being built around cleaner editorial UX, exam-specific packages, tutor follow-up, and a more guided study surface instead of dumping users into another generic question warehouse."
      stats={[
        { label: "Comparison", value: "Modern vs legacy" },
        { label: "Packages", value: "CCRN + NCLEX" },
        { label: "Flow", value: "Cleaner UX" },
      ]}
      accentLabel="Comparison page"
      primaryHref="/upgrade"
      primaryLabel="Choose your package"
      secondaryHref="/"
      secondaryLabel="See ChapAI"
      whyTitle="Comparison pages catch buyers who are already evaluating alternatives."
      whyBody="That is high-intent traffic. The goal is not to attack established tools loudly; it is to show that ChapAI is calmer, cleaner, and more focused on how modern learners actually move through a study product."
      proofPoints={[
        { label: "Cleaner surface", text: "The product is moving toward a more premium editorial interface rather than a cramped qbank feel." },
        { label: "Exam split", text: "CCRN and NCLEX are sold as distinct packages because they are different buying decisions." },
        { label: "Tutor path", text: "Tutor follow-up and visual rationale blocks add teaching value on top of the raw question bank." },
      ]}
      buyerTitle="People comparing study products right before purchase"
      buyerBody="This audience is already in evaluation mode. They need a clear reason to believe ChapAI is more modern and more focused on their exam."
      packageTitle="Move them directly to the package page"
      packageBody="Once the comparison answer is clear, the shortest path is to show CCRN and NCLEX packages instead of sending them to a generic homepage."
      urgencyTitle="The buy window is already open"
      urgencyBody="Traffic comparing one tool against another is usually very close to spending, so the CTA should stay decisive and direct."
      faq={[
        {
          question: "What is the core ChapAI argument in a comparison page?",
          answer: "A cleaner product flow, stronger exam-specific packaging, and a more modern learning surface with AI-supported follow-up instead of generic qbank clutter.",
        },
        {
          question: "Why compare against UWorld at all?",
          answer: "Because buyers search for comparisons when they are near a decision. If that traffic lands nowhere, it never gets the chance to convert.",
        },
        {
          question: "What should happen after the comparison?",
          answer: "The user should move straight into the right package page for CCRN or NCLEX instead of getting lost in the site.",
        },
      ]}
    />
  );
}
