import type { Metadata } from "next";
import HeroCTA from "@/components/marketing/HeroCTA";
import PricingCards from "@/components/marketing/PricingCards";
import TrustStrip from "@/components/marketing/TrustStrip";
import DailyQuestionSignup from "@/components/marketing/DailyQuestionSignup";
import HighlightsBand from "@/components/marketing/HighlightsBand";
import { getLiveBankStats } from "@/lib/live-bank-stats";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "NCLEX practice questions with AI review",
  description:
    "Premium NCLEX-RN practice with NGN case studies, AI tutor, and 5 readiness exams. From $9.99/mo — under 10% of UWorld. Start free.",
  alternates: {
    canonical: "/nclex",
  },
};

export default async function NclexPage() {
  const stats = await getLiveBankStats();

  return (
    <main>
      <HeroCTA heroArt="nclex" />
      <TrustStrip questionCount={stats.nclexLive} examCount={5} />

      <HighlightsBand
        questionCount={stats.nclexLive}
        ngnRatio={stats.nclexNgnRatio}
        caseStudies={50}
        readinessExams={5}
        drugCards={200}
      />

      <div className="px-4 pt-8 pb-14">
        <div className="mx-auto max-w-[1180px]">
          <DailyQuestionSignup
            source="nclex-landing"
            exam="nclex"
            title="Free daily NCLEX question, straight to your inbox."
            body="One sharp, exam-style NCLEX question every day with a clean rationale. No credit card, unsubscribe anytime — keep your streak alive before you unlock the full bank."
          />
        </div>
      </div>

      <PricingCards />
    </main>
  );
}
