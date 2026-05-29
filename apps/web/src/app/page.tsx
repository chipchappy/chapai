import type { Metadata } from "next";
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
        caseStudies={50}
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
    </main>
  );
}
