import type { ServerEnv } from "@/lib/env";
import { getServerEnv } from "@/lib/env";

function adminEmails(env: ServerEnv) {
  return new Set(
    (env.CLINICAL_SIMULATION_ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

/**
 * The simulator is opt-in in every environment. Production additionally
 * requires an authenticated allowlisted administrator, preventing an
 * accidental flag change from exposing unfinished routes to students.
 */
export function isClinicalSimulationEnabledForUser(
  userEmail?: string | null,
  env = getServerEnv(),
) {
  if (!env.CLINICAL_SIMULATION_ENABLED) return false;
  if (env.APP_ENV !== "production" || env.VERCEL_ENV === "preview") return true;
  return Boolean(userEmail && adminEmails(env).has(userEmail.trim().toLowerCase()));
}

export function isClinicalSimulationDeveloperForUser(
  userEmail?: string | null,
  env = getServerEnv(),
) {
  if (!env.CLINICAL_SIMULATION_ENABLED) return false;
  if (env.APP_ENV === "development") return true;
  return Boolean(userEmail && adminEmails(env).has(userEmail.trim().toLowerCase()));
}
