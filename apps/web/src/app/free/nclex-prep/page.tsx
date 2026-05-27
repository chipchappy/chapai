import type { Metadata } from "next";
import FreeLandingPage from "@/components/seo/FreeLandingPage";
import { SEED_GENERAL } from "@/content/free-landings/seed-questions";

const SLUG = "nclex-prep";
const SITE_URL = "https://claritynclex.com";

export const metadata: Metadata = {
  title: "Free NCLEX Prep | Study Plan, Practice Questions, and AI Tutor",
  description:
    "Free NCLEX-RN prep with a structured study plan, real practice questions, and an AI tutor preview. Pass faster without paying $109/mo for UWorld.",
  alternates: { canonical: `/free/${SLUG}` },
  keywords: [
    "free NCLEX prep",
    "free NCLEX-RN prep",
    "NCLEX prep free",
    "free NCLEX study guide",
    "NCLEX-RN study plan",
    "free NCLEX preparation",
  ],
  openGraph: {
    title: "Free NCLEX Prep | Study Plan, Practice Questions, and AI Tutor",
    description: "Free NCLEX prep with study plan, practice questions, and AI tutor.",
    url: `${SITE_URL}/free/${SLUG}`,
    type: "article",
  },
};

export default function Page() {
  return (
    <FreeLandingPage
      slug={SLUG}
      h1="Free NCLEX prep — study plan, practice questions, and AI tutor"
      metaTitle={metadata.title as string}
      metaDescription={metadata.description as string}
      intro={
        <p>
          Everything you need to start NCLEX-RN prep without paying anything: a research-based
          study plan, five free practice questions, and access to 10 free questions per day with a
          free account. When you're ready for the full 5,000+ question bank and AI tutor, premium
          starts at $9.99/mo.
        </p>
      }
      body={
        <>
          <h2>How long does NCLEX prep actually take?</h2>
          <p>
            Most students who pass on the first attempt put in 4–8 weeks of focused prep at 3–5
            hours per day. That's roughly 100–250 total hours of practice plus rationale review.
            Less than 2 weeks of prep correlates with higher fail rates. More than 12 weeks
            usually means burnout, not better readiness.
          </p>

          <h2>The Clarity 6-week NCLEX prep plan (free)</h2>
          <h3>Week 1: Diagnostic and foundation</h3>
          <p>
            Take a baseline 75-question practice exam without studying. The score tells you which
            of the eight client need categories are weakest. Spend the rest of the week reviewing
            high-yield notes on your two weakest areas.
          </p>

          <h3>Week 2: Pharmacology and safety</h3>
          <p>
            Pharmacology and safety together account for ~25% of the NCLEX-RN. Do 75 questions/day
            across these categories. Build a one-page "drug danger" sheet of the 50 highest-yield
            drugs with their black-box warnings, priority labs, and antidotes.
          </p>

          <h3>Week 3: Med-surg deep dive</h3>
          <p>
            Physiological adaptation is the largest single category. Focus on cardiac,
            respiratory, endocrine, and renal — they generate the most NCLEX items. Build pattern
            sheets for shock, electrolyte imbalances, and acid-base.
          </p>

          <h3>Week 4: Maternity, peds, and mental health</h3>
          <p>
            Smaller categories on the test but high-yield because students often underprep them.
            Focus on prenatal red flags, pediatric vital sign ranges, and crisis communication.
          </p>

          <h3>Week 5: NGN deep practice</h3>
          <p>
            Spend the week on case studies, bow-tie, matrix, and SATA questions. Time yourself
            loosely — case studies should take 5–8 minutes, SATA 60–90 seconds.
          </p>

          <h3>Week 6: Readiness exams and rest</h3>
          <p>
            Take two timed 75-question readiness exams early in the week. Review every miss in
            depth. The last two days before your test should be light review of high-yield notes
            and rest. Do NOT take a full practice exam the day before.
          </p>

          <h2>Free vs paid NCLEX prep — what's the real difference?</h2>
          <p>
            Free resources are great for content review and small question sets. They fall short
            on three things:
          </p>
          <ul>
            <li>
              <strong>Question volume.</strong> Most successful test-takers do 2,000–3,500
              questions. Free banks rarely have more than a few hundred unique items.
            </li>
            <li>
              <strong>Adaptive difficulty.</strong> Real NCLEX prep should escalate difficulty as
              you improve. Free question sets are usually fixed difficulty.
            </li>
            <li>
              <strong>Rationale depth.</strong> A one-sentence "because that's the answer" doesn't
              build judgment. Premium banks (UWorld, Kaplan, Clarity) write multi-paragraph
              rationales with citations.
            </li>
          </ul>
          <p>
            UWorld solves all three but costs $109/month. Clarity solves all three for $9.99/mo —
            same NGN item types, same rationale depth, plus an AI tutor for follow-up questions on
            anything that's still confusing.
          </p>

          <h2>Try 5 questions now</h2>
          <p>
            Below are five sample questions across the categories that drive the most NCLEX
            failures. Score yourself honestly to gauge where you are.
          </p>
        </>
      }
      questions={SEED_GENERAL}
      faqs={[
        {
          question: "What's the best free NCLEX prep resource?",
          answer:
            "NCSBN's free NCLEX Tutorial is the authoritative source for understanding the test format. For practice questions, free banks like Clarity's daily 10 questions, RegisteredNursing.org practice sets, and Khan Academy NCLEX videos are solid starting points.",
        },
        {
          question: "Can you pass the NCLEX with only free resources?",
          answer:
            "It's possible but harder. Most graduates who pass on the first try use at least one paid bank with 2,000+ questions and rationales. Free resources are best as supplements rather than your only prep.",
        },
        {
          question: "How many hours should I study for the NCLEX-RN?",
          answer:
            "Most successful candidates put in 100–250 hours of focused prep over 4–8 weeks. Quality matters more than total hours — 3 deep hours beats 6 distracted ones.",
        },
        {
          question: "Should I retake nursing school content or focus on NCLEX questions?",
          answer:
            "Focus on NCLEX-style questions with rationale review. Rereading textbooks is the lowest-yield NCLEX prep activity. Practice questions force you to apply knowledge, which is exactly what the test measures.",
        },
        {
          question: "When should I start NCLEX prep?",
          answer:
            "Start light review (5–10 questions/day) during your final semester of nursing school. Begin focused, full-time prep the week after graduation. Test 4–8 weeks after graduation when content is freshest.",
        },
      ]}
      relatedSlugs={[
        { slug: "nclex-practice-exam", label: "Free NCLEX practice exam" },
        { slug: "nclex-practice-questions", label: "Free NCLEX practice questions" },
        { slug: "nclex-case-studies", label: "Free NCLEX case studies" },
        { slug: "nclex-ngn-questions", label: "Free NCLEX NGN questions" },
        { slug: "nclex-prioritization-questions", label: "Free NCLEX prioritization questions" },
        { slug: "nclex-pharmacology-questions", label: "Free NCLEX pharmacology questions" },
      ]}
    />
  );
}
