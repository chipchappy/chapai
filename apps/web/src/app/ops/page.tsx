import type { Metadata } from "next";
import { redirect } from "next/navigation";
import MissionControlAutoRefresh from "@/components/dashboard/MissionControlAutoRefresh";
import OpsDashboard from "@/components/dashboard/OpsDashboard";
import { getDashboardAccessContext } from "@/lib/dashboard-access";
import { getMissionControlSnapshot } from "@/lib/mission-control";
import { getOpsDashboardData } from "@/lib/ops-dashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ops - ChapAI",
  description: "Private ChapAI swarm operations dashboard.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function OpsPage() {
  const access = await getDashboardAccessContext();
  if (access.role !== "operator") {
    redirect("/guild-access?next=%2Fops");
  }

  const snapshot = await getMissionControlSnapshot();
  const ops = getOpsDashboardData(snapshot);

  return (
    <>
      <MissionControlAutoRefresh />
      <OpsDashboard snapshot={snapshot} ops={ops} accessLabel={access.displayLabel ?? "private operator"} />
    </>
  );
}
