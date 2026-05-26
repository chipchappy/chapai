import type { Metadata } from "next";
import ComparisonPage from "@/components/seo/ComparisonPage";

const SITE_URL = "https://claritynclex.com";

export const metadata: Metadata = {
  title: "Clarity vs NCLEX Bootcamp 2026 | Question Bank Comparison + Pricing",
  description:
    "Clarity vs NCLEX Bootcamp side-by-side: question count, NGN case studies, AI tutor, pricing. The honest comparison for nursing students choosing prep in 2026.",
  alternates: { canonical: "/compare/clarity-vs-bootcamp" },
  keywords: [
    "NCLEX Bootcamp vs UWorld",
    "Bootcamp NCLEX review",
    "Clarity vs Bootcamp",
    "NCLEX Bootcamp alternatives",
    "best affordable NCLEX prep",
  ],
  openGraph: {
    title: "Clarity vs NCLEX Bootcamp 2026",
    description: "Honest side-by-side comparison of question count, NGN coverage, and pricing.",
    url: `${SITE_URL}/compare/clarity-vs-bootcamp`,
    type: "article",
  },
};

export default function Page() {
  return (
    <ComparisonPage
      slug="clarity-vs-bootcamp"
      competitor="NCLEX Bootcamp"
      metaTitle={metadata.title as string}
      metaDescription={metadata.description as string}
      intro={
        <p>
          NCLEX Bootcamp is one of the most popular newer NCLEX prep platforms, known for video
          lectures, an active community, and an adaptive question bank. Clarity is a leaner
          competitor focused on premium NGN content and AI tutoring at a lower price.
          Here's the honest comparison.
        </p>
      }
      competitorOverview={
        <>
          <p>
            NCLEX Bootcamp (bootcamp.com) offers a comprehensive package: 3,000+ NCLEX-RN
            practice questions, video lessons, a study planner, and a community forum. Pricing
            sits at roughly $169 for 6 months ($28/month equivalent) — substantially cheaper
            than UWorld but more expensive than Clarity.
          </p>
          <p>
            Bootcamp's strength is breadth: it bundles video content review, question practice,
            community support, and study planning. The brand has built strong word of mouth
            among nursing students on TikTok and Instagram.
          </p>
        </>
      }
      comparisonRows={[
        { feature: "Question count", clarity: "5,000+ NCLEX items", competitor: "~3,000 NCLEX items" },
        { feature: "Real multi-step NGN cases", clarity: "50+ CJMM-mapped cases", competitor: "Limited; varies by update" },
        { feature: "True bow-tie items", clarity: "30+ with 3-zone scoring", competitor: "Partial coverage" },
        { feature: "Video lectures", clarity: "Not included", competitor: "Yes (curriculum format)" },
        { feature: "AI tutor", clarity: "Yes (Claude Haiku)", competitor: "No" },
        { feature: "Pricing", clarity: "$9.99/mo NCLEX Monthly", competitor: "$169 for 6 months (~$28/mo)" },
        { feature: "CCRN content", clarity: "Yes (Premium $15.99/mo)", competitor: "No" },
        { feature: "Community forum", clarity: "Not included", competitor: "Yes" },
        { feature: "Mobile experience", clarity: "Browser-first, responsive", competitor: "Native app + web" },
        { feature: "Best for", clarity: "Cost-conscious, NGN-focused, self-paced", competitor: "Students who want video + community" },
      ]}
      body={
        <>
          <h2>When NCLEX Bootcamp wins</h2>
          <p>
            Bootcamp's video lectures and community forum are real value for students who learn
            visually or who study better with peer accountability. The platform feels modern,
            the marketing is strong, and the all-in-one bundling is convenient.
          </p>

          <h2>When Clarity wins</h2>
          <p>
            Three reasons:
          </p>
          <ul>
            <li>
              <strong>Price.</strong> $9.99/mo vs $28/mo equivalent. If you're studying 8 weeks,
              that's $20 vs $112.
            </li>
            <li>
              <strong>AI tutor.</strong> Clarity's tutor walks you through any missed question
              in plain English using Claude Haiku 4.5. Bootcamp doesn't offer AI tutoring.
            </li>
            <li>
              <strong>NGN depth.</strong> Clarity's question bank is built NGN-first with real
              multi-step case studies and 3-zone bow-tie scoring. Bootcamp has NGN coverage but
              less of it.
            </li>
          </ul>

          <h2>The honest weakness</h2>
          <p>
            Clarity doesn't include video lectures. If video is how you learn best, Bootcamp's
            curriculum-style delivery may justify the premium. You can also pair Clarity with
            free YouTube (Sarah Michelle, RegisteredNurseRN, Simple Nursing) to get video
            content without the markup.
          </p>
        </>
      }
      verdict={
        <p>
          NCLEX Bootcamp is a solid all-in-one platform with a strong community. Clarity costs
          a third as much, has 2,000+ more questions, includes an AI tutor, and goes deeper on
          NGN. If video lectures and community are deal-breakers for you, pick Bootcamp. If
          you're price-sensitive or you learn better from practice + rationale than from video,
          pick Clarity. Either way, get NGN reps somewhere.
        </p>
      }
    />
  );
}
