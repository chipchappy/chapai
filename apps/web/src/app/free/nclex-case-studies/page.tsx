import type { Metadata } from "next";
import FreeLandingPage from "@/components/seo/FreeLandingPage";
import { SEED_CASE_STUDIES } from "@/content/free-landings/seed-questions";

const SLUG = "nclex-case-studies";
const SITE_URL = "https://claritynclex.com";

export const metadata: Metadata = {
  title: "Free NCLEX Case Studies | 5 Real NGN Unfolding Cases with Rationales",
  description:
    "5 free NCLEX-RN case studies covering cardiac, respiratory, endocrine, neuro, and maternity emergencies. Full rationales, no signup. NGN-style with multi-step decision making.",
  alternates: { canonical: `/free/${SLUG}` },
  keywords: [
    "free NCLEX case studies",
    "NCLEX NGN case studies",
    "free NGN case studies",
    "NCLEX-RN case study practice",
    "Next Generation NCLEX case studies",
    "free nursing case studies",
  ],
  openGraph: {
    title: "Free NCLEX Case Studies | 5 Real NGN Unfolding Cases",
    description: "5 free NCLEX-RN case studies with full rationales. No signup required.",
    url: `${SITE_URL}/free/${SLUG}`,
    type: "article",
  },
};

export default function Page() {
  return (
    <FreeLandingPage
      slug={SLUG}
      h1="Free NCLEX case studies with full rationales"
      metaTitle={metadata.title as string}
      metaDescription={metadata.description as string}
      intro={
        <p>
          The Next Generation NCLEX (NGN) replaced isolated clinical questions with{" "}
          <strong>unfolding case studies</strong> that test how nurses actually think. Each case
          gives you a real patient scenario, then walks you through the six steps of the NCSBN
          Clinical Judgment Measurement Model: recognize cues, analyze cues, prioritize hypotheses,
          generate solutions, take actions, and evaluate outcomes. The cases below are five of the
          5,000+ practice items in the Clarity bank — no signup required to try them.
        </p>
      }
      body={
        <>
          <h2>What is an NCLEX case study, exactly?</h2>
          <p>
            Starting April 2023, the NCLEX-RN became the Next Generation NCLEX, and case studies
            became the centerpiece of the exam. A case study is a single patient scenario followed
            by six sequential questions that escalate from recognition to action to evaluation.
            Unlike a standalone multiple-choice item, the answers you choose early in the case can
            shape the data you see later — exactly like clinical practice.
          </p>
          <p>
            The NCSBN built the format to address a documented gap: new graduate nurses score well
            on standalone questions but struggle with the layered judgment of real patient care.
            Case studies test that integration directly.
          </p>

          <h2>The six steps of the Clinical Judgment Measurement Model</h2>
          <ol>
            <li>
              <strong>Recognize cues.</strong> Pick out the data in the chart that matter. Not all
              findings are clinically significant — the case study tests your ability to filter.
            </li>
            <li>
              <strong>Analyze cues.</strong> Connect findings to pathophysiology. A potassium of
              3.0 plus furosemide plus muscle weakness paints a different picture than each finding
              alone.
            </li>
            <li>
              <strong>Prioritize hypotheses.</strong> Several diagnoses could fit. Rank them by
              likelihood and urgency, and decide which to investigate first.
            </li>
            <li>
              <strong>Generate solutions.</strong> Identify the nursing actions, provider orders,
              and patient teaching that address the top hypothesis.
            </li>
            <li>
              <strong>Take actions.</strong> Execute the most appropriate solution. Often this is a
              bow-tie question with one condition in the middle and actions plus monitoring on
              either side.
            </li>
            <li>
              <strong>Evaluate outcomes.</strong> Reassess. Did the intervention work? Is the
              patient improving, stable, or declining?
            </li>
          </ol>

          <h2>How to study NCLEX case studies effectively</h2>
          <p>
            The mistake most students make is treating case studies like long multiple-choice
            questions. They're not. Three habits separate students who pass on the first try:
          </p>
          <ul>
            <li>
              <strong>Read the scenario twice before the first question.</strong> The first read
              gives you the headline. The second read makes you notice the lab trends, the timeline,
              and the patient history that the test writers planted on purpose.
            </li>
            <li>
              <strong>Predict the next question.</strong> If the scenario shows a deteriorating
              postpartum client, predict whether the next question will ask about hemorrhage,
              eclampsia, or PE before the answer choices load. This trains your clinical reasoning,
              not just your test-taking.
            </li>
            <li>
              <strong>Write down the priority cue.</strong> One sentence: "The cue that changes the
              next safest action is ___." If you can name that cue, you'll answer correctly. If you
              can't, slow down and reread.
            </li>
          </ul>

          <h2>Topics covered in the 5 cases below</h2>
          <p>
            These five sample cases span the highest-yield categories the NCSBN test plan
            emphasizes: cardiac emergency, anaphylaxis, endocrine crisis, traumatic brain injury,
            and obstetric hemorrhage. Each is at the difficulty level you'll see on the live exam —
            not easier, not harder.
          </p>

          <h2>What the full Clarity bank includes</h2>
          <p>
            The full bank has 50+ real multi-step NGN case studies (six sub-items each, scored
            independently), 30+ bow-tie items, and thousands of standalone questions across every
            client need category. Premium also unlocks the AI tutor that walks you through the case
            in plain English when the printed rationale isn't enough — for less than the price of a
            single month of UWorld.
          </p>
        </>
      }
      questions={SEED_CASE_STUDIES}
      faqs={[
        {
          question: "Are these NCLEX case studies free?",
          answer:
            "Yes. All five case studies on this page are completely free with no signup required. The full Clarity bank includes 50+ multi-step NGN case studies; you can try 10 questions per day free or unlock the full bank from $9.99/mo.",
        },
        {
          question: "How are NCLEX case studies scored?",
          answer:
            "Each NGN case study has six sub-questions. Each sub-question is scored independently using polytomous scoring (partial credit). You don't have to answer them all correctly to do well — getting most of them right is enough to demonstrate clinical judgment.",
        },
        {
          question: "How many case studies are on the actual NCLEX-RN?",
          answer:
            "Test-takers receive 3 stand-alone case studies (each with 6 sub-questions, so 18 items) as part of their NCLEX-RN. Additional NGN item types — bow-tie, matrix, cloze, extended drag-and-drop — are mixed throughout the remaining items.",
        },
        {
          question: "How long is each case study on the NCLEX?",
          answer:
            "Each case study takes most students 5–8 minutes to read and answer all six sub-questions. The total NCLEX-RN window is 5 hours including breaks, and case studies are not separately timed.",
        },
        {
          question: "What's the difference between a case study and a bow-tie question?",
          answer:
            "A case study is a multi-question unfolding scenario with six sequential items. A bow-tie is a single question with a three-zone answer format (one condition in the center, two actions on the left, two parameters to monitor on the right). Bow-ties can appear inside case studies as the 'take actions' step.",
        },
        {
          question: "Are these case studies updated for the 2026 NCLEX test plan?",
          answer:
            "Yes. Clarity questions are aligned to the NCSBN 2026 NCLEX-RN Test Plan and reflect the post-April-2023 NGN format with the Clinical Judgment Measurement Model integrated.",
        },
      ]}
      relatedSlugs={[
        { slug: "nclex-ngn-questions", label: "Free NCLEX NGN questions (bow-tie, matrix, cloze)" },
        { slug: "nclex-sata-questions", label: "Free NCLEX SATA (select-all) questions" },
        { slug: "nclex-prioritization-questions", label: "Free NCLEX prioritization questions" },
        { slug: "nclex-pharmacology-questions", label: "Free NCLEX pharmacology questions" },
        { slug: "nclex-cardiac-questions", label: "Free NCLEX cardiac questions" },
        { slug: "nclex-practice-exam", label: "Free NCLEX practice exam" },
      ]}
      upgradePitch="These 5 are a tiny slice of the 50+ real multi-step NGN case studies in the Clarity bank. Premium ($9.99/mo) unlocks every case study, the AI tutor, and 5 timed readiness exams."
    />
  );
}
