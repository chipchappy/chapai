import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Clarity for Nursing Programs | Program-wide NCLEX readiness",
  description:
    "Clarity Campus gives nursing programs the assessment, analytics, and reporting they expect from ATI — with the calm, modern experience students actually want. Cohort dashboards, at-risk alerts, readiness exams, and transparent pricing.",
};

const DEMO_MAILTO =
  "mailto:business@chapaisolutions.com?subject=Clarity%20for%20Nursing%20Programs%20%E2%80%94%20demo%20request&body=Program%2FSchool%3A%20%0ARole%3A%20%0ACohort%20size%3A%20%0ATarget%20start%3A%20%0A%0AWhat%20we%27d%20like%20to%20see%3A%20";

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`mx-auto w-full max-w-[1080px] px-5 ${className}`}>{children}</section>;
}

export default function ProgramsPage() {
  return (
    <main className="bg-[var(--c-bg)] text-[var(--c-text)]">
      {/* Hero */}
      <Section className="pt-16 pb-12 md:pt-24 md:pb-16">
        <span className="text-[0.78rem] font-bold uppercase tracking-[0.18em] text-[var(--c-gold)]">
          For nursing programs
        </span>
        <h1 className="mt-4 max-w-[16ch] text-[clamp(2.4rem,5.4vw,4.2rem)] leading-[1.04]">
          NCLEX readiness your whole program can see.
        </h1>
        <p className="mt-6 max-w-[54ch] text-lg leading-8 text-[var(--c-text-muted)]">
          Clarity Campus brings the assessment depth, cohort analytics, and reporting nursing programs
          expect from ATI and Kaplan — delivered through the calm, modern, mobile-first experience
          students already prefer. No bloat, no busywork, transparent pricing.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <a
            href={DEMO_MAILTO}
            className="inline-flex items-center justify-center rounded-full bg-[var(--c-adobe)] px-7 py-3 text-base font-semibold text-white shadow-[0_10px_30px_rgba(176,92,67,0.28)] transition hover:opacity-95"
          >
            Request a demo
          </a>
          <a
            href="#pilot"
            className="inline-flex items-center justify-center rounded-full border border-[var(--c-border)] bg-[var(--c-bg-elevated)] px-7 py-3 text-base font-semibold text-[var(--c-text)] transition hover:border-[var(--c-gold)]"
          >
            Start a founding pilot
          </a>
        </div>
      </Section>

      {/* Proof band */}
      <Section className="pb-14">
        <div className="grid gap-4 rounded-[18px] border border-[var(--c-border)] bg-[var(--c-bg-elevated)] p-6 sm:grid-cols-4 md:p-8">
          {[
            ["3,800+", "premium NCLEX & NGN items"],
            ["Mechanism-level", "rationales with visual guides"],
            ["5", "blueprint-built readiness exams"],
            ["Live today", "used by students & programs now"],
          ].map(([n, l]) => (
            <div key={l}>
              <div className="font-serif text-[1.9rem] leading-none text-[var(--c-teal,#2F6E62)]">{n}</div>
              <div className="mt-2 text-sm leading-6 text-[var(--c-text-muted)]">{l}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Why students prefer it */}
      <Section className="py-10">
        <h2 className="text-[clamp(1.7rem,3.4vw,2.4rem)] leading-tight">Students actually want to use it.</h2>
        <p className="mt-3 max-w-[60ch] text-[var(--c-text-muted)] leading-8">
          Adoption fails when a platform feels like a chore. Clarity keeps the parts that build mastery and
          cuts the friction: a fast question bank, premium per-distractor rationales, reasoning-mapped
          visuals, and a grounded AI tutor after every question — on any phone.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ["Premium rationales", "Why the answer is right, why every distractor is wrong, the clinical principle, safety logic, and a test-taking cue — not a one-line explanation."],
            ["Reasoning-mapped visuals", "Onset timelines, decision matrices, and lab-range gauges that make the answer stick for visual learners — a genuine differentiator."],
            ["Grounded AI tutor", "A capable tutor that answers any nursing question in depth, anchored to the verified rationale so it stays safe and accurate."],
          ].map(([h, b]) => (
            <div key={h} className="rounded-[16px] border border-[var(--c-border)] bg-[var(--c-bg-elevated)] p-5">
              <h3 className="font-serif text-lg text-[var(--c-text)]">{h}</h3>
              <p className="mt-2 text-sm leading-7 text-[var(--c-text-muted)]">{b}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* For faculty / For administrators */}
      <Section className="py-10">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-[18px] border border-[var(--c-border)] bg-[var(--c-bg-elevated)] p-6 md:p-7">
            <span className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[var(--c-gold)]">For faculty</span>
            <h3 className="mt-3 font-serif text-2xl">See who needs help, before it&apos;s too late.</h3>
            <ul className="mt-4 space-y-2.5 text-sm leading-7 text-[var(--c-text-muted)]">
              <li>Cohort roster with readiness distribution and at-risk students surfaced first</li>
              <li>Per-student strengths, weaknesses, trend, and time-per-question</li>
              <li>Assign question sets or readiness exams with open/close windows</li>
              <li>Log interventions; export a course file in one click</li>
            </ul>
          </div>
          <div className="rounded-[18px] border border-[var(--c-border)] bg-[var(--c-bg-elevated)] p-6 md:p-7">
            <span className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[var(--c-gold)]">For administrators</span>
            <h3 className="mt-3 font-serif text-2xl">Program-wide readiness, accreditation-ready.</h3>
            <ul className="mt-4 space-y-2.5 text-sm leading-7 text-[var(--c-text-muted)]">
              <li>Cohort-over-cohort and semester comparisons</li>
              <li>Client-needs and clinical-judgment performance across the program</li>
              <li>Exportable, dated reports mapped to your blueprint</li>
              <li>Role-based access, cohorts, licensing, and audit trail</li>
            </ul>
          </div>
        </div>
      </Section>

      {/* Comparison */}
      <Section className="py-10">
        <h2 className="text-[clamp(1.7rem,3.4vw,2.4rem)] leading-tight">A modern alternative — not more of the same.</h2>
        <div className="mt-6 overflow-x-auto rounded-[16px] border border-[var(--c-border)]">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="bg-[var(--c-bg-elevated)] text-left text-[0.74rem] uppercase tracking-wide text-[var(--c-text-muted)]">
                <th className="p-4 font-semibold">Capability</th>
                <th className="p-4 font-semibold">Traditional platforms</th>
                <th className="p-4 font-semibold">Clarity Campus</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Student experience", "Dense, dated, desktop-first", "Calm, modern, mobile-first"],
                ["Rationale depth", "Variable", "Mechanism-level + visuals, every item"],
                ["AI tutor per question", "Rare / emerging", "Live, grounded, capable"],
                ["Cohort analytics & at-risk", "Full", "Full"],
                ["Pricing", "Opaque, per-program", "Transparent, published tiers"],
                ["Time to onboard a cohort", "Weeks", "Days"],
              ].map(([c, a, b]) => (
                <tr key={c} className="border-t border-[var(--c-border)]">
                  <td className="p-4 font-medium text-[var(--c-text)]">{c}</td>
                  <td className="p-4 text-[var(--c-text-muted)]">{a}</td>
                  <td className="p-4 text-[var(--c-text)]">{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs italic text-[var(--c-text-muted)]">
          A factual, feature-by-feature comparison. We compete on quality, experience, and transparency.
        </p>
      </Section>

      {/* Tiers */}
      <Section className="py-10">
        <h2 className="text-[clamp(1.7rem,3.4vw,2.4rem)] leading-tight">Packaged for how programs actually buy.</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            ["Essentials", "Question bank, readiness exams, faculty assignments, cohort reporting, standard support."],
            ["Program Readiness", "Everything in Essentials + advanced analytics, at-risk alerts, adaptive study plans, custom blueprints, curriculum mapping."],
            ["Campus Partner", "Everything in Program Readiness + multi-campus licensing, branded portal, SSO/LMS, accreditation reporting, dedicated onboarding."],
          ].map(([t, d], i) => (
            <div key={t} className={`rounded-[16px] border p-6 ${i === 1 ? "border-[var(--c-gold)] bg-[var(--c-bg-elevated)]" : "border-[var(--c-border)] bg-[var(--c-bg-elevated)]"}`}>
              {i === 1 && <span className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[var(--c-gold)]">Most popular</span>}
              <h3 className="mt-1 font-serif text-xl">{t}</h3>
              <p className="mt-2 text-sm leading-7 text-[var(--c-text-muted)]">{d}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-[var(--c-text-muted)]">
          Directional pricing: roughly <strong className="text-[var(--c-text)]">$64–$120 per student / year</strong> by cohort size,
          with flat-rate and multi-campus options. Add-ons: live review, custom content, SSO/LMS, pass-guarantee eligibility.
        </p>
      </Section>

      {/* Pilot CTA */}
      <Section className="py-12" >
        <div id="pilot" className="rounded-[22px] border border-[var(--c-border)] bg-[var(--c-bg-elevated)] p-7 md:p-10">
          <span className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[var(--c-gold)]">Founding-partner pilot</span>
          <h2 className="mt-3 max-w-[22ch] text-[clamp(1.6rem,3.2vw,2.4rem)] leading-tight">
            Run one cohort, one semester — and see the outcomes for yourself.
          </h2>
          <p className="mt-4 max-w-[58ch] text-[var(--c-text-muted)] leading-8">
            A limited number of founding programs get a full-featured pilot at a founding rate, with dedicated
            onboarding and a locked partner price for year two — in exchange for outcome data and a case study.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={DEMO_MAILTO} className="inline-flex items-center justify-center rounded-full bg-[var(--c-adobe)] px-7 py-3 text-base font-semibold text-white transition hover:opacity-95">
              Request a demo
            </a>
            <Link href="/quiz" className="inline-flex items-center justify-center rounded-full border border-[var(--c-border)] px-7 py-3 text-base font-semibold text-[var(--c-text)] transition hover:border-[var(--c-gold)]">
              Try the student experience
            </Link>
          </div>
        </div>
      </Section>

      {/* FAQ */}
      <Section className="pb-20">
        <h2 className="text-[clamp(1.5rem,3vw,2rem)] leading-tight">Questions programs ask</h2>
        <div className="mt-5 divide-y divide-[var(--c-border)] rounded-[16px] border border-[var(--c-border)]">
          {[
            ["Does this change the experience for our students?", "No. Students use the same fast, modern Clarity they already like — the program layer simply adds assigned exams and due dates. Nothing about the individual product changes."],
            ["How does readiness scoring work?", "We present banded readiness indicators, not guarantees. True adaptive (CAT) and validated cut scores are introduced once a program has enough response data for sound psychometrics — we won't overclaim before then."],
            ["How is student data handled?", "The program owns its data. Access is role-scoped, exports are available, and we are building toward an institution-ready security and privacy posture governed by a data-sharing agreement. We make no compliance claim we haven't verified."],
            ["How fast can we start?", "A pilot cohort can be onboarded in days. Request a demo and we'll scope it with you."],
          ].map(([q, a]) => (
            <details key={q} className="group p-5">
              <summary className="cursor-pointer list-none font-serif text-lg text-[var(--c-text)] marker:hidden">
                {q}
              </summary>
              <p className="mt-3 text-sm leading-7 text-[var(--c-text-muted)]">{a}</p>
            </details>
          ))}
        </div>
        <p className="mt-6 text-sm text-[var(--c-text-muted)]">
          Ready to talk?{" "}
          <a href={DEMO_MAILTO} className="font-semibold text-[var(--c-adobe)] underline underline-offset-2">
            Request a demo
          </a>{" "}
          or email business@chapaisolutions.com.
        </p>
      </Section>
    </main>
  );
}
