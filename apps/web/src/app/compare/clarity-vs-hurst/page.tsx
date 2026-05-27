import type { Metadata } from "next";
import ComparisonPage from "@/components/seo/ComparisonPage";

const SITE_URL = "https://claritynclex.com";

export const metadata: Metadata = {
  title: "Clarity vs Hurst Review for NCLEX-RN | Content Mastery vs Adaptive Bank",
  description:
    "Clarity vs Hurst Review NCLEX-RN: Hurst's content mastery + Q-Reviews vs Clarity's adaptive 5,000-question bank with NGN cases and AI tutor. Honest comparison.",
  alternates: { canonical: "/compare/clarity-vs-hurst" },
  keywords: [
    "Hurst NCLEX review",
    "Hurst vs UWorld",
    "Hurst review alternatives",
    "Clarity vs Hurst",
    "Hurst review NCLEX-RN",
  ],
  openGraph: {
    title: "Clarity vs Hurst NCLEX Review",
    description: "Content mastery vs adaptive question bank — which is right for you?",
    url: `${SITE_URL}/compare/clarity-vs-hurst`,
    type: "article",
  },
};

export default function Page() {
  return (
    <ComparisonPage
      slug="clarity-vs-hurst"
      competitor="Hurst Review"
      metaTitle={metadata.title as string}
      metaDescription={metadata.description as string}
      intro={
        <p>
          Hurst Review built its reputation on the "Hurst Method" — content mastery through
          structured live and on-demand classes followed by Q-Reviews. Clarity is a digital
          adaptive question bank with AI tutor and real NGN case studies. They serve different
          stages of NCLEX prep.
        </p>
      }
      competitorOverview={
        <>
          <p>
            Hurst Review offers live, virtual, and on-demand NCLEX-RN content review courses
            with thousands of practice questions through their "Q-Review" series. Pricing is
            usually $200–$500+ depending on the package and whether you choose live instruction
            or self-paced.
          </p>
          <p>
            Hurst's strength is the structured content delivery: a defined curriculum, set
            schedule, and instructor-led Q&A. Their Q-Reviews are graded with predictive scoring,
            and they offer a pass guarantee with some packages.
          </p>
        </>
      }
      comparisonRows={[
        { feature: "Format", clarity: "Adaptive QBank + AI tutor", competitor: "Live/on-demand courses + Q-Reviews" },
        { feature: "Content review", clarity: "Embedded in rationales", competitor: "Structured curriculum (10–14 days)" },
        { feature: "Question count", clarity: "5,000+", competitor: "~2,000 (varies by package)" },
        { feature: "NGN coverage", clarity: "Multi-step case studies, bow-tie, matrix", competitor: "Coverage varies by package" },
        { feature: "AI tutor", clarity: "Yes (Claude Haiku)", competitor: "Human instructors via Q&A" },
        { feature: "Pricing", clarity: "$9.99/mo", competitor: "$200–$500+ one-time" },
        { feature: "Pass guarantee", clarity: "No formal guarantee", competitor: "Available on select packages" },
        { feature: "Time commitment", clarity: "Self-paced", competitor: "10–14 days structured" },
        { feature: "Best for", clarity: "Self-directed learners + cost-conscious", competitor: "Students who want a defined plan" },
      ]}
      body={
        <>
          <h2>When Hurst wins</h2>
          <p>
            Hurst's structured course works best for students who need accountability. If you
            shut down without external structure, the 10–14 day Hurst plan with live or recorded
            lectures gives you a path. The pass guarantee on some packages is real comfort if
            this is your second or third attempt.
          </p>
          <p>
            Hurst's content review is also more comprehensive than what comes embedded in
            Clarity rationales. If your content knowledge is shaky in multiple categories,
            Hurst's curriculum can fill those gaps in a way a question bank can't.
          </p>

          <h2>When Clarity wins</h2>
          <p>
            Pricing is the obvious gap: $9.99/mo vs $200–$500+. For most first-attempt students
            who already passed nursing school, the foundational content is in your head — what
            you need is practice volume, NGN exposure, and feedback when you miss. Clarity gives
            you all three for less than 5% of Hurst's cost.
          </p>
          <p>
            Clarity also adapts to you. Hurst's Q-Reviews are fixed sets at fixed difficulty.
            Clarity's question bank surfaces your weak areas and re-tests them via the SM-2
            review queue. That kind of personalization is hard to deliver in a 14-day live
            course.
          </p>

          <h2>The combo most students use</h2>
          <p>
            If this is your second NCLEX attempt and you have access to Hurst through your
            school's affiliation (or free trial), do the Hurst course for content review, then
            switch to Clarity for the 4 weeks of daily question practice before your test date.
          </p>
        </>
      }
      verdict={
        <p>
          Hurst is excellent if you need structured content review and external accountability,
          and you have $200–$500 to invest. Clarity is the better fit if you want
          self-paced adaptive practice with NGN coverage at a fraction of the cost. For
          first-time test-takers with solid content knowledge, Clarity at $9.99/mo is enough.
          For repeat candidates with content gaps, Hurst + Clarity is the combo.
        </p>
      }
    />
  );
}
