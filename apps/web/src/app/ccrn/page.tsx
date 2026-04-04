import type { Metadata } from "next";
import DailyQuestionSignup from "@/components/marketing/DailyQuestionSignup";
import PremiumArtHero from "@/components/marketing/PremiumArtHero";
import { marketingArtwork } from "@/components/marketing/marketingArtwork";
import { getLiveContentSummary } from "@/lib/live-content-summary";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "CCRN practice questions for ICU nurses",
  description:
    "Premium CCRN practice questions, original critical-care scenarios, AI rationale, and a calmer study tool for ICU nurses.",
  alternates: {
    canonical: "/ccrn",
  },
};

export default function CcrnPage() {
  const summary = getLiveContentSummary();

  return (
    <main className="space-y-12 px-4 py-8 md:py-10">
      <PremiumArtHero
        backgroundColor="#E5E9E3"
        title="Critical care, held to a higher standard."
        body="Original questions, AI-guided rationale, and a direct learning path built for working ICU nurses and students."
        ctaHref="/upgrade#ccrn"
        ctaLabel="Learn More"
        artwork={marketingArtwork.ccrn}
      />

      <section className="page-shell pt-0">
        <div className="grid gap-5 rounded-[28px] border border-[rgba(74,85,89,0.08)] bg-[rgba(250,252,248,0.92)] p-6 shadow-card lg:grid-cols-3">
          <article>
            <span className="section-label">Current build</span>
            <h2 className="mt-3 font-serif text-[2rem] leading-none text-[#1E2328]">{summary.ccrn.live} live CCRN questions</h2>
            <p className="mt-4 font-sans text-base leading-7 text-[#5E6367]">Built around hemodynamics, shock, rhythm change, respiratory failure, neuro change, and endocrine rescue.</p>
          </article>
          <article>
            <span className="section-label">Review style</span>
            <h2 className="mt-3 font-serif text-[2rem] leading-none text-[#1E2328]">Trend-first bedside reasoning</h2>
            <p className="mt-4 font-sans text-base leading-7 text-[#5E6367]">Every rationale should coach the bedside pattern, not just reveal a key.</p>
          </article>
          <article>
            <span className="section-label">Package path</span>
            <h2 className="mt-3 font-serif text-[2rem] leading-none text-[#1E2328]">Sprint / Plus / Pro</h2>
            <p className="mt-4 font-sans text-base leading-7 text-[#5E6367]">Start light, then move into the full critical-care flow when you need more reps.</p>
          </article>
        </div>
      </section>

      <div className="page-shell pt-0">
        <DailyQuestionSignup
          exam="ccrn"
          source="ccrn-daily-question"
          title="Get one CCRN question each day."
          body="A lighter daily touchpoint for CCRN buyers who want steady bedside reps before they commit to the full package."
        />
      </div>
    </main>
  );
}
