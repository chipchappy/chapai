import type { Metadata } from "next";
import IntentLanding from "@/components/marketing/IntentLanding";
import { getLiveContentSummary } from "@/lib/live-content-summary";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "CCRN hemodynamics questions",
  description:
    "Practice CCRN hemodynamics questions with bedside-style rationales, AI teaching, and a calmer critical-care study flow.",
  alternates: {
    canonical: "/ccrn/hemodynamics-questions",
  },
};

export default function CcrnHemodynamicsQuestionsPage() {
  const summary = getLiveContentSummary();

  return (
    <IntentLanding
      eyebrow="CCRN search page"
      examPill="CCRN"
      title="CCRN hemodynamics questions should teach patterns, not just pressure numbers."
      body="This page exists for nurses who specifically want hemodynamics practice. ChapAI turns those questions into cleaner bedside pattern recognition, AI-guided teaching, and a more premium review surface."
      stats={[
        { label: "Live CCRN bank", value: `${summary.ccrn.live} questions` },
        { label: "Draft lane", value: `${summary.ccrn.draft} staged` },
        { label: "Why it matters", value: "MAP, preload, SVR, shock" },
      ]}
      accentLabel="Hemodynamics review"
      primaryHref="/upgrade#ccrn"
      primaryLabel="Choose CCRN package"
      secondaryHref="/quiz?exam=ccrn"
      secondaryLabel="Try CCRN practice"
      whyTitle="The right hemodynamics qbank teaches relationships, not memorized fragments."
      whyBody="Most nurses searching for CCRN hemodynamics questions are really asking for something harder: a faster way to interpret pressure relationships, identify the shock pattern, and choose the next move under stress."
      proofPoints={[
        {
          label: "Preload to perfusion",
          text: "Questions should show how CVP, PAOP, urine output, and MAP move together instead of teaching each number in isolation.",
        },
        {
          label: "Shock pattern recognition",
          text: "The best questions make cardiogenic, hypovolemic, distributive, and obstructive shock easier to separate under pressure.",
        },
        {
          label: "Rationale that sticks",
          text: "ChapAI adds a short bedside takeaway and visual rationale so the pattern is easier to remember the next shift and the next quiz.",
        },
      ]}
      buyerTitle="ICU nurses who keep missing the relationship between numbers."
      buyerBody="Best for nurses who know the terms but want shock, preload, contractility, and perfusion decisions to feel cleaner and more automatic."
      packageTitle="A calmer critical-care package with hemodynamic teaching built in."
      packageBody="Instead of a giant noisy qbank, you get original CCRN-style questions, better rationales, and an AI tutor that can keep teaching even when the cloud model is unavailable."
      urgencyTitle="The bank is still compounding."
      urgencyBody="Founding buyers get the cleaner product now while the local batch engine keeps adding net-new hemodynamic and shock content in the background."
      faq={[
        {
          question: "Are these questions only about Swan numbers?",
          answer: "No. The better CCRN hemodynamics questions connect pressure data to perfusion, shock type, bedside priorities, and what the nurse should do next.",
        },
        {
          question: "What makes this different from generic CCRN question banks?",
          answer: "The product is built to feel less cluttered and more clinical: original questions, cleaner rationales, and visual teaching cues instead of just answer dumps.",
        },
        {
          question: "Should I use this if hemodynamics is my weakest category?",
          answer: "Yes. This is one of the strongest entry points because clearer hemodynamic pattern recognition improves shock, vent, cardiac, and multisystem questions too.",
        },
      ]}
    />
  );
}
