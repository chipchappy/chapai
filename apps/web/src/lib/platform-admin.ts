import "server-only";
import { hasDatabase, resolveEnv, type Env } from "@/lib/db";

// ─────────────────────────────────────────────────────────────────────────────
// Platform admin — a scope strictly above instructor.
//
// An instructor is bound to exactly one cohort and can only ever read that
// cohort's grant holders. A platform admin can choose any cohort AND read the
// whole user base, including organic free signups who hold no institutional
// grant and are therefore invisible to every cohort-scoped query.
//
// Membership is an env allowlist, never a database flag: a DB row can be
// written by any code path that can write the DB, whereas the allowlist can
// only change through a deploy. Compare the same way the clinical-simulation
// admin gate does (lib/clinical-simulation/feature.ts).
// ─────────────────────────────────────────────────────────────────────────────

function allowlist(env: Partial<Env>): string[] {
  return (env.PLATFORM_ADMIN_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

export function isPlatformAdmin(email?: string | null, env: Partial<Env> = resolveEnv()): boolean {
  if (!email) return false;
  return allowlist(env).includes(email.trim().toLowerCase());
}

export type CohortOption = {
  cohort: string;
  institution: string | null;
  students: number;
};

/**
 * Every cohort on the platform, for the admin's scope picker. Instructors never
 * call this — they have exactly one cohort and no picker.
 */
export async function listCohorts(): Promise<CohortOption[]> {
  const env = resolveEnv();
  if (!hasDatabase(env) || !env.DB) return [];
  const binding = env.DB as unknown as {
    prepare: (sql: string) => { all: <T>() => Promise<{ results?: T[] }> };
  };
  try {
    const rows = (await binding.prepare(`
      SELECT cohort,
             MAX(institution) AS institution,
             COUNT(DISTINCT email) AS students
      FROM access_key_grants
      WHERE cohort IS NOT NULL AND role = 'student' AND email IS NOT NULL
      GROUP BY cohort
      ORDER BY students DESC
    `).all<{ cohort: string; institution: string | null; students: number }>()).results ?? [];
    return rows.map((r) => ({
      cohort: r.cohort,
      institution: r.institution ?? null,
      students: Number(r.students ?? 0),
    }));
  } catch {
    return [];
  }
}
