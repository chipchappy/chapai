import { getClinicalSimulationAccess } from "@/lib/clinical-simulation/access";
import { completeSimulation } from "@/lib/clinical-simulation/engine";
import { getClinicalScenarioById } from "@/lib/clinical-simulation/scenarios";
import { getSimulationAttempt, listSimulationActionRecords } from "@/lib/clinical-simulation/store";
import { handleRouteError, jsonError } from "@/lib/http";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ attemptId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { attemptId } = await context.params;
  try {
    const access = await getClinicalSimulationAccess();
    if (!access.ok) return access.response;
    if (!access.developerToolsEnabled) {
      return jsonError(403, "DEVELOPER_ACCESS_REQUIRED", "Developer testing access is required to export an attempt trace.");
    }

    const attempt = await getSimulationAttempt(access.db, access.hostedUser.id, attemptId);
    if (!attempt) return jsonError(404, "ATTEMPT_NOT_FOUND", "Simulation attempt not found.");
    const scenario = getClinicalScenarioById(attempt.scenarioId);
    if (!scenario || scenario.version !== attempt.scenarioVersion) {
      return jsonError(409, "SCENARIO_VERSION_UNAVAILABLE", "The attempt's scenario version is unavailable.");
    }

    const persistedActions = await listSimulationActionRecords(access.db, access.hostedUser.id, attemptId);
    const debrief = attempt.status === "completed" ? completeSimulation(scenario, attempt.state).debrief : null;
    const trace = {
      exportVersion: "1.0",
      exportedAt: new Date().toISOString(),
      privacy: "Sanitized developer trace. User identity, email, cookies, tokens, and secrets are excluded.",
      scenario: {
        id: scenario.id,
        slug: scenario.slug,
        version: scenario.version,
        status: scenario.status,
        clinicalReviewerStatus: scenario.clinicalReviewerStatus,
      },
      attempt: {
        id: attempt.id,
        seed: attempt.seed,
        mode: attempt.mode,
        status: attempt.status,
        startedAt: attempt.startedAt,
        updatedAt: attempt.updatedAt,
        completedAt: attempt.completedAt,
        virtualMinute: attempt.virtualMinute,
      },
      currentPatientState: attempt.state,
      studentActions: attempt.state.actionLog,
      persistedActionRecords: persistedActions,
      patientEvents: attempt.state.notices,
      processedEventIds: attempt.state.processedEventIds,
      pendingEvents: attempt.state.pendingEffects,
      score: debrief?.domainScores ?? attempt.domainScores,
      criticalErrors: attempt.state.criticalErrors,
      finalOutcome: debrief?.outcome ?? null,
      debrief,
    };

    return new Response(JSON.stringify(trace, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="clinical-simulation-${attempt.id}.json"`,
        "Cache-Control": "no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return handleRouteError(error, { route: "/api/clinical-simulation/attempts/[attemptId]/trace" });
  }
}
