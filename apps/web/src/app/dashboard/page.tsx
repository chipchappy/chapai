import { redirect } from "next/navigation";
import { getDashboardAccessContext } from "@/lib/dashboard-access";
import MissionControlAutoRefresh from "@/components/dashboard/MissionControlAutoRefresh";
import MissionControlDashboard from "@/components/dashboard/MissionControlDashboard";
import StudentProgressDashboard from "@/components/dashboard/StudentProgressDashboard";
import { getMissionControlSnapshot } from "@/lib/mission-control";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { getDB, hasDatabase, resolveEnv } from "@/lib/db";
import { getStudentDashboardData, getReadinessCategoryDeltas, getRecentMissesForTutor, type ReadinessCategoryDelta, type TutorFollowupItem } from "@/lib/student-dashboard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard — Your NCLEX-RN Progress",
  description:
    "Personalized NCLEX-RN dashboard with readiness score, weak areas, mastery by category, streak, and the next best study move.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{
    welcome?: string;
    view?: string;
    upgrade?: string;
    plan?: string;
    package?: string;
    utm_source?: string;
  }>;
}) {
  const params = (await searchParams) ?? {};
  const adminAccess = await getDashboardAccessContext();
  const user = await getAuthenticatedUser();

  const wantsMissionControl = params.view === "mission-control";

  // Admin / operator with a preview key → mission control dashboard (existing experience)
  if (adminAccess.role !== "none" && (wantsMissionControl || !user)) {
    const snapshot = await getMissionControlSnapshot();
    return (
      <main className="page-shell">
        <MissionControlAutoRefresh />
        <MissionControlDashboard snapshot={snapshot} access={adminAccess} />
      </main>
    );
  }

  // No auth at all → login flow
  if (!user) {
    redirect("/auth/login?next=%2Fdashboard");
  }

  // Authenticated student (or founder choosing the student view) → personalized dashboard
  const env = resolveEnv();
  let data;
  let readinessDeltas: ReadinessCategoryDelta[] = [];
  let tutorMisses: TutorFollowupItem[] = [];
  if (hasDatabase(env)) {
    try {
      const db = getDB(env);
      data = await getStudentDashboardData(db, { userId: user.id, email: user.email ?? null });
      try {
        readinessDeltas = await getReadinessCategoryDeltas(db, user.id);
      } catch {
        // non-fatal
      }
      try {
        tutorMisses = await getRecentMissesForTutor(db, user.id);
      } catch {
        // non-fatal
      }
    } catch {
      data = await getStudentDashboardData(null, { userId: user.id, email: user.email ?? null });
    }
  } else {
    data = await getStudentDashboardData(null, { userId: user.id, email: user.email ?? null });
  }

  const welcome = params.welcome === "1";
  const upgradeSuccess = params.upgrade === "success";
  return (
    <StudentProgressDashboard
      data={data}
      userEmail={user.email ?? null}
      welcome={welcome}
      upgradeSuccess={upgradeSuccess}
      upgradePackage={params.package ?? null}
      readinessDeltas={readinessDeltas}
      tutorMisses={tutorMisses}
      canUseTutor={Boolean(user?.email)}
      utmSource={params.utm_source ?? null}
    />
  );
}
