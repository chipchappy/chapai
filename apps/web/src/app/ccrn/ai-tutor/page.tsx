import type { Metadata } from "next";
import IntentLanding from "@/components/marketing/IntentLanding";
import { getLiveContentSummary } from "@/lib/live-content-summary";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "CCRN AI tutor",
  description:
    "Use a cleaner CCRN AI tutor flow for hemodynamics, shock, vents, and bedside reasoning with original practice questions and tighter rationale.",
  alternates: {
    canonical: "/ccrn/ai-tutor",
  },
};

export default function CcrnAiTutorPage() {
  const summary = getLiveContentSummary();

  return (
    <IntentLanding
      eyebrow="CCRN AI tutor intent"
      examPill="CCRN"
      title="A useful CCRN AI tutor should make bedside reasoning cleaner, not noisier."
      body="This page is for the buyer who wants a calmer teaching loop: a real critical-care question, a believable rationale, and a follow-up tutor explanation that helps the next decision feel easier."
      stats={[
        { label: "CCRN live", value: `${summary.ccrn.live}` },
        { label: "Tutor mode", value: "Bedside-focused" },
        { label: "Best fit", value: "Shock / vents / drips" },
      ]}
      accentLabel="AI tutor intent"
      primaryHref="/ccrn/24-hour-cram"
      primaryLabel="Start CCRN cram pass"
      secondaryHref="/upgrade#ccrn"
      secondaryLabel="Choose CCRN package"
      whyTitle="The tutor should sharpen the next clinical move."
      whyBody="Many buyers are not looking for a chat toy. They want clearer hemodynamic logic, stronger vent reasoning, and a cleaner explanation after each rep."
      proofPoints={[
        {
          label: "Question first",
          text: "The tutor works best when it follows a real original question instead of replacing the question entirely.",
        },
        {
          label: "Clinical follow-up",
          text: "The strongest tutor answer explains urgency, perfusion, and next-step thinking instead of restating a definition.",
        },
        {
          label: "Cleaner conversion path",
          text: "Search traffic can move directly from tutor intent into the cram pass or the full CCRN package.",
        },
      ]}
      buyerTitle="ICU nurses who want cleaner bedside teaching"
      buyerBody="Best for buyers who learn by seeing one focused question, then asking why the safer, stronger, or more urgent answer wins."
      packageTitle="One calmer CCRN teaching loop"
      packageBody="The product keeps the question, rationale, tutor follow-up, and package CTA aligned to critical care instead of feeling like a generic chat app."
      urgencyTitle="High-intent traffic should convert quickly"
      urgencyBody="People searching for a CCRN AI tutor are usually close to prep, already paying attention, and more likely to start with a low-friction offer."
      faq={[
        {
          question: "What should a CCRN AI tutor actually help with?",
          answer: "It should help with shock states, hemodynamics, ventilators, vasoactive support, and bedside decision patterns that matter in critical care.",
        },
        {
          question: "Is the tutor better than just more questions?",
          answer: "The best loop is question first, tutor second. Practice gives signal, and the tutor should sharpen the reasoning after the rep.",
        },
        {
          question: "Should I start with the cram pass?",
          answer: "If you want the fastest first buy, the cram pass is the lowest-friction entry. If you want a steadier review loop, choose the full package.",
        },
      ]}
    />
  );
}
