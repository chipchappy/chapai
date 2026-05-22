import type { Metadata } from "next";
import HeroCTA from "@/components/marketing/HeroCTA";
import PricingCards from "@/components/marketing/PricingCards";
import TrustStrip from "@/components/marketing/TrustStrip";
import DailyQuestionSignup from "@/components/marketing/DailyQuestionSignup";
import { getLiveBankStats } from "@/lib/live-bank-stats";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "NCLEX practice questions with AI review",
  description:
    "Premium NCLEX practice questions focused on NGN case studies, prioritization, safety, pharmacology, and realistic test-mode review.",
  alternates: {
    canonical: "/nclex",
  },
};

export default async function NclexPage() {
  const stats = await getLiveBankStats();

  return (
    <main>
      <HeroCTA heroArt="nclex" />
      <TrustStrip />
      <section className="bg-[var(--c-bg)] px-4 py-16">
        <div className="mx-auto max-w-[1180px]">
          <span className="text-[0.78rem] font-bold uppercase tracking-[0.18em] text-[var(--c-gold)]">
            NGN structure
          </span>
          <h2 className="mt-4 max-w-[46rem] text-[clamp(2.35rem,4vw,4.2rem)]">
            Case studies are not bonus content. They are the exam.
          </h2>
          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {[
              [`${stats.nclexLive.toLocaleString()} live items`, "The current bank is wired into practice and review surfaces."],
              [`${stats.nclexNgnRatio}% NGN mix`, "Case, matrix, bow-tie, ordering, and chart-style formats stay visible."],
              ["3-5 case studies", "The sample runner treats unfolding cases as a core exam flow, not a worksheet."],
            ].map(([title, body]) => (
              <article
                key={title}
                className="rounded-[8px] border border-[var(--c-border)] bg-[var(--c-bg-elevated)] p-5"
              >
                <h3 className="text-[1.45rem]">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--c-text-muted)]">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <div className="px-4 py-12">
        <DailyQuestionSignup
          source="nclex-landing"
          exam="nclex"
          title="Free daily NCLEX question, straight to your inbox."
          body="One sharp, exam-style NCLEX question every day with a clean rationale. No credit card, unsubscribe anytime — keep your streak alive before you unlock the full bank."
        />
      </div>

      <PricingCards />
    </main>
  );
}
