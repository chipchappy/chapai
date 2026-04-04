import { compareDashboardAccessKey, DASHBOARD_AUTH_COOKIE } from "@/lib/dashboard-auth";
import MissionControlAutoRefresh from "@/components/dashboard/MissionControlAutoRefresh";
import MissionControlDashboard from "@/components/dashboard/MissionControlDashboard";
import { getMissionControlSnapshot } from "@/lib/mission-control";
import { cookies } from "next/headers";
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

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const accessCookie = cookieStore.get(DASHBOARD_AUTH_COOKIE)?.value;

  if (!compareDashboardAccessKey(accessCookie)) {
    redirect("/guild-access?next=%2Fdashboard");
  }

  const snapshot = await getMissionControlSnapshot();

  return (
    <main className="page-shell">
      <MissionControlAutoRefresh />
      <MissionControlDashboard snapshot={snapshot} />
    </main>
  );
}
