import { ensureHostedUser } from "@/lib/billing-store";
import { getDB, hasDatabase, resolveEnv } from "@/lib/db";
import { isClinicalSimulationDeveloperForUser, isClinicalSimulationEnabledForUser } from "@/lib/clinical-simulation/feature";
import { jsonError } from "@/lib/http";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export async function getClinicalSimulationAccess() {
  const env = resolveEnv();
  const user = await getAuthenticatedUser();

  if (!isClinicalSimulationEnabledForUser(user?.email ?? null, env)) {
    return {
      ok: false as const,
      response: jsonError(404, "NOT_FOUND", "Not found."),
    };
  }

  if (!user) {
    return {
      ok: false as const,
      response: jsonError(401, "AUTH_REQUIRED", "Sign in to use Clinical Simulation."),
    };
  }

  if (!hasDatabase(env)) {
    return {
      ok: false as const,
      response: jsonError(503, "SIMULATION_STORAGE_UNAVAILABLE", "Clinical Simulation storage is not configured."),
    };
  }

  const db = getDB(env);
  const hostedUser = await ensureHostedUser(db, {
    userId: user.id,
    email: user.email ?? null,
    name: typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null,
  });

  if (!hostedUser) {
    return {
      ok: false as const,
      response: jsonError(503, "SIMULATION_ACCOUNT_UNAVAILABLE", "The hosted student account could not be loaded."),
    };
  }

  return {
    ok: true as const,
    env,
    db,
    user,
    hostedUser,
    developerToolsEnabled: isClinicalSimulationDeveloperForUser(user.email, env),
  };
}
