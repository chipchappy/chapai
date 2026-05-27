import Link from "next/link";
import type { ReactNode } from "react";

interface ComparisonPageProps {
  slug: string;
  competitor: string;
  metaTitle: string;
  metaDescription: string;
  intro: ReactNode;
  competitorOverview: ReactNode;
  comparisonRows: Array<{ feature: string; clarity: string; competitor: string }>;
  body: ReactNode;
  verdict: ReactNode;
}

const SITE_URL = "https://claritynclex.com";

export default function ComparisonPage(props: ComparisonPageProps) {
  const { slug, competitor, metaTitle, metaDescription, intro, competitorOverview, comparisonRows, body, verdict } = props;
  const canonical = `${SITE_URL}/compare/${slug}`;

  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: metaTitle,
    description: metaDescription,
    image: `${SITE_URL}/logo.png`,
    author: { "@type": "Organization", name: "Clarity Clinical Prep", url: SITE_URL },
    publisher: {
      "@type": "Organization",
      name: "Clarity Clinical Prep",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` },
    },
    datePublished: "2026-05-26",
    dateModified: new Date().toISOString().slice(0, 10),
    mainEntityOfPage: canonical,
  };

  return (
    <main className="min-h-screen bg-[var(--c-bg)] px-4 py-10 md:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(article) }} />
      <article className="mx-auto max-w-[920px]">
        <header className="mb-8">
          <span className="text-[0.78rem] font-bold uppercase tracking-[0.18em] text-[var(--c-gold)]">
            NCLEX prep comparison
          </span>
          <h1 className="mt-4 text-[clamp(2.4rem,4.8vw,4.4rem)] font-serif leading-[1.05]">
            Clarity vs {competitor} for NCLEX-RN prep
          </h1>
          <div className="mt-5 text-base leading-8 text-[var(--c-text-muted)]">{intro}</div>
        </header>

        <section className="prose prose-lg max-w-none text-[var(--c-text)]">
          <h2>{competitor} at a glance</h2>
          {competitorOverview}
        </section>

        <section className="my-10 overflow-x-auto rounded-[12px] border border-[var(--c-border)] bg-[var(--c-bg-elevated)]">
          <table className="w-full text-sm">
            <thead className="bg-[rgba(126,157,134,0.10)]">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Feature</th>
                <th className="px-4 py-3 text-left font-semibold">Clarity</th>
                <th className="px-4 py-3 text-left font-semibold">{competitor}</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row, i) => (
                <tr key={row.feature} className={i % 2 === 0 ? "bg-white" : ""}>
                  <td className="px-4 py-3 font-semibold">{row.feature}</td>
                  <td className="px-4 py-3">{row.clarity}</td>
                  <td className="px-4 py-3 text-[var(--c-text-muted)]">{row.competitor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="prose prose-lg max-w-none text-[var(--c-text)]">{body}</section>

        <section className="mt-10 rounded-[12px] border border-[var(--c-gold)] bg-[rgba(176,141,87,0.08)] p-6">
          <h2 className="mt-0 text-xl font-serif">Bottom line</h2>
          <div className="text-base leading-7">{verdict}</div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/auth/signup"
              className="inline-flex rounded-[8px] bg-[var(--c-sage-deep)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--c-sage-deep-hover)]"
            >
              Try Clarity free
            </Link>
            <Link
              href="/free/nclex-practice-questions"
              className="inline-flex rounded-[8px] border border-[var(--c-border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--c-text)]"
            >
              See free questions first
            </Link>
          </div>
        </section>
      </article>
    </main>
  );
}
