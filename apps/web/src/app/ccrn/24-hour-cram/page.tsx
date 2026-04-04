import type { Metadata } from "next";
import IntentLanding from "@/components/marketing/IntentLanding";
import { getLiveContentSummary } from "@/lib/live-content-summary";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "CCRN 24-hour cram pass",
  description:
    "Need a last-minute CCRN cram sprint? Get 24 hours of focused critical-care review, AI teaching, and original bedside-style questions for $10.",
  alternates: {
    canonical: "/ccrn/24-hour-cram",
  },
};

export default function Ccrn24HourCramPage() {
  const summary = getLiveContentSummary();

  return (
    <IntentLanding
      eyebrow="CCRN cram page"
      examPill="CCRN"
      title="Need to cram for CCRN in one day? Buy a 24-hour sprint, not a noisy monthly commitment."
      body="This page is for high-urgency buyers. If they are taking CCRN soon and want one focused day of hemodynamics, vents, shock, and bedside review, the fastest answer should be a cheaper 24-hour yes."
      stats={[
        { label: "Sprint price", value: "$10 one time" },
        { label: "CCRN live bank", value: `${summary.ccrn.live} live` },
        { label: "Staged growth", value: `${summary.ccrn.draft} drafted` },
      ]}
      accentLabel="24-hour sprint"
      primaryHref="/upgrade#cram-pass"
      primaryLabel="Start CCRN cram pass"
      secondaryHref="/upgrade#ccrn"
      secondaryLabel="See full CCRN package"
      whyTitle="A 24-hour pass is the right first offer for last-minute ICU buyers."
      whyBody="When someone is cramming, the job is not to sell them the whole roadmap first. The job is to give them one fast way in, one believable study day, and one clean reason to buy now."
      proofPoints={[
        {
          label: "Lower-friction buy",
          text: "A $10 one-time pass is easier to say yes to when the exam is close and the buyer does not want to overthink a monthly commitment.",
        },
        {
          label: "Better fit for urgency",
          text: "The cram pass is built for the buyer who wants one concentrated day of ICU review instead of a long planning cycle.",
        },
        {
          label: "Upgrade path still exists",
          text: "If the buyer likes the product, the full CCRN package remains the natural next step after the sprint window ends.",
        },
      ]}
      buyerTitle="ICU nurses who need one intense day of review before the exam."
      buyerBody="Best for high-urgency buyers who need cleaner hemodynamic, respiratory, and shock review immediately."
      packageTitle="Original CCRN-style questions plus AI teaching in a short window."
      packageBody="The sprint still gives access to the same product feel: original scenarios, cleaner rationales, and tutor guidance without forcing a bigger purchase first."
      urgencyTitle="This page should convert urgency, not slow it down."
      urgencyBody="If someone is searching for a last-minute CCRN cram tool, they are already close to a decision. The CTA should move them directly into the sprint offer."
      faq={[
        {
          question: "Who is the CCRN cram pass for?",
          answer: "It is for last-minute or high-urgency buyers who want one focused day of cleaner ICU review before deciding on a full monthly package.",
        },
        {
          question: "What do I get during the 24 hours?",
          answer: "You get concentrated access to the CCRN product flow, including question sessions, rationales, and AI-guided teaching.",
        },
        {
          question: "Can I upgrade later if I like it?",
          answer: "Yes. The cram pass is designed as the cheapest first yes, not the only path in.",
        },
      ]}
    />
  );
}
