import type { Metadata } from "next";
import FreeLandingPage from "@/components/seo/FreeLandingPage";
import { SEED_SATA } from "@/content/free-landings/seed-questions";

const SLUG = "nclex-sata-questions";
const SITE_URL = "https://claritynclex.com";

export const metadata: Metadata = {
  title: "Free NCLEX SATA Questions | Select-All-That-Apply Practice with Rationales",
  description:
    "Free NCLEX-RN SATA (select-all-that-apply) practice questions across pharmacology, cardiac, infection control, peds, and mental health. Full rationales, no signup.",
  alternates: { canonical: `/free/${SLUG}` },
  keywords: [
    "free NCLEX SATA questions",
    "NCLEX select all that apply",
    "free NCLEX-RN SATA",
    "SATA NCLEX practice",
    "free select all that apply nursing questions",
  ],
  openGraph: {
    title: "Free NCLEX SATA Questions | Select-All-That-Apply Practice",
    description: "Free NCLEX SATA practice with full rationales.",
    url: `${SITE_URL}/free/${SLUG}`,
    type: "article",
  },
};

export default function Page() {
  return (
    <FreeLandingPage
      slug={SLUG}
      h1="Free NCLEX SATA questions — select-all-that-apply practice"
      metaTitle={metadata.title as string}
      metaDescription={metadata.description as string}
      intro={
        <p>
          Select-all-that-apply (SATA) items are the most-dreaded format on the NCLEX-RN because
          old-format SATA was all-or-nothing. On the Next Generation NCLEX, most SATA items now
          use partial-credit scoring — but they still require precision. Five free SATA questions
          below with full rationales and the reasoning behind each correct and incorrect
          selection.
        </p>
      }
      body={
        <>
          <h2>How NCLEX SATA scoring actually works in 2026</h2>
          <p>
            Pre-2023 SATA was 0/1 — every selection had to be exactly right. The Next Generation
            NCLEX introduced "extended multiple response" scoring on most SATA items, which uses
            +1 / 0 / -1 scoring: correct selection earns +1, incorrect selection loses -1, no
            selection earns 0. The total floors at zero so you can't go negative on any single
            item.
          </p>
          <p>
            Translation: shotgun-selecting every option is now punished. Selecting only the ones
            you're confident in is rewarded. This is a major strategic change from old-format
            SATA.
          </p>

          <h2>The 4 rules for answering SATA questions correctly</h2>
          <ol>
            <li>
              <strong>Evaluate each option independently.</strong> Treat each choice as its own
              true/false question. Don't try to find a pattern across options.
            </li>
            <li>
              <strong>If you're uncertain, leave it unselected.</strong> Under partial-credit
              scoring, no selection (0) beats a wrong selection (-1).
            </li>
            <li>
              <strong>Watch for absolute words.</strong> "Always," "never," "all," and "only"
              usually make a SATA option wrong. "May," "should," "appropriate" usually make it
              right.
            </li>
            <li>
              <strong>Don't second-guess your "yes" selections.</strong> The most common SATA
              error is dropping a correct selection because the student talks themselves out of
              it. If you know it's right, keep it.
            </li>
          </ol>

          <h2>How many SATA questions are on the NCLEX-RN?</h2>
          <p>
            Roughly 10–15 SATA items appear on each NCLEX-RN, though the count varies because the
            test is adaptive. Higher-performing students typically see more SATA because the
            algorithm is testing them at higher cognitive levels.
          </p>

          <h2>Common SATA traps the NCSBN plants on purpose</h2>
          <ul>
            <li>
              <strong>The plausible-but-wrong distractor.</strong> Every SATA has 1–2 options that
              sound right but contradict a guideline (e.g., "encourage ambulation" for a client
              with a DVT before anticoagulation).
            </li>
            <li>
              <strong>The expected-finding-vs-priority trap.</strong> An option might be a true
              finding for the condition but not what the question is asking. Re-read the stem.
            </li>
            <li>
              <strong>The overstated absolute.</strong> "All clients with X should..." or "Never
              administer Y" usually makes an option wrong even when it's mostly true.
            </li>
            <li>
              <strong>The mixed-truth.</strong> An option pairs a correct action with an incorrect
              rationale or vice versa. Both halves must be right for the option to be selected.
            </li>
          </ul>

          <h2>Practice the SATA format, not just the topic</h2>
          <p>
            Doing 50 SATA items on pharmacology builds different skills than doing 50 standalone
            multiple choice items on the same content. The format itself is what makes SATA hard.
            Aim for at least 200 SATA items in your prep period across mixed categories.
          </p>
        </>
      }
      questions={SEED_SATA}
      faqs={[
        {
          question: "Is NCLEX SATA still all-or-nothing scoring?",
          answer:
            "No. As of April 2023, most NCLEX SATA items use polytomous (partial-credit) scoring. Correct selections earn +1, incorrect selections lose -1, no selection earns 0. The total floors at zero so a single item can't drop you into the negatives.",
        },
        {
          question: "How many SATA questions are on the NCLEX-RN?",
          answer:
            "About 10–15 SATA items per NCLEX-RN, though the exact count varies because of the adaptive testing format. Higher performers tend to see more SATA at higher cognitive levels.",
        },
        {
          question: "What's the best strategy for NCLEX SATA questions?",
          answer:
            "Evaluate each option independently as a true/false question. Select only the ones you're confident are correct. Under partial-credit scoring, leaving uncertain options unselected beats guessing wrong.",
        },
        {
          question: "Are there free NCLEX SATA practice questions?",
          answer:
            "Yes. The five SATA items on this page are free with no signup. Clarity premium ($9.99/mo) includes 3,700+ SATA practice items across every NCLEX category.",
        },
        {
          question: "Why are NCLEX SATA questions so hard?",
          answer:
            "SATA tests precision rather than recognition. You have to know each option is correct or incorrect, not just narrow to the best of four. Most students need 200+ SATA reps to build this precision.",
        },
      ]}
      relatedSlugs={[
        { slug: "nclex-ngn-questions", label: "Free NCLEX NGN questions" },
        { slug: "nclex-bow-tie-questions", label: "Free NCLEX bow-tie questions" },
        { slug: "nclex-matrix-questions", label: "Free NCLEX matrix questions" },
        { slug: "nclex-pharmacology-questions", label: "Free NCLEX pharmacology questions" },
        { slug: "nclex-case-studies", label: "Free NCLEX case studies" },
        { slug: "nclex-practice-exam", label: "Free NCLEX practice exam" },
      ]}
    />
  );
}
