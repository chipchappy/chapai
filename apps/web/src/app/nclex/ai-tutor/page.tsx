import type { Metadata } from "next";
import IntentLanding from "@/components/marketing/IntentLanding";
import { getLiveContentSummary } from "@/lib/live-content-summary";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "NCLEX AI tutor",
  description:
    "Use a cleaner NCLEX AI tutor for prioritization, delegation, safety, and pharmacology with original questions and more useful rationale.",
  alternates: {
    canonical: "/nclex/ai-tutor",
  },
};

export default function NclexAiTutorPage() {
  const summary = getLiveContentSummary();

  return (
    <IntentLanding
      eyebrow="NCLEX AI tutor intent"
      examPill="NCLEX"
      title="A good NCLEX AI tutor should reduce panic and sharpen safer answers."
      body="This route is built for students searching for a cleaner teaching loop: original NCLEX-style reps, calmer rationale, and tutor follow-up focused on prioritization, delegation, safety, and pharmacology."
      stats={[
        { label: "NCLEX draft bank", value: `${summary.nclex.draft}` },
        { label: "Tutor angle", value: "Safety-first" },
        { label: "Best fit", value: "Priority / delegation" },
      ]}
      accentLabel="AI tutor intent"
      primaryHref="/nclex/24-hour-cram"
      primaryLabel="Start NCLEX cram pass"
      secondaryHref="/upgrade#nclex"
      secondaryLabel="Choose NCLEX package"
      whyTitle="The tutor should explain why the safer answer wins."
      whyBody="Students looking for an NCLEX AI tutor usually want less chaos. The right teaching loop keeps the focus on unstable patients, delegation mistakes, safety logic, and the next safer move."
      proofPoints={[
        {
          label: "Safety logic",
          text: "The tutor is most useful when it explains urgency, delegation, and harm reduction in direct language.",
        },
        {
          label: "Question grounded",
          text: "Original practice questions create the best setup for a useful tutor answer instead of turning prep into open-ended chat.",
        },
        {
          label: "Fast conversion",
          text: "High-intent tutor traffic can step straight into the 24-hour cram offer or the full package without extra friction.",
        },
      ]}
      buyerTitle="Students who want structure instead of noise"
      buyerBody="Best for anxious students, repeat takers, or anyone who learns better from cleaner explanation after each rep."
      packageTitle="One direct NCLEX teaching path"
      packageBody="The NCLEX package keeps the question, rationale, tutor follow-up, and CTA aligned to the actual exam market instead of mixing in ICU language."
      urgencyTitle="Tutor-intent traffic is often close to buying"
      urgencyBody="Many users searching for an NCLEX AI tutor are already committed to studying and want a faster, cleaner decision about what to buy."
      faq={[
        {
          question: "What should an NCLEX AI tutor focus on?",
          answer: "It should focus on prioritization, delegation, safety, pharmacology, and the clearer reason one option is safer than another.",
        },
        {
          question: "Can a tutor replace a qbank?",
          answer: "Not usually. The strongest loop is original practice first, tutor guidance second, then another rep to confirm the pattern.",
        },
        {
          question: "Is the cram pass a good first buy?",
          answer: "Yes for close-to-exam buyers who want a fast low-risk entry. The full package is better for a steadier longer review loop.",
        },
      ]}
    />
  );
}
