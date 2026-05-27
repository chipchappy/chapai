import type { Metadata } from "next";
import NclexCountdownClient from "./NclexCountdownClient";

const SITE_URL = "https://claritynclex.com";

export const metadata: Metadata = {
  title: "NCLEX Countdown Timer — Days, Hours, Minutes Until Your Exam",
  description:
    "Free NCLEX countdown clock. Set your NCLEX-RN test date and see exactly how much study time you have left, with a recommended daily question count and study plan.",
  alternates: { canonical: "/tools/nclex-countdown" },
  keywords: [
    "NCLEX countdown",
    "NCLEX countdown timer",
    "days until NCLEX",
    "NCLEX-RN countdown",
    "free nursing exam countdown",
    "NCLEX study timer",
  ],
  openGraph: {
    title: "Free NCLEX Countdown Timer",
    description: "Set your test date. See exactly how much study time is left.",
    url: `${SITE_URL}/tools/nclex-countdown`,
    type: "website",
  },
};

export default function Page() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "NCLEX Countdown Timer",
    url: `${SITE_URL}/tools/nclex-countdown`,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    description: "Free countdown timer to your NCLEX-RN exam with daily study targets.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    provider: { "@type": "Organization", name: "Clarity Clinical Prep", url: SITE_URL },
  };

  return (
    <main className="min-h-screen bg-[var(--c-bg)] px-4 py-10 md:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div className="mx-auto max-w-[920px]">
        <header className="mb-8">
          <span className="text-[0.78rem] font-bold uppercase tracking-[0.18em] text-[var(--c-gold)]">
            Free tool
          </span>
          <h1 className="mt-4 text-[clamp(2.6rem,5vw,4.6rem)] font-serif leading-[1.05]">
            NCLEX countdown timer
          </h1>
          <p className="mt-5 max-w-[58rem] text-base leading-8 text-[var(--c-text-muted)]">
            Set your test date. We'll show you exactly how much study time you have left, plus a
            research-based daily question count to hit your goal. Share the countdown with your
            study group or screenshot it for Instagram — link back to us, please.
          </p>
        </header>
        <NclexCountdownClient />

        <section className="prose prose-lg mt-12 max-w-none text-[var(--c-text)]">
          <h2>How to use the countdown</h2>
          <ol>
            <li>Pick your scheduled NCLEX-RN date (or your target if you haven't booked yet).</li>
            <li>The countdown gives you days, hours, and minutes remaining.</li>
            <li>The daily target shows roughly how many practice questions you should do per day to hit 2,500 total before the test.</li>
            <li>Screenshot it. Pin it to your desk. Share it.</li>
          </ol>

          <h2>Why 2,500 questions before NCLEX?</h2>
          <p>
            Studies of first-attempt NCLEX-RN pass rates consistently find that volume of practice
            with rationale review is the strongest predictor of success. The 2,500-question mark
            is where the curve flattens — going from 1,000 to 2,500 questions yields large
            improvements, but going from 2,500 to 5,000 yields diminishing returns.
          </p>
          <p>
            If your test date is 4 weeks away, that's 90 questions per day. 6 weeks = 60 per day.
            8 weeks = 45 per day. The countdown does the math for you.
          </p>

          <h2>What to do if your countdown is too short</h2>
          <p>
            If the daily target is over 150 questions per day, you're likely too close to your
            test date for high-quality prep. Consider rescheduling 2–4 weeks out. Burnout from
            cramming is correlated with worse first-attempt outcomes than a slightly later test
            with deeper prep.
          </p>

          <h2>Ready to start the questions?</h2>
          <p>
            Get 10 free NCLEX questions per day with a free Clarity account, or unlock the full
            5,000+ bank from $9.99/mo. The AI tutor walks you through any question you miss.
          </p>
        </section>
      </div>
    </main>
  );
}
