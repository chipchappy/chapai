import type { Metadata } from "next";
import DailyQuestionSignup from "@/components/marketing/DailyQuestionSignup";
import PremiumArtHero from "@/components/marketing/PremiumArtHero";
import { marketingArtwork } from "@/components/marketing/marketingArtwork";
import { getLiveContentSummary } from "@/lib/live-content-summary";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "CCRN and NCLEX practice questions with AI tutor",
  description:
    "Study for CCRN and NCLEX with premium practice questions, AI-guided rationale, and focused package paths built for ICU nurses and nursing students.",
  keywords: [
    "CCRN questions",
    "NCLEX questions",
    "CCRN cram",
    "NCLEX cram",
    "AI nursing tutor",
    "CCRN practice bank",
    "NCLEX practice bank",
  ],
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  const summary = getLiveContentSummary();
  const homeSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "Clarity Clinical Prep",
        url: "https://clarityccrn.chapaisolutions.com",
        description:
          "Premium CCRN and NCLEX preparation with original questions, AI-guided rationale, and cleaner clinical product design.",
      },
      {
        "@type": "WebSite",
        name: "Clarity Clinical Prep",
        url: "https://clarityccrn.chapaisolutions.com",
      },
      {
        "@type": "OfferCatalog",
        name: "Clarity study packages",
        itemListElement: [
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "CCRN package",
              description: "Critical care question bank with AI-guided rationale and focused bedside review.",
            },
            url: "https://clarityccrn.chapaisolutions.com/ccrn",
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "NCLEX package",
              description: "NCLEX preparation focused on priority, delegation, safety, and cleaner review flow.",
            },
            url: "https://clarityccrn.chapaisolutions.com/nclex",
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "24-hour cram pass",
              description: "Short-term sprint access for last-minute high-intent buyers.",
            },
            url: "https://clarityccrn.chapaisolutions.com/upgrade",
          },
        ],
      },
    ],
  };

  return (
    <main className="space-y-12 px-4 py-8 md:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeSchema) }} />
      <PremiumArtHero
        backgroundColor="#F4EFE6"
        eyebrow="Clarity Clinical Prep"
        title="Sharper CCRN and NCLEX."
        body="Original questions, AI-guided rationale, and a direct learning path built for working ICU nurses and students who need a cleaner product."
        ctaHref="/upgrade"
        ctaLabel="Get Access"
        artwork={marketingArtwork.home}
      />

      <section className="featured-editorial-band page-shell pt-0">
        <div className="featured-editorial-copy">
          <span className="section-label">Why it stands out</span>
          <h2>Two exam products, one calmer clinical standard.</h2>
          <p>
            Clarity does not lead with clutter. The surface stays editorial and clear, while the system underneath keeps
            original questions, package paths, AI teaching, and content growth moving together.
          </p>
        </div>

        <div className="featured-editorial-grid">
          <a href="/ccrn" className="featured-editorial-card interactive-card">
            <div className="featured-editorial-top">
              <span>CCRN</span>
              <span>Critical care</span>
            </div>
            <h3>Sharper shock, vent, rhythm, and hemodynamic review for ICU nurses.</h3>
            <p>Built for bedside pattern recognition instead of generic qbank drift.</p>
          </a>

          <a href="/nclex" className="featured-editorial-card interactive-card">
            <div className="featured-editorial-top">
              <span>NCLEX</span>
              <span>Safety first</span>
            </div>
            <h3>Priority, delegation, pharmacology, and next-step teaching in one cleaner path.</h3>
            <p>Built for test takers who want direction, not punishment.</p>
          </a>
        </div>

        <div className="featured-intent-band">
          <div className="featured-intent-copy">
            <span className="section-label">High-intent routes</span>
            <h3>Send buyers to the right decision faster.</h3>
          </div>
          <div className="featured-intent-links">
            <a href="/ccrn/hemodynamics-questions" className="featured-intent-link interactive-card">
              <strong>CCRN hemodynamics questions</strong>
              <span>Shock, preload, perfusion.</span>
            </a>
            <a href="/compare/chapai-vs-archer" className="featured-intent-link interactive-card">
              <strong>ChapAI vs Archer</strong>
              <span>See how the question depth compares.</span>
            </a>
            <a href="/ccrn/ai-tutor" className="featured-intent-link interactive-card">
              <strong>CCRN AI tutor</strong>
              <span>Get a rationale after every answer.</span>
            </a>
            <a href="/nclex/study-plan" className="featured-intent-link interactive-card">
              <strong>NCLEX study plan</strong>
              <span>Know exactly what to study next.</span>
            </a>
          </div>
        </div>
      </section>

      <div className="page-shell pt-0">
        <div className="mb-8 grid gap-4 rounded-[28px] border border-[rgba(74,85,89,0.08)] bg-[rgba(255,251,245,0.84)] p-6 shadow-card md:grid-cols-3">
          <div>
            <span className="section-label">Current build</span>
            <p className="mt-3 font-sans text-2xl font-semibold text-[#1E2328]">{summary.ccrn.live} live CCRN questions</p>
          </div>
          <div>
            <span className="section-label">NCLEX path</span>
            <p className="mt-3 font-sans text-2xl font-semibold text-[#1E2328]">{summary.nclex.live} live NCLEX questions</p>
          </div>
          <div>
            <span className="section-label">Study edge</span>
            <p className="mt-3 font-sans text-2xl font-semibold text-[#1E2328]">Cleaner than generic qbanks</p>
          </div>
        </div>

        <DailyQuestionSignup
          exam="both"
          source="home-daily-question"
          title="Start the free daily question."
          body="Capture one clean repeat touchpoint: a daily nursing question, sharper rationale, and a faster route into the right paid plan."
        />
      </div>
    </main>
  );
}
