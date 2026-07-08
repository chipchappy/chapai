import type { Metadata } from "next";
import { redirect } from "next/navigation";
import InstructorDashboard from "@/components/dashboard/InstructorDashboard";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { getDB, hasDatabase, resolveEnv } from "@/lib/db";
import { getInstructorContext, getCohortRoster } from "@/lib/instructor-access";

export const metadata: Metadata = {
  title: "Instructor Dashboard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function InstructorPage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/auth/login?next=/instructor");
  }

  const ctx = await getInstructorContext({ userId: user.id, email: user.email ?? null });
  if (!ctx.isInstructor) {
    // Not a faculty account — send to the personal study dashboard.
    redirect("/study");
  }

  const env = resolveEnv();
  const roster = hasDatabase(env)
    ? await getCohortRoster(getDB(env), ctx.cohort)
    : { students: [], aggregate: { count: 0, active7: 0, onTrack: 0, atRisk: 0, avgAccuracy: 0 } };

  return (
    <main className="min-h-screen bg-bg px-4 py-8 md:py-12">
      <InstructorDashboard
        institution={ctx.institution}
        cohort={ctx.cohort}
        students={roster.students}
        aggregate={roster.aggregate}
      />
    </main>
  );
}
