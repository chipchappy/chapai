import { redirect } from "next/navigation";
import { FrontpageSignalRings } from "@/components/marketing/frontpage";
import { getServerAccessContext } from "@/lib/server-access";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Preview Hub | Clarity",
  description: "Preview the upgraded Clarity practice center, premium study modes, and AI tutor flows.",
  robots: {
    index: false,
    follow: false,
  },
};

const practiceLinks = [
  {
    href: "/quiz?exam=ccrn&mode=standard",
    label: "Standard CCRN",
    note: "Use the live-bank session flow with larger question taking and rationale review.",
  },
  {
    href: "/quiz?exam=nclex&mode=chart",
    label: "Chart Reading",
    note: "Stress-test wide data panels, trend reading, and chart-based reasoning.",
  },
  {
    href: "/quiz?exam=ccrn&mode=case-study",
    label: "CCRN Case Study",
    note: "Open the clinically serious bedside format with labs, vitals, and hemodynamics.",
  },
  {
    href: "/quiz?exam=nclex&mode=ngn",
    label: "NGN Flow",
    note: "Validate matrix and multi-select handling inside the richer study player.",
  },
  {
    href: "/quiz?mode=practice-exam&practiceExam=nclex-sim-1",
    label: "Practice Exam",
    note: "Launch a fixed-length simulation with timer, review states, and score flow.",
  },
  {
    href: "/ccrn/ai-tutor",
    label: "AI Tutor",
    note: "Verify that premium access unlocks the coaching layer without dead ends.",
  },
] as const;

export default async function DemoPage() {
  const { access } = await getServerAccessContext();

  if (access.tier === "free") {
    redirect("/demo-access?next=%2Fdemo");
  }

  const founderAccess = access.source === "founder-key";
  const paidAccess = access.source === "server-entitlement";

  return (
    <main className="page-shell">
      <section className="overflow-hidden rounded-[34px] border border-border bg-[linear-gradient(135deg,rgba(250,246,239,0.98),rgba(240,244,239,0.92))] shadow-card">
        <div className="grid gap-8 px-6 py-6 md:px-8 md:py-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="max-w-2xl">
            <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
              {access.accessType ? <span className="rounded-full border border-border px-3 py-1">{access.accessType}</span> : null}
              <span className="rounded-full border border-border px-3 py-1">scope {access.examTrack}</span>
              <span className="rounded-full border border-border px-3 py-1">{access.tier.toUpperCase()} study access</span>
            </div>
            <h1 className="mt-4 font-serif text-[clamp(2.8rem,6vw,4.8rem)] leading-[0.92] text-dark">
              Preview the real Clarity product.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted">
              This preview hub now points directly into the upgraded practice center instead of a detached shell. Use
              it to inspect rich study modes, simulation flow, and premium tutor access on the working product surface.
            </p>
            <div className="mt-6 rounded-[24px] border border-[rgba(90,127,136,0.18)] bg-[rgba(255,252,247,0.82)] p-5">
              <p className="text-sm font-semibold text-dark">
                {founderAccess
                  ? "Founder full access is active for every premium mode, simulation, and tutor surface."
                  : paidAccess
                    ? "Paid premium access is active on this account. Launch the richer study flows below to validate the live product surface."
                    : "Preview access is active. Launch the richer study flows below to validate the product surface."}
              </p>
              {access.displayLabel ? <p className="mt-2 text-sm leading-6 text-muted">{access.displayLabel}</p> : null}
            </div>
          </div>

          <div className="flex min-h-[18rem] items-center justify-center lg:min-h-[26rem] lg:justify-end">
            <FrontpageSignalRings tone="cool" className="max-w-[22rem] opacity-90 md:max-w-[28rem]" />
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {practiceLinks.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="rounded-[26px] border border-border bg-[rgba(255,252,247,0.94)] p-6 shadow-card transition-transform duration-200 hover:-translate-y-0.5"
          >
            <span className="section-label">Live path</span>
            <strong className="mt-3 block font-serif text-[1.8rem] leading-[1] text-dark">{item.label}</strong>
            <span className="mt-3 block text-sm leading-6 text-muted">{item.note}</span>
          </a>
        ))}
      </section>
    </main>
  );
}
