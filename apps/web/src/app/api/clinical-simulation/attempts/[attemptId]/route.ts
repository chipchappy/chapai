import { z } from "zod";
import { getClinicalSimulationAccess } from "@/lib/clinical-simulation/access";
import {
  advanceSimulation,
  applySimulationAction,
  canCompleteSimulation,
  completeSimulation,
  createInitialPatientState,
  minutesToNextMeaningfulEvent,
  setSimulationPaused,
  triggerScenarioEvent,
  rewindSimulation,
} from "@/lib/clinical-simulation/engine";
import { getClinicalScenarioById } from "@/lib/clinical-simulation/scenarios";
import {
  getSimulationAttempt,
  markSimulationDebriefViewed,
  resetSimulationAttempt,
  saveSimulationState,
} from "@/lib/clinical-simulation/store";
import { validateScenarioDefinition } from "@/lib/clinical-simulation/schema";
import { handleRouteError, jsonError, jsonSuccess } from "@/lib/http";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ attemptId: string }> };

const updateSchema = z.discriminatedUnion("operation", [
  z.object({ operation: z.literal("act"), actionId: z.string().min(1), selectedElements: z.array(z.string().max(100)).max(30).default([]) }),
  z.object({ operation: z.literal("advance"), minutes: z.number().int().min(1).max(30) }),
  z.object({ operation: z.literal("advance_next") }),
  z.object({ operation: z.literal("set_paused"), paused: z.boolean() }),
  z.object({ operation: z.literal("complete") }),
  z.object({ operation: z.literal("debrief_viewed") }),
  z.object({ operation: z.literal("abandon") }),
  z.object({ operation: z.literal("reset"), seed: z.number().int().positive().max(2_147_483_647).optional() }),
  z.object({ operation: z.literal("trigger_event"), eventId: z.string().min(1) }),
  z.object({ operation: z.literal("rewind"), keepActions: z.number().int().min(0).max(200) }),
]);

async function loadOwnedAttempt(attemptId: string) {
  const access = await getClinicalSimulationAccess();
  if (!access.ok) return { access, response: access.response } as const;
  const attempt = await getSimulationAttempt(access.db, access.hostedUser.id, attemptId);
  if (!attempt) return { access, response: jsonError(404, "ATTEMPT_NOT_FOUND", "Simulation attempt not found.") } as const;
  const scenario = getClinicalScenarioById(attempt.scenarioId);
  if (!scenario || scenario.version !== attempt.scenarioVersion) {
    return { access, response: jsonError(409, "SCENARIO_VERSION_UNAVAILABLE", "This attempt requires a scenario version that is no longer available.") } as const;
  }
  return { access, attempt, scenario, response: null } as const;
}

export async function GET(_request: Request, context: RouteContext) {
  const { attemptId } = await context.params;
  try {
    const loaded = await loadOwnedAttempt(attemptId);
    if (loaded.response) return loaded.response;
    const debrief = loaded.attempt.status === "completed"
      ? completeSimulation(loaded.scenario, loaded.attempt.state).debrief
      : null;
    return jsonSuccess({
      attempt: loaded.attempt,
      scenario: loaded.scenario,
      debrief,
      developerToolsEnabled: loaded.access.developerToolsEnabled,
      developer: loaded.access.developerToolsEnabled ? {
        validation: validateScenarioDefinition(loaded.scenario),
        events: loaded.scenario.events.map((event) => ({ id: event.id, atMinute: event.atMinute, severity: event.severity, feedback: event.feedback })),
      } : null,
    });
  } catch (error) {
    return handleRouteError(error, { route: "/api/clinical-simulation/attempts/[attemptId]" });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { attemptId } = await context.params;
  try {
    const loaded = await loadOwnedAttempt(attemptId);
    if (loaded.response) return loaded.response;
    const input = updateSchema.parse(await request.json());

    if (input.operation === "debrief_viewed") {
      if (loaded.attempt.status !== "completed") return jsonError(409, "ATTEMPT_ACTIVE", "Complete the simulation before opening the debrief.");
      await markSimulationDebriefViewed(loaded.access.db, loaded.access.hostedUser.id, attemptId);
      return jsonSuccess({ viewed: true });
    }

    if (input.operation === "abandon") {
      if (loaded.attempt.status !== "in_progress") {
        return jsonError(409, "ATTEMPT_NOT_ACTIVE", "Only an active simulation attempt can be abandoned.");
      }
      const state = { ...loaded.attempt.state, status: "abandoned" as const, clockPaused: true };
      const attempt = await saveSimulationState(loaded.access.db, { userId: loaded.access.hostedUser.id, attemptId, state });
      return jsonSuccess({ abandoned: true, attempt, state });
    }

    if (input.operation === "reset") {
      if (!loaded.access.developerToolsEnabled) return jsonError(403, "DEVELOPER_ACCESS_REQUIRED", "Developer testing access is required.");
      const attempt = await resetSimulationAttempt(loaded.access.db, {
        userId: loaded.access.hostedUser.id,
        attemptId,
        scenario: loaded.scenario,
        mode: loaded.attempt.mode,
        seed: input.seed ?? loaded.attempt.seed,
      });
      return jsonSuccess({ attempt, state: attempt?.state ?? createInitialPatientState(loaded.scenario, input.seed ?? loaded.attempt.seed, loaded.attempt.mode) });
    }

    if (loaded.attempt.status !== "in_progress") {
      return jsonError(409, "ATTEMPT_COMPLETE", "This simulation attempt is already complete.");
    }

    if (input.operation === "act") {
      const result = applySimulationAction(loaded.scenario, loaded.attempt.state, input.actionId, input.selectedElements);
      const attempt = await saveSimulationState(loaded.access.db, {
        userId: loaded.access.hostedUser.id,
        attemptId,
        state: result.state,
        action: result.entry,
      });
      return jsonSuccess({ attempt, entry: result.entry, state: result.state });
    }

    if (input.operation === "rewind") {
      const state = rewindSimulation(loaded.scenario, loaded.attempt.state, input.keepActions);
      const attempt = await saveSimulationState(loaded.access.db, { userId: loaded.access.hostedUser.id, attemptId, state });
      return jsonSuccess({ attempt, state });
    }

    if (input.operation === "set_paused") {
      const state = setSimulationPaused(loaded.attempt.state, input.paused);
      const attempt = await saveSimulationState(loaded.access.db, { userId: loaded.access.hostedUser.id, attemptId, state });
      return jsonSuccess({ attempt, state });
    }

    if (input.operation === "advance" || input.operation === "advance_next") {
      const minutes = input.operation === "advance" ? input.minutes : minutesToNextMeaningfulEvent(loaded.scenario, loaded.attempt.state);
      const state = advanceSimulation(loaded.scenario, loaded.attempt.state, minutes);
      const attempt = await saveSimulationState(loaded.access.db, {
        userId: loaded.access.hostedUser.id,
        attemptId,
        state,
      });
      return jsonSuccess({ attempt, state, advancedMinutes: minutes });
    }

    if (input.operation === "trigger_event") {
      if (!loaded.access.developerToolsEnabled) return jsonError(403, "DEVELOPER_ACCESS_REQUIRED", "Developer testing access is required.");
      const result = triggerScenarioEvent(loaded.scenario, loaded.attempt.state, input.eventId);
      const attempt = await saveSimulationState(loaded.access.db, { userId: loaded.access.hostedUser.id, attemptId, state: result.state });
      return jsonSuccess({ attempt, state: result.state, notice: result.notice });
    }

    if (!canCompleteSimulation(loaded.scenario, loaded.attempt.state)) {
      return jsonError(409, "SIMULATION_INCOMPLETE", `Complete at least ${loaded.scenario.completion.minimumActions} clinical actions before ending the scenario.`);
    }
    const completed = completeSimulation(loaded.scenario, loaded.attempt.state);
    const attempt = await saveSimulationState(loaded.access.db, {
      userId: loaded.access.hostedUser.id,
      attemptId,
      state: completed.state,
      debrief: completed.debrief,
    });
    return jsonSuccess({ attempt, state: completed.state, debrief: completed.debrief });
  } catch (error) {
    return handleRouteError(error, { route: "/api/clinical-simulation/attempts/[attemptId]" });
  }
}
