import type { Metadata } from "next";
import FreeLandingPage from "@/components/seo/FreeLandingPage";
import { SEED_DELEGATION } from "@/content/free-landings/extra-questions";
import { SEED_PRIORITIZATION } from "@/content/free-landings/seed-questions";

const SLUG = "nclex-delegation-questions";
const SITE_URL = "https://claritynclex.com";

export const metadata: Metadata = {
  title: "Free NCLEX Delegation Questions | RN vs LPN vs UAP Practice",
  description:
    "Free NCLEX-RN delegation practice using the NCSBN 5-rights framework. RN-only tasks, LPN scope, UAP scope. Full rationales.",
  alternates: { canonical: `/free/${SLUG}` },
  keywords: [
    "free NCLEX delegation questions",
    "NCLEX delegation practice",
    "NCSBN delegation rights",
    "RN LPN UAP scope",
    "free nursing delegation NCLEX",
  ],
  openGraph: {
    title: "Free NCLEX Delegation Questions",
    description: "RN vs LPN vs UAP. NCSBN 5-rights framework.",
    url: `${SITE_URL}/free/${SLUG}`,
    type: "article",
  },
};

const Qs = [...SEED_DELEGATION, SEED_PRIORITIZATION[1]];

export default function Page() {
  return (
    <FreeLandingPage
      slug={SLUG}
      h1="Free NCLEX delegation questions — RN, LPN, and UAP scope"
      metaTitle={metadata.title as string}
      metaDescription={metadata.description as string}
      intro={
        <p>
          Four free NCLEX-RN delegation questions using the NCSBN 5-rights framework. Knowing
          what can and cannot be delegated to LPNs and UAPs is foundational to the Management
          of Care category — the largest single category on the test.
        </p>
      }
      body={
        <>
          <h2>The NCSBN 5 rights of delegation</h2>
          <ol>
            <li><strong>Right task.</strong> Routine, predictable tasks can be delegated. Assessment, teaching, evaluation, and judgment-based interventions cannot.</li>
            <li><strong>Right circumstance.</strong> The client must be stable. Unstable clients stay with the RN.</li>
            <li><strong>Right person.</strong> Match the task to the scope and competence of the LPN or UAP receiving it.</li>
            <li><strong>Right direction/communication.</strong> Give specific instructions including how, when, and what to report.</li>
            <li><strong>Right supervision/evaluation.</strong> Follow up. Verify the task was completed correctly.</li>
          </ol>

          <h2>What RNs can delegate</h2>
          <ul>
            <li><strong>To LPNs:</strong> medication administration to stable clients (oral, IM, subcutaneous; some states allow IV push), dressing changes, ostomy care, foley insertion, NG insertion, tube feedings, reinforcing teaching done by RN.</li>
            <li><strong>To UAPs:</strong> routine vital signs on stable clients, ADLs (bathing, grooming, toileting), ambulation, positioning, feeding (without swallow precautions), I&O measurement, weights, specimen collection.</li>
          </ul>

          <h2>What RNs cannot delegate</h2>
          <ul>
            <li><strong>Assessment</strong> — including initial pain assessment, post-procedure assessment, neuro checks, and any new finding.</li>
            <li><strong>Teaching</strong> — original patient or family teaching. LPNs may reinforce but not initiate.</li>
            <li><strong>Evaluation</strong> — judging whether interventions worked or a client is improving.</li>
            <li><strong>Care of unstable clients</strong> — anyone newly admitted, immediately post-op, or actively decompensating.</li>
            <li><strong>Blood administration</strong> in most states.</li>
            <li><strong>IV push medications</strong> from RN-only drug lists (vasoactives, chemo, sedatives).</li>
          </ul>

          <h2>Assignment vs delegation</h2>
          <p>
            Assignment is giving a task within someone's normal scope. Delegation is giving a task
            outside their normal scope but that they're competent to perform under supervision.
            NCLEX usually uses these terms loosely — both follow the 5 rights.
          </p>

          <h2>The acuity rule for assignments</h2>
          <p>
            Match the most experienced RN to the highest-acuity client. Newly admitted, hemodynamically
            unstable, post-procedure within 24 hr, and complex psych or oncology clients all warrant
            experienced staff. Stable post-op day 3 or routine medical clients can go to newer staff.
          </p>
        </>
      }
      questions={Qs}
      faqs={[
        { question: "Can RNs delegate assessment?", answer: "No. Assessment requires nursing judgment and is the responsibility of the RN. UAPs may collect data (vitals, I&O), but interpretation and assessment remain with the RN." },
        { question: "What can LPNs do that UAPs cannot?", answer: "LPNs can administer medications, perform sterile procedures, change dressings, insert foleys and NGs, and reinforce teaching. UAPs cannot do any of these — they're limited to routine, predictable tasks for stable clients." },
        { question: "Who should care for an unstable client?", answer: "The most experienced RN available. Unstable clients require nursing judgment, rapid response capability, and frequent reassessment — outside the scope of LPNs and UAPs." },
        { question: "How do I memorize delegation rules for NCLEX?", answer: "Three rules: (1) assessment, teaching, evaluation = RN only; (2) routine + stable = UAP eligible; (3) medications + procedures for stable clients = LPN eligible. Memorize these three filters and most questions fall into place." },
      ]}
      relatedSlugs={[
        { slug: "nclex-prioritization-questions", label: "Free NCLEX prioritization questions" },
        { slug: "nclex-safety-questions", label: "Free NCLEX safety questions" },
        { slug: "nclex-case-studies", label: "Free NCLEX case studies" },
        { slug: "nclex-pharmacology-questions", label: "Free NCLEX pharmacology questions" },
        { slug: "nclex-sata-questions", label: "Free NCLEX SATA questions" },
        { slug: "nclex-practice-exam", label: "Free NCLEX practice exam" },
      ]}
    />
  );
}
