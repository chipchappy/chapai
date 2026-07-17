import { z } from "zod";
import { getClinicalSimulationAccess } from "@/lib/clinical-simulation/access";
import { getClinicalScenarioBySlug } from "@/lib/clinical-simulation/scenarios";
import { createSimulationAttempt, listSimulationAttempts } from "@/lib/clinical-simulation/store";
import { handleRouteError, jsonError, jsonSuccess } from "@/lib/http";

export const dynamic = "force-dynamic";

const startSchema = z.object({
  scenarioSlug: z.string().regex(/^[a-z0-9-]+$/),
  mode: z.enum(["guided", "independent"]),
  seed: z.number().int().positive().max(2_147_483_647).optional(),
});

type RawD1 = {
  prepare: (sql: string) => {
    bind: (...values: unknown[]) => {
      all: <T>() => Promise<{ results?: T[] }>;
    };
  };
};

type StudentAssignmentRow = {
  id: string;
  scenario_id: string;
  mode: "guided" | "independent";
  minimum_domain_level: string | null;
  due_at: number | null;
  created_at: number;
};

function attemptSummary(attempt: Awaited<ReturnType<typeof listSimulationAttempts>>[number]) {
  return {
    id: attempt.id,
    scenarioId: attempt.scenarioId,
    scenarioVersion: attempt.scenarioVersion,
    mode: attempt.mode,
    status: attempt.status,
    seed: attempt.seed,
    virtualMinute: attempt.virtualMinute,
    domainScores: attempt.domainScores,
    criticalErrors: attempt.criticalErrors,
    debriefViewed: attempt.debriefViewed,
    startedAt: attempt.startedAt,
    updatedAt: attempt.updatedAt,
    completedAt: attempt.completedAt,
  };
}

export async function GET() {
  const access = await getClinicalSimulationAccess();
  if (!access.ok) return access.response;
  try {
    const attempts = await listSimulationAttempts(access.db, access.hostedUser.id);
    const raw = access.env.DB as unknown as RawD1;
    const assignments = access.user.email
      ? (await raw.prepare(`
          SELECT DISTINCT a.id, a.scenario_id, a.mode, a.minimum_domain_level, a.due_at, a.created_at
          FROM clinical_simulation_assignments a
          JOIN access_key_grants g ON g.cohort = a.cohort
          WHERE g.role = 'student' AND lower(g.email) = lower(?) AND g.expires_at > unixepoch()
          ORDER BY a.created_at DESC
        `).bind(access.user.email).all<StudentAssignmentRow>()).results ?? []
      : [];
    return jsonSuccess({
      attempts: attempts.map(attemptSummary),
      assignments: assignments.map((assignment) => ({
        id: assignment.id,
        scenarioId: assignment.scenario_id,
        mode: assignment.mode,
        minimumDomainLevel: assignment.minimum_domain_level,
        dueAt: assignment.due_at,
        createdAt: assignment.created_at,
      })),
      developerToolsEnabled: access.developerToolsEnabled,
    });
  } catch (error) {
    return handleRouteError(error, { route: "/api/clinical-simulation/attempts" });
  }
}

export async function POST(request: Request) {
  const access = await getClinicalSimulationAccess();
  if (!access.ok) return access.response;
  try {
    const input = startSchema.parse(await request.json());
    const scenario = getClinicalScenarioBySlug(input.scenarioSlug);
    if (!scenario) return jsonError(404, "SCENARIO_NOT_FOUND", "The requested simulation scenario was not found.");

    const attempt = await createSimulationAttempt(access.db, {
      userId: access.hostedUser.id,
      scenario,
      mode: input.mode,
      seed: input.seed ?? ((crypto.getRandomValues(new Uint32Array(1))[0] % 2_147_483_647) || 1),
    });
    return jsonSuccess({ ...attemptSummary(attempt), state: attempt.state }, 201);
  } catch (error) {
    return handleRouteError(error, { route: "/api/clinical-simulation/attempts" });
  }
}
