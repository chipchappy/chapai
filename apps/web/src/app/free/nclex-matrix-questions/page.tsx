import type { Metadata } from "next";
import FreeLandingPage from "@/components/seo/FreeLandingPage";
import { SEED_MATRIX } from "@/content/free-landings/extra-questions";
import { SEED_SATA } from "@/content/free-landings/seed-questions";

const SLUG = "nclex-matrix-questions";
const SITE_URL = "https://claritynclex.com";

export const metadata: Metadata = {
  title: "Free NCLEX Matrix Questions | NGN Grid Practice with Rationales",
  description:
    "Free NCLEX-RN matrix and grid practice questions in the NGN format. Categorize findings by indicated vs not indicated, urgent vs non-urgent. Full rationales.",
  alternates: { canonical: `/free/${SLUG}` },
  keywords: [
    "free NCLEX matrix questions",
    "NGN matrix practice",
    "NCLEX grid questions",
    "free NGN matrix items",
    "NCLEX-RN matrix format",
  ],
  openGraph: {
    title: "Free NCLEX Matrix Questions",
    description: "NGN matrix and grid practice with full rationales.",
    url: `${SITE_URL}/free/${SLUG}`,
    type: "article",
  },
};

const Qs = [SEED_MATRIX[0], SEED_SATA[0], SEED_SATA[3]];

export default function Page() {
  return (
    <FreeLandingPage
      slug={SLUG}
      h1="Free NCLEX matrix questions in real NGN format"
      metaTitle={metadata.title as string}
      metaDescription={metadata.description as string}
      intro={
        <p>
          Matrix items present a table of rows (findings, interventions, or assessments) and
          columns (categories like indicated/not indicated, urgent/non-urgent). They test
          recognize-cues and analyze-cues steps of the Clinical Judgment Measurement Model.
        </p>
      }
      body={
        <>
          <h2>How matrix questions work on NCLEX</h2>
          <p>
            A matrix item shows you 4–6 rows (clinical findings, lab results, or potential
            interventions) and 2–3 columns (the categories you assign each row to). You click
            each row's correct column.
          </p>
          <p>
            Scoring is polytomous: each correct row earns +1, each incorrect row loses -1. The
            floor is zero per item, so one mistake doesn't ruin a whole matrix.
          </p>

          <h2>Common matrix templates on NCLEX</h2>
          <ul>
            <li><strong>Indicated vs not indicated:</strong> For each intervention, is it appropriate for this client?</li>
            <li><strong>Expected vs unexpected:</strong> For each finding, is it consistent with the diagnosis?</li>
            <li><strong>Urgent vs non-urgent:</strong> For each cue, does it require immediate action?</li>
            <li><strong>Supports vs refutes:</strong> For each finding, does it support or refute the hypothesis?</li>
            <li><strong>Essential vs non-essential:</strong> For each teaching point, is it required for this client?</li>
          </ul>

          <h2>4 rules for tackling matrix questions</h2>
          <ol>
            <li><strong>Read every row before answering.</strong> Test writers anchor you with obvious rows and bury subtle ones below.</li>
            <li><strong>Evaluate each row in isolation.</strong> Don't try to balance "I have 3 in this column already so the next should be in the other."</li>
            <li><strong>When uncertain, lean toward not-indicated / unexpected / non-urgent.</strong> Partial-credit scoring penalizes wrong selections.</li>
            <li><strong>Don't second-guess the obvious ones.</strong> If a row is clearly correct, move on.</li>
          </ol>
        </>
      }
      questions={Qs}
      faqs={[
        { question: "How are NCLEX matrix questions scored?", answer: "Polytomous: each correct row earns +1, each incorrect row loses -1, no selection earns 0. The item total floors at zero." },
        { question: "How many matrix questions are on the NCLEX?", answer: "Most test-takers see 2–4 standalone matrix items per NCLEX-RN, plus matrix sub-items embedded in case studies. They appear in every test." },
        { question: "What's the best strategy for matrix questions?", answer: "Read every row before answering. Evaluate each independently. Lean toward not-indicated when uncertain. Don't try to balance column counts." },
        { question: "Where can I practice NCLEX matrix questions for free?", answer: "The matrix on this page is in real NGN format. NCSBN's NGN practice items include matrices. Clarity premium ($9.99/mo) includes 2,000+ matrix and SATA items." },
      ]}
      relatedSlugs={[
        { slug: "nclex-ngn-questions", label: "Free NCLEX NGN questions" },
        { slug: "nclex-bow-tie-questions", label: "Free NCLEX bow-tie questions" },
        { slug: "nclex-sata-questions", label: "Free NCLEX SATA questions" },
        { slug: "nclex-case-studies", label: "Free NCLEX case studies" },
        { slug: "nclex-safety-questions", label: "Free NCLEX safety questions" },
        { slug: "nclex-practice-exam", label: "Free NCLEX practice exam" },
      ]}
    />
  );
}
