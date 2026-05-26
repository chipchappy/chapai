import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = "https://claritynclex.com";

export const metadata: Metadata = {
  title: "Frequently Asked Questions | Clarity Clinical Prep",
  description:
    "Answers to the most common Clarity NCLEX questions: pricing, cancellation, question bank size, NGN coverage, AI tutor, and how the readiness exams work.",
  alternates: { canonical: "/faq" },
};

const FAQS = [
  { q: "How much does Clarity cost?", a: "Free tier with 10 questions per day. 7-day pass $4.99. NCLEX Monthly $9.99/mo. Premium (NCLEX + CCRN + AI tutor) $15.99/mo. No long-term commitment. Cancel anytime." },
  { q: "How many questions are in the bank?", a: "5,000+ refined NCLEX-RN items plus 1,700+ CCRN items. Every question has a unique distractor rationale and references — not boilerplate." },
  { q: "Does Clarity cover the Next Generation NCLEX (NGN)?", a: "Yes. Real multi-step case studies, true 3-zone bow-tie items, matrix grids, partial-credit SATA, and cloze items. Aligned to the 2026 NCSBN test plan." },
  { q: "Is there an AI tutor?", a: "Yes. Premium ($15.99/mo) includes an AI tutor (Claude Haiku 4.5) that walks you through any missed question in plain English with the clinical reasoning behind each option." },
  { q: "How many readiness exams are included?", a: "Five timed readiness exams modeled on the live adaptive NCLEX-RN format. Each gives you a category-by-category breakdown after completion." },
  { q: "Can I cancel anytime?", a: "Yes. No long-term commitment. Cancel from your account billing page and you keep access until the end of the current period." },
  { q: "What's your refund policy?", a: "If your access doesn't work within 7 days of purchase, we'll refund the full amount. Email support@chapaisolutions.com." },
  { q: "Do you have a mobile app?", a: "The web app is fully mobile-optimized and works in any browser. Native iOS and Android apps are in development." },
  { q: "Does Clarity work for the CCRN exam?", a: "Yes. The Premium tier ($15.99/mo) includes the full CCRN bank with hemodynamics, vasoactive drips, and ICU-focused content." },
  { q: "Is Clarity affiliated with NCSBN?", a: "No. Clarity is an independent NCLEX-RN preparation platform. NCLEX-RN is a registered trademark of NCSBN. We're built by nurses who refused to pay competitor prices." },
  { q: "Where can I report a question error?", a: "Email content@chapaisolutions.com with the question ID and the correction. We review every report within 48 hours and credit your account when we update an item based on your feedback." },
  { q: "Can my nursing school use Clarity?", a: "Yes. We offer school site licenses with rostered access, faculty dashboards, and aggregate weak-area reporting. Email partnerships@chapaisolutions.com." },
];

export default function Page() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <main className="min-h-screen px-4 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div className="mx-auto max-w-[840px]">
        <header className="mb-10 text-center">
          <span className="text-[0.78rem] font-bold uppercase tracking-[0.18em] text-[var(--c-gold)]">
            Help & answers
          </span>
          <h1 className="mt-4 font-serif text-[clamp(2.6rem,5vw,4.4rem)] leading-[1.05]">
            Frequently asked questions
          </h1>
        </header>

        <ul className="space-y-4">
          {FAQS.map((f) => (
            <li key={f.q} className="rounded-[20px] border border-[var(--c-border)] bg-[rgba(255,250,242,0.78)] p-5 backdrop-blur-sm">
              <details>
                <summary className="cursor-pointer text-base font-semibold">{f.q}</summary>
                <p className="mt-3 text-sm leading-7 text-[var(--c-text-muted)]">{f.a}</p>
              </details>
            </li>
          ))}
        </ul>

        <div className="mt-10 text-center text-sm text-[var(--c-text-muted)]">
          Didn't see your question? Email{" "}
          <a href="mailto:support@chapaisolutions.com" className="font-semibold text-[var(--c-sage-deep)] hover:underline">
            support@chapaisolutions.com
          </a>
          .
          <div className="mt-3">
            <Link href="/" className="font-semibold text-[var(--c-sage-deep)] hover:underline">
              Back to home →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
