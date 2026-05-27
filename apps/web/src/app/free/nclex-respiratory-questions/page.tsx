import type { Metadata } from "next";
import FreeLandingPage from "@/components/seo/FreeLandingPage";
import { SEED_RESPIRATORY } from "@/content/free-landings/extra-questions";
import { SEED_CASE_STUDIES } from "@/content/free-landings/seed-questions";

const SLUG = "nclex-respiratory-questions";
const SITE_URL = "https://claritynclex.com";

export const metadata: Metadata = {
  title: "Free NCLEX Respiratory Questions | COPD, ARDS, PE, Oxygen Delivery",
  description:
    "Free NCLEX-RN respiratory practice questions: COPD with CO2 retention, status asthmaticus silent chest, chest tube management, ABG interpretation. Full rationales.",
  alternates: { canonical: `/free/${SLUG}` },
  keywords: [
    "free NCLEX respiratory questions",
    "NCLEX respiratory practice",
    "NCLEX COPD questions",
    "free nursing respiratory NCLEX",
    "NCLEX ABG questions",
  ],
  openGraph: {
    title: "Free NCLEX Respiratory Questions",
    description: "COPD, ARDS, PE, oxygen delivery. Free rationales.",
    url: `${SITE_URL}/free/${SLUG}`,
    type: "article",
  },
};

const Qs = [SEED_RESPIRATORY[0], SEED_RESPIRATORY[1], SEED_RESPIRATORY[2], SEED_CASE_STUDIES[1]];

export default function Page() {
  return (
    <FreeLandingPage
      slug={SLUG}
      h1="Free NCLEX respiratory questions with full rationales"
      metaTitle={metadata.title as string}
      metaDescription={metadata.description as string}
      intro={
        <p>
          Four free NCLEX-RN respiratory questions covering CO2 narcosis in COPD, chest tube
          air leaks, status asthmaticus warning signs, and anaphylaxis with airway compromise.
          Respiratory items are airway-priority items — they often answer the "see this client
          first" question.
        </p>
      }
      body={
        <>
          <h2>Top respiratory topics on NCLEX-RN</h2>
          <ul>
            <li><strong>COPD with CO2 retention.</strong> Target SpO2 88–92% only. Higher O2 saturations can blunt hypoxic drive and worsen hypercapnia.</li>
            <li><strong>Asthma exacerbation.</strong> Silent chest = impending respiratory failure. Albuterol, ipratropium, steroids, magnesium escalation.</li>
            <li><strong>Pulmonary embolism.</strong> Sudden dyspnea, pleuritic chest pain, tachycardia, hypoxia. D-dimer + CT angiography. Anticoagulation.</li>
            <li><strong>ARDS.</strong> Bilateral infiltrates, PaO2/FiO2 ratio &lt; 300, refractory hypoxia. Low tidal volume ventilation, prone positioning.</li>
            <li><strong>Chest tube management.</strong> Continuous bubbling = air leak. Tidaling = patent system. Cessation of drainage with respiratory distress = possible occlusion.</li>
            <li><strong>Tracheostomy emergencies.</strong> Decannulation, mucus plug, bleeding. Always have a spare trach at bedside.</li>
          </ul>

          <h2>Master the ABG in 4 steps</h2>
          <ol>
            <li><strong>pH.</strong> Above 7.45 alkalosis. Below 7.35 acidosis.</li>
            <li><strong>PaCO2.</strong> Respiratory cause if pH and PaCO2 move opposite directions.</li>
            <li><strong>HCO3.</strong> Metabolic cause if pH and HCO3 move same direction.</li>
            <li><strong>Compensation.</strong> If both PaCO2 and HCO3 are abnormal, the body is compensating. Fully normal pH = full compensation.</li>
          </ol>

          <h2>Oxygen delivery decision tree</h2>
          <ul>
            <li>Nasal cannula 1–6 L → ~24–44% FiO2.</li>
            <li>Simple mask 6–10 L → ~35–55% FiO2.</li>
            <li>Venturi mask → precise FiO2 control, ideal for COPD.</li>
            <li>Non-rebreather 10–15 L → ~80–95% FiO2.</li>
            <li>High-flow nasal cannula or BiPAP → escalation when FiO2 above 50% needed.</li>
            <li>Intubation → for refractory hypoxia, hypercapnia with acidosis, or airway protection.</li>
          </ul>
        </>
      }
      questions={Qs}
      faqs={[
        { question: "What SpO2 should I target in a COPD patient?", answer: "88–92% for chronic CO2 retainers. Higher saturations risk blunting hypoxic drive and worsening hypercapnia. Use the Venturi mask for precise FiO2 control." },
        { question: "What is a silent chest in asthma?", answer: "Absence of audible wheezing in an asthmatic in crisis. It is NOT improvement — it means airways are so narrowed that air movement is minimal. Sign of impending respiratory failure requiring immediate escalation." },
        { question: "When do I worry about chest tube bubbling?", answer: "Continuous bubbling in the water seal indicates an air leak from the lung, tubing, or insertion site. Intermittent bubbling with cough or exhalation is normal. Cessation of bubbling can mean lung re-expansion (good) or tube occlusion (bad)." },
        { question: "How do I interpret a quick ABG?", answer: "pH first (acidosis vs alkalosis), then PaCO2 (respiratory cause if moves opposite to pH), then HCO3 (metabolic cause if moves with pH). Mixed disorders if both abnormal. Compensated if pH near normal." },
      ]}
      relatedSlugs={[
        { slug: "nclex-cardiac-questions", label: "Free NCLEX cardiac questions" },
        { slug: "nclex-case-studies", label: "Free NCLEX case studies" },
        { slug: "nclex-pharmacology-questions", label: "Free NCLEX pharmacology questions" },
        { slug: "nclex-lab-values-questions", label: "Free NCLEX lab values questions" },
        { slug: "nclex-prioritization-questions", label: "Free NCLEX prioritization questions" },
        { slug: "nclex-practice-exam", label: "Free NCLEX practice exam" },
      ]}
    />
  );
}
