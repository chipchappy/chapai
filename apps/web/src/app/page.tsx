import type { Metadata } from "next";
import CtaButtons from "@/components/marketing/CtaButtons";
import HeroCTA from "@/components/marketing/HeroCTA";
import PricingCards from "@/components/marketing/PricingCards";
import TrustStrip from "@/components/marketing/TrustStrip";
import DailyQuestionSignup from "@/components/marketing/DailyQuestionSignup";
import HighlightsBand from "@/components/marketing/HighlightsBand";
import { getLiveBankStats } from "@/lib/live-bank-stats";

export const dynamic = "force-dynamic";

const SITE_URL = "https://claritynclex.com";

export const metadata: Metadata = {
  title: "Free NCLEX Practice Test & NGN Question Bank",
  description:
    "Stop overpaying for NCLEX prep. Premium NGN bank, AI tutor, and 5 readiness exams for $9.99/mo — under 10% of UWorld. Start free.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const stats = await getLiveBankStats();
  const homeSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#org`,
        name: "Clarity Clinical Prep",
        url: SITE_URL,
        logo: `${SITE_URL}/logo.png`,
        description: "Premium NCLEX-RN preparation with a free NCLEX practice test, realistic NGN questions, AI tutor rationales, and affordable flat pricing.",
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "Clarity Clinical Prep",
        publisher: { "@id": `${SITE_URL}/#org` },
      },
      {
        "@type": "SoftwareApplication",
        name: "Clarity NCLEX",
        applicationCategory: "EducationalApplication",
        operatingSystem: "Web",
        description: "Free NCLEX practice test and premium NGN question bank with AI tutor and 5 readiness exams.",
        offers: {
          "@type": "Offer",
          price: "9.99",
          priceCurrency: "USD",
        },
      },
      {
        "@type": "Quiz",
        name: "NCLEX-RN Practice Questions",
        about: {
          "@type": "Thing",
          name: "NCLEX-RN examination",
        },
        educationalLevel: "Professional certification",
        assesses: "Clinical judgment for entry-level registered nursing practice",
        provider: { "@id": `${SITE_URL}/#org` },
        hasPart: [
          { "@type": "Question", eduQuestionType: "Multiple choice", name: "Standard NCLEX-style multiple choice items" },
          { "@type": "Question", eduQuestionType: "Checkbox", name: "Select-all-that-apply (SATA) items" },
          { "@type": "Question", eduQuestionType: "Matching", name: "Next Generation NCLEX matrix, bow-tie, and case-study items" },
        ],
      },
    ],
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeSchema) }} />
      <HeroCTA />
      <TrustStrip questionCount={stats.nclexLive} examCount={5} ngnCount={stats.nclexNgnLive} />

      <HighlightsBand
        questionCount={stats.nclexLive}
        ngnRatio={stats.nclexNgnRatio}
        caseStudies={stats.nclexCaseStudyLive}
        readinessExams={5}
        drugCards={200}
      />

      <PricingCards />

      {/* Guarantee band — the Pass Pledge, visible right at the pricing decision. */}
      <section className="px-4 pb-12">
        <div className="mx-auto flex max-w-[880px] flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-[22px] border border-[rgba(111,141,118,0.3)] bg-[linear-gradient(180deg,rgba(240,246,241,0.9),rgba(255,252,247,0.95))] px-6 py-5 text-center">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(111,141,118,0.16)] text-[#55715e]" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </span>
          <p className="text-sm leading-6 text-dark">
            <strong className="font-semibold">Backed by the Clarity Pass Pledge</strong> — score On Track on all 5 readiness
            exams and don&rsquo;t pass? Your next 3 months are free.{" "}
            <a href="/pricing#pledge" className="underline decoration-dotted underline-offset-2 text-[#55715e] hover:text-dark">
              See the pledge
            </a>
          </p>
        </div>
      </section>

      <div className="px-4 pt-2 pb-14">
        <div className="mx-auto max-w-[1180px]">
          <DailyQuestionSignup
            source="home-front-page"
            exam="both"
            title="Free daily NCLEX question, straight to your inbox."
            body="One sharp, exam-style question every day with a clean rationale. No credit card, unsubscribe anytime — a calm way to keep your streak alive before you unlock the full bank."
          />
        </div>
      </div>

      {/* Closing CTA — same primary action at the end of the scroll (single,
          consistent conversion path; styling reuses existing tokens only). */}
      <section className="px-4 pb-20 pt-4">
        <div className="mx-auto max-w-[720px] text-center">
          <h2 className="font-serif text-[2.3rem] leading-[1.02] text-dark">Ready when you are.</h2>
          <p className="mt-3 text-base leading-7 text-muted">
            Free daily questions to start — the full NGN bank, AI tutor, and readiness exams when you&rsquo;re ready.
          </p>
          <div className="mt-6 flex justify-center">
            <CtaButtons surface="home-closing" />
          </div>
        </div>
      </section>
    </main>
  );
}
