import type { Metadata } from "next";
import IntentLanding from "@/components/marketing/IntentLanding";
import { getLiveContentSummary } from "@/lib/live-content-summary";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "CCRN vasoactive drips questions",
  description:
    "Practice CCRN vasoactive drip questions with cleaner critical-care rationales, AI-guided teaching, and a calmer ICU study surface.",
  alternates: {
    canonical: "/ccrn/vasoactive-drips",
  },
};

export default function CcrnVasoactiveDripsPage() {
  const summary = getLiveContentSummary();

  return (
    <IntentLanding
      eyebrow="CCRN search page"
      examPill="CCRN"
      title="CCRN vasoactive drip questions should train escalation judgment, not just drug names."
      body="Most nurses searching for CCRN vasoactive drip practice are trying to get cleaner under pressure: which drip fits the shock pattern, what to titrate first, and what change means the patient is getting worse."
      stats={[
        { label: "Live CCRN bank", value: `${summary.ccrn.live} questions` },
        { label: "Draft lane", value: `${summary.ccrn.draft} staged` },
        { label: "Core signals", value: "MAP, SVR, perfusion, shock" },
      ]}
      accentLabel="Vasoactive review"
      primaryHref="/upgrade#ccrn"
      primaryLabel="Choose CCRN package"
      secondaryHref="/quiz?exam=ccrn"
      secondaryLabel="Try CCRN practice"
      whyTitle="Better vasoactive questions make drip choices feel faster and safer."
      whyBody="The strongest CCRN drip questions force you to connect hemodynamics, shock type, and bedside response instead of memorizing isolated norepinephrine-versus-dobutamine facts."
      proofPoints={[
        {
          label: "Shock to drip fit",
          text: "Questions should make it easier to match distributive, cardiogenic, and mixed shock states to the right vasoactive strategy.",
        },
        {
          label: "Titration logic",
          text: "Good rationales teach what change means the current plan is working, failing, or causing harm.",
        },
        {
          label: "Cleaner memory",
          text: "ChapAI adds short bedside takeaways and visual cues so pressor and inotrope decisions feel more retrievable on the next shift.",
        },
      ]}
      buyerTitle="ICU nurses who know the drugs but want the bedside decision to feel cleaner."
      buyerBody="Best for nurses who get stuck between pressors, inotropes, preload support, and what to do when the numbers move the wrong way."
      packageTitle="A calmer CCRN package that teaches why the drip fits the patient."
      packageBody="Instead of a cluttered qbank, you get original CCRN-style questions, cleaner rationales, AI teaching, and a study surface designed to keep critical-care pattern recognition sharp."
      urgencyTitle="This is a high-value weak spot."
      urgencyBody="If vasoactive choices still feel noisy, improving here helps shock, cardiac, multisystem, and hemodynamic questions all at once."
      faq={[
        {
          question: "Do these questions focus only on memorizing drug classes?",
          answer: "No. The goal is to connect the drug choice to perfusion, shock pattern, titration response, and bedside nursing priorities.",
        },
        {
          question: "Why are vasoactive drips such a strong CCRN topic to train?",
          answer: "Because they sit right at the overlap of hemodynamics, shock, cardiac support, and rapid decision-making under pressure.",
        },
        {
          question: "Should I start here if pressors and inotropes are my weakest area?",
          answer: "Yes. It is one of the highest-leverage weak spots because cleaner drip reasoning improves multiple CCRN categories quickly.",
        },
      ]}
    />
  );
}
