import { and, asc, desc, eq } from "drizzle-orm";
import {
  clinicalSimulationActions,
  clinicalSimulationAttempts,
  clinicalSimulationAssignments,
} from "@chapai/db/schema";
import type { DB } from "@/lib/db";
import type { ClinicalScenario } from "@/lib/clinical-simulation/schema";
import { createInitialPatientState, normalizePatientState } from "@/lib/clinical-simulation/engine";
import type {
  ActionLogEntry,
  DomainScore,
  PatientState,
  SimulationDebrief,
  SimulationMode,
} from "@/lib/clinical-simulation/engine";

export type StoredSimulationAttempt = typeof clinicalSimulationAttempts.$inferSelect;

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function hydrateStoredAttempt(row: StoredSimulationAttempt) {
  const parsedState = parseJson<PatientState | null>(row.currentState, null);
  if (!parsedState?.vitals || !Array.isArray(parsedState.actionLog)) {
    throw new Error(`Stored simulation state is corrupted for attempt ${row.id}.`);
  }
  return {
    ...row,
    state: normalizePatientState(parsedState),
    domainScores: parseJson<DomainScore[]>(row.scoreDomains, []),
    criticalErrors: parseJson<string[]>(row.criticalErrors, []),
  };
}

export async function createSimulationAttempt(
  db: DB,
  input: { userId: string; scenario: ClinicalScenario; mode: SimulationMode; seed: number },
) {
  const now = Math.floor(Date.now() / 1000);
  const id = crypto.randomUUID();
  const state = createInitialPatientState(input.scenario, input.seed, input.mode);
  await db.insert(clinicalSimulationAttempts).values({
    id,
    userId: input.userId,
    scenarioId: input.scenario.id,
    scenarioVersion: input.scenario.version,
    mode: input.mode,
    status: "in_progress",
    seed: input.seed,
    virtualMinute: 0,
    currentState: JSON.stringify(state),
    criticalErrors: "[]",
    startedAt: now,
    updatedAt: now,
  });
  const row = await getSimulationAttempt(db, input.userId, id);
  if (!row) throw new Error("The simulation attempt was not created.");
  return row;
}

export async function getSimulationAttempt(db: DB, userId: string, attemptId: string) {
  const row = await db
    .select()
    .from(clinicalSimulationAttempts)
    .where(and(eq(clinicalSimulationAttempts.id, attemptId), eq(clinicalSimulationAttempts.userId, userId)))
    .get();
  return row ? hydrateStoredAttempt(row) : null;
}

export async function listSimulationAttempts(db: DB, userId: string) {
  const rows = await db
    .select()
    .from(clinicalSimulationAttempts)
    .where(eq(clinicalSimulationAttempts.userId, userId))
    .orderBy(desc(clinicalSimulationAttempts.updatedAt))
    .limit(100);
  return rows.map(hydrateStoredAttempt);
}

export async function saveSimulationState(
  db: DB,
  input: {
    userId: string;
    attemptId: string;
    state: PatientState;
    action?: ActionLogEntry;
    debrief?: SimulationDebrief;
  },
) {
  const now = Math.floor(Date.now() / 1000);
  await db
    .update(clinicalSimulationAttempts)
    .set({
      status: input.state.status,
      virtualMinute: input.state.virtualMinute,
      currentState: JSON.stringify(input.state),
      scoreDomains: input.debrief ? JSON.stringify(input.debrief.domainScores) : undefined,
      criticalErrors: JSON.stringify(input.state.criticalErrors),
      updatedAt: now,
      completedAt: input.state.status === "completed" ? now : null,
    })
    .where(and(
      eq(clinicalSimulationAttempts.id, input.attemptId),
      eq(clinicalSimulationAttempts.userId, input.userId),
    ));

  if (input.action) {
    await db.insert(clinicalSimulationActions).values({
      id: crypto.randomUUID(),
      attemptId: input.attemptId,
      userId: input.userId,
      actionId: input.action.actionId,
      category: input.action.category,
      classification: input.action.classification,
      virtualMinute: input.action.virtualMinute,
      details: JSON.stringify({
        selectedElements: input.action.selectedElements,
        feedback: input.action.feedback,
      }),
      stateTransition: JSON.stringify({
        scoreDelta: input.action.scoreDelta,
        stateChanges: input.action.stateChanges,
        teamResponse: input.action.teamResponse,
        completedActionIds: input.state.completedActionIds,
        processedEventIds: input.state.processedEventIds,
        criticalErrors: input.state.criticalErrors,
      }),
      createdAt: now,
    });
  }

  return getSimulationAttempt(db, input.userId, input.attemptId);
}

export async function markSimulationDebriefViewed(db: DB, userId: string, attemptId: string) {
  await db
    .update(clinicalSimulationAttempts)
    .set({ debriefViewed: true, updatedAt: Math.floor(Date.now() / 1000) })
    .where(and(eq(clinicalSimulationAttempts.id, attemptId), eq(clinicalSimulationAttempts.userId, userId)));
}

export async function resetSimulationAttempt(
  db: DB,
  input: { userId: string; attemptId: string; scenario: ClinicalScenario; mode: SimulationMode; seed: number },
) {
  const now = Math.floor(Date.now() / 1000);
  const state = createInitialPatientState(input.scenario, input.seed, input.mode);
  await db.delete(clinicalSimulationActions).where(and(
    eq(clinicalSimulationActions.attemptId, input.attemptId),
    eq(clinicalSimulationActions.userId, input.userId),
  ));
  await db.update(clinicalSimulationAttempts).set({
    scenarioVersion: input.scenario.version,
    mode: input.mode,
    status: "in_progress",
    seed: input.seed,
    virtualMinute: 0,
    currentState: JSON.stringify(state),
    scoreDomains: null,
    criticalErrors: "[]",
    debriefViewed: false,
    startedAt: now,
    updatedAt: now,
    completedAt: null,
  }).where(and(
    eq(clinicalSimulationAttempts.id, input.attemptId),
    eq(clinicalSimulationAttempts.userId, input.userId),
  ));
  return getSimulationAttempt(db, input.userId, input.attemptId);
}

export async function listSimulationActionRecords(db: DB, userId: string, attemptId: string) {
  const rows = await db.select().from(clinicalSimulationActions).where(and(
    eq(clinicalSimulationActions.attemptId, attemptId),
    eq(clinicalSimulationActions.userId, userId),
  )).orderBy(asc(clinicalSimulationActions.virtualMinute), asc(clinicalSimulationActions.createdAt));
  return rows.map((row) => ({
    id: row.id,
    actionId: row.actionId,
    category: row.category,
    classification: row.classification,
    virtualMinute: row.virtualMinute,
    details: parseJson<Record<string, unknown>>(row.details, {}),
    stateTransition: parseJson<Record<string, unknown>>(row.stateTransition, {}),
    createdAt: row.createdAt,
  }));
}

export async function createSimulationAssignment(db: DB, input: {
  cohort: string;
  instructorUserId: string;
  scenarioId: string;
  mode: SimulationMode;
  minimumDomainLevel?: string | null;
  dueAt?: number | null;
}) {
  const id = crypto.randomUUID();
  await db.insert(clinicalSimulationAssignments).values({ id, ...input });
  return db.select().from(clinicalSimulationAssignments).where(eq(clinicalSimulationAssignments.id, id)).get();
}

export async function listSimulationAssignments(db: DB, cohort: string) {
  return db
    .select()
    .from(clinicalSimulationAssignments)
    .where(eq(clinicalSimulationAssignments.cohort, cohort))
    .orderBy(desc(clinicalSimulationAssignments.createdAt));
}
