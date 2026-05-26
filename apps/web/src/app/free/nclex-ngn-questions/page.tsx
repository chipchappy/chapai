import type { Metadata } from "next";
import FreeLandingPage from "@/components/seo/FreeLandingPage";
import { SEED_CASE_STUDIES, SEED_SATA } from "@/content/free-landings/seed-questions";

const SLUG = "nclex-ngn-questions";
const SITE_URL = "https://claritynclex.com";

export const metadata: Metadata = {
  title: "Free NCLEX NGN Questions | Next Generation NCLEX Practice with Rationales",
  description:
    "Free Next Generation NCLEX (NGN) practice questions including case studies, bow-tie, matrix, SATA, and cloze items. Full rationales, no signup. Aligned to NCSBN 2026 test plan.",
  alternates: { canonical: `/free/${SLUG}` },
  keywords: [
    "free NCLEX NGN questions",
    "free Next Generation NCLEX questions",
    "NGN practice questions",
    "NCLEX NGN sample questions",
    "free NCLEX-RN NGN practice",
    "NCSBN NGN practice",
  ],
  openGraph: {
    title: "Free NCLEX NGN Questions | Next Generation NCLEX Practice",
    description: "Free NGN practice: case studies, bow-tie, matrix, SATA. Full rationales.",
    url: `${SITE_URL}/free/${SLUG}`,
    type: "article",
  },
};

const NGN_MIX = [
  SEED_CASE_STUDIES[0],
  SEED_SATA[0],
  SEED_CASE_STUDIES[3],
  SEED_SATA[2],
  SEED_CASE_STUDIES[4],
];

export default function Page() {
  return (
    <FreeLandingPage
      slug={SLUG}
      h1="Free NCLEX NGN questions — case studies, SATA, and bow-tie practice"
      metaTitle={metadata.title as string}
      metaDescription={metadata.description as string}
      intro={
        <p>
          The Next Generation NCLEX (NGN) launched April 2023 and brought six new item types
          designed to measure clinical judgment, not just knowledge recall. Five of those item
          types appear below, each with full rationale: extended multiple response (SATA), case
          study with multi-step reasoning, matrix grid, drag-and-drop ordering, and bow-tie
          decisions. Free, no signup.
        </p>
      }
      body={
        <>
          <h2>What are NGN questions?</h2>
          <p>
            Next Generation NCLEX (NGN) items test the six steps of the NCSBN Clinical Judgment
            Measurement Model: recognize cues, analyze cues, prioritize hypotheses, generate
            solutions, take actions, and evaluate outcomes. Each NGN item type targets one or more
            of those steps.
          </p>

          <h2>The 6 NGN item types you'll see on the NCLEX-RN</h2>
          <h3>1. Extended multiple response (SATA)</h3>
          <p>
            Select all that apply, but with partial-credit scoring. Each correct selection earns a
            point, each incorrect selection loses a point. Guessing is penalized in a way
            traditional SATA was not.
          </p>

          <h3>2. Extended drag-and-drop</h3>
          <p>
            Place items from a pool into a target zone in a specific order. Common for ordering
            nursing actions, ranking priorities, or sequencing a procedure.
          </p>

          <h3>3. Cloze (drop-down)</h3>
          <p>
            Fill in the blank from a drop-down menu, often nested inside a sentence like "The
            nurse should administer [drug] because the client is in [condition]." Multiple
            drop-downs can appear in a single item.
          </p>

          <h3>4. Enhanced hotspot (highlighting)</h3>
          <p>
            Click words or phrases in a passage that are clinically significant. Frequently used
            for analyzing assessment notes, vital signs, or lab results.
          </p>

          <h3>5. Matrix / grid</h3>
          <p>
            A table of rows (findings, interventions, or assessments) and columns (categories such
            as "indicated," "not indicated," "essential," "non-essential"). You assign each row to
            the correct column.
          </p>

          <h3>6. Bow-tie</h3>
          <p>
            A three-zone item: one condition in the center, two actions on the left, two
            parameters to monitor on the right. Often the "take actions" sub-question of a case
            study. Bow-ties weight heavily in scoring because they integrate diagnosis, action,
            and evaluation in a single item.
          </p>

          <h2>How NGN scoring differs from old-format SATA</h2>
          <p>
            Old SATA was all-or-nothing. NGN uses polytomous scoring on most item types so you can
            earn partial credit. This is good news: you don't have to get every cell right to do
            well on a case study, and one wrong matrix row doesn't tank the whole question.
          </p>
          <p>
            The 0/+/- scoring rule applies to most NGN items: correct selection = +1, incorrect =
            -1, no selection = 0 (floor at zero — you can't go negative). This rewards measured
            judgment and penalizes shotgun guessing.
          </p>

          <h2>How to study NGN questions effectively</h2>
          <ul>
            <li>
              <strong>Practice the item type, not just the topic.</strong> Doing 50 SATA questions
              builds different reasoning skills than 50 standalone MCQs on the same content.
            </li>
            <li>
              <strong>Slow down on matrix items.</strong> Read every row before you start
              answering. Test writers plant a few obviously-correct rows to anchor you, then
              insert subtler rows that depend on rereading.
            </li>
            <li>
              <strong>For bow-tie items, anchor on the center condition first.</strong> Pick the
              condition. Then ask: what two actions treat this condition right now, and what two
              parameters tell me whether those actions worked?
            </li>
            <li>
              <strong>Time yourself loosely.</strong> Case studies should take 5–8 minutes total.
              SATA should take 60–90 seconds. If you're going much longer, you're overthinking.
            </li>
          </ul>

          <h2>What percentage of the NCLEX is NGN?</h2>
          <p>
            On the post-April-2023 NCLEX-RN, roughly 25% of items are NGN format. Three case
            studies (six items each = 18 items) are guaranteed, and the rest are standalone NGN
            item types mixed with traditional multiple choice. Expect to see 8–10 standalone NGN
            items in addition to the case studies on your test day.
          </p>
        </>
      }
      questions={NGN_MIX}
      faqs={[
        {
          question: "What is the NGN on the NCLEX?",
          answer:
            "The Next Generation NCLEX (NGN) is the format launched April 2023 to measure clinical judgment through new item types: case studies, bow-tie, matrix, cloze, hotspot, extended drag-and-drop, and extended multiple response (SATA with partial credit).",
        },
        {
          question: "How many NGN questions are on the NCLEX-RN?",
          answer:
            "Approximately 25% of the NCLEX-RN is NGN format. Every test-taker gets three case studies (18 items total) plus 8–10 standalone NGN items mixed throughout the rest of the test.",
        },
        {
          question: "Are NGN questions harder than regular NCLEX questions?",
          answer:
            "They feel harder because they require more clinical synthesis, but they're scored with partial credit (polytomous scoring) which makes them more forgiving. You don't need to get every cell right to pass them.",
        },
        {
          question: "How do I practice NGN bow-tie questions for free?",
          answer:
            "The case study and SATA items below give you real NGN-style reasoning. For a dedicated bow-tie practice set, visit our free bow-tie questions page. Clarity premium includes 30+ true 3-zone bow-tie items.",
        },
        {
          question: "What's the best NGN practice resource?",
          answer:
            "NCSBN's official Learning Extension is the authoritative source. Commercial banks like UWorld, Bootcamp, Kaplan, and Clarity build on top of NCSBN guidance. Clarity is the most affordable at $9.99/mo and includes real multi-step case studies plus an AI tutor.",
        },
      ]}
      relatedSlugs={[
        { slug: "nclex-case-studies", label: "Free NCLEX case studies (deep dive)" },
        { slug: "nclex-sata-questions", label: "Free NCLEX SATA questions" },
        { slug: "nclex-bow-tie-questions", label: "Free NCLEX bow-tie questions" },
        { slug: "nclex-matrix-questions", label: "Free NCLEX matrix questions" },
        { slug: "nclex-prioritization-questions", label: "Free NCLEX prioritization questions" },
        { slug: "nclex-practice-exam", label: "Free NCLEX practice exam" },
      ]}
    />
  );
}
