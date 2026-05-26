import type { Metadata } from "next";
import FreeLandingPage from "@/components/seo/FreeLandingPage";
import { SEED_SAFETY } from "@/content/free-landings/extra-questions";
import { SEED_SATA } from "@/content/free-landings/seed-questions";

const SLUG = "nclex-safety-questions";
const SITE_URL = "https://claritynclex.com";

export const metadata: Metadata = {
  title: "Free NCLEX Safety Questions | Infection Control, Restraints, Falls",
  description:
    "Free NCLEX-RN safety and infection control practice: sentinel events, airborne vs droplet vs contact precautions, restraint rules, fall risk. Full rationales.",
  alternates: { canonical: `/free/${SLUG}` },
  keywords: [
    "free NCLEX safety questions",
    "NCLEX infection control practice",
    "NCLEX safety practice",
    "free nursing safety NCLEX",
    "NCLEX precautions questions",
  ],
  openGraph: {
    title: "Free NCLEX Safety Questions",
    description: "Infection control, restraints, falls. Free rationales.",
    url: `${SITE_URL}/free/${SLUG}`,
    type: "article",
  },
};

const Qs = [...SEED_SAFETY, SEED_SATA[2]];

export default function Page() {
  return (
    <FreeLandingPage
      slug={SLUG}
      h1="Free NCLEX safety and infection control questions"
      metaTitle={metadata.title as string}
      metaDescription={metadata.description as string}
      intro={
        <p>
          Four free NCLEX-RN safety and infection control items covering sentinel events,
          airborne precautions for TB, restraint rules, and SATA TB precautions. Safety is
          10–16% of the test and overlaps with Management of Care priority questions.
        </p>
      }
      body={
        <>
          <h2>The 4 isolation precaution categories every NCLEX student must know</h2>
          <ul>
            <li>
              <strong>Standard precautions.</strong> Universal for every client. Hand hygiene,
              gloves with body fluid contact, PPE based on anticipated exposure.
            </li>
            <li>
              <strong>Contact precautions.</strong> Gown + gloves. Used for C. diff, MRSA, VRE,
              draining wounds, scabies, RSV. For C. diff, soap and water hand hygiene (alcohol
              doesn't kill spores).
            </li>
            <li>
              <strong>Droplet precautions.</strong> Surgical mask within 3 feet. Used for
              influenza, pertussis, meningitis (until 24 hr of antibiotics), rubella, mumps.
            </li>
            <li>
              <strong>Airborne precautions.</strong> Negative-pressure room + N95 respirator or
              PAPR. Used for TB, measles, varicella, disseminated zoster, COVID-19 with aerosol-
              generating procedures.
            </li>
          </ul>

          <h2>Sentinel event vs near miss vs error</h2>
          <ul>
            <li><strong>Sentinel event:</strong> unanticipated event involving death or serious physical/psychological injury. Requires immediate RCA.</li>
            <li><strong>Adverse event:</strong> patient harm from care delivery (not always preventable).</li>
            <li><strong>Near miss:</strong> error that did not reach the patient (interception, luck, or detection).</li>
            <li><strong>Medical error:</strong> failure to complete a planned action correctly.</li>
          </ul>

          <h2>Restraint rules tested on NCLEX</h2>
          <ul>
            <li>Use the least-restrictive option that ensures safety.</li>
            <li>Requires a provider order — within 1 hour for behavioral restraints.</li>
            <li>Behavioral restraints: re-evaluate every hour (adult) or every 30 min (child).</li>
            <li>Medical restraints: re-evaluate every 24 hr.</li>
            <li>Tie restraints to bed frame, NOT side rails (rail movement can cause injury).</li>
            <li>Quick-release knot.</li>
            <li>Monitor skin, circulation, ROM every 2 hours minimum.</li>
            <li>Document: rationale, type, time, monitoring findings.</li>
          </ul>

          <h2>The 5 fall-risk red flags</h2>
          <ol>
            <li>Age &gt; 65.</li>
            <li>Multiple medications, especially benzodiazepines, opioids, antihypertensives.</li>
            <li>History of prior fall in past 6 months.</li>
            <li>Cognitive impairment or delirium.</li>
            <li>Orthostatic hypotension or gait/balance impairment.</li>
          </ol>

          <h2>Hand hygiene rules</h2>
          <p>
            Alcohol-based sanitizer for routine. Soap and water for: visibly soiled hands, C.
            diff, norovirus, after using the restroom, before eating. Friction matters more
            than time — 15 seconds of good technique beats 30 seconds of poor.
          </p>
        </>
      }
      questions={Qs}
      faqs={[
        { question: "What's the difference between airborne and droplet precautions?", answer: "Airborne: small particles that travel in the air, requiring negative pressure rooms and N95. Examples: TB, measles, varicella. Droplet: larger particles that fall within 3 feet, requiring a surgical mask. Examples: flu, pertussis, meningitis." },
        { question: "Why do C. diff patients need soap and water?", answer: "Alcohol-based sanitizer does not kill C. diff spores. Soap and water with friction physically removes the spores from your hands. Always use soap and water before AND after contact with C. diff patients." },
        { question: "What's a sentinel event?", answer: "An unexpected event involving death or serious physical or psychological injury. Examples: wrong-site surgery, suicide of an inpatient, infant abduction, hemolytic transfusion reaction. Requires immediate root cause analysis." },
        { question: "How often do restraints need reassessment?", answer: "Behavioral restraints: every 15–30 min monitoring, full reassessment every hour (adult) or every 30 min (child). Medical restraints (less common): reassess at least every 24 hours, monitor skin/circulation every 2 hours minimum." },
      ]}
      relatedSlugs={[
        { slug: "nclex-delegation-questions", label: "Free NCLEX delegation questions" },
        { slug: "nclex-prioritization-questions", label: "Free NCLEX prioritization questions" },
        { slug: "nclex-pharmacology-questions", label: "Free NCLEX pharmacology questions" },
        { slug: "nclex-case-studies", label: "Free NCLEX case studies" },
        { slug: "nclex-sata-questions", label: "Free NCLEX SATA questions" },
        { slug: "nclex-practice-exam", label: "Free NCLEX practice exam" },
      ]}
    />
  );
}
