import { getDashboardAccessContext } from "@/lib/dashboard-access";
import MissionControlAutoRefresh from "@/components/dashboard/MissionControlAutoRefresh";
import MissionControlDashboard from "@/components/dashboard/MissionControlDashboard";
import { getMissionControlSnapshot } from "@/lib/mission-control";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Guild Dashboard - ChapAI",
  description: "Live guild dashboard for agent brains, batch growth, runtime health, and direct human fixes.",
  robots: {
    index: false,
    follow: false,
  },
};

function WelcomeBanner() {
  return (
    <section className="mb-6 rounded-[8px] border border-[rgba(107,138,110,0.42)] bg-[#EEF4EC] p-5">
      <span className="text-[0.74rem] font-bold uppercase tracking-[0.16em] text-[var(--c-sage-deep)]">
        Welcome to Clarity
      </span>
      <h1 className="mt-2 text-[clamp(2rem,4vw,3.4rem)]">Start in the test runner.</h1>
      <p className="mt-3 max-w-[42rem] text-sm leading-7 text-[var(--c-text-muted)]">
        Your premium dashboard stays warm and readable. Questions open in a separate NCLEX-style runner so practice feels like the exam.
      </p>
      <a
        href="/quiz/sample"
        className="mt-5 inline-flex rounded-[8px] bg-[var(--c-sage-deep)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--c-sage-deep-hover)]"
      >
        Try your first NCLEX question &rarr;
      </a>
    </section>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ welcome?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const access = await getDashboardAccessContext();
  if (access.role === "none") {
    if (params.welcome === "1") {
      return (
        <main className="page-shell">
          <WelcomeBanner />
        </main>
      );
    }
    redirect("/guild-access?next=%2Fdashboard");
  }

  const snapshot = await getMissionControlSnapshot();

  return (
    <main className="page-shell">
      {params.welcome === "1" ? <WelcomeBanner /> : null}
      <MissionControlAutoRefresh />
      <MissionControlDashboard snapshot={snapshot} access={access} />
    </main>
  );
}
