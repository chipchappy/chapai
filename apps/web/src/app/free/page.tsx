import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = "https://claritynclex.com";

export const metadata: Metadata = {
  title: "Free NCLEX Practice Questions, NGN Case Studies, and Prep Resources",
  description:
    "Free NCLEX practice questions across every category — NGN case studies, SATA, bow-tie, pharmacology, prioritization, and more. No signup required to try.",
  alternates: { canonical: "/free" },
  openGraph: {
    title: "Free NCLEX Practice Questions, NGN Case Studies, and Prep Resources",
    description:
      "Free NCLEX practice questions across every category. NGN case studies, SATA, bow-tie, pharmacology, prioritization. No signup to try.",
    url: `${SITE_URL}/free`,
  },
};

const LANDINGS: Array<{ slug: string; title: string; blurb: string }> = [
  { slug: "nclex-practice-exam", title: "Free NCLEX Practice Exam", blurb: "Sample timed practice exam covering every NCLEX-RN client need." },
  { slug: "nclex-practice-questions", title: "Free NCLEX Practice Questions", blurb: "Hand-picked NCLEX-RN questions with full rationales." },
  { slug: "nclex-prep", title: "Free NCLEX Prep", blurb: "Free prep questions, study plan, and AI tutor preview." },
  { slug: "nclex-ngn-questions", title: "Free NCLEX NGN Questions", blurb: "Next Generation NCLEX case studies, bow-tie, matrix, and cloze items." },
  { slug: "nclex-case-studies", title: "Free NCLEX Case Studies", blurb: "Multi-step unfolding case studies mapped to the Clinical Judgment Measurement Model." },
  { slug: "nclex-sata-questions", title: "Free NCLEX SATA Questions", blurb: "Select-all-that-apply items with partial-credit rationale." },
  { slug: "nclex-bow-tie-questions", title: "Free NCLEX Bow-Tie Questions", blurb: "3-zone NGN bow-tie items with center condition, actions, and monitoring." },
  { slug: "nclex-matrix-questions", title: "Free NCLEX Matrix Questions", blurb: "Matrix and grid-style NGN items with row-by-row scoring." },
  { slug: "nclex-pharmacology-questions", title: "Free NCLEX Pharmacology Questions", blurb: "Drug safety, classifications, contraindications, and priority labs." },
  { slug: "nclex-prioritization-questions", title: "Free NCLEX Prioritization Questions", blurb: "Who do you see first? ABC, Maslow, and safety frameworks." },
  { slug: "nclex-delegation-questions", title: "Free NCLEX Delegation Questions", blurb: "RN vs LPN vs UAP delegation scenarios with NCSBN reasoning." },
  { slug: "nclex-safety-questions", title: "Free NCLEX Safety Questions", blurb: "Infection control, fall risk, restraints, and patient safety priorities." },
  { slug: "nclex-cardiac-questions", title: "Free NCLEX Cardiac Questions", blurb: "ACS, heart failure, dysrhythmias, and hemodynamic emergencies." },
  { slug: "nclex-respiratory-questions", title: "Free NCLEX Respiratory Questions", blurb: "Asthma, COPD, ARDS, PE, and oxygen delivery decisions." },
  { slug: "nclex-endocrine-questions", title: "Free NCLEX Endocrine Questions", blurb: "DKA, HHS, thyroid storm, Addisonian crisis, and insulin safety." },
  { slug: "nclex-lab-values-questions", title: "Free NCLEX Lab Values Questions", blurb: "Normal ranges, critical values, and nursing actions for abnormal results." },
];

export default function FreeIndexPage() {
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Free NCLEX Practice Topics",
    itemListElement: LANDINGS.map((l, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/free/${l.slug}`,
      name: l.title,
    })),
  };

  return (
    <main className="min-h-screen bg-[var(--c-bg)] px-4 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      <div className="mx-auto max-w-[1080px]">
        <header className="mb-10">
          <span className="text-[0.78rem] font-bold uppercase tracking-[0.18em] text-[var(--c-gold)]">
            100% free · No signup to try
          </span>
          <h1 className="mt-4 text-[clamp(2.6rem,5vw,4.6rem)] font-serif leading-[1.05]">
            Free NCLEX practice questions, NGN case studies, and prep
          </h1>
          <p className="mt-5 max-w-[58rem] text-base leading-8 text-[var(--c-text-muted)]">
            Pick a topic. Get 5 real NCLEX-RN questions with full rationales, no email required.
            When you're ready for the full bank, Clarity premium starts at $9.99/mo — less than a single month of UWorld or Kaplan.
          </p>
        </header>

        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {LANDINGS.map((l) => (
            <li key={l.slug}>
              <Link
                href={`/free/${l.slug}`}
                className="block h-full rounded-[12px] border border-[var(--c-border)] bg-[var(--c-bg-elevated)] p-5 transition hover:border-[var(--c-gold)] hover:shadow-md"
              >
                <h2 className="text-lg font-serif">{l.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--c-text-muted)]">{l.blurb}</p>
                <span className="mt-3 inline-block text-sm font-semibold text-[var(--c-sage-deep)]">
                  Start practicing →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
