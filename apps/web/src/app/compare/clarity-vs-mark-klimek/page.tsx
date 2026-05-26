import type { Metadata } from "next";
import ComparisonPage from "@/components/seo/ComparisonPage";

const SITE_URL = "https://claritynclex.com";

export const metadata: Metadata = {
  title: "Clarity vs Mark Klimek for NCLEX-RN | Lectures vs Adaptive Question Bank",
  description:
    "Clarity vs Mark Klimek NCLEX review: 12-lecture audio prep vs adaptive 5,000-question NGN bank with AI tutor. Pricing, features, and who each is for.",
  alternates: { canonical: "/compare/clarity-vs-mark-klimek" },
  keywords: [
    "Mark Klimek vs UWorld",
    "Mark Klimek NCLEX review",
    "Mark Klimek alternatives",
    "Clarity vs Mark Klimek",
    "best NCLEX prep audio",
  ],
  openGraph: {
    title: "Clarity vs Mark Klimek NCLEX Review",
    description: "Audio lectures vs adaptive NGN bank. Which is better for NCLEX prep?",
    url: `${SITE_URL}/compare/clarity-vs-mark-klimek`,
    type: "article",
  },
};

export default function Page() {
  return (
    <ComparisonPage
      slug="clarity-vs-mark-klimek"
      competitor="Mark Klimek"
      metaTitle={metadata.title as string}
      metaDescription={metadata.description as string}
      intro={
        <p>
          Mark Klimek is famous in nursing student circles for his 12-lecture NCLEX review series
          — many graduates listen to them in the final week before the test. Clarity is a 5,000+
          question adaptive bank with NGN case studies, AI tutor, and timed readiness exams. They
          solve different parts of the prep problem and many students use both.
        </p>
      }
      competitorOverview={
        <>
          <p>
            Mark Klimek is a long-time nursing educator who recorded 12 audio lectures covering
            high-yield NCLEX content. The lectures focus on mnemonics, fast pattern recognition,
            and "Klimek rules" for prioritization, lab values, acid-base, and drug safety.
          </p>
          <p>
            The lectures are sold through ReMar Nurse Live and other distributors, typically as
            a one-time purchase. There is no question bank, no adaptive practice, no NGN item
            types — it's pure audio content review.
          </p>
        </>
      }
      comparisonRows={[
        { feature: "Format", clarity: "Adaptive question bank + AI tutor", competitor: "Audio lectures (12 sessions)" },
        { feature: "Question count", clarity: "5,000+ NCLEX items", competitor: "No questions included" },
        { feature: "NGN item types", clarity: "Case studies, bow-tie, matrix, SATA, cloze", competitor: "Discussed, not practiced" },
        { feature: "Pricing", clarity: "$9.99/mo NCLEX Monthly", competitor: "~$60–$120 one-time bundle" },
        { feature: "AI tutor", clarity: "Yes (Claude Haiku)", competitor: "No" },
        { feature: "Readiness exams", clarity: "5 timed exams", competitor: "Not included" },
        { feature: "Mnemonics + memory aids", clarity: "Embedded in rationales", competitor: "Core strength" },
        { feature: "Best for", clarity: "Active practice + weak-area drilling", competitor: "Passive review in the final week" },
      ]}
      body={
        <>
          <h2>When Mark Klimek wins</h2>
          <p>
            Klimek's lectures are unbeatable for the last 7–10 days before the test. They
            consolidate content into memorable rules ("when in doubt, pick the silly one for
            psych questions") that stick in the moment of testing. If you learn auditorily, like
            while commuting or doing chores, the lectures deliver more per minute than reading a
            textbook chapter.
          </p>

          <h2>When Clarity wins</h2>
          <p>
            Practice volume is the single strongest predictor of first-attempt NCLEX-RN pass
            rates. Klimek alone doesn't give you reps. Clarity gives you 5,000+ NCLEX questions,
            real NGN case studies, partial-credit SATA scoring, an AI tutor that walks you
            through misses in plain English, and timed readiness exams that simulate the actual
            adaptive test.
          </p>
          <p>
            Klimek's lectures predate the 2023 NGN format. The mnemonics still work; the format
            doesn't. You need NGN practice somewhere, and Clarity is the cheapest option that
            delivers it ($9.99/mo vs UWorld's $109).
          </p>

          <h2>The combo most students use</h2>
          <p>
            Listen to Mark Klimek's lectures during your final week as a high-yield content
            review. Use Clarity (or UWorld/Kaplan) for daily question practice during the 6–8
            weeks of focused prep before that. The two are complements, not substitutes.
          </p>
        </>
      }
      verdict={
        <p>
          Mark Klimek and Clarity solve different problems. Klimek = passive content review and
          mnemonics. Clarity = active practice, NGN exposure, and adaptive readiness. The
          highest-passing students use both. If you can only pick one, pick the one that fixes
          your bigger gap: knowledge (Klimek) or test-taking practice (Clarity).
        </p>
      }
    />
  );
}
