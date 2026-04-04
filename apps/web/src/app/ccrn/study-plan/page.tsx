import type { Metadata } from "next";
import IntentLanding from "@/components/marketing/IntentLanding";
import { getLiveContentSummary } from "@/lib/live-content-summary";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "CCRN study plan",
  description:
    "Build a cleaner CCRN study plan with focused hemodynamics, shock, vent, and bedside reasoning practice instead of generic qbank drift.",
  alternates: {
    canonical: "/ccrn/study-plan",
  },
};

export default function CcrnStudyPlanPage() {
  const summary = getLiveContentSummary();

  return (
    <IntentLanding
      eyebrow="CCRN study-plan intent"
      examPill="CCRN"
      title="A good CCRN study plan should narrow the field and make the next rep obvious."
      body="Most people searching for a CCRN study plan are not looking for more resources. They are looking for a cleaner order of operations. ChapAI is built for that buyer: original critical-care questions, stronger rationale, and a package path that feels calm instead of scattered."
      stats={[
        { label: "CCRN live", value: `${summary.ccrn.live}` },
        { label: "CCRN draft bank", value: `${summary.ccrn.draft}` },
        { label: "Best use", value: "Focused bedside reps" },
      ]}
      accentLabel="Study-plan intent"
      primaryHref="/ccrn/24-hour-cram"
      primaryLabel="Start CCRN cram pass"
      secondaryHref="/upgrade#ccrn"
      secondaryLabel="Choose CCRN package"
      whyTitle="The best study plan is not longer. It is cleaner."
      whyBody="A practical CCRN plan should bias toward hemodynamics, shock, vasoactive drips, vent settings, and clinical prioritization. The product should help the learner know what to study next without bouncing across five tools."
      proofPoints={[
        {
          label: "Cleaner order",
          text: "Use the product as a tighter sequence: high-yield topics first, rationale second, tutor follow-up third.",
        },
        {
          label: "Original growth",
          text: "The bank keeps compounding through the cheap local generation lane, which helps the product stay alive instead of freezing after launch.",
        },
        {
          label: "Calmer design",
          text: "A calmer interface matters because many buyers are studying after shifts, before work, or close to their exam date.",
        },
      ]}
      buyerTitle="ICU nurses who need a cleaner study order"
      buyerBody="Best for bedside nurses who do not need more noise. They need the next highest-yield topic, a believable question, and a clear explanation."
      packageTitle="One direct CCRN package"
      packageBody="The CCRN package keeps the language, proof points, and clinical signals aligned with critical care instead of mixing them into a generic nursing product."
      urgencyTitle="Useful for both slow prep and last-minute tightening"
      urgencyBody="Some buyers want a full package. Others want the 24-hour cram pass because they are close to test day. The study-plan intent page can serve both."
      faq={[
        {
          question: "What should I study first for CCRN?",
          answer: "Start with hemodynamics, shock states, vasoactive support, vents, and clinical decision patterns that show up repeatedly in critical care.",
        },
        {
          question: "Should I use a generic study schedule?",
          answer: "A generic schedule can help, but a product that teaches you what to do next after each question is usually more useful.",
        },
        {
          question: "Is a cram option enough?",
          answer: "For last-minute buyers, the cram pass is the fastest entry point. For longer prep, the full CCRN package gives a steadier flow.",
        },
      ]}
    />
  );
}
