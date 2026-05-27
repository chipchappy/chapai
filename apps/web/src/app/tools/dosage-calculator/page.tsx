import type { Metadata } from "next";
import DosageCalcClient from "./DosageCalcClient";

const SITE_URL = "https://claritynclex.com";

export const metadata: Metadata = {
  title: "Free Nursing Dosage Calculator — Med Math, IV Drip Rates, mcg/kg/min",
  description:
    "Free nursing dosage calculator: pediatric weight-based dosing, IV drip rates (gtt/min), mcg/kg/min titration, and reconstitution math. Built for NCLEX prep and clinical use.",
  alternates: { canonical: "/tools/dosage-calculator" },
  keywords: [
    "nursing dosage calculator",
    "free nursing dosage calculator",
    "IV drip rate calculator",
    "mcg/kg/min calculator",
    "pediatric dosage calculator",
    "med math calculator nursing",
    "dimensional analysis calculator",
    "drug calculation nursing",
  ],
  openGraph: {
    title: "Free Nursing Dosage Calculator",
    description: "Pediatric, drip rates, mcg/kg/min, reconstitution — instant math.",
    url: `${SITE_URL}/tools/dosage-calculator`,
    type: "website",
  },
};

export default function Page() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Nursing Dosage Calculator",
    url: `${SITE_URL}/tools/dosage-calculator`,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    description:
      "Free nursing med math calculator with pediatric weight-based dosing, IV drip rates, mcg/kg/min titration, and reconstitution.",
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
            Nursing dosage calculator
          </h1>
          <p className="mt-5 max-w-[58rem] text-base leading-8 text-[var(--c-text-muted)]">
            Four of the most common nursing math calculations in one tool: pediatric weight-based
            dosing, IV gravity drip rates, mcg/kg/min titration (think vasopressors), and powder
            reconstitution. Built for NCLEX prep, clinical reference, and the night before your
            med-math exam.
          </p>
          <p className="mt-4 max-w-[58rem] text-sm leading-7 text-[var(--c-text-muted)]">
            <strong>Disclaimer:</strong> Always verify calculations with a second nurse, your
            facility's formulary, and the prescriber's order. This tool is for education and
            quick-check use, not a substitute for clinical judgment.
          </p>
        </header>

        <DosageCalcClient />

        <section className="prose prose-lg mt-12 max-w-none text-[var(--c-text)]">
          <h2>The 4 formulas behind this calculator</h2>

          <h3>1. Pediatric weight-based dose</h3>
          <p>
            Dose = mg/kg ordered × patient weight in kg. If the medication comes in mg/mL,
            calculate volume to give: Volume = total dose ÷ concentration.
          </p>

          <h3>2. IV gravity drip rate (gtt/min)</h3>
          <p>
            Rate (gtt/min) = (Total volume in mL × drop factor in gtt/mL) ÷ Total time in minutes.
            Drop factors: macro-drip is 10, 15, or 20 gtt/mL; micro-drip is 60 gtt/mL.
          </p>

          <h3>3. mcg/kg/min titration (IV pump)</h3>
          <p>
            Pump rate (mL/hr) = (ordered mcg/kg/min × weight in kg × 60) ÷ concentration in
            mcg/mL. Used for norepinephrine, dopamine, propofol, nitroglycerin drips, and most
            ICU vasoactive infusions.
          </p>

          <h3>4. Reconstitution</h3>
          <p>
            Final concentration (mg/mL) = total mg in vial ÷ total mL of diluent. Volume to draw
            up = ordered dose ÷ final concentration.
          </p>

          <h2>Common NCLEX med-math traps</h2>
          <ul>
            <li>
              <strong>Pounds vs kilograms.</strong> NCLEX gives weight in pounds about half the
              time. Always convert: kg = lb ÷ 2.2.
            </li>
            <li>
              <strong>Strength vs volume.</strong> "0.25 mg/mL" is concentration; "2 mL" is volume.
              Read the label carefully.
            </li>
            <li>
              <strong>Round to the device.</strong> IV pumps usually accept 0.1 mL/hr precision;
              syringes 0.1 mL; gtt/min must be whole numbers.
            </li>
            <li>
              <strong>Safe dose check.</strong> Compare your calculated dose to the safe-dose
              range. If your answer exceeds the high end, recheck before giving.
            </li>
          </ul>

          <h2>Free med-math practice questions</h2>
          <p>
            For 5 free practice problems on dosage calculations, drip rates, and pediatric math,
            see our <a href="/free/nclex-pharmacology-questions">pharmacology question set</a>.
          </p>
        </section>
      </div>
    </main>
  );
}
