import type { Metadata } from "next";
import { redirect } from "next/navigation";
import InstructorDashboard from "@/components/dashboard/InstructorDashboard";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { getDB, hasDatabase, resolveEnv } from "@/lib/db";
import {
  getInstructorContext,
  getCohortRoster,
  EMPTY_COHORT_AGGREGATE,
  type RosterScope,
} from "@/lib/instructor-access";
import { isPlatformAdmin, listCohorts } from "@/lib/platform-admin";

export const metadata: Metadata = {
  title: "Instructor Dashboard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<{ scope?: string }> };

export default async function InstructorPage({ searchParams }: PageProps) {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/auth/login?next=/instructor");
    // Unreachable: redirect() throws. Present so `user` narrows to non-null
    // for the rest of the function under every module-resolution setup.
    return null;
  }

  const email = user.email ?? null;
  const admin = isPlatformAdmin(email);
  const ctx = await getInstructorContext({ userId: user.id, email });

  // A platform admin reaches this page without needing an instructor grant.
  if (!admin && !ctx.isInstructor) {
    // Not a faculty account — send to the personal study dashboard.
    redirect("/study");
  }

  const env = resolveEnv();
  const cohorts = admin ? await listCohorts() : [];

  // Scope resolution. Instructors stay pinned to their own cohort and ?scope is
  // ignored for them — otherwise the query string would be a way around cohort
  // isolation. Only an allowlisted admin can widen the scope.
  const requested = (await searchParams).scope;
  let scope: RosterScope;
  if (!admin) {
    scope = { kind: "cohort", cohort: (ctx as Extract<typeof ctx, { isInstructor: true }>).cohort };
  } else if (!requested || requested === "all") {
    scope = { kind: "all" };
  } else if (cohorts.some((c) => c.cohort === requested)) {
    scope = { kind: "cohort", cohort: requested };
  } else {
    scope = { kind: "all" };
  }

  const roster = hasDatabase(env)
    ? await getCohortRoster(getDB(env), scope)
    : { students: [], aggregate: EMPTY_COHORT_AGGREGATE };

  const activeCohort = scope.kind === "cohort" ? scope.cohort : null;
  const institution = admin
    ? activeCohort
      ? cohorts.find((c) => c.cohort === activeCohort)?.institution ?? activeCohort
      : "All students"
    : ctx.isInstructor
      ? ctx.institution
      : null;

  return (
    <main className="min-h-screen bg-bg px-4 py-8 md:py-12">
      <InstructorDashboard
        institution={institution}
        cohort={activeCohort ?? "all"}
        accessExpiresAt={ctx.isInstructor ? ctx.expiresAt : null}
        students={roster.students}
        aggregate={roster.aggregate}
        isPlatformAdmin={admin}
        cohortOptions={cohorts}
        activeScope={scope.kind === "all" ? "all" : scope.cohort}
      />
    </main>
  );
}
