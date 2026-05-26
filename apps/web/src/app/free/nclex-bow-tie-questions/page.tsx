import type { Metadata } from "next";
import FreeLandingPage from "@/components/seo/FreeLandingPage";
import { SEED_BOWTIE } from "@/content/free-landings/extra-questions";

const SLUG = "nclex-bow-tie-questions";
const SITE_URL = "https://claritynclex.com";

export const metadata: Metadata = {
  title: "Free NCLEX Bow-Tie Questions | NGN 3-Zone Practice with Rationales",
  description:
    "Free NCLEX-RN bow-tie practice questions in the NGN 3-zone format: center condition, two actions, two monitoring parameters. Full rationales.",
  alternates: { canonical: `/free/${SLUG}` },
  keywords: [
    "free NCLEX bow tie questions",
    "NGN bow tie practice",
    "NCLEX bow-tie format",
    "free NGN bow tie",
    "NCLEX 3 zone questions",
  ],
  openGraph: {
    title: "Free NCLEX Bow-Tie Questions",
    description: "NGN 3-zone bow-tie practice with full rationales.",
    url: `${SITE_URL}/free/${SLUG}`,
    type: "article",
  },
};

export default function Page() {
  return (
    <FreeLandingPage
      slug={SLUG}
      h1="Free NCLEX bow-tie questions in real NGN format"
      metaTitle={metadata.title as string}
      metaDescription={metadata.description as string}
      intro={
        <p>
          Bow-tie items are the highest-weighted NGN item type because they integrate diagnosis,
          action, and monitoring into a single question. Two free bow-tie practice items below
          covering septic shock and DKA, with the answer key broken down by zone.
        </p>
      }
      body={
        <>
          <h2>What is a bow-tie question on the NCLEX?</h2>
          <p>
            A bow-tie item is a single NGN question structured into three zones:
          </p>
          <ul>
            <li><strong>Center zone (condition):</strong> The diagnosis or clinical state. Usually one choice from 2–4 options.</li>
            <li><strong>Left zone (actions):</strong> Two nursing or provider actions to take immediately. Selected from a pool of 4–6 options.</li>
            <li><strong>Right zone (monitoring):</strong> Two parameters or assessments to watch for response or complications. Selected from 4–6 options.</li>
          </ul>
          <p>
            Each cell is scored independently (+1 correct, -1 incorrect, 0 not selected). Maximum
            score per bow-tie is typically 5 points: 1 condition + 2 actions + 2 monitoring.
          </p>

          <h2>How to attack a bow-tie item in 4 steps</h2>
          <ol>
            <li><strong>Identify the condition first.</strong> Use the cues to anchor a single diagnosis. This drives every other zone.</li>
            <li><strong>Pick the two actions that treat the condition right now.</strong> Not in 6 hours — right now.</li>
            <li><strong>Pick the two parameters that will tell you whether your actions worked.</strong> These usually include a hemodynamic marker (BP, MAP, urine output) and a lab trend (lactate, glucose, K+).</li>
            <li><strong>Don't over-select.</strong> Adding a third action under partial-credit scoring usually loses you a point because the extra option is a distractor.</li>
          </ol>

          <h2>The bow-tie patterns that recur on NCLEX</h2>
          <ul>
            <li><strong>Septic shock:</strong> Fluids + antibiotics → MAP ≥ 65 + lactate trending down.</li>
            <li><strong>DKA:</strong> Fluids + insulin drip → hourly glucose + K+ every 2 hr.</li>
            <li><strong>Acute MI:</strong> Aspirin + heparin → ST resolution + troponin trend.</li>
            <li><strong>Anaphylaxis:</strong> IM epinephrine + airway support → BP + respiratory rate.</li>
            <li><strong>Stroke:</strong> Stroke alert + glucose check → NIH stroke scale + neuro checks.</li>
          </ul>

          <h2>Why bow-tie weights heavily on NCLEX scoring</h2>
          <p>
            Bow-tie items test three CJMM steps simultaneously: prioritize hypotheses (center),
            take actions (left), and evaluate outcomes (right). For test-takers near the
            passing line, bow-tie performance often decides pass or fail. Practice them.
          </p>
        </>
      }
      questions={SEED_BOWTIE}
      faqs={[
        { question: "How are bow-tie questions scored on NCLEX?", answer: "Polytomous (partial-credit) scoring: +1 for correct selection, -1 for incorrect, 0 for none. Maximum is usually 5 points (1 condition + 2 actions + 2 monitoring). Score floors at zero." },
        { question: "How many bow-tie questions are on the NCLEX?", answer: "Most test-takers see 2–4 standalone bow-tie items plus bow-ties embedded as the 'take actions' sub-question within case studies. Total bow-tie items range from 3 to 7 per exam." },
        { question: "What's the best strategy for a bow-tie?", answer: "Anchor the condition first. Then ask: what two actions treat THIS condition right now, and what two parameters tell me whether those actions worked? Don't over-select." },
        { question: "Where can I practice real bow-tie questions for free?", answer: "The two on this page are real bow-tie format. NCSBN's official NGN practice items also include bow-ties. Clarity premium ($9.99/mo) includes 30+ true 3-zone bow-tie items." },
      ]}
      relatedSlugs={[
        { slug: "nclex-ngn-questions", label: "Free NCLEX NGN questions" },
        { slug: "nclex-case-studies", label: "Free NCLEX case studies" },
        { slug: "nclex-matrix-questions", label: "Free NCLEX matrix questions" },
        { slug: "nclex-sata-questions", label: "Free NCLEX SATA questions" },
        { slug: "nclex-cardiac-questions", label: "Free NCLEX cardiac questions" },
        { slug: "nclex-practice-exam", label: "Free NCLEX practice exam" },
      ]}
    />
  );
}
