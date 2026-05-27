import type { Metadata } from "next";
import FreeLandingPage from "@/components/seo/FreeLandingPage";
import { SEED_GENERAL, SEED_PRIORITIZATION } from "@/content/free-landings/seed-questions";

const SLUG = "nclex-practice-exam";
const SITE_URL = "https://claritynclex.com";

export const metadata: Metadata = {
  title: "Free NCLEX Practice Exam | 5 NCLEX-RN Questions to Self-Score",
  description:
    "Free NCLEX practice exam with real NCLEX-RN questions across every category. Full rationales, no signup. Use it as a readiness gauge before your test date.",
  alternates: { canonical: `/free/${SLUG}` },
  keywords: [
    "free NCLEX practice exam",
    "free NCLEX-RN practice exam",
    "NCLEX practice test",
    "free NCLEX practice test",
    "NCLEX-RN practice test free",
    "free nursing practice exam",
  ],
  openGraph: {
    title: "Free NCLEX Practice Exam | 5 NCLEX-RN Questions to Self-Score",
    description: "Free NCLEX practice exam with real NCLEX-RN questions. No signup.",
    url: `${SITE_URL}/free/${SLUG}`,
    type: "article",
  },
};

const EXAM_MIX = [
  SEED_PRIORITIZATION[0],
  SEED_GENERAL[0],
  SEED_PRIORITIZATION[1],
  SEED_GENERAL[2],
  SEED_PRIORITIZATION[3],
];

export default function Page() {
  return (
    <FreeLandingPage
      slug={SLUG}
      h1="Free NCLEX practice exam — self-score your readiness"
      metaTitle={metadata.title as string}
      metaDescription={metadata.description as string}
      intro={
        <p>
          Five NCLEX-RN questions in the categories that fail more students than any other:
          prioritization, delegation, pharmacology safety, and unstable-client recognition. Score
          yourself honestly — 5/5 means you're ready, 4/5 means you're close, 3/5 or below means
          you need targeted weak-area review. No signup required.
        </p>
      }
      body={
        <>
          <h2>What this free NCLEX practice exam measures</h2>
          <p>
            The actual NCLEX-RN is a computerized adaptive test (CAT) that adjusts difficulty in
            real time. Five questions can't simulate that adaptivity, but they can sample your
            performance on the topics that most heavily drive pass/fail outcomes: management of
            care, safety, pharmacology, and physiological adaptation. Those four categories alone
            make up over 50% of the live test.
          </p>

          <h2>How to interpret your score</h2>
          <ul>
            <li>
              <strong>5/5 correct.</strong> You're likely ready. Take a full 75-question readiness
              exam to confirm and book your test date.
            </li>
            <li>
              <strong>4/5 correct.</strong> You're close. Identify which one you missed and review
              that category in depth. One miss could be a knowledge gap or a stem-reading habit.
            </li>
            <li>
              <strong>3/5 correct.</strong> You have meaningful gaps. Build a 2–4 week focused
              study plan and prioritize the categories you missed.
            </li>
            <li>
              <strong>2/5 or below.</strong> Don't book your test yet. You need 4–8 weeks of
              structured practice (75–100 questions/day with rationale review) before you'll have
              the depth to pass.
            </li>
          </ul>

          <h2>What a real NCLEX-RN practice exam includes</h2>
          <p>
            A proper readiness exam mirrors the live test in three ways: it uses the full set of
            NGN item types (case study, bow-tie, matrix, cloze, hotspot, SATA), it spans all eight
            client need categories at the NCSBN-published percentages, and it has at least 75
            questions so the difficulty distribution evens out. Clarity premium includes five such
            timed readiness exams.
          </p>

          <h2>How the NCLEX-RN actually decides if you pass</h2>
          <p>
            The exam ranges from 75 to 145 questions. It ends in one of three ways:
          </p>
          <ol>
            <li>
              <strong>The 95% rule.</strong> The algorithm is 95% certain you're above or below
              the passing standard. Most students end here, between 75 and 145 items.
            </li>
            <li>
              <strong>Maximum length (145 items).</strong> If the algorithm is still uncertain at
              question 145, your performance on the final 60 items is averaged against the passing
              standard.
            </li>
            <li>
              <strong>Time runs out (5 hours including breaks).</strong> A "run-out-of-time" rule
              uses your last 60 questions to determine pass/fail.
            </li>
          </ol>

          <h2>The biggest mistake students make on practice exams</h2>
          <p>
            They take the test, see a score, and move on without reviewing rationales. The
            rationale is where the learning happens — not the question itself. A student who does
            50 questions with deep rationale review will outperform a student who does 200
            questions and only checks the score.
          </p>
          <p>
            For each question below, force yourself to write one sentence: "The cue I missed was
            ___." If you got it right, write: "The pattern I used was ___." Both habits build
            transferable judgment.
          </p>

          <h2>What's in the full Clarity readiness exam</h2>
          <p>
            Clarity premium ($9.99/mo NCLEX Monthly, $15.99/mo full Premium) includes five timed
            readiness exams, each modeled on the live NCLEX-RN format with NGN item types woven
            throughout. After every exam you get a category-by-category breakdown showing your
            strongest and weakest areas, plus an AI tutor that walks you through any item you
            missed in plain English.
          </p>
        </>
      }
      questions={EXAM_MIX}
      faqs={[
        {
          question: "Is this NCLEX practice exam free?",
          answer:
            "Yes. All five questions are free with no signup required. Clarity also gives you 10 free questions per day with a free account, and unlocks five full timed readiness exams with a $9.99/mo NCLEX Monthly subscription.",
        },
        {
          question: "How long is the actual NCLEX-RN?",
          answer:
            "The NCLEX-RN runs 75–145 questions over up to 5 hours including breaks. Most test-takers finish between 75 and 100 items as the adaptive algorithm reaches confidence.",
        },
        {
          question: "What's a good score on an NCLEX practice exam?",
          answer:
            "On a 75-item NCLEX practice exam, 65% or higher correlates with a high pass probability if your category coverage is balanced. Below 55% strongly suggests delaying your test date.",
        },
        {
          question: "How many practice questions should I do before the NCLEX?",
          answer:
            "Most successful test-takers complete 2,000–3,500 practice questions before sitting for the NCLEX-RN, with rationale review on every item. Less than 1,000 questions correlates with higher fail rates.",
        },
        {
          question: "Should I take a practice exam the day before my NCLEX?",
          answer:
            "No. Test fatigue is real and a poor score the day before tanks your confidence. The day before should be light review of high-yield notes and rest. Take your last full practice exam 3–5 days out.",
        },
      ]}
      relatedSlugs={[
        { slug: "nclex-practice-questions", label: "Free NCLEX practice questions" },
        { slug: "nclex-case-studies", label: "Free NCLEX case studies" },
        { slug: "nclex-ngn-questions", label: "Free NCLEX NGN questions" },
        { slug: "nclex-prioritization-questions", label: "Free NCLEX prioritization questions" },
        { slug: "nclex-pharmacology-questions", label: "Free NCLEX pharmacology questions" },
        { slug: "nclex-sata-questions", label: "Free NCLEX SATA questions" },
      ]}
    />
  );
}
