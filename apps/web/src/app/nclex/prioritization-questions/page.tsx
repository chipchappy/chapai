import type { Metadata } from "next";
import IntentLanding from "@/components/marketing/IntentLanding";

export const metadata: Metadata = {
  title: "NCLEX Prioritization Questions — Free Practice with Rationales | Clarity",
  description:
    "Free NCLEX prioritization and delegation practice with full rationales. ABC, Maslow, and safety-first frameworks worked through with real clinical scenarios. Updated for the 2026 NCSBN test plan.",
  alternates: { canonical: "/nclex/prioritization-questions" },
  keywords: [
    "NCLEX prioritization questions",
    "free NCLEX prioritization questions",
    "NCLEX who do you see first",
    "NCLEX-RN prioritization practice",
    "NCLEX safety-first decision making",
  ],
  openGraph: {
    title: "NCLEX Prioritization Questions — Free Practice with Rationales",
    description:
      "Free NCLEX prioritization practice with ABC, Maslow, and safety-first frameworks. Updated for 2026.",
    url: "https://claritynclex.com/nclex/prioritization-questions",
    type: "article",
  },
};

export default function NclexPrioritizationQuestionsPage() {
  return (
    <IntentLanding
      eyebrow="NCLEX prioritization intent"
      examPill="NCLEX"
      title="NCLEX prioritization questions should train judgment, not just drill random items."
      body="ChapAI keeps NCLEX practice calmer and more bedside-real, with clearer rationales, AI tutor follow-up, and package-first flows built around prioritization, safety, and next-best-action logic."
      stats={[
        { label: "NCLEX draft bank", value: "272+" },
        { label: "Focus", value: "Prioritization" },
        { label: "Tutor mode", value: "Live" },
      ]}
      accentLabel="Safety-first study flow"
      primaryHref="/upgrade"
      primaryLabel="Choose NCLEX package"
      secondaryHref="/nclex"
      secondaryLabel="See NCLEX surface"
      whyTitle="This page is for the buyer who is specifically looking for prioritization help."
      whyBody="That search intent usually means the student is struggling with next-best-action, unstable-patient triage, or who-to-see-first logic. The page should answer that directly, then move into the NCLEX package."
      proofPoints={[
        { label: "Clear fit", text: "Built for students who need stronger safety, urgency, and delegation judgment." },
        { label: "Better teaching", text: "Rationales and tutor follow-ups explain why one patient is unstable instead of only revealing the answer." },
        { label: "Cleaner flow", text: "Traffic can go directly from this intent page into the NCLEX package without wandering around the site." },
      ]}
      buyerTitle="NCLEX students weak on safety and next-best-action"
      buyerBody="This is the right lane for repeat test-takers or anxious students who know prioritization is the section still costing them points."
      packageTitle="NCLEX package with calmer prioritization practice"
      packageBody="The NCLEX package is positioned as a cleaner, more modern study system for prioritization, pharmacology, and review."
      urgencyTitle="Get ahead of the next exam date"
      urgencyBody="If someone is searching for prioritization questions now, they are already close to the buy window and should see the package immediately."
      faq={[
        {
          question: "Why are prioritization questions so hard on NCLEX?",
          answer: "Because they test judgment under pressure: who is unstable, what action is safest first, and what data should change your priority order immediately.",
        },
        {
          question: "What should a good prioritization tool teach?",
          answer: "It should teach pattern recognition, triage logic, and why a patient is the actual priority instead of only showing the correct choice.",
        },
        {
          question: "Why push directly to the package page?",
          answer: "Because this search is already close to purchase intent. The student is not browsing casually; they are trying to solve a specific problem.",
        },
      ]}
    />
  );
}
