import type { Metadata } from "next";
import FreeLandingPage from "@/components/seo/FreeLandingPage";
import { SEED_CARDIAC } from "@/content/free-landings/extra-questions";
import { SEED_CASE_STUDIES } from "@/content/free-landings/seed-questions";

const SLUG = "nclex-cardiac-questions";
const SITE_URL = "https://claritynclex.com";

export const metadata: Metadata = {
  title: "Free NCLEX Cardiac Questions | ACS, Heart Failure, Dysrhythmias Practice",
  description:
    "Free NCLEX-RN cardiac practice questions on acute coronary syndrome, heart failure, dysrhythmias, hemodynamics, and post-cath complications. Full rationales.",
  alternates: { canonical: `/free/${SLUG}` },
  keywords: [
    "free NCLEX cardiac questions",
    "NCLEX cardiac practice",
    "NCLEX heart failure questions",
    "NCLEX-RN ACS questions",
    "free nursing cardiac NCLEX",
  ],
  openGraph: {
    title: "Free NCLEX Cardiac Questions",
    description: "ACS, heart failure, dysrhythmias, hemodynamics. Free rationales.",
    url: `${SITE_URL}/free/${SLUG}`,
    type: "article",
  },
};

const Qs = [SEED_CARDIAC[0], SEED_CARDIAC[1], SEED_CARDIAC[2], SEED_CASE_STUDIES[0]];

export default function Page() {
  return (
    <FreeLandingPage
      slug={SLUG}
      h1="Free NCLEX cardiac questions with full rationales"
      metaTitle={metadata.title as string}
      metaDescription={metadata.description as string}
      intro={
        <p>
          Four free NCLEX-RN cardiac questions covering decompensated heart failure,
          nitroglycerin titration, post-cath assessment, and inferior STEMI management. Cardiac
          is one of the highest-weighted NCLEX content areas — get it right and you secure a
          large chunk of the test.
        </p>
      }
      body={
        <>
          <h2>What cardiac topics dominate the NCLEX?</h2>
          <ul>
            <li><strong>Acute coronary syndrome.</strong> STEMI, NSTEMI, unstable angina. EKG lead interpretation, MONA-B mnemonic, contraindications to nitroglycerin (RV infarct, sildenafil within 24 hr).</li>
            <li><strong>Heart failure.</strong> Left- vs right-sided, HFrEF vs HFpEF, BNP interpretation, diuretic management, ACE inhibitor side effects, beta-blocker initiation rules.</li>
            <li><strong>Dysrhythmias.</strong> Atrial fibrillation (rate vs rhythm control, anticoagulation), bradycardia (atropine, pacing), V-tach (pulseless vs with pulse), V-fib (defibrillation), torsades de pointes (magnesium).</li>
            <li><strong>Hemodynamics.</strong> Cardiac tamponade triad (Beck's), aortic dissection, cardiogenic shock, pulmonary embolism.</li>
            <li><strong>Post-procedure.</strong> Cardiac catheterization site assessment, distal pulse monitoring, restrictions, watch for retroperitoneal bleed.</li>
          </ul>

          <h2>The 5 cardiac patterns that win NCLEX cardiac questions</h2>
          <ol>
            <li><strong>Unstable = priority.</strong> Hypotension, new dysrhythmia, decreasing LOC — these clients beat stable ones every time.</li>
            <li><strong>EKG changes drive action.</strong> ST elevation in 2+ contiguous leads = STEMI = cath lab. Peaked T waves = hyperkalemia.</li>
            <li><strong>Right-sided MI = preload-dependent.</strong> Avoid nitroglycerin, give fluids, watch for hypotension.</li>
            <li><strong>Heart failure backs up.</strong> Left = lungs (crackles, dyspnea). Right = systemic (JVD, edema, ascites).</li>
            <li><strong>The antidote rule.</strong> Heparin → protamine. Warfarin → vitamin K. Digoxin → digoxin immune Fab.</li>
          </ol>
        </>
      }
      questions={Qs}
      faqs={[
        { question: "What's the most-tested NCLEX cardiac topic?", answer: "Heart failure assessment and acute coronary syndrome management consistently appear on every NCLEX-RN. Together they make up roughly half of all cardiac items." },
        { question: "How do I memorize EKG strips for NCLEX?", answer: "Memorize 8 rhythms cold: NSR, sinus brady, sinus tach, A-fib, A-flutter, V-tach, V-fib, asystole. For each, know the priority intervention. You don't need 12-lead interpretation depth on NCLEX." },
        { question: "Is nitroglycerin ever contraindicated in chest pain?", answer: "Yes. Hold nitroglycerin if systolic BP <90, suspected right-ventricular MI, or use of PDE-5 inhibitors (sildenafil, tadalafil) within 24–48 hours due to severe hypotension risk." },
        { question: "What's the priority assessment after cardiac catheterization?", answer: "Distal pulses, color, temperature, and capillary refill in the affected extremity. Compare to the opposite side. Diminished pulse or cool/mottled extremity suggests arterial compromise requiring immediate notification." },
      ]}
      relatedSlugs={[
        { slug: "nclex-respiratory-questions", label: "Free NCLEX respiratory questions" },
        { slug: "nclex-pharmacology-questions", label: "Free NCLEX pharmacology questions" },
        { slug: "nclex-case-studies", label: "Free NCLEX case studies" },
        { slug: "nclex-prioritization-questions", label: "Free NCLEX prioritization questions" },
        { slug: "nclex-lab-values-questions", label: "Free NCLEX lab values questions" },
        { slug: "nclex-practice-exam", label: "Free NCLEX practice exam" },
      ]}
    />
  );
}
