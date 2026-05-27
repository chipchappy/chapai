import type { Metadata } from "next";
import ReadinessClient from "./ReadinessClient";

const SITE_URL = "https://claritynclex.com";

export const metadata: Metadata = {
  title: "Free NCLEX Readiness Calculator — Estimate Your Pass Probability",
  description:
    "Free interactive NCLEX-RN readiness calculator. Answer 12 quick questions about your prep and get an estimated pass probability with category-by-category gaps to close.",
  alternates: { canonical: "/tools/nclex-readiness-calculator" },
  keywords: [
    "NCLEX readiness calculator",
    "NCLEX pass probability",
    "am I ready for NCLEX",
    "NCLEX readiness assessment",
    "NCLEX-RN self assessment",
    "free NCLEX readiness check",
  ],
  openGraph: {
    title: "Free NCLEX Readiness Calculator",
    description: "12 questions. Estimated pass probability + study plan.",
    url: `${SITE_URL}/tools/nclex-readiness-calculator`,
    type: "website",
  },
};

export default function Page() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "NCLEX Readiness Calculator",
    url: `${SITE_URL}/tools/nclex-readiness-calculator`,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    description:
      "Heuristic-based self-assessment that estimates NCLEX-RN readiness from study habits, question volume, and topic coverage.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    provider: { "@type": "Organization", name: "Clarity Clinical Prep", url: SITE_URL },
  };

  return (
    <main className="min-h-screen bg-[var(--c-bg)] px-4 py-10 md:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div className="mx-auto max-w-[960px]">
        <header className="mb-8">
          <span className="text-[0.78rem] font-bold uppercase tracking-[0.18em] text-[var(--c-gold)]">
            Free tool
          </span>
          <h1 className="mt-4 text-[clamp(2.4rem,4.8vw,4.4rem)] font-serif leading-[1.05]">
            Am I ready for the NCLEX-RN?
          </h1>
          <p className="mt-5 max-w-[58rem] text-base leading-8 text-[var(--c-text-muted)]">
            Twelve quick questions about your prep so far. We weight the responses against the
            patterns seen in students who pass on the first attempt and give you an honest
            estimate. Not a guarantee — but more useful than a guess.
          </p>
        </header>

        <ReadinessClient />

        <section className="prose prose-lg mt-12 max-w-none text-[var(--c-text)]">
          <h2>How this calculator works</h2>
          <p>
            The 12 factors weighted in this tool are drawn from published research on NCLEX-RN
            first-attempt pass rates: question volume, rationale review habits, NGN exposure,
            weakness-targeting, sleep, simulated full-length exams, and the gap between
            graduation and test date. None of these are individually decisive, but together they
            predict readiness better than any single score.
          </p>

          <h2>What the score means</h2>
          <ul>
            <li>
              <strong>85–100:</strong> Strong readiness. Book the test or keep your scheduled date.
              Maintain volume with light review for the final week.
            </li>
            <li>
              <strong>70–84:</strong> Probable readiness with gaps. Identify your two lowest
              factors and spend 1–2 weeks closing them before testing.
            </li>
            <li>
              <strong>55–69:</strong> Uncertain. Take a full 75-question readiness exam to
              confirm. Consider rescheduling 2–4 weeks if scores stay low.
            </li>
            <li>
              <strong>Below 55:</strong> Not ready. Volume and rationale-review habits need to
              change. Reschedule and build a structured 6–8 week plan.
            </li>
          </ul>

          <h2>This is a heuristic — confirm with a real readiness exam</h2>
          <p>
            No self-assessment beats a timed 75-question NCLEX-style practice exam with category
            breakdown. Use this calculator to decide whether to take a full readiness exam now or
            study another week first. Clarity's $9.99/mo plan unlocks five timed readiness exams
            modeled on the live NCLEX-RN.
          </p>
        </section>
      </div>
    </main>
  );
}
