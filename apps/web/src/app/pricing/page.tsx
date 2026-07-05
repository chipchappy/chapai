import type { Metadata } from "next";
import PricingCards from "@/components/marketing/PricingCards";

export const metadata: Metadata = {
  title: "Pricing | Clarity NCLEX",
  description: "Clarity NCLEX pricing: $9.99/mo for NCLEX Base, $15.99/mo for Dual Premium, and $4.99 24-hour passes.",
  alternates: { canonical: "/pricing" },
};

const PRICING_FAQS: Array<{ q: string; a: string }> = [
  {
    q: "What do I get for $9.99/month?",
    a: "NCLEX Base includes the full live NCLEX question bank (NGN case studies, matrix, bow-tie, SATA, and standard items) with premium rationales and citations, the AI tutor on every question, 2 timed readiness exams, and your progress dashboard. Dual Premium ($15.99/mo) adds the CCRN track and unlocks all 5 readiness exams.",
  },
  {
    q: "Can I try Clarity before paying?",
    a: "Yes. The free plan gives you 10 questions every day with full rationales — no credit card required. Upgrade only when you want the whole bank, the AI tutor, and the readiness exams.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel whenever you like and you keep full access through the end of your current billing period. No lock-in, no cancellation fees.",
  },
  {
    q: "Is there a pass guarantee?",
    a: "The Clarity Pass Pledge: complete all five readiness exams on Dual Premium with “On Track” scores before your test date, and if you don’t pass the NCLEX, email your official result letter within 30 days — we’ll add 3 months of Dual Premium free while you prepare to retest.",
  },
  {
    q: "How does Clarity compare to UWorld or Kaplan at this price?",
    a: "You practice the same NGN item types — case studies, bow-tie, matrix, SATA — with detailed rationales and an AI tutor on every question, for under 10% of a typical UWorld or Kaplan package. The bank is reviewed for clinical accuracy and grows daily.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: PRICING_FAQS.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

export default function PricingPage() {
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* Guarantee ribbon — the pledge is visible before the price is. */}
      <section className="px-4 pt-8">
        <div className="mx-auto flex max-w-[880px] flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-[22px] border border-[rgba(111,141,118,0.3)] bg-[linear-gradient(180deg,rgba(240,246,241,0.9),rgba(255,252,247,0.95))] px-6 py-4 text-center">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(111,141,118,0.16)] text-[#55715e]" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </span>
          <p className="text-sm leading-6 text-dark">
            <strong className="font-semibold">Every plan is backed by the Clarity Pass Pledge</strong> — do the work,
            and if you don&rsquo;t pass, your next 3 months are free.{" "}
            <a href="#pledge" className="underline decoration-dotted underline-offset-2 text-[#55715e] hover:text-dark">
              Details
            </a>
          </p>
        </div>
      </section>

      <PricingCards />

      {/* The Clarity Pass Pledge — trust mechanic (P0-4). Terms are explicit and
          tied to the plan that actually includes all 5 readiness exams. */}
      <section id="pledge" className="px-4 pb-6 pt-2">
        <div className="mx-auto max-w-[880px] rounded-[28px] border border-[rgba(126,157,134,0.24)] bg-[rgba(126,157,134,0.08)] p-6 text-center md:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">The Clarity Pass Pledge</p>
          <h2 className="mt-3 font-serif text-[2rem] leading-[1.02] text-dark">
            Score &ldquo;On Track&rdquo; on all 5 readiness exams and don&rsquo;t pass? Your next 3 months are on us.
          </h2>
          <p className="mx-auto mt-4 max-w-[640px] text-sm leading-7 text-muted">
            Complete all five timed readiness exams on Dual Premium with &ldquo;On Track&rdquo; scores before your
            test date. If you still don&rsquo;t pass the NCLEX, email your official result letter to support within
            30 days and we&rsquo;ll add <strong className="text-dark">3 months of Dual Premium free</strong> while you
            get ready to retest. No forms, no fine-print gymnastics.
          </p>
        </div>
      </section>

      {/* Buying-objection FAQ (P0-3) — native <details> accordion, zero JS. */}
      <section className="px-4 pb-20 pt-6">
        <div className="mx-auto max-w-[880px]">
          <h2 className="text-center font-serif text-[2rem] leading-[1.02] text-dark">Pricing questions, answered.</h2>
          <div className="mt-6 space-y-3">
            {PRICING_FAQS.map((item) => (
              <details
                key={item.q}
                className="group rounded-[20px] border border-[rgba(74,85,89,0.10)] bg-white/70 px-5 py-4"
              >
                <summary className="cursor-pointer list-none text-[15px] font-semibold text-dark marker:content-none">
                  <span className="mr-2 inline-block text-muted transition-transform group-open:rotate-90">›</span>
                  {item.q}
                </summary>
                <p className="mt-3 pl-5 text-sm leading-7 text-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
