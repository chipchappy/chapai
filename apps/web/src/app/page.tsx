import type { Metadata } from "next";
import HeroCTA from "@/components/marketing/HeroCTA";
import PricingCards from "@/components/marketing/PricingCards";
import TrustStrip from "@/components/marketing/TrustStrip";
import DailyQuestionSignup from "@/components/marketing/DailyQuestionSignup";
import { CompetitiveStudySystem, FrontpageCompareDeck } from "@/components/marketing/frontpage";
import { getLiveBankStats } from "@/lib/live-bank-stats";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "NCLEX practice questions with NGN case studies",
  description:
    "Premium NCLEX-RN prep with NGN case studies, realistic test-mode questions, AI tutor support, and $9.99/mo flat pricing.",
  alternates: {
    canonical: "/",
  },
};

const toolCards = [
  ["NGN case studies", "Scenario, exhibits, vitals, labs, orders, partial-credit scoring, and rationales in one exam-like flow."],
  ["Practice how you test", "A sterile NCLEX runner with blue test chrome, timer, calculator, review marking, and two-pane rationales."],
  ["Weak-area review", "Track clinical categories and question types so the next session is based on the misses, not random busywork."],
  ["AI tutor", "Ask for a cleaner explanation after the rationale, with the clinical decision tree kept close to the question."],
  ["Readiness exams", "Timed exam sets for confidence checks before the real test window."],
  ["Daily free reps", "Ten free questions a day keep prospects learning before they decide to unlock the full bank."],
] as const;

export default async function HomePage() {
  const stats = await getLiveBankStats();
  const homeSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "Clarity Clinical Prep",
        url: "https://claritynclex.chapaisolutions.com",
        description: "Premium NCLEX preparation with realistic NGN questions and affordable flat pricing.",
      },
      {
        "@type": "SoftwareApplication",
        name: "Clarity NCLEX",
        applicationCategory: "EducationalApplication",
        offers: {
          "@type": "Offer",
          price: "9.99",
          priceCurrency: "USD",
        },
      },
    ],
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeSchema) }} />
      <HeroCTA />
      <TrustStrip />
      <CompetitiveStudySystem
        route="home"
        nclexCount={stats.nclexLive}
        ccrnCount={stats.ccrnLive}
        ngnRatio={stats.nclexNgnRatio}
      />

      <section className="bg-[var(--c-bg)] px-4 py-16">
        <div className="mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-[0.72fr_1.28fr]">
          <div>
            <span className="text-[0.78rem] font-bold uppercase tracking-[0.18em] text-[var(--c-gold)]">
              Product surface
            </span>
            <h2 className="mt-4 max-w-[32rem] text-[clamp(2.35rem,4vw,4.2rem)]">
              Premium outside. Sterile when it matters.
            </h2>
            <p className="mt-5 max-w-[34rem] text-base leading-8 text-[var(--c-text-muted)]">
              Students browse, subscribe, and review progress in the warmer Clarity interface. When they start a question,
              the product switches into a clean NCLEX-style testing environment with no marketing chrome.
            </p>
            <div className="mt-6 grid gap-3 text-sm text-[var(--c-text-muted)]">
              <span>{stats.nclexLive.toLocaleString()} live NCLEX items synced into the current bank.</span>
              <span>
                {stats.nclexNgnRatio > 0
                  ? `${stats.nclexNgnRatio}% NGN-style mix across case study, bow-tie, matrix, select-all, ordering, and chart review formats.`
                  : "NGN-style practice across case study, bow-tie, matrix, select-all, ordering, and chart review formats."}
              </span>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {toolCards.map(([title, body]) => (
              <article
                key={title}
                className="rounded-[8px] border border-[var(--c-border)] bg-[var(--c-bg-elevated)] p-5 shadow-[0_16px_38px_rgba(30,42,36,0.05)]"
              >
                <h3 className="text-[1.35rem]">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--c-text-muted)]">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <FrontpageCompareDeck route="home" />

      <div className="px-4 py-12">
        <DailyQuestionSignup
          source="home-front-page"
          exam="both"
          title="Free daily NCLEX question, straight to your inbox."
          body="One sharp, exam-style question every day with a clean rationale. No credit card, unsubscribe anytime — a calm way to keep your streak alive before you unlock the full bank."
        />
      </div>

      <PricingCards />
    </main>
  );
}
