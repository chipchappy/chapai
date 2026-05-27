import type { Metadata } from "next";
import IntentLanding from "@/components/marketing/IntentLanding";
import { getLiveContentSummary } from "@/lib/live-content-summary";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "NCLEX Delegation Questions — Free RN, LPN, UAP Practice with Rationales",
  description:
    "Free NCLEX delegation practice questions using the NCSBN 5-rights framework. RN vs LPN vs UAP scenarios with full rationales. Updated for the 2026 NCSBN test plan.",
  alternates: { canonical: "/nclex/delegation-questions" },
  keywords: [
    "NCLEX delegation questions",
    "free NCLEX delegation questions",
    "NCLEX RN LPN UAP delegation",
    "NCSBN 5 rights of delegation",
    "NCLEX delegation practice",
  ],
  openGraph: {
    title: "NCLEX Delegation Questions — Free RN, LPN, UAP Practice",
    description: "Free NCLEX delegation practice with NCSBN 5-rights framework. Updated for 2026.",
    url: "https://claritynclex.com/nclex/delegation-questions",
    type: "article",
  },
};

export default function NclexDelegationQuestionsPage() {
  const summary = getLiveContentSummary();

  return (
    <IntentLanding
      eyebrow="NCLEX search page"
      examPill="NCLEX"
      title="NCLEX delegation questions should make assignment safety obvious, not fuzzy."
      body="Students searching for NCLEX delegation questions are usually trying to stop second-guessing which patient, task, or change in status belongs to the RN, the LPN/LVN, or the assistive personnel."
      stats={[
        { label: "NCLEX draft lane", value: `${summary.nclex.draft} staged` },
        { label: "Why buyers care", value: "Safety, prioritization, scope" },
        { label: "Package style", value: "Cleaner and calmer" },
      ]}
      accentLabel="Delegation review"
      primaryHref="/upgrade#nclex"
      primaryLabel="Choose NCLEX package"
      secondaryHref="/quiz?exam=nclex"
      secondaryLabel="Try NCLEX practice"
      whyTitle="The best delegation practice reduces hesitation by teaching safe assignment patterns."
      whyBody="A stronger NCLEX delegation product helps students recognize unstable versus stable patients faster, understand scope boundaries, and stop overthinking tasks that should have become automatic."
      proofPoints={[
        {
          label: "Scope clarity",
          text: "Questions should make RN-only assessments, teaching, and unstable patient care feel distinct from what can be safely delegated.",
        },
        {
          label: "Safety-first rationale",
          text: "The right answer should always connect back to patient stability, need for judgment, and who can legally or safely do the work.",
        },
        {
          label: "Faster retrieval",
          text: "ChapAI packages the rationale into a short bedside-style rule so delegation logic is easier to reuse across multiple question types.",
        },
      ]}
      buyerTitle="NCLEX students who keep missing assignment and scope questions."
      buyerBody="Best for students who understand the words but still hesitate when asked who should take the patient, perform the task, or see the change first."
      packageTitle="A calmer NCLEX package centered on safe prioritization and delegation."
      packageBody="You get original NCLEX-style items, clearer rationales, AI teaching, and a product flow built to help safety logic stick faster than a cluttered generic qbank."
      urgencyTitle="Delegation is a leverage category."
      urgencyBody="If delegation feels cleaner, prioritization, management of care, and many safety questions start improving with it."
      faq={[
        {
          question: "Are NCLEX delegation questions mostly about memorizing scope rules?",
          answer: "Not really. The stronger questions connect scope to stability, judgment, teaching, and what requires an RN-level clinical decision.",
        },
        {
          question: "Why do students miss delegation even when they know the role definitions?",
          answer: "Because the exam hides the decision inside patient safety and instability. Better practice makes those patterns feel easier to spot quickly.",
        },
        {
          question: "Should delegation be one of my first NCLEX weak spots to fix?",
          answer: "Yes. It is one of the highest-value categories because it strengthens management of care, prioritization, and patient safety at the same time.",
        },
      ]}
    />
  );
}
