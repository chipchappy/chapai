import type { Metadata } from "next";
import Link from "next/link";
import { STATES } from "@/content/state-pages/states";

const SITE_URL = "https://claritynclex.com";

export const metadata: Metadata = {
  title: "NCLEX Requirements by State — Fees, CE Hours, NLC Compact List",
  description:
    "Complete NCLEX-RN requirements for all 50 states: state board, licensing fee, continuing education hours, fingerprint requirement, and NLC compact status.",
  alternates: { canonical: "/nclex-requirements" },
  keywords: [
    "NCLEX requirements by state",
    "NCLEX-RN requirements",
    "nursing license requirements",
    "NLC compact states",
    "state board of nursing requirements",
  ],
  openGraph: {
    title: "NCLEX Requirements by State — All 50 States",
    description: "Fees, CE hours, fingerprint requirements, NLC compact status for every state.",
    url: `${SITE_URL}/nclex-requirements`,
    type: "website",
  },
};

export default function Page() {
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "NCLEX Requirements by State",
    itemListElement: STATES.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/nclex-requirements/${s.slug}`,
      name: `NCLEX requirements in ${s.name}`,
    })),
  };

  return (
    <main className="min-h-screen bg-[var(--c-bg)] px-4 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      <div className="mx-auto max-w-[1080px]">
        <header className="mb-10">
          <span className="text-[0.78rem] font-bold uppercase tracking-[0.18em] text-[var(--c-gold)]">
            Complete state-by-state reference
          </span>
          <h1 className="mt-4 text-[clamp(2.6rem,5vw,4.6rem)] font-serif leading-[1.05]">
            NCLEX-RN requirements by state
          </h1>
          <p className="mt-5 max-w-[60rem] text-base leading-8 text-[var(--c-text-muted)]">
            Licensing fees, continuing education hours, renewal cycles, fingerprint requirements,
            and NLC compact membership for every U.S. state. Always confirm directly with your
            state board before submitting — rules change.
          </p>
        </header>

        <div className="overflow-x-auto rounded-[12px] border border-[var(--c-border)] bg-[var(--c-bg-elevated)]">
          <table className="w-full text-sm">
            <thead className="bg-[rgba(126,157,134,0.10)]">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">State</th>
                <th className="px-4 py-3 text-left font-semibold">Fee</th>
                <th className="px-4 py-3 text-left font-semibold">CE hrs</th>
                <th className="px-4 py-3 text-left font-semibold">Renewal</th>
                <th className="px-4 py-3 text-left font-semibold">NLC</th>
                <th className="px-4 py-3 text-left font-semibold">Fingerprint</th>
              </tr>
            </thead>
            <tbody>
              {STATES.map((s, i) => (
                <tr key={s.slug} className={i % 2 === 0 ? "bg-white" : ""}>
                  <td className="px-4 py-3">
                    <Link href={`/nclex-requirements/${s.slug}`} className="font-semibold text-[var(--c-sage-deep)] hover:underline">
                      {s.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">${s.feeUsd}</td>
                  <td className="px-4 py-3">{s.ceHoursPerRenewal || "—"}</td>
                  <td className="px-4 py-3">{s.renewalYears} yr</td>
                  <td className="px-4 py-3">{s.nlcCompact ? "Yes" : "No"}</td>
                  <td className="px-4 py-3">{s.fingerprintRequired ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <section className="mt-10 prose prose-lg max-w-none text-[var(--c-text)]">
          <h2>What is the NLC compact?</h2>
          <p>
            The Nurse Licensure Compact (NLC) lets RNs and LPNs hold a multistate license that's
            valid in every participating state. As of 2026, over 40 states are members. If you're
            licensed in a compact state and live in a compact state, you can practice across all
            compact states without applying for additional licenses.
          </p>

          <h2>Which states are NOT in the NLC compact?</h2>
          <p>
            The notable non-compact states are California, New York, Massachusetts, Illinois,
            Connecticut, Hawaii, Nevada, Oregon, Washington, Michigan, and Minnesota. If you
            primarily live or practice in these states, you'll need to apply for each license
            individually (endorsement process).
          </p>

          <h2>How much does it cost to get licensed?</h2>
          <p>
            Initial RN licensing fees range from $50 (Indiana) to $350 (California). Add the $200
            NCSBN fee for the NCLEX-RN exam itself, plus $25–60 for fingerprinting if your state
            requires it. Total cost for first-time licensure typically falls between $300 and
            $600.
          </p>
        </section>
      </div>
    </main>
  );
}
