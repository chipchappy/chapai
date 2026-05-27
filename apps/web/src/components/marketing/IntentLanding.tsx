import SplitImageHero from "./SplitImageHero";
import { getBackgroundForIntent } from "./marketingArtwork";

interface IntentLandingProps {
  eyebrow: string;
  examPill?: string;
  title: string;
  body: string;
  stats: Array<{ label: string; value: string }>;
  accentLabel: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
  whyTitle: string;
  whyBody: string;
  proofPoints: Array<{ label: string; text: string }>;
  sectionLabel?: string;
  buyerTitle: string;
  buyerBody: string;
  packageTitle: string;
  packageBody: string;
  urgencyTitle: string;
  urgencyBody: string;
  faq: Array<{ question: string; answer: string }>;
}

export default function IntentLanding({
  eyebrow,
  examPill,
  title,
  body,
  stats,
  accentLabel,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  whyTitle,
  whyBody,
  proofPoints,
  sectionLabel = "Search intent page",
  buyerTitle,
  buyerBody,
  packageTitle,
  packageBody,
  urgencyTitle,
  urgencyBody,
  faq,
}: IntentLandingProps) {
  const backgroundColor = getBackgroundForIntent(examPill);
  const tone = examPill?.toLowerCase().includes("ccrn") ? "sage" : examPill?.toLowerCase().includes("nclex") ? "cool" : "warm";

  const faqSchema = faq.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faq.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      }
    : null;

  return (
    <main className="page-shell">
      {faqSchema ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      ) : null}
      <SplitImageHero
        backgroundColor={backgroundColor}
        eyebrow={eyebrow}
        title={title}
        body={body}
        buttonHref={primaryHref}
        buttonLabel={primaryLabel}
        secondaryHref={secondaryHref}
        secondaryLabel={secondaryLabel}
        supportLine={accentLabel}
        tone={tone}
      />

      <section className="mt-8 grid gap-4 rounded-[28px] border border-[rgba(74,85,89,0.08)] bg-[rgba(255,251,245,0.84)] p-6 shadow-card md:grid-cols-3">
        {stats.map((item) => (
          <article key={item.label}>
            <span className="section-label">{item.label}</span>
            <p className="mt-3 font-sans text-2xl font-semibold text-[#1E2328]">{item.value}</p>
          </article>
        ))}
      </section>

      <section className="search-intent-shell">
        <div className="search-intent-copy">
          <span className="section-label">{sectionLabel}</span>
          <h2>{whyTitle}</h2>
          <p>{whyBody}</p>
        </div>
        <div className="search-intent-list">
          {proofPoints.map((item) => (
            <article key={item.label} className="search-intent-line">
              <span>{item.label}</span>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="package-bridge package-bridge-seamless">
        <div className="package-bridge-copy">
          <span className="section-label">Why this should convert</span>
          <h2>Give search traffic the right answer, then move directly into the package.</h2>
          <p>
            These pages are built to answer the exact buyer question quickly, then move into a clear exam-specific CTA
            instead of making traffic wander around a generic homepage.
          </p>
        </div>

        <div className="package-bridge-grid">
          <article className="package-bridge-card">
            <span>Best fit</span>
            <strong>{buyerTitle}</strong>
            <p>{buyerBody}</p>
          </article>
          <article className="package-bridge-card">
            <span>Why ChapAI</span>
            <strong>{packageTitle}</strong>
            <p>{packageBody}</p>
          </article>
          <article className="package-bridge-card">
            <span>Why now</span>
            <strong>{urgencyTitle}</strong>
            <p>{urgencyBody}</p>
          </article>
        </div>

        <div className="package-bridge-actions">
          <a href={primaryHref} className="btn-primary">
            {primaryLabel}
          </a>
          <a href={secondaryHref} className="btn-secondary">
            {secondaryLabel}
          </a>
        </div>
      </section>

      <section className="faq-stream">
        <div className="faq-stream-copy">
          <span className="section-label">Fast answers</span>
          <h2>Short answers to the exact question that brought them here.</h2>
        </div>
        <div className="faq-stream-list">
          {faq.map((item) => (
            <article key={item.question} className="faq-stream-item">
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
