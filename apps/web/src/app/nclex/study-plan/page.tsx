import type { Metadata } from "next";
import IntentLanding from "@/components/marketing/IntentLanding";
import { getLiveContentSummary } from "@/lib/live-content-summary";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "NCLEX study plan",
  description:
    "Build a calmer NCLEX study plan around prioritization, delegation, safety, and pharmacology with cleaner teaching and package-first review.",
  alternates: {
    canonical: "/nclex/study-plan",
  },
};

export default function NclexStudyPlanPage() {
  const summary = getLiveContentSummary();

  return (
    <IntentLanding
      eyebrow="NCLEX study-plan intent"
      examPill="NCLEX"
      title="A good NCLEX study plan should reduce chaos and keep safety logic in front."
      body="People searching for an NCLEX study plan are usually overwhelmed. ChapAI is built to make the next move cleaner: original practice, AI teaching, and a tighter focus on prioritization, delegation, safety, and pharmacology."
      stats={[
        { label: "NCLEX draft bank", value: `${summary.nclex.draft}` },
        { label: "Teaching angle", value: "Safety-first" },
        { label: "Best fit", value: "Repeatable calm reps" },
      ]}
      accentLabel="NCLEX buyer intent"
      primaryHref="/nclex/24-hour-cram"
      primaryLabel="Start NCLEX cram pass"
      secondaryHref="/upgrade#nclex"
      secondaryLabel="Choose NCLEX package"
      whyTitle="Most students do not need more tabs. They need a cleaner plan."
      whyBody="A real NCLEX study plan should keep the student close to prioritization, unstable-patient logic, delegation, and safer answer patterns instead of treating the exam like one giant random pile."
      proofPoints={[
        {
          label: "Prioritization first",
          text: "The strongest early leverage is almost always prioritization, safety, and delegation before collecting more random content.",
        },
        {
          label: "Cleaner review",
          text: "The product is designed to explain why the decision is safer or more urgent, not just which letter is correct.",
        },
        {
          label: "Low-friction entry",
          text: "Search traffic can move directly from the study-plan question into the cram pass or the full NCLEX package.",
        },
      ]}
      buyerTitle="Students who want structure without punishment"
      buyerBody="Best for anxious students, repeat test takers, or anyone who knows they learn better from tighter guidance and clearer teaching."
      packageTitle="A dedicated NCLEX package"
      packageBody="The NCLEX package stays aligned to its own market instead of borrowing ICU language that does not fit the actual buyer."
      urgencyTitle="Close-to-exam traffic should move fast"
      urgencyBody="Study-plan searches often happen when the exam date already feels real. That is why the cram path and package choice should stay one click away."
      faq={[
        {
          question: "What should I focus on first for NCLEX?",
          answer: "Start with prioritization, delegation, safety, and pharmacology because they shape so many decision questions across the exam.",
        },
        {
          question: "Do I need a big qbank to pass NCLEX?",
          answer: "Not always. Many students do better with clearer teaching, stronger rationale, and a calmer review loop.",
        },
        {
          question: "Should I buy the cram pass or the package?",
          answer: "If you are very close to exam day, the cram pass is the easiest start. If you want a steadier review flow, choose the full package.",
        },
      ]}
    />
  );
}
