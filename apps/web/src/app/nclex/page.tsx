import type { Metadata } from "next";
import DailyQuestionSignup from "@/components/marketing/DailyQuestionSignup";
import PremiumArtHero from "@/components/marketing/PremiumArtHero";
import { marketingArtwork } from "@/components/marketing/marketingArtwork";
import { getLiveContentSummary } from "@/lib/live-content-summary";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "NCLEX practice questions with AI review",
  description:
    "Premium NCLEX practice questions focused on prioritization, safety, pharmacology, and AI-guided review in a cleaner study tool.",
  alternates: {
    canonical: "/nclex",
  },
};

export default function NclexPage() {
  const summary = getLiveContentSummary();

  return (
    <main className="space-y-12 px-4 py-8 md:py-10">
      <PremiumArtHero
        backgroundColor="#F5F1E8"
        title="NCLEX, sharpened for safer next-step thinking."
        body="Original questions, AI-guided rationale, and a direct learning path built for working ICU nurses and students."
        ctaHref="/upgrade#nclex"
        ctaLabel="Learn More"
        artwork={marketingArtwork.nclex}
      />

      <section className="page-shell pt-0">
        <div className="grid gap-5 rounded-[28px] border border-[rgba(74,85,89,0.08)] bg-[rgba(255,252,247,0.92)] p-6 shadow-card lg:grid-cols-3">
          <article>
            <span className="section-label">Current build</span>
            <h2 className="mt-3 font-serif text-[2rem] leading-none text-[#1E2328]">{summary.nclex.live} live NCLEX questions</h2>
            <p className="mt-4 font-sans text-base leading-7 text-[#5E6367]">Built around prioritization, delegation, medication safety, and next-step thinking.</p>
          </article>
          <article>
            <span className="section-label">Review style</span>
            <h2 className="mt-3 font-serif text-[2rem] leading-none text-[#1E2328]">Priority + safety first</h2>
            <p className="mt-4 font-sans text-base leading-7 text-[#5E6367]">Rationales are meant to coach the safe move, the wrong-turn pattern, and the next study rep.</p>
          </article>
          <article>
            <span className="section-label">Package path</span>
            <h2 className="mt-3 font-serif text-[2rem] leading-none text-[#1E2328]">Sprint / Plus / Pro</h2>
            <p className="mt-4 font-sans text-base leading-7 text-[#5E6367]">A cheaper, cleaner path into the exam without generic qbank clutter.</p>
          </article>
        </div>
      </section>

      <div className="page-shell pt-0">
        <DailyQuestionSignup
          exam="nclex"
          source="nclex-daily-question"
          title="Get one NCLEX question each day."
          body="A lighter daily touchpoint for NCLEX buyers who want daily priority and safety reps before the full package."
        />
      </div>
    </main>
  );
}
