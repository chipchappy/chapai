import { z } from "zod";
import { getClinicalSimulationAccess } from "@/lib/clinical-simulation/access";
import { getClinicalScenarioById } from "@/lib/clinical-simulation/scenarios";
import { createSimulationAssignment, listSimulationAssignments } from "@/lib/clinical-simulation/store";
import { getInstructorContext } from "@/lib/instructor-access";
import { handleRouteError, jsonError, jsonSuccess } from "@/lib/http";

export const dynamic = "force-dynamic";

type RawD1 = {
  prepare: (sql: string) => {
    bind: (...values: unknown[]) => {
      all: <T>() => Promise<{ results?: T[] }>;
    };
  };
};

type CohortAttemptRow = {
  student_id: string;
  email: string;
  name: string | null;
  attempt_id: string | null;
  scenario_id: string | null;
  status: string | null;
  mode: string | null;
  started_at: number | null;
  completed_at: number | null;
  updated_at: number | null;
  virtual_minute: number | null;
  score_domains: string | null;
  critical_errors: string | null;
};

const assignmentSchema = z.object({
  scenarioId: z.string().min(3),
  mode: z.enum(["guided", "independent"]),
  minimumDomainLevel: z.enum(["developing", "competent", "strong"]).nullable().optional(),
  dueAt: z.number().int().positive().nullable().optional(),
});

async function instructorAccess() {
  const access = await getClinicalSimulationAccess();
  if (!access.ok) return { access, response: access.response } as const;
  const instructor = await getInstructorContext({ userId: access.user.id, email: access.user.email ?? null });
  if (!instructor.isInstructor) {
    return { access, response: jsonError(403, "INSTRUCTOR_REQUIRED", "Instructor access is required.") } as const;
  }
  return { access, instructor, response: null } as const;
}

export async function GET() {
  try {
    const loaded = await instructorAccess();
    if (loaded.response) return loaded.response;
    const raw = loaded.access.env.DB as unknown as RawD1;
    const rows = (await raw.prepare(`
      SELECT u.id AS student_id, u.email, u.name,
             a.id AS attempt_id, a.scenario_id, a.status, a.mode,
             a.started_at, a.completed_at, a.updated_at, a.virtual_minute,
             a.score_domains, a.critical_errors
      FROM (
        SELECT DISTINCT lower(email) AS normalized_email
        FROM access_key_grants
        WHERE cohort = ? AND role = 'student' AND email IS NOT NULL AND expires_at > unixepoch()
      ) g
      JOIN users u ON lower(u.email) = g.normalized_email
      LEFT JOIN clinical_simulation_attempts a ON a.user_id = u.id
      ORDER BY u.email, a.updated_at DESC
    `).bind(loaded.instructor.cohort).all<CohortAttemptRow>()).results ?? [];
    const assignments = await listSimulationAssignments(loaded.access.db, loaded.instructor.cohort);
    return jsonSuccess({
      cohort: loaded.instructor.cohort,
      institution: loaded.instructor.institution,
      attempts: rows.map((row) => ({
        ...row,
        score_domains: row.score_domains ? JSON.parse(row.score_domains) : [],
        critical_errors: row.critical_errors ? JSON.parse(row.critical_errors) : [],
      })),
      assignments,
    });
  } catch (error) {
    return handleRouteError(error, { route: "/api/clinical-simulation/instructor" });
  }
}

export async function POST(request: Request) {
  try {
    const loaded = await instructorAccess();
    if (loaded.response) return loaded.response;
    const input = assignmentSchema.parse(await request.json());
    const scenario = getClinicalScenarioById(input.scenarioId);
    if (!scenario) return jsonError(404, "SCENARIO_NOT_FOUND", "The requested simulation scenario was not found.");
    const assignment = await createSimulationAssignment(loaded.access.db, {
      cohort: loaded.instructor.cohort,
      instructorUserId: loaded.access.hostedUser.id,
      scenarioId: scenario.id,
      mode: input.mode,
      minimumDomainLevel: input.minimumDomainLevel ?? null,
      dueAt: input.dueAt ?? null,
    });
    return jsonSuccess(assignment, 201);
  } catch (error) {
    return handleRouteError(error, { route: "/api/clinical-simulation/instructor" });
  }
}
