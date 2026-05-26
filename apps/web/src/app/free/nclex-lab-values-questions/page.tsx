import type { Metadata } from "next";
import FreeLandingPage from "@/components/seo/FreeLandingPage";
import { SEED_LAB_VALUES_Q } from "@/content/free-landings/extra-questions";
import { SEED_PHARM } from "@/content/free-landings/seed-questions";

const SLUG = "nclex-lab-values-questions";
const SITE_URL = "https://claritynclex.com";

export const metadata: Metadata = {
  title: "Free NCLEX Lab Values Questions | ABG, Electrolytes, Drug Levels",
  description:
    "Free NCLEX-RN lab value interpretation practice: ABG, electrolytes, drug levels, coagulation. Full rationales for every distractor.",
  alternates: { canonical: `/free/${SLUG}` },
  keywords: [
    "free NCLEX lab values questions",
    "NCLEX lab interpretation practice",
    "free NCLEX ABG questions",
    "NCLEX electrolyte questions",
    "free nursing lab values NCLEX",
  ],
  openGraph: {
    title: "Free NCLEX Lab Values Questions",
    description: "ABG, electrolytes, drug levels, coagulation practice.",
    url: `${SITE_URL}/free/${SLUG}`,
    type: "article",
  },
};

const Qs = [...SEED_LAB_VALUES_Q, SEED_PHARM[3]];

export default function Page() {
  return (
    <FreeLandingPage
      slug={SLUG}
      h1="Free NCLEX lab values practice questions"
      metaTitle={metadata.title as string}
      metaDescription={metadata.description as string}
      intro={
        <p>
          Four free NCLEX-RN lab interpretation questions covering digoxin + hypokalemia, ABG
          decoding, vancomycin trough monitoring, and pre-vancomycin labs. Lab questions are
          rarely "what is the normal range?" — they're almost always "what should you do about
          this abnormal result?"
        </p>
      }
      body={
        <>
          <h2>Lab value applications that win NCLEX points</h2>
          <ul>
            <li><strong>Potassium + digoxin.</strong> K+ &lt; 3.5 = digoxin toxicity risk.</li>
            <li><strong>Insulin + potassium.</strong> Insulin drives K+ intracellularly. Expect K+ to drop during DKA treatment.</li>
            <li><strong>Heparin + aPTT.</strong> Therapeutic 60–80 sec. &gt; 100 = hold, notify, consider protamine.</li>
            <li><strong>Warfarin + INR.</strong> Therapeutic 2–3 (3–4 for mechanical valve). &gt; 5 = hold + vitamin K.</li>
            <li><strong>Vancomycin trough.</strong> 10–20 mcg/mL. &gt; 20 = nephrotoxicity, ototoxicity risk.</li>
            <li><strong>Lithium.</strong> Narrow window 0.6–1.2 mEq/L. &gt; 1.5 toxic. Watch for dehydration and NSAIDs.</li>
            <li><strong>BNP.</strong> &gt; 400 heart failure. Trend to assess volume status.</li>
            <li><strong>Troponin.</strong> Any elevation suggests myocardial injury. Rises 3–4 hr post-MI.</li>
            <li><strong>Lactate.</strong> &gt; 2 in sepsis suggests tissue hypoperfusion. &gt; 4 indicates septic shock until proven otherwise.</li>
          </ul>

          <h2>ABG decoding flow</h2>
          <ol>
            <li>pH first. Below 7.35 acidosis. Above 7.45 alkalosis.</li>
            <li>PaCO2. Moves opposite to pH = respiratory cause.</li>
            <li>HCO3. Moves with pH = metabolic cause.</li>
            <li>If both abnormal: compensation. Fully normal pH = fully compensated.</li>
            <li>PaO2 &lt; 60 = respiratory failure regardless of pH.</li>
          </ol>

          <h2>Critical values to memorize cold</h2>
          <ul>
            <li>K+ &lt; 2.5 or &gt; 6.5</li>
            <li>Na+ &lt; 120 or &gt; 160</li>
            <li>Glucose &lt; 40 or &gt; 500</li>
            <li>Ca++ &lt; 7 or &gt; 13</li>
            <li>Platelets &lt; 50,000</li>
            <li>Hgb &lt; 7</li>
            <li>pH &lt; 7.20 or &gt; 7.60</li>
            <li>PaO2 &lt; 60</li>
            <li>INR &gt; 5 (especially with bleeding)</li>
          </ul>

          <p>
            For a complete reference, see our{" "}
            <a href="/nclex-lab-values">NCLEX lab values cheat sheet</a>.
          </p>
        </>
      }
      questions={Qs}
      faqs={[
        { question: "What lab values do I need to memorize for NCLEX?", answer: "Top 20: Na, K, Ca, Mg, glucose, BUN, creatinine, hemoglobin, hematocrit, platelets, WBC, INR, aPTT, pH, PaCO2, HCO3, PaO2, troponin, BNP, plus therapeutic levels for digoxin, lithium, phenytoin, and vancomycin." },
        { question: "How do I interpret ABG quickly?", answer: "pH first. PaCO2 second (respiratory cause if moves opposite to pH). HCO3 third (metabolic cause if moves with pH). Both abnormal = compensation occurring." },
        { question: "What's the priority when potassium is 6.5?", answer: "Hyperkalemia critical. Continuous EKG monitoring (peaked T waves, prolonged QRS, dysrhythmias), calcium gluconate to stabilize myocardium, insulin + dextrose or kayexalate to shift/eliminate K+. Hold ACE inhibitors, K-sparing diuretics, and potassium-containing fluids." },
        { question: "When is INR too high?", answer: "Therapeutic INR on warfarin is 2.0–3.0 (2.5–3.5 for mechanical valves). INR above 5 carries significant bleeding risk and typically warrants holding warfarin and possibly giving vitamin K. INR above 10 requires reversal with vitamin K or PCC." },
      ]}
      relatedSlugs={[
        { slug: "nclex-pharmacology-questions", label: "Free NCLEX pharmacology questions" },
        { slug: "nclex-cardiac-questions", label: "Free NCLEX cardiac questions" },
        { slug: "nclex-respiratory-questions", label: "Free NCLEX respiratory questions" },
        { slug: "nclex-endocrine-questions", label: "Free NCLEX endocrine questions" },
        { slug: "nclex-prioritization-questions", label: "Free NCLEX prioritization questions" },
        { slug: "nclex-practice-exam", label: "Free NCLEX practice exam" },
      ]}
    />
  );
}
