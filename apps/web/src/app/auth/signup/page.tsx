import type { Metadata } from "next";
import NewsletterOptIn from "@/components/newsletter/NewsletterOptIn";

export const metadata: Metadata = {
  title: "Start free | Clarity NCLEX",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-[var(--c-bg)] px-4 py-12">
      <section className="mx-auto grid max-w-[980px] gap-10 rounded-[8px] border border-[var(--c-border)] bg-[var(--c-bg-elevated)] p-6 shadow-[0_20px_48px_rgba(30,42,36,0.06)] md:grid-cols-[0.92fr_1.08fr] md:p-8">
        <div>
          <span className="text-[0.78rem] font-bold uppercase tracking-[0.18em] text-[var(--c-gold)]">
            Start free
          </span>
          <h1 className="mt-4 text-[clamp(2.7rem,5vw,4.8rem)]">Get ten NCLEX questions today.</h1>
          <p className="mt-5 text-base leading-8 text-[var(--c-text-muted)]">
            Create the account first. Then the dashboard takes you straight into a sterile sample question so the product
            feels like the test, not a landing page.
          </p>
          <p className="mt-5 font-serif text-lg italic leading-7 text-[var(--c-adobe)]">
            Full bank is $9.99/mo. No credit card for the free start.
          </p>
        </div>
        <div>
          <NewsletterOptIn />
        </div>
      </section>
    </main>
  );
}
