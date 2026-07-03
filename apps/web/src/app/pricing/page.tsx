import type { Metadata } from "next";
import PricingCards from "@/components/marketing/PricingCards";

export const metadata: Metadata = {
  title: "Pricing | Clarity NCLEX",
  description: "Clarity NCLEX pricing: $9.99/mo for NCLEX Base, $15.99/mo for Dual Premium, and $4.99 24-hour passes.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return (
    <main>
      <PricingCards />

      {/* The Clarity Pass Pledge — trust mechanic (P0-4). Terms are explicit and
          tied to the plan that actually includes all 5 readiness exams. */}
      <section className="px-4 pb-6 pt-2">
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
    </main>
  );
}
