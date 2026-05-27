import type { Metadata } from "next";
import FreeLandingPage from "@/components/seo/FreeLandingPage";
import { SEED_PRIORITIZATION } from "@/content/free-landings/seed-questions";

const SLUG = "nclex-prioritization-questions";
const SITE_URL = "https://claritynclex.com";

export const metadata: Metadata = {
  title: "Free NCLEX Prioritization Questions | Who Do You See First? Practice",
  description:
    "Free NCLEX-RN prioritization and delegation questions with full rationales. ABC, Maslow, and safety frameworks worked through with real clinical scenarios.",
  alternates: { canonical: `/free/${SLUG}` },
  keywords: [
    "free NCLEX prioritization questions",
    "NCLEX prioritization practice",
    "NCLEX who do you see first",
    "free NCLEX delegation questions",
    "NCLEX-RN prioritization",
  ],
  openGraph: {
    title: "Free NCLEX Prioritization Questions | Who Do You See First?",
    description: "Free NCLEX prioritization practice with full rationales.",
    url: `${SITE_URL}/free/${SLUG}`,
    type: "article",
  },
};

export default function Page() {
  return (
    <FreeLandingPage
      slug={SLUG}
      h1="Free NCLEX prioritization questions — who do you see first?"
      metaTitle={metadata.title as string}
      metaDescription={metadata.description as string}
      intro={
        <p>
          Prioritization questions are the highest-yield NCLEX category because they appear on
          every test and they're scored at the highest cognitive levels. Five free items below
          covering "who do you assess first," delegation, mass-casualty triage, post-op priority,
          and timing-critical medications. Full rationales included.
        </p>
      }
      body={
        <>
          <h2>The 5 frameworks that decide every NCLEX priority question</h2>

          <h3>1. ABCs (Airway, Breathing, Circulation)</h3>
          <p>
            The most-used framework. Apply when a question gives you multiple clients with
            physiologic problems. Pick the one whose airway, breathing, or circulation is most
            threatened. Be careful: not every "airway" answer is the right priority — sometimes
            the question is about whose airway is <em>changing</em>, not whose has been stable
            below baseline for hours.
          </p>

          <h3>2. Unstable beats stable</h3>
          <p>
            Even within ABCs, the client whose condition is actively deteriorating outranks the
            client who's been chronically lower. A client with a baseline SpO2 of 88% on COPD who
            is currently at 86% is more worrying than a non-COPD client at 92%. Trajectory
            matters.
          </p>

          <h3>3. Acute beats chronic</h3>
          <p>
            A new symptom always outranks an established baseline finding of the same type. New
            chest pain beats chronic chest pain. New confusion beats baseline dementia. The
            question is asking what's <em>different</em> from this client's normal.
          </p>

          <h3>4. Maslow's hierarchy</h3>
          <p>
            When all options seem physiologic, fall back to Maslow: physiologic needs trump
            safety, safety trumps love/belonging, etc. Useful in psych or mental health priority
            questions where the answers blur into communication therapy.
          </p>

          <h3>5. Nursing process (ADPIE)</h3>
          <p>
            Assess before intervene. The question often plants a tempting "give a med" or "call
            the provider" option when the right first step is reassessing. Default to assessment
            unless the situation is an obvious emergency requiring immediate action.
          </p>

          <h2>The 5-rights of delegation</h2>
          <p>
            Delegation questions test your understanding of the 5-rights framework from the NCSBN:
            right task, right circumstance, right person, right direction, right supervision.
            Quick rule of thumb for the test:
          </p>
          <ul>
            <li>
              <strong>RN tasks:</strong> assessment, teaching, evaluation, unstable clients,
              invasive procedures, blood administration, IV push meds, NG insertion.
            </li>
            <li>
              <strong>LPN tasks:</strong> stable client care, reinforcing teaching done by RN,
              dressing changes, oral and IM meds, sterile procedures (varies by state).
            </li>
            <li>
              <strong>UAP tasks:</strong> routine vital signs on stable clients, ADLs, I&O,
              ambulation, feeding (no swallow precautions), positioning.
            </li>
          </ul>
          <p>
            Never delegate assessment, teaching, evaluation, or care of an unstable client. That's
            the single biggest test trap.
          </p>

          <h2>Mass-casualty triage on the NCLEX</h2>
          <p>
            The START triage system uses four colors:
          </p>
          <ul>
            <li>
              <strong>Red (immediate):</strong> life-threatening but salvageable with rapid
              intervention (e.g., respiratory distress with patent airway, arterial bleeding).
            </li>
            <li>
              <strong>Yellow (delayed):</strong> serious but stable for 1+ hours (e.g., closed
              fractures, abdominal injuries without shock).
            </li>
            <li>
              <strong>Green (minor):</strong> walking wounded, can be delayed for hours (e.g.,
              superficial wounds, sprains).
            </li>
            <li>
              <strong>Black (expectant):</strong> no spontaneous respirations after airway opened;
              in a mass casualty event, resources go to those who can be saved.
            </li>
          </ul>
        </>
      }
      questions={SEED_PRIORITIZATION}
      faqs={[
        {
          question: "Are NCLEX prioritization questions hard?",
          answer:
            "They're considered the hardest single item type because they're scored at the highest cognitive level (analyze and synthesize). Most failing students cite prioritization as their weakest category.",
        },
        {
          question: "What's the ABC rule on the NCLEX?",
          answer:
            "Airway-Breathing-Circulation. When multiple clients need attention, assess the one whose airway, breathing, or circulation is most threatened first. Within ABCs, the actively deteriorating client outranks the chronically lower one.",
        },
        {
          question: "What tasks can a nurse delegate to a UAP?",
          answer:
            "UAPs can perform routine, predictable tasks for stable clients: routine vital signs, ADLs, intake and output, ambulation, basic positioning, feeding (without swallow precautions). Never delegate assessment, teaching, evaluation, or care of an unstable client.",
        },
        {
          question: "How many prioritization questions are on the NCLEX?",
          answer:
            "Management of care (which includes prioritization and delegation) makes up 15–21% of the NCLEX-RN — the largest single category, with roughly 11–30 items per test.",
        },
        {
          question: "What's the difference between priority and first action?",
          answer:
            "Priority asks which client to see first; first action asks what to do for one specific client first. Priority questions use ABC and unstable-beats-stable rules. First-action questions use the nursing process (assess before intervene unless it's a clear emergency).",
        },
      ]}
      relatedSlugs={[
        { slug: "nclex-delegation-questions", label: "Free NCLEX delegation questions" },
        { slug: "nclex-safety-questions", label: "Free NCLEX safety questions" },
        { slug: "nclex-case-studies", label: "Free NCLEX case studies" },
        { slug: "nclex-pharmacology-questions", label: "Free NCLEX pharmacology questions" },
        { slug: "nclex-practice-questions", label: "Free NCLEX practice questions" },
        { slug: "nclex-practice-exam", label: "Free NCLEX practice exam" },
      ]}
    />
  );
}
