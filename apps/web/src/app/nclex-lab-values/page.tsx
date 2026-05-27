import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = "https://claritynclex.com";

export const metadata: Metadata = {
  title: "NCLEX Lab Values Cheat Sheet (2026) — Normal Ranges + Critical Values",
  description:
    "Complete NCLEX lab values reference: CBC, BMP, CMP, ABG, coagulation, cardiac, liver, lipid panel. Normal ranges, critical values, and the priority nursing action for every abnormal result.",
  alternates: { canonical: "/nclex-lab-values" },
  keywords: [
    "NCLEX lab values",
    "NCLEX lab values cheat sheet",
    "nursing lab values",
    "lab values to memorize for NCLEX",
    "free NCLEX lab values",
    "normal lab values nursing",
    "critical lab values NCLEX",
  ],
  openGraph: {
    title: "NCLEX Lab Values Cheat Sheet — Complete 2026 Reference",
    description: "Normal ranges, critical values, and the priority nursing action for every abnormal lab.",
    url: `${SITE_URL}/nclex-lab-values`,
    type: "article",
  },
};

interface LabRow {
  test: string;
  normal: string;
  critical?: string;
  nursing: string;
}

interface LabPanel {
  panel: string;
  labs: LabRow[];
}

const PANELS: LabPanel[] = [
  {
    panel: "Complete Blood Count (CBC)",
    labs: [
      { test: "WBC", normal: "4,500–11,000/mm³", critical: "<2,500 or >30,000", nursing: "Low: neutropenic precautions. High: rule out infection vs steroid response." },
      { test: "RBC", normal: "4.2–6.1 million/mm³", nursing: "Low: bleeding, anemia, B12/folate deficiency." },
      { test: "Hemoglobin", normal: "M 13.5–17.5, F 12–15.5 g/dL", critical: "<7", nursing: "<7 transfuse symptomatic patients; assess for blood loss, fatigue, dyspnea." },
      { test: "Hematocrit", normal: "M 41–53%, F 36–46%", nursing: "Roughly 3× hemoglobin. Low = anemia, dilution. High = dehydration, polycythemia." },
      { test: "Platelets", normal: "150,000–450,000/mm³", critical: "<50,000 or >1,000,000", nursing: "<50k bleeding precautions, no IM injections. <20k spontaneous bleeding risk." },
    ],
  },
  {
    panel: "Basic Metabolic Panel (BMP)",
    labs: [
      { test: "Sodium (Na+)", normal: "135–145 mEq/L", critical: "<120 or >160", nursing: "Hyponatremia: seizure risk. Correct slowly to avoid central pontine myelinolysis." },
      { test: "Potassium (K+)", normal: "3.5–5.0 mEq/L", critical: "<2.5 or >6.5", nursing: "Peaked T waves on EKG = hyperkalemia. <3.0 = digoxin toxicity risk." },
      { test: "Chloride (Cl-)", normal: "98–106 mEq/L", nursing: "Tracks with sodium and acid-base status." },
      { test: "CO2 (bicarb)", normal: "22–28 mEq/L", nursing: "<22 metabolic acidosis. >28 metabolic alkalosis or compensation." },
      { test: "BUN", normal: "7–20 mg/dL", nursing: "Elevated: dehydration, GI bleed, AKI, high-protein diet." },
      { test: "Creatinine", normal: "0.6–1.2 mg/dL", critical: ">4.0", nursing: "Renal function marker. Hold metformin and adjust nephrotoxic drugs if elevated." },
      { test: "BUN:Cr ratio", normal: "10:1 to 20:1", nursing: ">20:1 suggests prerenal cause (dehydration, GI bleed)." },
      { test: "Glucose (fasting)", normal: "70–100 mg/dL", critical: "<40 or >500", nursing: "<70 treat hypoglycemia. >250 with ketones = DKA workup." },
      { test: "Calcium (total)", normal: "8.5–10.5 mg/dL", critical: "<7 or >13", nursing: "Hypocalcemia: Trousseau and Chvostek signs, seizure risk." },
      { test: "Magnesium", normal: "1.5–2.5 mg/dL", nursing: "Low: tetany, torsades de pointes. High: hyporeflexia, respiratory depression." },
      { test: "Phosphorus", normal: "2.5–4.5 mg/dL", nursing: "Inversely related to calcium. Refeeding syndrome risk." },
    ],
  },
  {
    panel: "Arterial Blood Gas (ABG)",
    labs: [
      { test: "pH", normal: "7.35–7.45", critical: "<7.20 or >7.60", nursing: "<7.35 acidosis. >7.45 alkalosis. Drives the entire interpretation." },
      { test: "PaCO2", normal: "35–45 mmHg", nursing: "Respiratory parameter. >45 respiratory acidosis, <35 respiratory alkalosis." },
      { test: "HCO3-", normal: "22–26 mEq/L", nursing: "Metabolic parameter. <22 metabolic acidosis, >26 metabolic alkalosis." },
      { test: "PaO2", normal: "80–100 mmHg", critical: "<60", nursing: "<60 mmHg = respiratory failure. Increase FiO2 or escalate." },
      { test: "SaO2", normal: "95–100%", critical: "<88%", nursing: "<88% requires intervention. <92% in non-COPD is concerning." },
    ],
  },
  {
    panel: "Coagulation",
    labs: [
      { test: "PT", normal: "11–13 seconds", nursing: "Extrinsic pathway. Affected by warfarin and liver disease." },
      { test: "INR (untreated)", normal: "0.8–1.2", critical: ">5", nursing: "Therapeutic on warfarin 2–3 (most), 2.5–3.5 (mechanical valve). >5 risk of bleeding." },
      { test: "aPTT", normal: "30–40 seconds", nursing: "Intrinsic pathway. Therapeutic on heparin 60–80 (1.5–2.5× baseline)." },
      { test: "D-dimer", normal: "<500 ng/mL FEU", nursing: "Elevated in PE, DVT, DIC. Rule-out test for thromboembolism." },
    ],
  },
  {
    panel: "Cardiac markers",
    labs: [
      { test: "Troponin I", normal: "<0.04 ng/mL", nursing: ">0.04 myocardial injury. Rises 3–4 hr post-MI, peaks 24 hr, persists 1–2 weeks." },
      { test: "CK-MB", normal: "0–3% of total CK", nursing: "Rises 4–6 hr post-MI. Less specific than troponin." },
      { test: "BNP", normal: "<100 pg/mL", nursing: ">400 heart failure likely. >900 severe HF. Use to assess volume status." },
    ],
  },
  {
    panel: "Liver function",
    labs: [
      { test: "ALT (SGPT)", normal: "7–56 U/L", nursing: "Liver-specific. Elevated in hepatitis, fatty liver, acetaminophen toxicity." },
      { test: "AST (SGOT)", normal: "10–40 U/L", nursing: "Less liver-specific. Also elevated in muscle injury, MI." },
      { test: "Alkaline phosphatase", normal: "44–147 U/L", nursing: "Elevated in cholestasis, bone disease, pregnancy." },
      { test: "Total bilirubin", normal: "0.1–1.2 mg/dL", nursing: ">2.5 visible jaundice. Indirect = hemolysis, direct = obstruction." },
      { test: "Albumin", normal: "3.5–5.0 g/dL", nursing: "Low: malnutrition, liver disease, nephrotic syndrome." },
    ],
  },
  {
    panel: "Lipid panel (fasting)",
    labs: [
      { test: "Total cholesterol", normal: "<200 mg/dL", nursing: ">240 = high. Lifestyle + statin discussion." },
      { test: "LDL", normal: "<100 mg/dL", nursing: "<70 for high cardiovascular risk patients." },
      { test: "HDL", normal: "M >40, F >50 mg/dL", nursing: "Higher is better. Exercise raises HDL." },
      { test: "Triglycerides", normal: "<150 mg/dL", nursing: ">500 acute pancreatitis risk." },
    ],
  },
  {
    panel: "Therapeutic drug levels",
    labs: [
      { test: "Digoxin", normal: "0.5–2.0 ng/mL", nursing: "Toxicity: nausea, vision changes, dysrhythmias, especially with low K+." },
      { test: "Lithium", normal: "0.6–1.2 mEq/L", critical: ">1.5", nursing: "Narrow therapeutic window. Toxicity: tremor, confusion, seizure." },
      { test: "Phenytoin (Dilantin)", normal: "10–20 mcg/mL", nursing: "Toxicity: nystagmus, ataxia, gingival hyperplasia." },
      { test: "Vancomycin trough", normal: "10–20 mcg/mL", nursing: "Draw 30 min before next dose. Nephrotoxic and ototoxic." },
      { test: "Acetaminophen", normal: "<25 mcg/mL (4 hr post)", nursing: ">150 at 4 hr = N-acetylcysteine indicated." },
    ],
  },
];

export default function Page() {
  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "NCLEX Lab Values Cheat Sheet — Complete 2026 Reference",
    image: `${SITE_URL}/logo.png`,
    author: { "@type": "Organization", name: "Clarity Clinical Prep", url: SITE_URL },
    publisher: {
      "@type": "Organization",
      name: "Clarity Clinical Prep",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` },
    },
    datePublished: "2026-05-26",
    dateModified: new Date().toISOString().slice(0, 10),
    mainEntityOfPage: `${SITE_URL}/nclex-lab-values`,
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Which lab values do I need to memorize for NCLEX?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The high-yield list: sodium, potassium, calcium, magnesium, glucose, BUN, creatinine, hemoglobin, hematocrit, platelets, WBC, INR, aPTT, ABG values (pH, PaCO2, HCO3, PaO2), troponin, BNP, and the therapeutic drug levels for digoxin, lithium, phenytoin, and vancomycin. Knowing these 20 values covers ~95% of NCLEX lab questions.",
        },
      },
      {
        "@type": "Question",
        name: "What is the critical value for potassium on NCLEX?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Critical potassium values are below 2.5 mEq/L or above 6.5 mEq/L. Hyperkalemia above 6.5 causes peaked T waves and risk of fatal dysrhythmia. Hypokalemia below 2.5 increases digoxin toxicity risk and causes muscle weakness, U waves, and dysrhythmias.",
        },
      },
      {
        "@type": "Question",
        name: "What does INR therapeutic range mean on warfarin?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Therapeutic INR on warfarin is 2.0–3.0 for most conditions (atrial fibrillation, DVT/PE, ischemic stroke prevention) and 2.5–3.5 for mechanical heart valves. INR above 5 carries significant bleeding risk; above 10 requires vitamin K reversal.",
        },
      },
      {
        "@type": "Question",
        name: "What ABG pattern is respiratory acidosis?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Respiratory acidosis: pH below 7.35 with PaCO2 above 45 mmHg. Caused by hypoventilation (COPD exacerbation, opioid overdose, neuromuscular weakness). Treatment: improve ventilation. If HCO3 is also elevated, partial metabolic compensation is occurring.",
        },
      },
      {
        "@type": "Question",
        name: "When should I worry about a vancomycin trough?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Vancomycin trough above 20 mcg/mL carries nephrotoxicity risk. Trough should be drawn 30 minutes before the next scheduled dose. Therapeutic range is 10–20 mcg/mL for serious infections (15–20 for MRSA bacteremia, endocarditis, meningitis).",
        },
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[var(--c-bg)] px-4 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(article) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <article className="mx-auto max-w-[1080px]">
        <header className="mb-10">
          <span className="text-[0.78rem] font-bold uppercase tracking-[0.18em] text-[var(--c-gold)]">
            NCLEX cheat sheet · 2026
          </span>
          <h1 className="mt-4 text-[clamp(2.4rem,4.8vw,4.4rem)] font-serif leading-[1.05]">
            NCLEX lab values cheat sheet
          </h1>
          <p className="mt-5 max-w-[60rem] text-base leading-8 text-[var(--c-text-muted)]">
            Every lab value tested on the NCLEX-RN with normal range, critical value, and the
            priority nursing action when it's abnormal. Bookmark this page, screenshot it, share
            it. Updated to the 2026 NCSBN test plan.
          </p>
        </header>

        {PANELS.map((p) => (
          <section key={p.panel} className="mb-10">
            <h2 className="text-[clamp(1.6rem,3vw,2.2rem)] font-serif">{p.panel}</h2>
            <div className="mt-4 overflow-x-auto rounded-[12px] border border-[var(--c-border)] bg-[var(--c-bg-elevated)]">
              <table className="w-full text-sm">
                <thead className="bg-[rgba(126,157,134,0.10)]">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Test</th>
                    <th className="px-4 py-3 text-left font-semibold">Normal range</th>
                    <th className="px-4 py-3 text-left font-semibold">Critical</th>
                    <th className="px-4 py-3 text-left font-semibold">Priority nursing action</th>
                  </tr>
                </thead>
                <tbody>
                  {p.labs.map((l, i) => (
                    <tr key={l.test} className={i % 2 === 0 ? "bg-white" : ""}>
                      <td className="px-4 py-3 font-semibold">{l.test}</td>
                      <td className="px-4 py-3">{l.normal}</td>
                      <td className="px-4 py-3 text-[var(--c-text-muted)]">{l.critical ?? "—"}</td>
                      <td className="px-4 py-3 text-[var(--c-text-muted)]">{l.nursing}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}

        <section className="prose prose-lg mt-10 max-w-none text-[var(--c-text)]">
          <h2>How NCLEX tests lab values</h2>
          <p>
            Lab value questions on the NCLEX rarely ask "what is the normal range?" They ask:
          </p>
          <ul>
            <li>Which lab change is the priority concern in this client?</li>
            <li>Which finding requires immediate provider notification?</li>
            <li>Which lab result would prompt the nurse to hold a medication?</li>
            <li>Which assessment finding is consistent with this lab abnormality?</li>
          </ul>
          <p>
            Memorize the ranges, but practice applying them. The Clarity question bank includes
            500+ lab-interpretation questions with full rationales and citation to Davis's Lab
            Tests and Lewis Med-Surg.
          </p>
        </section>

        <div className="mt-10 rounded-[12px] border border-[var(--c-gold)] bg-[rgba(176,141,87,0.08)] p-6 text-center">
          <p className="text-base leading-7">
            Practice lab interpretation with 5 free NCLEX-RN questions covering electrolyte
            emergencies, ABG analysis, and drug-level monitoring.
          </p>
          <Link
            href="/free/nclex-pharmacology-questions"
            className="mt-5 inline-flex rounded-[8px] bg-[var(--c-sage-deep)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--c-sage-deep-hover)]"
          >
            Try free lab + pharmacology questions →
          </Link>
        </div>
      </article>
    </main>
  );
}
