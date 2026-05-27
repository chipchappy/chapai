import type { Metadata } from "next";
import FreeLandingPage from "@/components/seo/FreeLandingPage";
import { SEED_GENERAL } from "@/content/free-landings/seed-questions";

const SLUG = "nclex-practice-questions";
const SITE_URL = "https://claritynclex.com";

export const metadata: Metadata = {
  title: "Free NCLEX Practice Questions | Real NCLEX-RN Items with Rationales",
  description:
    "Free NCLEX-RN practice questions across cardiac, pharmacology, SATA, and prioritization. Full rationales, no signup. Updated for the 2026 NCSBN test plan.",
  alternates: { canonical: `/free/${SLUG}` },
  keywords: [
    "free NCLEX practice questions",
    "NCLEX practice questions",
    "free NCLEX-RN questions",
    "NCLEX-RN practice",
    "NCLEX sample questions free",
    "free nursing exam questions",
  ],
  openGraph: {
    title: "Free NCLEX Practice Questions | Real NCLEX-RN Items with Rationales",
    description: "Free NCLEX-RN practice questions with full rationales. No signup.",
    url: `${SITE_URL}/free/${SLUG}`,
    type: "article",
  },
};

export default function Page() {
  return (
    <FreeLandingPage
      slug={SLUG}
      h1="Free NCLEX practice questions with full rationales"
      metaTitle={metadata.title as string}
      metaDescription={metadata.description as string}
      intro={
        <p>
          Five free NCLEX-RN practice questions spanning the categories the NCSBN test plan
          weights most heavily — pharmacology safety, prioritization, SATA, and clinical
          judgment. Every question includes the correct answer, the clinical reasoning, and a
          note on why each distractor is wrong. No signup required.
        </p>
      }
      body={
        <>
          <h2>Why "free NCLEX practice questions" rarely match the real exam</h2>
          <p>
            Most free NCLEX question sets fall into one of three traps: they were written before
            the 2023 Next Generation NCLEX update, they're medical-knowledge quizzes dressed up as
            nursing questions, or they're so easy that they give a false sense of readiness. The
            real NCLEX-RN tests clinical judgment — the ability to recognize what's changing in a
            patient and pick the safest next action — not memorized facts.
          </p>
          <p>
            The five questions on this page were written to NCSBN's published item-writing
            standards and reviewed for accuracy. Every distractor (wrong answer) is something a
            student could plausibly choose, and the rationale explains the specific clinical error
            in each option rather than a generic "this is wrong."
          </p>

          <h2>What categories are on the NCLEX-RN?</h2>
          <p>The 2026 NCSBN test plan covers eight client need areas:</p>
          <ul>
            <li><strong>Management of Care</strong> (15–21%) — delegation, prioritization, advocacy.</li>
            <li><strong>Safety and Infection Control</strong> (10–16%) — falls, restraints, isolation, error prevention.</li>
            <li><strong>Health Promotion and Maintenance</strong> (6–12%) — screening, developmental stages, prenatal care.</li>
            <li><strong>Psychosocial Integrity</strong> (6–12%) — crisis, grief, addiction, therapeutic communication.</li>
            <li><strong>Basic Care and Comfort</strong> (6–12%) — ADLs, nutrition, mobility, sleep.</li>
            <li><strong>Pharmacological and Parenteral Therapies</strong> (13–19%) — administration, monitoring, adverse effects.</li>
            <li><strong>Reduction of Risk Potential</strong> (9–15%) — diagnostic tests, lab values, complications.</li>
            <li><strong>Physiological Adaptation</strong> (11–17%) — medical-surgical conditions, hemodynamics, fluid/electrolytes.</li>
          </ul>
          <p>
            The questions below sample across these categories so you can gauge the breadth of
            what you'll face.
          </p>

          <h2>The 3 question-reading habits of students who pass first-try</h2>
          <ol>
            <li>
              <strong>Identify the question type first.</strong> Is it asking for a priority, an
              expected outcome, an unexpected finding, or a teaching evaluation? The verb in the
              stem ("first," "best," "most concerning," "requires further teaching") tells you the
              rule to apply.
            </li>
            <li>
              <strong>Predict the answer before reading the options.</strong> If you can't predict,
              you don't understand the question. Reread the stem.
            </li>
            <li>
              <strong>Use ABCs and Maslow only as tiebreakers.</strong> Don't default to "airway"
              every time. If two options both address airway, pick the one that's least invasive,
              most reversible, or that uses the nursing process step the question is testing.
            </li>
          </ol>

          <h2>How many questions are on the NCLEX-RN?</h2>
          <p>
            The exam delivers between 75 and 145 questions using a computerized adaptive testing
            (CAT) format. The test ends when the algorithm is 95% confident you're above or below
            the passing standard. Roughly 15 of your items are unscored "tryout" questions — you
            won't know which.
          </p>

          <h2>What the full Clarity bank looks like</h2>
          <p>
            The bank has 5,000+ NCLEX practice items spanning every category above, including 50+
            real multi-step NGN case studies, 30+ bow-tie items, 200+ pharmacology drug cards
            linked from rationales, and 5 timed readiness exams that simulate the real adaptive
            test. The full bank is $9.99/mo — less than a single month of UWorld.
          </p>
        </>
      }
      questions={SEED_GENERAL}
      faqs={[
        {
          question: "Are these NCLEX practice questions actually free?",
          answer:
            "Yes. Every question on this page is free with no signup. Clarity also offers 10 free questions per day to anyone with a free account, and a full premium bank from $9.99/mo.",
        },
        {
          question: "How accurate are these free NCLEX practice questions?",
          answer:
            "Each question is written to NCSBN item-writing standards, reviewed for clinical accuracy, and aligned to the 2026 NCLEX-RN test plan. We update questions when guidelines change (e.g., ACLS, sepsis bundles, ATI/NCSBN policy updates).",
        },
        {
          question: "What's a passing score on the NCLEX-RN?",
          answer:
            "There's no traditional passing percentage. The NCLEX uses logit scoring and computerized adaptive testing. As of April 2023 the passing standard is -0.18 logits. You pass when the algorithm is 95% confident you perform above that standard.",
        },
        {
          question: "How long should I study for the NCLEX-RN?",
          answer:
            "Most graduates spend 4–8 weeks of focused prep doing 75–100 questions/day with thorough rationale review. Less than 2 weeks of prep is correlated with higher fail rates; more than 12 weeks tends to produce burnout without further gains.",
        },
        {
          question: "Is UWorld worth it for NCLEX prep?",
          answer:
            "UWorld is the most established option but costs ~$109/month. Clarity covers the same NGN item types and adds an AI tutor for $9.99/mo. The questions on this page give you a direct sample so you can judge for yourself.",
        },
      ]}
      relatedSlugs={[
        { slug: "nclex-case-studies", label: "Free NCLEX case studies" },
        { slug: "nclex-ngn-questions", label: "Free NCLEX NGN questions" },
        { slug: "nclex-sata-questions", label: "Free NCLEX SATA questions" },
        { slug: "nclex-prioritization-questions", label: "Free NCLEX prioritization questions" },
        { slug: "nclex-pharmacology-questions", label: "Free NCLEX pharmacology questions" },
        { slug: "nclex-practice-exam", label: "Free NCLEX practice exam" },
      ]}
    />
  );
}
