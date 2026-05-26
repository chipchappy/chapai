import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = "https://claritynclex.com";

export const metadata: Metadata = {
  title: "NCLEX Glossary — 60 NCLEX Terms Every Nursing Student Should Know",
  description:
    "Plain-language definitions for 60 NCLEX-RN terms: NGN, CAT, CJMM, bow-tie, ATT, NCSBN, NLC, polytomous scoring, and more. Free reference for nursing students.",
  alternates: { canonical: "/nclex-glossary" },
  keywords: [
    "NCLEX glossary",
    "NCLEX terms",
    "what is NGN nursing",
    "NCLEX CAT explained",
    "CJMM nursing",
    "NCLEX vocabulary",
  ],
  openGraph: {
    title: "NCLEX Glossary — 60 Terms Every Nursing Student Should Know",
    description: "Plain-language definitions for 60 NCLEX-RN terms.",
    url: `${SITE_URL}/nclex-glossary`,
    type: "article",
  },
};

interface Term {
  term: string;
  definition: string;
}

const TERMS: Term[] = [
  { term: "NCLEX-RN", definition: "National Council Licensure Examination for Registered Nurses. The standardized exam every U.S. RN candidate must pass for licensure." },
  { term: "NCLEX-PN", definition: "National Council Licensure Examination for Practical Nurses. The LPN/LVN equivalent of the NCLEX-RN." },
  { term: "NCSBN", definition: "National Council of State Boards of Nursing. The body that writes and administers the NCLEX." },
  { term: "NGN (Next Generation NCLEX)", definition: "The post-April-2023 format of the NCLEX, with new item types (case studies, bow-tie, matrix, cloze, hotspot) designed to measure clinical judgment." },
  { term: "CAT (Computerized Adaptive Testing)", definition: "The format the NCLEX uses. Questions adapt in difficulty based on your performance. The test ends when the algorithm is 95% confident you're above or below the passing standard." },
  { term: "CJMM (Clinical Judgment Measurement Model)", definition: "NCSBN's six-step framework for clinical judgment: recognize cues, analyze cues, prioritize hypotheses, generate solutions, take actions, evaluate outcomes." },
  { term: "Passing standard", definition: "The minimum logit score needed to pass the NCLEX-RN. As of April 2023, it's -0.18 logits." },
  { term: "Logit", definition: "The unit of measurement on the NCLEX scoring scale. Item difficulty and candidate ability are measured on the same logit scale." },
  { term: "Case study", definition: "An NGN item type: one patient scenario followed by six sub-questions mapped to the six CJMM steps. Each NCLEX-RN includes 3 case studies (18 items total)." },
  { term: "Bow-tie", definition: "An NGN item with a three-zone answer: one condition in the center, two actions to take on the left, two parameters to monitor on the right." },
  { term: "Matrix item", definition: "An NGN item structured as a table of rows (findings or interventions) and columns (categories like 'indicated' / 'not indicated')." },
  { term: "Cloze (drop-down)", definition: "An NGN item with fill-in-the-blank using drop-down menus, often nested in a sentence like 'The nurse should administer [drug] because the client is in [condition].'" },
  { term: "Enhanced hotspot", definition: "An NGN item where you click words or phrases in a passage that are clinically significant." },
  { term: "Extended drag-and-drop", definition: "An NGN item where you order items into a sequence — typically nursing actions or steps of a procedure." },
  { term: "Extended multiple response", definition: "The NGN evolution of SATA (select-all-that-apply). Uses partial-credit (polytomous) scoring." },
  { term: "Polytomous scoring", definition: "Partial-credit scoring used on most NGN items: +1 for correct selection, -1 for incorrect, 0 for none. The total floors at zero so a single item can't drop you into the negatives." },
  { term: "Dichotomous scoring", definition: "All-or-nothing scoring used on traditional NCLEX multiple-choice items. Either correct or incorrect, no partial credit." },
  { term: "ATT (Authorization to Test)", definition: "The official document NCSBN issues that lets you schedule your NCLEX with Pearson VUE. Valid for 90 days." },
  { term: "Pearson VUE", definition: "The testing service that delivers the NCLEX at hundreds of testing centers worldwide." },
  { term: "Tryout questions", definition: "Approximately 15 questions on each NCLEX that are not scored. NCSBN uses them to calibrate future items. You can't tell which questions are tryout." },
  { term: "Client need categories", definition: "The eight content areas the NCLEX-RN test plan organizes around: Management of Care, Safety/Infection Control, Health Promotion, Psychosocial, Basic Care, Pharmacology, Reduction of Risk, Physiological Adaptation." },
  { term: "Test plan", definition: "NCSBN's published document detailing what the NCLEX tests, in what proportions. Updated every 3 years; current version is the 2026 NCLEX-RN Test Plan." },
  { term: "ADN", definition: "Associate Degree in Nursing. A two-year nursing degree that qualifies you to sit for the NCLEX-RN." },
  { term: "BSN", definition: "Bachelor of Science in Nursing. A four-year degree increasingly required by hospital employers, especially Magnet-designated facilities." },
  { term: "MSN", definition: "Master of Science in Nursing. Required for nurse practitioner, CNS, CRNA, and nursing education roles." },
  { term: "DNP", definition: "Doctor of Nursing Practice. The terminal practice degree for advanced practice registered nurses." },
  { term: "NLC (Nurse Licensure Compact)", definition: "An agreement among 40+ states that lets RNs and LPNs hold a multistate license valid across all compact states." },
  { term: "Endorsement", definition: "The process of obtaining a license in a new state based on an existing license in another state. Required when moving between non-compact states." },
  { term: "Single-state license", definition: "A nursing license valid only in the issuing state. Most non-compact-state licenses." },
  { term: "Multistate license", definition: "An NLC-compact license valid across all compact states. Issued by your primary state of residence if it's a compact state." },
  { term: "Five rights of delegation", definition: "NCSBN's framework: right task, right circumstance, right person, right direction, right supervision. Tested heavily on Management of Care items." },
  { term: "ABC priority", definition: "Airway-Breathing-Circulation. The foundational priority framework on the NCLEX. The client whose airway, breathing, or circulation is most threatened comes first." },
  { term: "Maslow's hierarchy", definition: "A priority framework used when all options seem physiologic: physiologic needs > safety > love/belonging > esteem > self-actualization." },
  { term: "ADPIE (nursing process)", definition: "Assessment → Diagnosis → Planning → Implementation → Evaluation. The nursing process. Assessment comes before intervention unless an emergency requires immediate action." },
  { term: "SBAR", definition: "Situation, Background, Assessment, Recommendation. The standardized format for handoff communication between providers." },
  { term: "Therapeutic communication", definition: "Communication techniques that promote client well-being: open-ended questions, reflection, silence, clarification. Tested heavily in psychiatric content." },
  { term: "Therapeutic drug level", definition: "The serum drug concentration that produces the intended effect without toxicity. Common NCLEX examples: digoxin 0.5–2.0 ng/mL, lithium 0.6–1.2 mEq/L, vancomycin trough 10–20 mcg/mL." },
  { term: "Black-box warning", definition: "The FDA's strongest drug safety alert, indicating a serious or life-threatening risk. NCLEX tests black-box warnings on warfarin, SSRIs in youth, fluoroquinolones, and metformin with contrast, among others." },
  { term: "Antidote", definition: "A drug that reverses the effects of another drug. NCLEX antidote pairings: heparin/protamine, warfarin/vitamin K, opioids/naloxone, benzodiazepines/flumazenil, acetaminophen/N-acetylcysteine." },
  { term: "Therapeutic INR", definition: "Target INR on warfarin. 2.0–3.0 for most conditions, 2.5–3.5 for mechanical heart valves." },
  { term: "aPTT", definition: "Activated partial thromboplastin time. Lab to monitor heparin therapy. Therapeutic 1.5–2.5× baseline, usually 60–80 seconds." },
  { term: "Pearson Vue trick", definition: "An unofficial method some test-takers use to guess if they passed the NCLEX before official results: attempting to re-register and seeing if the system blocks them. Not endorsed by NCSBN. Use the official Quick Results service ($7.95) for a confirmed result." },
  { term: "Quick Results", definition: "NCSBN's optional service ($7.95) that releases unofficial NCLEX results 48 business hours after the test. Final results come from your state board within 1–6 weeks." },
  { term: "Tabula rasa", definition: "Starting the NCLEX with a blank slate. The CAT algorithm has no prior data on you and begins at an estimated medium difficulty." },
  { term: "Run-out-of-time rule", definition: "If your NCLEX time expires before the algorithm reaches confidence, your performance on the last 60 items determines pass/fail." },
  { term: "Maximum-length rule", definition: "If you reach question 145 and the algorithm is still uncertain, your performance on the last 60 items is averaged against the passing standard." },
  { term: "Critical lab value", definition: "A lab result so abnormal it requires immediate provider notification. Examples: K+ <2.5 or >6.5, glucose <40 or >500, sodium <120 or >160, platelet <50,000." },
  { term: "Anticipatory grief", definition: "Grieving that occurs before a loss, common in family members of terminally ill clients. Tested in psychosocial integrity content." },
  { term: "Neutropenic precautions", definition: "Protective isolation for clients with absolute neutrophil count below 1,000. No fresh flowers, no raw vegetables, mask out of room, private room." },
  { term: "Airborne precautions", definition: "PPE for diseases spread by airborne droplet nuclei: TB, measles, varicella. Requires negative-pressure room and N95 respirator." },
  { term: "Droplet precautions", definition: "PPE for diseases spread by large respiratory droplets: flu, pertussis, meningitis. Requires surgical mask within 3 feet." },
  { term: "Contact precautions", definition: "PPE for diseases spread by direct contact or contaminated surfaces: C. diff, MRSA, VRE. Requires gown and gloves; soap-and-water hand hygiene for C. diff (alcohol does not kill spores)." },
  { term: "Standard precautions", definition: "Universal PPE used with every client regardless of diagnosis. Includes hand hygiene, gloves when contacting body fluids, and appropriate PPE based on anticipated exposure." },
  { term: "Sentinel event", definition: "An unexpected event involving death or serious physical or psychological injury. Requires immediate root-cause analysis and reporting." },
  { term: "Never events", definition: "Serious medical errors that should never happen: wrong-site surgery, retained foreign object, fall with serious injury, stage 3+ pressure ulcer." },
  { term: "Root cause analysis (RCA)", definition: "A structured process for identifying the underlying cause of a sentinel event so it doesn't recur. Tested in quality improvement content." },
  { term: "Just culture", definition: "An organizational framework that distinguishes human error from at-risk behavior from reckless behavior, balancing accountability with safety reporting." },
  { term: "Restraint criteria", definition: "Restraints require provider order (within 1 hour for behavioral), least-restrictive option first, monitoring every 15–30 min, and skin/circulation assessment every 2 hours." },
  { term: "Informed consent", definition: "The client's voluntary agreement to a procedure after the provider has explained risks, benefits, and alternatives. The nurse witnesses the signature; the provider obtains consent." },
  { term: "Advance directive", definition: "A legal document specifying a client's wishes about end-of-life care, including living will and durable power of attorney for health care." },
  { term: "DNR (Do Not Resuscitate)", definition: "An order specifying no CPR or advanced cardiac life support if the client arrests. Other interventions (comfort, IV fluids, antibiotics) continue unless specified otherwise." },
];

export default function Page() {
  const definedTerms = TERMS.map((t) => ({
    "@type": "DefinedTerm",
    name: t.term,
    description: t.definition,
    inDefinedTermSet: `${SITE_URL}/nclex-glossary`,
  }));

  const schema = {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    name: "NCLEX Glossary",
    url: `${SITE_URL}/nclex-glossary`,
    hasDefinedTerm: definedTerms,
  };

  return (
    <main className="min-h-screen bg-[var(--c-bg)] px-4 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div className="mx-auto max-w-[920px]">
        <header className="mb-10">
          <span className="text-[0.78rem] font-bold uppercase tracking-[0.18em] text-[var(--c-gold)]">
            Plain-language reference
          </span>
          <h1 className="mt-4 text-[clamp(2.6rem,5vw,4.6rem)] font-serif leading-[1.05]">
            NCLEX glossary — 60 terms every nursing student should know
          </h1>
          <p className="mt-5 max-w-[60rem] text-base leading-8 text-[var(--c-text-muted)]">
            From NGN to ATT, CJMM to logit scoring, NLC compact to neutropenic precautions —
            plain-language definitions of the 60 terms that come up most in NCLEX-RN prep and on
            test day.
          </p>
        </header>

        <dl className="space-y-5">
          {TERMS.map((t) => {
            const id = t.term.toLowerCase().replace(/[^a-z0-9]+/g, "-");
            return (
              <div key={t.term} id={id} className="scroll-mt-24 rounded-[10px] border border-[var(--c-border)] bg-[var(--c-bg-elevated)] p-5">
                <dt className="text-lg font-semibold">
                  <a href={`#${id}`} className="hover:underline">{t.term}</a>
                </dt>
                <dd className="mt-2 text-sm leading-7 text-[var(--c-text-muted)]">{t.definition}</dd>
              </div>
            );
          })}
        </dl>

        <div className="mt-10 rounded-[12px] border border-[var(--c-gold)] bg-[rgba(176,141,87,0.08)] p-6 text-center">
          <p className="text-base leading-7">
            Knowing the terms is step one. Step two is applying them in real practice questions.
          </p>
          <Link
            href="/free"
            className="mt-5 inline-flex rounded-[8px] bg-[var(--c-sage-deep)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--c-sage-deep-hover)]"
          >
            Try free NCLEX practice →
          </Link>
        </div>
      </div>
    </main>
  );
}
