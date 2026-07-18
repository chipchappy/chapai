import { notFound, redirect } from "next/navigation";
import { resolveEnv } from "@/lib/db";
import { isClinicalSimulationDeveloperForUser, isClinicalSimulationEnabledForUser } from "@/lib/clinical-simulation/feature";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export async function requireClinicalSimulationPageAccess(nextPath = "/clinical-simulation") {
  const env = resolveEnv();
  const user = await getAuthenticatedUser();
  if (!isClinicalSimulationEnabledForUser(user?.email ?? null, env)) notFound();
  if (!user) redirect(`/auth/login?next=${encodeURIComponent(nextPath)}`);
  return {
    user,
    developerToolsEnabled: isClinicalSimulationDeveloperForUser(user.email, env),
  };
}
