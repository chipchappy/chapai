import type { Metadata } from "next";
import FreeLandingPage from "@/components/seo/FreeLandingPage";
import { SEED_PHARM } from "@/content/free-landings/seed-questions";

const SLUG = "nclex-pharmacology-questions";
const SITE_URL = "https://claritynclex.com";

export const metadata: Metadata = {
  title: "Free NCLEX Pharmacology Questions | Drug Safety Practice with Rationales",
  description:
    "Free NCLEX-RN pharmacology questions covering heparin, digoxin, ACE inhibitors, vancomycin, and metformin safety. Full rationales, no signup.",
  alternates: { canonical: `/free/${SLUG}` },
  keywords: [
    "free NCLEX pharmacology questions",
    "NCLEX pharmacology practice",
    "free nursing pharmacology questions",
    "NCLEX drug questions free",
    "NCLEX medication safety questions",
  ],
  openGraph: {
    title: "Free NCLEX Pharmacology Questions | Drug Safety Practice",
    description: "Free NCLEX pharmacology practice with full rationales.",
    url: `${SITE_URL}/free/${SLUG}`,
    type: "article",
  },
};

export default function Page() {
  return (
    <FreeLandingPage
      slug={SLUG}
      h1="Free NCLEX pharmacology questions with full rationales"
      metaTitle={metadata.title as string}
      metaDescription={metadata.description as string}
      intro={
        <p>
          Pharmacology and parenteral therapies make up 13–19% of every NCLEX-RN and account for
          more first-attempt failures than any single category. Five free questions below covering
          the highest-yield drugs: heparin, digoxin, ACE inhibitors, vancomycin, and metformin.
          Each with a full clinical rationale.
        </p>
      }
      body={
        <>
          <h2>What pharmacology topics dominate the NCLEX-RN?</h2>
          <p>The NCSBN test plan emphasizes these pharm categories:</p>
          <ul>
            <li>
              <strong>Anticoagulants.</strong> Heparin, warfarin, DOACs. Bleeding precautions,
              antidotes, lab monitoring (aPTT, INR, anti-Xa).
            </li>
            <li>
              <strong>Cardiac drugs.</strong> Digoxin (apical pulse, toxicity at low potassium),
              beta-blockers, ACE inhibitors (angioedema, dry cough, K+), nitrates (hypotension).
            </li>
            <li>
              <strong>Insulin.</strong> Onset, peak, duration of regular, NPH, lispro, glargine.
              Sliding scale rules, hypoglycemia management.
            </li>
            <li>
              <strong>Antibiotics.</strong> Vancomycin (trough, nephrotoxicity, red man syndrome),
              aminoglycosides (ototoxicity), penicillin/cephalosporin allergies.
            </li>
            <li>
              <strong>Opioids.</strong> Respiratory depression as the priority adverse effect,
              naloxone reversal, addiction-monitoring vs pain undertreatment.
            </li>
            <li>
              <strong>Mental health drugs.</strong> Lithium therapeutic range and toxicity, SSRIs
              and serotonin syndrome, MAOIs and tyramine, antipsychotics and EPS/NMS.
            </li>
          </ul>

          <h2>The single highest-yield pharm rule for the NCLEX</h2>
          <p>
            <strong>Treat the dangerous effect first, then correct the cause.</strong> If a client
            has a supratherapeutic INR with active bleeding, you stop the warfarin and consider
            reversal — you don't lecture them about diet first. If a client on insulin has glucose
            of 38, you treat the hypoglycemia — you don't analyze why it dropped first.
          </p>
          <p>
            This rule catches most NCLEX pharm priority questions. The "correct" answer is almost
            always the one that addresses the most immediate physiological threat.
          </p>

          <h2>Black-box warnings to memorize cold</h2>
          <ul>
            <li>
              <strong>Warfarin:</strong> bleeding risk including fatal intracranial hemorrhage.
            </li>
            <li>
              <strong>SSRIs in patients under 25:</strong> increased suicidal ideation.
            </li>
            <li>
              <strong>Antipsychotics in elderly with dementia:</strong> increased mortality.
            </li>
            <li>
              <strong>Fluoroquinolones (cipro, levofloxacin):</strong> tendon rupture, especially
              Achilles, especially in patients on steroids.
            </li>
            <li>
              <strong>Metformin with iodinated contrast:</strong> lactic acidosis from
              contrast-induced AKI. Hold metformin 48 hours after contrast.
            </li>
            <li>
              <strong>Long-acting beta-agonists (salmeterol) in asthma:</strong> increased risk of
              asthma death when used as monotherapy.
            </li>
          </ul>

          <h2>How to study NCLEX pharmacology efficiently</h2>
          <p>
            Don't try to memorize every drug. Memorize <em>classes</em>. If you know that
            "anything ending in -pril is an ACE inhibitor that causes dry cough, hyperkalemia, and
            angioedema," you can answer questions about lisinopril, enalapril, ramipril, and
            captopril with one mental model.
          </p>
          <p>
            Build a one-page sheet for each drug class with: prototype drug, mechanism, top 3
            indications, top 3 adverse effects, contraindications, monitoring labs, and the
            antidote/reversal agent. Twelve sheets covers most of NCLEX pharmacology.
          </p>
        </>
      }
      questions={SEED_PHARM}
      faqs={[
        {
          question: "What percentage of the NCLEX is pharmacology?",
          answer:
            "Pharmacological and parenteral therapies make up 13–19% of the NCLEX-RN, which works out to roughly 10–28 items on a 75–145 question exam. It's one of the largest single categories.",
        },
        {
          question: "How do I memorize NCLEX drug names?",
          answer:
            "Memorize drug classes by suffix, not individual drugs. -pril = ACE inhibitor, -sartan = ARB, -olol = beta-blocker, -statin = HMG-CoA reductase inhibitor, -prazole = PPI, -caine = local anesthetic. One mental model covers an entire class.",
        },
        {
          question: "What pharmacology resource is best for NCLEX prep?",
          answer:
            "Davis Drug Guide is the standard reference. For high-yield NCLEX-specific pharm, NurseInTheMaking IG, Pharmacology Made Easy (ATI), and Clarity's 200-card pharm library are widely used.",
        },
        {
          question: "Are pharmacology questions on the NCLEX hard?",
          answer:
            "They're often considered the hardest single category because they require both memorization (drug names, doses, mechanisms) and clinical judgment (recognizing toxicity, prioritizing safety). Volume of practice is the biggest predictor of success.",
        },
        {
          question: "What are black-box warnings on the NCLEX?",
          answer:
            "Black-box warnings are the FDA's strongest drug safety alerts and appear regularly on NCLEX questions. Memorize at least 12: warfarin, SSRIs in youth, antipsychotics in elderly, fluoroquinolones, metformin with contrast, long-acting beta-agonists in asthma, opioids, methotrexate, isotretinoin, tamoxifen, infliximab, and digoxin toxicity.",
        },
      ]}
      relatedSlugs={[
        { slug: "nclex-practice-questions", label: "Free NCLEX practice questions" },
        { slug: "nclex-sata-questions", label: "Free NCLEX SATA questions" },
        { slug: "nclex-prioritization-questions", label: "Free NCLEX prioritization questions" },
        { slug: "nclex-case-studies", label: "Free NCLEX case studies" },
        { slug: "nclex-cardiac-questions", label: "Free NCLEX cardiac questions" },
        { slug: "nclex-practice-exam", label: "Free NCLEX practice exam" },
      ]}
    />
  );
}
