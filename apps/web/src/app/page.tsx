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

      <div className="px-4 pt-8 pb-14">
        <div className="mx-auto max-w-[1180px]">
          <DailyQuestionSignup
            source="home-front-page"
            exam="both"
            title="Free daily NCLEX question, straight to your inbox."
            body="One sharp, exam-style question every day with a clean rationale. No credit card, unsubscribe anytime — a calm way to keep your streak alive before you unlock the full bank."
          />
        </div>
      </div>

      <PricingCards />

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
