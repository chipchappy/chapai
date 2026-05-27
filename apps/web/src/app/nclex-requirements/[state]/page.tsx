import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { STATES, getStateBySlug } from "@/content/state-pages/states";

const SITE_URL = "https://claritynclex.com";

export function generateStaticParams() {
  return STATES.map((s) => ({ state: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string }>;
}): Promise<Metadata> {
  const { state } = await params;
  const data = getStateBySlug(state);
  if (!data) return { title: "State not found" };

  return {
    title: `NCLEX Requirements in ${data.name} — Fees, CE Hours, License Steps`,
    description: `Complete NCLEX-RN requirements for ${data.name}: ${data.boardName}, $${data.feeUsd} fee, ${data.ceHoursPerRenewal || "no"} CE hours, ${data.renewalYears}-year renewal, ${data.nlcCompact ? "NLC compact member" : "not NLC compact"}.`,
    alternates: { canonical: `/nclex-requirements/${data.slug}` },
    keywords: [
      `NCLEX requirements ${data.name}`,
      `${data.name} NCLEX-RN requirements`,
      `${data.name} nursing license`,
      `${data.name} board of nursing`,
      `RN licensure ${data.name}`,
      `nursing license fee ${data.name}`,
    ],
    openGraph: {
      title: `NCLEX Requirements in ${data.name}`,
      description: `Fees, CE hours, license steps, NLC compact status for ${data.name}.`,
      url: `${SITE_URL}/nclex-requirements/${data.slug}`,
      type: "article",
    },
  };
}

export default async function Page({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params;
  const data = getStateBySlug(state);
  if (!data) notFound();

  const canonical = `${SITE_URL}/nclex-requirements/${data.slug}`;

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "NCLEX requirements", item: `${SITE_URL}/nclex-requirements` },
      { "@type": "ListItem", position: 3, name: data.name, item: canonical },
    ],
  };

  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `NCLEX-RN requirements in ${data.name}`,
    image: `${SITE_URL}/logo.png`,
    author: { "@type": "Organization", name: "Clarity Clinical Prep", url: SITE_URL },
    publisher: {
      "@type": "Organization",
      name: "Clarity Clinical Prep",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` },
    },
    datePublished: "2026-05-26",
    dateModified: new Date().toISOString().slice(0, 10),
    mainEntityOfPage: canonical,
  };

  const ceLine = data.ceHoursPerRenewal === 0
    ? `${data.name} does not require continuing education hours for RN renewal.`
    : `${data.name} requires ${data.ceHoursPerRenewal} continuing education hours per ${data.renewalYears}-year renewal cycle.`;

  return (
    <main className="min-h-screen bg-[var(--c-bg)] px-4 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(article) }} />

      <article className="mx-auto max-w-[920px]">
        <nav className="mb-6 text-sm text-[var(--c-text-muted)]" aria-label="Breadcrumb">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/nclex-requirements" className="hover:underline">NCLEX requirements</Link>
          <span className="mx-2">/</span>
          <span aria-current="page">{data.name}</span>
        </nav>

        <header className="mb-8">
          <span className="text-[0.78rem] font-bold uppercase tracking-[0.18em] text-[var(--c-gold)]">
            {data.abbreviation} · state guide
          </span>
          <h1 className="mt-4 text-[clamp(2.4rem,4.8vw,4.4rem)] font-serif leading-[1.05]">
            NCLEX-RN requirements in {data.name}
          </h1>
          <p className="mt-5 max-w-[58rem] text-base leading-8 text-[var(--c-text-muted)]">
            Everything you need to know to get licensed as an RN in {data.name}: the board, fees,
            continuing education, renewal cycle, fingerprint requirements, and NLC compact status.
          </p>
        </header>

        <section className="mb-10 grid gap-4 md:grid-cols-2">
          {[
            { label: "State board", value: data.boardName },
            { label: "Initial licensing fee", value: `$${data.feeUsd}` },
            { label: "CE hours per renewal", value: data.ceHoursPerRenewal === 0 ? "None required" : `${data.ceHoursPerRenewal} hours` },
            { label: "Renewal cycle", value: `${data.renewalYears} year${data.renewalYears > 1 ? "s" : ""}` },
            { label: "Fingerprint required", value: data.fingerprintRequired ? "Yes" : "No" },
            { label: "NLC compact member", value: data.nlcCompact ? "Yes" : "No" },
          ].map((item) => (
            <div key={item.label} className="rounded-[12px] border border-[var(--c-border)] bg-[var(--c-bg-elevated)] p-5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--c-text-muted)]">{item.label}</div>
              <div className="mt-2 text-base font-semibold">{item.value}</div>
            </div>
          ))}
        </section>

        <section className="prose prose-lg max-w-none text-[var(--c-text)]">
          <h2>How to get your RN license in {data.name}</h2>
          <ol>
            <li>
              <strong>Graduate from an approved nursing program.</strong> {data.name} accepts ADN
              and BSN graduates from programs accredited by ACEN or CCNE.
            </li>
            <li>
              <strong>Apply to the {data.boardName}.</strong> Submit your application,
              transcripts, and the $${data.feeUsd} licensing fee through the board's online portal at <a href={data.boardUrl} target="_blank" rel="noopener noreferrer">{data.boardUrl}</a>.
            </li>
            {data.fingerprintRequired ? (
              <li>
                <strong>Complete fingerprinting and background check.</strong> {data.name}{" "}
                requires a criminal background check via fingerprinting, typically through L-1
                Enrollment Services or IdentoGO.
              </li>
            ) : (
              <li>
                <strong>Background check.</strong> {data.name} does not require fingerprinting,
                but a self-disclosure of any prior convictions is required.
              </li>
            )}
            <li>
              <strong>Register for the NCLEX-RN with NCSBN.</strong> Pay the $200 NCSBN fee,
              receive your Authorization to Test (ATT), and schedule with Pearson VUE.
            </li>
            <li>
              <strong>Pass the NCLEX-RN.</strong> The exam is 75 to 145 questions, computer
              adaptive, up to 5 hours. Results are reported to your state board within 1–2
              business days.
            </li>
            <li>
              <strong>Receive your license.</strong> {data.boardName} issues your license number
              once your NCLEX results post.
            </li>
          </ol>

          <h2>{data.name} continuing education and renewal</h2>
          <p>{ceLine} Renewals are managed online through {data.boardName}.</p>
          {data.notes ? <p><strong>State-specific notes:</strong> {data.notes}</p> : null}

          <h2>Is {data.name} a compact state?</h2>
          <p>
            {data.nlcCompact
              ? `${data.name} is a member of the Nurse Licensure Compact (NLC). If you hold a multistate license issued by ${data.name}, you can practice in every other compact state without applying for additional licensure. Your primary state of residency must be ${data.name} to issue the compact license here.`
              : `${data.name} is not currently a member of the Nurse Licensure Compact. RNs licensed in ${data.name} need to apply for endorsement in any other state where they want to practice. RNs from compact states must obtain a ${data.name} single-state license to work here.`}
          </p>

          <h2>How much does it cost to become an RN in {data.name}?</h2>
          <p>
            Total first-time licensure cost in {data.name} typically runs ${data.feeUsd + 200 + (data.fingerprintRequired ? 50 : 0)}–${data.feeUsd + 250 + (data.fingerprintRequired ? 60 : 0)}: ${data.feeUsd} state fee + $200 NCSBN NCLEX-RN fee{data.fingerprintRequired ? " + $50–60 fingerprinting" : ""}, plus optional NCLEX prep ($10–$500 depending on resource).
          </p>

          <h2>Free NCLEX-RN practice for {data.name} candidates</h2>
          <p>
            Clarity gives every test-taker 10 free NCLEX questions per day with a free account.
            Premium ($9.99/mo) unlocks 5,000+ questions, the AI tutor, and 5 timed readiness exams
            modeled on the live NCLEX-RN — accepted at every state board because the NCLEX itself
            is the same nationally.
          </p>

          <div className="not-prose mt-6 flex flex-wrap gap-3">
            <Link
              href="/auth/signup"
              className="inline-flex rounded-[8px] bg-[var(--c-sage-deep)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--c-sage-deep-hover)]"
            >
              Start free NCLEX practice
            </Link>
            <Link
              href="/free/nclex-practice-exam"
              className="inline-flex rounded-[8px] border border-[var(--c-border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--c-text)]"
            >
              Take a free practice exam
            </Link>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-[clamp(1.6rem,3vw,2.2rem)] font-serif">NCLEX requirements in neighboring states</h2>
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {STATES.filter((s) => s.slug !== data.slug).slice(0, 8).map((s) => (
              <li key={s.slug}>
                <Link href={`/nclex-requirements/${s.slug}`} className="block rounded-[8px] border border-[var(--c-border)] bg-[var(--c-bg-elevated)] p-4 text-sm hover:border-[var(--c-gold)]">
                  NCLEX requirements in {s.name} →
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </article>
    </main>
  );
}
