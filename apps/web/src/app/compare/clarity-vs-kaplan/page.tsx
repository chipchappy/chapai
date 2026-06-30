import type { Metadata } from "next";
import ComparisonPage from "@/components/seo/ComparisonPage";

const SITE_URL = "https://claritynclex.com";

export const metadata: Metadata = {
  title: "Clarity vs Kaplan for NCLEX-RN | $9.99/mo Adaptive Bank vs $499 Course",
  description:
    "Clarity vs Kaplan NCLEX review: a $9.99/mo adaptive 5,000-question NGN bank with AI tutor vs Kaplan's Decision Tree course and Qbank. Pricing, features, and who each is for.",
  alternates: { canonical: "/compare/clarity-vs-kaplan" },
  keywords: [
    "Clarity vs Kaplan",
    "Kaplan NCLEX review",
    "Kaplan NCLEX alternatives",
    "Kaplan Decision Tree",
    "cheaper than Kaplan NCLEX",
    "best NCLEX question bank",
  ],
  openGraph: {
    title: "Clarity vs Kaplan NCLEX Review",
    description: "A $9.99/mo adaptive NGN bank vs Kaplan's Decision Tree course. Which is better for NCLEX prep?",
    url: `${SITE_URL}/compare/clarity-vs-kaplan`,
    type: "article",
  },
};

export default function Page() {
  return (
    <ComparisonPage
      slug="clarity-vs-kaplan"
      competitor="Kaplan"
      metaTitle={metadata.title as string}
      metaDescription={metadata.description as string}
      intro={
        <p>
          Kaplan is one of the oldest and best-known names in NCLEX prep — its courses pair a
          Qbank with the trademarked &ldquo;Decision Tree&rdquo; strategy for working through hard
          questions. The trade-off is price: a full Kaplan course runs several hundred dollars.
          Clarity delivers a 5,000+ question adaptive NGN bank, AI tutor, and 5 timed readiness
          exams for $9.99/month — under 5% of a Kaplan course, with more practice volume.
        </p>
      }
      competitorOverview={
        <>
          <p>
            Kaplan&rsquo;s NCLEX-RN offering centers on its Qbank, a set of Question Trainer timed
            tests, content-review videos, and the Decision Tree method for prioritization and
            elimination. Live and on-demand class formats add instructor sessions and a readiness
            assessment that predicts pass likelihood.
          </p>
          <p>
            It&rsquo;s a polished, structured program with strong brand recognition among nursing
            schools. The cost reflects that: self-paced packages typically run ~$299–$499 and live
            options higher, usually as a one-time purchase rather than a low monthly subscription.
          </p>
        </>
      }
      comparisonRows={[
        { feature: "Format", clarity: "Adaptive question bank + AI tutor", competitor: "Course + Qbank + Decision Tree" },
        { feature: "Question count", clarity: "5,000+ NCLEX items", competitor: "~2,000–3,500 Qbank items" },
        { feature: "NGN item types", clarity: "Case studies, bow-tie, matrix, SATA, cloze", competitor: "NGN Qbank items included" },
        { feature: "Pricing", clarity: "$9.99/mo NCLEX Monthly", competitor: "~$299–$499+ one-time" },
        { feature: "AI tutor", clarity: "Yes (Claude Haiku) on every item", competitor: "No — instructor/video review" },
        { feature: "Readiness exams", clarity: "5 timed CAT-style exams", competitor: "Question Trainer + readiness predictor" },
        { feature: "Adaptive weak-area focus", clarity: "Endless adaptive mode targets your weak areas", competitor: "Static Qbank + manual review" },
        { feature: "Signature method", clarity: "Rationale-first, adaptive reps", competitor: "Decision Tree strategy" },
        { feature: "Best for", clarity: "High-volume adaptive practice on a budget", competitor: "Structured course + brand-name predictor" },
      ]}
      body={
        <>
          <h2>When Kaplan wins</h2>
          <p>
            If you want a fully structured, instructor-led program with a recognized readiness
            predictor — and budget isn&rsquo;t the constraint — Kaplan delivers it. The Decision
            Tree is a genuinely useful framework for breaking down prioritization and
            &ldquo;select the best action&rdquo; questions, and the live classes add accountability
            that a self-serve app can&rsquo;t replicate. Some students simply learn better with a
            scheduled course and a coach.
          </p>

          <h2>When Clarity wins</h2>
          <p>
            Practice volume is the single strongest predictor of first-attempt NCLEX-RN pass
            rates, and Clarity is built around it: 5,000+ questions, real NGN case studies,
            partial-credit SATA scoring, and an <strong>endless adaptive mode</strong> that keeps
            serving questions weighted toward your weakest categories — the same idea as the real
            CAT exam. An AI tutor explains every miss in plain English, instantly, on every
            question. You get all of it for $9.99/month instead of a few hundred dollars up front.
          </p>
          <p>
            For most students the math is decisive: a full Kaplan course can cost more than two
            <em> years</em> of Clarity. If your gap is reps and NGN exposure rather than a
            structured classroom, the cheaper, higher-volume tool is the better buy.
          </p>

          <h2>The combo some students use</h2>
          <p>
            A common approach: borrow Kaplan&rsquo;s Decision Tree thinking for tough
            prioritization items, then get your daily question volume and NGN practice through
            Clarity. You keep the strategy framework without paying for a full second qbank.
          </p>
        </>
      }
      verdict={
        <p>
          Kaplan is a premium, structured, brand-name course with a strong strategy method and a
          trusted readiness predictor — at a premium price. Clarity is a $9.99/month adaptive NGN
          bank with an AI tutor and far more practice volume. If you want a guided classroom and
          can pay for it, Kaplan fits. If you want maximum adaptive reps and NGN exposure for a
          fraction of the cost, Clarity is the smarter spend.
        </p>
      }
    />
  );
}
