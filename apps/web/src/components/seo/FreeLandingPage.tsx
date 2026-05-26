import Link from "next/link";
import type { ReactNode } from "react";

export interface FreeQuestion {
  id: string;
  stem: string;
  options: Array<{ id: string; text: string }>;
  answer: string | string[];
  rationale: string;
  category: string;
}

export interface FreeFAQ {
  question: string;
  answer: string;
}

export interface FreeLandingPageProps {
  slug: string;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  intro: ReactNode;
  body: ReactNode;
  questions: FreeQuestion[];
  faqs: FreeFAQ[];
  relatedSlugs: Array<{ slug: string; label: string }>;
  upgradePitch?: string;
}

const SITE_URL = "https://claritynclex.com";

function questionSchema(q: FreeQuestion, slug: string) {
  return {
    "@type": "Question",
    "@id": `${SITE_URL}/free/${slug}#${q.id}`,
    name: q.stem,
    text: q.stem,
    educationalAlignment: {
      "@type": "AlignmentObject",
      alignmentType: "assesses",
      targetName: "NCLEX-RN 2026 Test Plan",
      educationalFramework: "NCSBN Clinical Judgment Measurement Model",
    },
    acceptedAnswer: {
      "@type": "Answer",
      text: Array.isArray(q.answer)
        ? `${q.answer.map((a) => a.toUpperCase()).join(", ")}. ${q.rationale}`
        : `${q.answer.toUpperCase()}. ${q.rationale}`,
    },
    suggestedAnswer: q.options.map((opt) => ({
      "@type": "Answer",
      text: opt.text,
      position: opt.id.toUpperCase(),
    })),
  };
}

export default function FreeLandingPage(props: FreeLandingPageProps) {
  const { slug, h1, metaTitle, metaDescription, intro, body, questions, faqs, relatedSlugs, upgradePitch } = props;
  const canonical = `${SITE_URL}/free/${slug}`;

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Free NCLEX practice", item: `${SITE_URL}/free` },
      { "@type": "ListItem", position: 3, name: h1, item: canonical },
    ],
  };

  const quiz = {
    "@context": "https://schema.org",
    "@type": "Quiz",
    "@id": `${canonical}#quiz`,
    name: metaTitle,
    description: metaDescription,
    url: canonical,
    about: { "@type": "Thing", name: "NCLEX-RN" },
    educationalAlignment: {
      "@type": "AlignmentObject",
      alignmentType: "assesses",
      targetName: "NCLEX-RN 2026 Test Plan",
    },
    provider: { "@type": "Organization", name: "Clarity Clinical Prep", url: SITE_URL },
    hasPart: questions.map((q) => questionSchema(q, slug)),
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: h1,
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(quiz) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(article) }} />

      <article className="mx-auto max-w-[920px]">
        <nav className="mb-6 text-sm text-[var(--c-text-muted)]" aria-label="Breadcrumb">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/free" className="hover:underline">Free practice</Link>
          <span className="mx-2">/</span>
          <span aria-current="page">{h1}</span>
        </nav>

        <header className="mb-8">
          <span className="text-[0.78rem] font-bold uppercase tracking-[0.18em] text-[var(--c-gold)]">
            Free NCLEX practice
          </span>
          <h1 className="mt-4 text-[clamp(2.4rem,4.8vw,4.4rem)] font-serif leading-[1.05]">{h1}</h1>
          <div className="mt-5 text-base leading-8 text-[var(--c-text-muted)]">{intro}</div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/auth/signup"
              className="inline-flex rounded-[8px] bg-[var(--c-sage-deep)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--c-sage-deep-hover)]"
            >
              Start free — 10 questions/day
            </Link>
            <Link
              href="/pricing"
              className="inline-flex rounded-[8px] border border-[var(--c-border)] px-5 py-3 text-sm font-semibold text-[var(--c-text)] hover:bg-[var(--c-bg-elevated)]"
            >
              See premium — $9.99/mo
            </Link>
          </div>
        </header>

        <section className="prose prose-lg mb-12 max-w-none text-[var(--c-text)]">{body}</section>

        <section className="mb-12">
          <h2 className="text-[clamp(1.8rem,3.4vw,2.6rem)] font-serif">Try these {questions.length} questions now</h2>
          <p className="mt-2 text-base text-[var(--c-text-muted)]">
            No signup required. Tap an answer to reveal the rationale.
          </p>
          <ol className="mt-6 space-y-8">
            {questions.map((q, idx) => (
              <li
                key={q.id}
                className="rounded-[12px] border border-[var(--c-border)] bg-[var(--c-bg-elevated)] p-5 md:p-6"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[var(--c-gold)]">
                    Question {idx + 1} · {q.category}
                  </span>
                </div>
                <p className="mt-3 text-base leading-7">{q.stem}</p>
                <ul className="mt-4 space-y-2">
                  {q.options.map((opt) => (
                    <li key={opt.id} className="rounded-[8px] border border-[var(--c-border)] px-4 py-3 text-sm">
                      <span className="font-semibold uppercase mr-2">{opt.id}.</span>
                      {opt.text}
                    </li>
                  ))}
                </ul>
                <details className="mt-4 rounded-[8px] bg-[rgba(126,157,134,0.08)] p-4">
                  <summary className="cursor-pointer text-sm font-semibold text-[var(--c-sage-deep)]">
                    Show answer + rationale
                  </summary>
                  <p className="mt-3 text-sm leading-7">
                    <strong>Correct: {Array.isArray(q.answer) ? q.answer.map((a) => a.toUpperCase()).join(", ") : q.answer.toUpperCase()}.</strong>{" "}
                    {q.rationale}
                  </p>
                </details>
              </li>
            ))}
          </ol>

          <div className="mt-10 rounded-[12px] border border-[var(--c-gold)] bg-[rgba(176,141,87,0.08)] p-6 text-center">
            <p className="text-base leading-7">
              {upgradePitch ??
                "These are 5 of 5,000+ NCLEX questions in the Clarity bank. The full bank includes real NGN case studies, bow-tie items, AI tutor follow-up, and 5 readiness exams."}
            </p>
            <Link
              href="/auth/signup"
              className="mt-5 inline-flex rounded-[8px] bg-[var(--c-sage-deep)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--c-sage-deep-hover)]"
            >
              Get 5,000+ more questions free for 10/day →
            </Link>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-[clamp(1.8rem,3.4vw,2.6rem)] font-serif">Frequently asked questions</h2>
          <div className="mt-6 space-y-4">
            {faqs.map((f) => (
              <details
                key={f.question}
                className="rounded-[8px] border border-[var(--c-border)] bg-[var(--c-bg-elevated)] p-5"
              >
                <summary className="cursor-pointer text-base font-semibold">{f.question}</summary>
                <p className="mt-3 text-sm leading-7 text-[var(--c-text-muted)]">{f.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-[clamp(1.6rem,3vw,2.2rem)] font-serif">Practice more free NCLEX topics</h2>
          <ul className="mt-6 grid gap-3 md:grid-cols-2">
            {relatedSlugs.map((r) => (
              <li key={r.slug}>
                <Link
                  href={`/free/${r.slug}`}
                  className="block rounded-[8px] border border-[var(--c-border)] bg-[var(--c-bg-elevated)] p-4 text-sm hover:border-[var(--c-gold)]"
                >
                  {r.label} →
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </article>
    </main>
  );
}
