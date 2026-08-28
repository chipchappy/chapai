import type {
  ActionClassification,
  ClinicalScenario,
  CompetencyDomain,
  ScenarioAction,
  ScenarioCondition,
  ScenarioEffect,
} from "./schema";

export type SimulationMode = "guided" | "independent";
export type AttemptStatus = "in_progress" | "completed" | "abandoned";

export type PendingEffect = {
  id: string;
  dueMinute: number;
  effects: ScenarioEffect[];
  feedback: string;
};

export type StateChange = {
  path: string;
  before: unknown;
  after: unknown;
};

export type AssessmentRecord = {
  assessmentId: string;
  actionId: string;
  virtualMinute: number;
};

export type ActionLogEntry = {
  id: string;
  actionId: string;
  label: string;
  category: ScenarioAction["category"];
  classification: ActionClassification;
  virtualMinute: number;
  feedback: string;
  rationale: string;
  selectedElements: string[];
  scoreDelta: Partial<Record<CompetencyDomain, number>>;
  stateChanges: StateChange[];
  teamResponse: string | null;
};

export type SimulationNotice = {
  id: string;
  virtualMinute: number;
  severity: "info" | "warning" | "critical";
  message: string;
  stateChanges: StateChange[];
};

export type VitalsSample = {
  minute: number;
  heartRate: number;
  map: number;
  spo2: number;
  respiratoryRate: number;
};

export type ReassessmentLoop = {
  sourceActionId: string;
  sourceLabel: string;
  dueMinute: number;
  followUpActionIds: string[];
  status: "waiting" | "due" | "overdue";
};

export type PatientState = ClinicalScenario["initialState"] & {
  virtualMinute: number;
  status: AttemptStatus;
  mode: SimulationMode;
  seed: number;
  clockPaused: boolean;
  completedActionIds: string[];
  revealedFindingIds: string[];
  assessmentRecords: AssessmentRecord[];
  processedEventIds: string[];
  pendingEffects: PendingEffect[];
  actionLog: ActionLogEntry[];
  notices: SimulationNotice[];
  criticalErrors: string[];
  /** Per-minute vitals record powering the debrief trajectory chart. */
  vitalsHistory: VitalsSample[];
};

export type DomainScore = {
  domain: CompetencyDomain;
  earned: number;
  possible: number;
  level: "not-observed" | "developing" | "competent" | "strong";
};

export type SimulationDebrief = {
  outcome: "stabilized" | "partially-stabilized" | "deteriorated";
  domainScores: DomainScore[];
  completedRequiredActions: string[];
  missedRequiredActions: string[];
  strongestDomain: CompetencyDomain | null;
  weakestDomain: CompetencyDomain | null;
  criticalErrors: string[];
  timeline: ActionLogEntry[];
  vitalsTrajectory: VitalsSample[];
  delayedActionIds: string[];
  unsafeActionIds: string[];
  medicationActionIds: string[];
  patientTrajectory: SimulationNotice[];
  causalFactors: string[];
  outcomeExplanation: string;
  suggestedReplayFocus: string;
  triggeredFailureCondition: { id: string; label: string; rationale: string } | null;
  metrics: {
    timeToFirstAssessment: number | null;
    timeToRecognition: number | null;
    timeToFirstMajorIntervention: number | null;
    timeToEscalation: number | null;
    timeToReassessment: number | null;
    timeToDocumentation: number | null;
  };
  finalPatientState: {
    virtualMinute: number;
    heartRate: number;
    bloodPressure: string;
    map: number;
    respiratoryRate: number;
    spo2: number;
    temperatureC: number;
    mentalStatus: string;
    urineOutputMlHr: number;
    lactate: number | null;
    oxygenSupport: string;
    perfusion: string;
    activeComplications: string[];
  };
};

function clone<T>(value: T): T {
  if (value === undefined || value === null) return value;
  return JSON.parse(JSON.stringify(value)) as T;
}

function seededUnit(seed: number) {
  let value = seed | 0;
  return () => {
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    return ((value >>> 0) % 1_000_000) / 1_000_000;
  };
}

function getPath(target: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[key];
  }, target);
}

function setPath(target: unknown, path: string, value: unknown) {
  const parts = path.split(".");
  let current = target as Record<string, unknown>;
  for (const key of parts.slice(0, -1)) {
    const next = current[key];
    if (!next || typeof next !== "object") current[key] = {};
    current = current[key] as Record<string, unknown>;
  }
  current[parts.at(-1)!] = value;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function normalizePatientStateInPlace(state: PatientState) {
  if (!Array.isArray(state.vitalsHistory)) state.vitalsHistory = [];
  state.clockPaused ??= false;
  state.completedActionIds ??= [];
  state.revealedFindingIds ??= [];
  state.assessmentRecords ??= [];
  state.processedEventIds ??= [];
  state.pendingEffects ??= [];
  state.actionLog ??= [];
  state.notices ??= [];
  state.criticalErrors ??= [];
  state.actionLog = state.actionLog.map((entry) => ({ ...entry, stateChanges: entry.stateChanges ?? [], teamResponse: entry.teamResponse ?? null }));
  state.notices = state.notices.map((notice) => ({ ...notice, stateChanges: notice.stateChanges ?? [] }));
  state.activeComplications ??= [];
  state.activeOrders ??= [];
  state.position ??= "semi-fowler";
  state.headOfBedDegrees = clamp(Number(state.headOfBedDegrees ?? 30), -15, 90);
  state.timeSinceLastReassessment = Math.max(0, Math.round(state.timeSinceLastReassessment ?? 0));
  state.vitals.heartRate = clamp(Math.round(state.vitals.heartRate), 0, 300);
  state.vitals.systolic = clamp(Math.round(state.vitals.systolic), 0, 300);
  state.vitals.diastolic = clamp(Math.round(state.vitals.diastolic), 0, 200);
  state.vitals.map = clamp(Math.round(state.vitals.map), 0, 220);
  state.vitals.respiratoryRate = clamp(Math.round(state.vitals.respiratoryRate), 0, 80);
  state.vitals.spo2 = clamp(Math.round(state.vitals.spo2), 0, 100);
  state.vitals.temperatureC = clamp(Number(state.vitals.temperatureC.toFixed(1)), 25, 45);
  state.vitals.pain = clamp(Math.round(state.vitals.pain), 0, 10);
  state.urineOutputMlHr = Math.max(0, Math.round(state.urineOutputMlHr));
  state.drainOutputMl = Math.max(0, Math.round(state.drainOutputMl));
  state.bleedingMl = Math.max(0, Math.round(state.bleedingMl));
  state.anxiety = clamp(Math.round(state.anxiety), 0, 10);
  state.agitation = clamp(Math.round(state.agitation), 0, 10);
  if (state.gcs != null) state.gcs = clamp(Math.round(state.gcs), 3, 15);
  if (state.sedationScore != null) state.sedationScore = clamp(Math.round(state.sedationScore), -5, 4);
}

export function normalizePatientState(input: PatientState) {
  const state = clone(input);
  normalizePatientStateInPlace(state);
  return state;
}

/** Appends (or replaces, within the same minute) a vitals snapshot, bounded for storage. */
function recordVitalsSample(state: PatientState) {
  const sample: VitalsSample = {
    minute: state.virtualMinute,
    heartRate: Math.round(state.vitals.heartRate),
    map: Math.round(state.vitals.map),
    spo2: Math.round(state.vitals.spo2),
    respiratoryRate: Math.round(state.vitals.respiratoryRate),
  };
  const history = state.vitalsHistory;
  const last = history[history.length - 1];
  if (last && last.minute === sample.minute) history[history.length - 1] = sample;
  else history.push(sample);
  if (history.length > 200) history.splice(0, history.length - 200);
}

function applyEffects(state: PatientState, effects: ScenarioEffect[]) {
  const changes: StateChange[] = [];
  for (const effect of effects) {
    const before = clone(getPath(state, effect.path));
    if (effect.operation === "set") setPath(state, effect.path, clone(effect.value));
    if (effect.operation === "add") setPath(state, effect.path, Number(before ?? 0) + Number(effect.value));
    if (effect.operation === "push") setPath(state, effect.path, [...(Array.isArray(before) ? before : []), clone(effect.value)]);
    const after = clone(getPath(state, effect.path));
    if (JSON.stringify(before) !== JSON.stringify(after)) changes.push({ path: effect.path, before, after });
  }
  normalizePatientStateInPlace(state);
  for (const change of changes) change.after = clone(getPath(state, change.path));
  return changes;
}

function predicateMatches(state: PatientState, predicate: ScenarioCondition["all"][number]) {
  const actual = getPath(state, predicate.path);
  switch (predicate.operator) {
    case "eq": return actual === predicate.value;
    case "ne": return actual !== predicate.value;
    case "lt": return Number(actual) < Number(predicate.value);
    case "lte": return Number(actual) <= Number(predicate.value);
    case "gt": return Number(actual) > Number(predicate.value);
    case "gte": return Number(actual) >= Number(predicate.value);
    case "includes": return Array.isArray(actual) ? actual.includes(predicate.value) : String(actual ?? "").includes(String(predicate.value));
  }
}

function conditionMatches(state: PatientState, condition?: ScenarioCondition) {
  if (!condition) return true;
  const completed = new Set(state.completedActionIds);
  return condition.all.every((predicate) => predicateMatches(state, predicate))
    && condition.completedAll.every((id) => completed.has(id))
    && (condition.completedAny.length === 0 || condition.completedAny.some((id) => completed.has(id)))
    && condition.notCompleted.every((id) => !completed.has(id));
}

function processDueEffects(state: PatientState) {
  const due = state.pendingEffects.filter((effect) => effect.dueMinute <= state.virtualMinute);
  state.pendingEffects = state.pendingEffects.filter((effect) => effect.dueMinute > state.virtualMinute);
  for (const effect of due) {
    const stateChanges = applyEffects(state, effect.effects);
    state.notices.push({ id: effect.id, virtualMinute: state.virtualMinute, severity: "info", message: effect.feedback, stateChanges });
  }
}

function processEvents(scenario: ClinicalScenario, state: PatientState) {
  const processed = new Set(state.processedEventIds);
  for (const event of scenario.events) {
    if (processed.has(event.id) || event.atMinute > state.virtualMinute || !conditionMatches(state, event.condition)) continue;
    const stateChanges = applyEffects(state, event.effects);
    state.processedEventIds.push(event.id);
    state.notices.push({ id: event.id, virtualMinute: state.virtualMinute, severity: event.severity, message: event.feedback, stateChanges });
  }
}

export function createInitialPatientState(scenario: ClinicalScenario, seed: number, mode: SimulationMode): PatientState {
  const state: PatientState = {
    ...clone(scenario.initialState),
    virtualMinute: 0,
    status: "in_progress",
    mode,
    seed,
    clockPaused: false,
    completedActionIds: [],
    revealedFindingIds: [],
    assessmentRecords: [],
    processedEventIds: [],
    pendingEffects: [],
    actionLog: [],
    notices: [{ id: "simulation-start", virtualMinute: 0, severity: "info", message: "You have assumed care of the patient.", stateChanges: [] }],
    criticalErrors: [],
    vitalsHistory: [],
  };

  const random = seededUnit(seed || 1);
  for (const variance of scenario.randomization) {
    const delta = variance.minDelta + random() * (variance.maxDelta - variance.minDelta);
    const next = Number(getPath(state, variance.path) ?? 0) + (variance.integer ? Math.round(delta) : delta);
    setPath(state, variance.path, next);
  }
  normalizePatientStateInPlace(state);
  recordVitalsSample(state);
  return state;
}

export function advanceSimulation(scenario: ClinicalScenario, current: PatientState, minutes: number) {
  const state = normalizePatientState(current);
  if (state.status !== "in_progress") return state;
  const advanceBy = Math.max(0, Math.min(30, Math.floor(minutes)));
  for (let minute = 0; minute < advanceBy; minute += 1) {
    state.virtualMinute += 1;
    state.timeSinceLastReassessment += 1;
    processDueEffects(state);
    processEvents(scenario, state);
    recordVitalsSample(state);
  }
  if (state.virtualMinute >= scenario.completion.maximumVirtualMinutes) {
    if (!state.notices.some((notice) => notice.id === "scenario-deadline")) {
      state.notices.push({ id: "scenario-deadline", virtualMinute: state.virtualMinute, severity: "critical", message: "The clinical window has closed. Complete the simulation and review the debrief.", stateChanges: [] });
    }
  }
  return state;
}

// ─────────────────────────────────────────────────────────────────────────────
// In-simulation rewind.
//
// The engine is deterministic: the same seed plus the same ordered actions
// always reproduces the same state. So a rewind is a REPLAY — rebuild from the
// initial state and re-apply the first `keepActions` decisions at their original
// minutes. Nothing is trusted from the client beyond an index, and the resulting
// state is byte-identical to what the student actually had at that moment.
//
// This is what lets a student explore alternative routes: jump back to any of
// their own decisions, choose differently, and watch the consequences diverge.
// ─────────────────────────────────────────────────────────────────────────────
export function rewindSimulation(scenario: ClinicalScenario, current: PatientState, keepActions: number) {
  const source = normalizePatientState(current);
  const log = source.actionLog;
  const keep = Math.max(0, Math.min(keepActions, log.length));
  if (keep === log.length) return source;

  let state = createInitialPatientState(scenario, source.seed, source.mode);
  for (let index = 0; index < keep; index += 1) {
    const entry = log[index];
    const gap = entry.virtualMinute - state.virtualMinute;
    if (gap > 0) state = advanceSimulation(scenario, state, gap);
    const applied = applySimulationAction(scenario, state, entry.actionId, entry.selectedElements);
    state = applied.state;
  }

  // Land the clock where the student is rewinding to, and mark the branch so the
  // feed and debrief can show that this run was explored rather than linear.
  const targetMinute = keep === 0 ? 0 : log[keep - 1].virtualMinute;
  if (state.virtualMinute < targetMinute) {
    state = advanceSimulation(scenario, state, targetMinute - state.virtualMinute);
  }
  state.status = "in_progress";
  state.clockPaused = true;
  state.notices.push({
    id: `rewind-${Date.now()}`,
    virtualMinute: state.virtualMinute,
    severity: "info",
    message: keep === 0
      ? "Rewound to the start of the shift. The clock is paused — choose your first action."
      : `Rewound to just after "${log[keep - 1].label}". The clock is paused — try a different next step.`,
    stateChanges: [],
  });
  return state;
}

export function setSimulationPaused(current: PatientState, paused: boolean) {
  const state = normalizePatientState(current);
  state.clockPaused = paused;
  return state;
}

export function minutesToNextMeaningfulEvent(scenario: ClinicalScenario, current: PatientState) {
  const state = normalizePatientState(current);
  const pendingMinutes = state.pendingEffects.map((effect) => effect.dueMinute);
  const scenarioMinutes = scenario.events
    .filter((event) => !state.processedEventIds.includes(event.id) && event.atMinute > state.virtualMinute)
    .map((event) => event.atMinute);
  const nextMinute = [...pendingMinutes, ...scenarioMinutes]
    .filter((minute) => minute > state.virtualMinute)
    .sort((left, right) => left - right)[0];
  if (nextMinute == null) return 1;
  return Math.max(1, Math.min(30, nextMinute - state.virtualMinute));
}

export function triggerScenarioEvent(scenario: ClinicalScenario, current: PatientState, eventId: string) {
  const state = normalizePatientState(current);
  const event = scenario.events.find((candidate) => candidate.id === eventId);
  if (!event) throw new Error(`Unknown simulation event: ${eventId}`);
  if (state.processedEventIds.includes(event.id)) throw new Error("This event has already been processed.");
  const stateChanges = applyEffects(state, event.effects);
  state.processedEventIds.push(event.id);
  const notice: SimulationNotice = {
    id: event.id,
    virtualMinute: state.virtualMinute,
    severity: event.severity,
    message: `[Test event] ${event.feedback}`,
    stateChanges,
  };
  state.notices.push(notice);
  return { state, notice };
}

function completenessClassification(action: ScenarioAction, selectedElements: string[]) {
  const selected = new Set(selectedElements);
  if (action.communication && !action.communication.requiredElementIds.every((id) => selected.has(id))) return "incomplete" as const;
  if (action.documentation && !action.documentation.requiredFieldIds.every((id) => selected.has(id))) return "incomplete" as const;
  return null;
}

const CREDITABLE_CLASSIFICATIONS = new Set<ActionClassification>([
  "essential",
  "high_priority",
  "appropriate",
  "acceptable_alternative",
  "delayed",
]);

function reassessmentDelay(action: ScenarioAction) {
  if (action.medication?.reassessmentMinutes) return action.medication.reassessmentMinutes;
  const delays = action.delayedEffects.map((effect) => effect.delayMinutes);
  return delays.length ? Math.min(...delays) : 0;
}

function latestCreditablePerformance(state: PatientState, actionId: string) {
  return [...state.actionLog]
    .reverse()
    .find((entry) => entry.actionId === actionId && CREDITABLE_CLASSIFICATIONS.has(entry.classification));
}

function reassessmentSourceIds(action: ScenarioAction) {
  return [...new Set([...action.prerequisites, ...action.reassessmentForActionIds])];
}

function reassessmentDueMinute(scenario: ClinicalScenario, state: PatientState, action: ScenarioAction) {
  if (action.category !== "assessment" || !action.repeatable) return null;
  const dueMinutes = reassessmentSourceIds(action).flatMap((sourceId) => {
    const source = scenario.actions.find((candidate) => candidate.id === sourceId);
    const performance = latestCreditablePerformance(state, sourceId);
    if (!source || !performance) return [];
    const delay = reassessmentDelay(source);
    return delay > 0 ? [performance.virtualMinute + delay] : [];
  });
  return dueMinutes.length ? Math.max(...dueMinutes) : null;
}

export function getPendingReassessments(scenario: ClinicalScenario, state: PatientState): ReassessmentLoop[] {
  return scenario.actions.flatMap((source) => {
    const delay = reassessmentDelay(source);
    if (delay <= 0) return [];
    const performance = latestCreditablePerformance(state, source.id);
    if (!performance) return [];
    const followUps = scenario.actions.filter(
      (candidate) => candidate.category === "assessment"
        && candidate.repeatable
        && reassessmentSourceIds(candidate).includes(source.id),
    );
    if (!followUps.length) return [];
    const dueMinute = performance.virtualMinute + delay;
    const completedAfterWindow = state.actionLog.some(
      (entry) => followUps.some((candidate) => candidate.id === entry.actionId)
        && entry.virtualMinute >= dueMinute
        && CREDITABLE_CLASSIFICATIONS.has(entry.classification),
    );
    if (completedAfterWindow) return [];
    const status: ReassessmentLoop["status"] = state.virtualMinute < dueMinute
      ? "waiting"
      : state.virtualMinute <= dueMinute + 2
        ? "due"
        : "overdue";
    return [{
      sourceActionId: source.id,
      sourceLabel: source.label,
      dueMinute,
      followUpActionIds: followUps.map((candidate) => candidate.id),
      status,
    }];
  }).sort((a, b) => a.dueMinute - b.dueMinute);
}

export function applySimulationAction(
  scenario: ClinicalScenario,
  current: PatientState,
  actionId: string,
  selectedElements: string[] = [],
) {
  const state = normalizePatientState(current);
  const action = scenario.actions.find((candidate) => candidate.id === actionId);
  if (!action) throw new Error(`Unknown simulation action: ${actionId}`);
  if (state.status !== "in_progress") throw new Error("This simulation attempt is no longer active.");

  const completed = new Set(state.completedActionIds);
  let classification: ActionClassification = action.baseClassification;
  let feedback = action.feedback;
  let applyClinicalEffects = true;
  let teamResponse: string | null = null;
  const stateChanges: StateChange[] = [];

  if (!action.repeatable && completed.has(action.id)) {
    classification = "unnecessary_but_harmless";
    feedback = "This action was already completed; repeating it did not change the plan of care.";
    applyClinicalEffects = false;
  } else if (action.safetyChecks.some((id) => !completed.has(id))) {
    classification = action.criticalError ? "critical_error" : "unsafe";
    const missing = action.safetyChecks.filter((id) => !completed.has(id));
    feedback = `Required safety checks were missing: ${missing.join(", ")}. ${action.rationale}`;
    applyClinicalEffects = false;
  } else if (action.prerequisites.some((id) => !completed.has(id))) {
    classification = "premature";
    feedback = `This action was reasonable but premature because prerequisite assessment or preparation was incomplete. ${action.rationale}`;
    applyClinicalEffects = false;
  } else {
    const dueMinute = reassessmentDueMinute(scenario, state, action);
    const incomplete = completenessClassification(action, selectedElements);
    if (dueMinute != null && state.virtualMinute < dueMinute) {
      classification = "premature";
      feedback = `The response cannot be interpreted yet. The expected reassessment window opens at minute ${dueMinute}; continue monitoring and reassess then. ${action.rationale}`;
      applyClinicalEffects = false;
    } else if (incomplete) {
      classification = incomplete;
      feedback = `The action was initiated, but required clinical information was omitted. ${action.rationale}`;
      applyClinicalEffects = false;
    } else if (action.lateAfterMinute != null && state.virtualMinute > action.lateAfterMinute) {
      classification = "delayed";
      feedback = `The action was indicated but delayed beyond minute ${action.lateAfterMinute}. ${action.feedback}`;
    }
  }

  if (applyClinicalEffects) {
    stateChanges.push(...applyEffects(state, action.effects));
    if (action.category === "assessment") state.timeSinceLastReassessment = 0;
    for (const finding of action.revealFindings) {
      if (!state.revealedFindingIds.includes(finding)) state.revealedFindingIds.push(finding);
      const existing = state.assessmentRecords.find((record) => record.assessmentId === finding);
      if (existing) {
        existing.actionId = action.id;
        existing.virtualMinute = state.virtualMinute;
      } else {
        state.assessmentRecords.push({ assessmentId: finding, actionId: action.id, virtualMinute: state.virtualMinute });
      }
    }
    for (const delayed of action.delayedEffects) {
      state.pendingEffects.push({
        id: `${action.id}-${state.virtualMinute}-${delayed.delayMinutes}`,
        dueMinute: state.virtualMinute + delayed.delayMinutes,
        effects: clone(delayed.effects),
        feedback: delayed.feedback,
      });
    }
    if (!completed.has(action.id)) state.completedActionIds.push(action.id);
    const response = action.communication?.responses.find((candidate) => conditionMatches(state, candidate.condition));
    if (response) {
      teamResponse = response.message;
      feedback = response.message;
      if (response.delayMinutes > 0 && response.effects.length > 0) {
        state.pendingEffects.push({
          id: `${action.id}-response-${state.virtualMinute}-${response.delayMinutes}`,
          dueMinute: state.virtualMinute + response.delayMinutes,
          effects: clone(response.effects),
          feedback: response.message,
        });
      } else {
        stateChanges.push(...applyEffects(state, response.effects));
      }
    }
  }

  if (classification === "critical_error" && action.criticalError && !state.criticalErrors.includes(action.criticalError)) {
    state.criticalErrors.push(action.criticalError);
  }

  const earnsPoints = ["essential", "high_priority", "appropriate", "acceptable_alternative"].includes(classification);
  const scoreDelta = Object.fromEntries(action.score.map((score) => [score.domain, earnsPoints ? score.points : 0])) as Partial<Record<CompetencyDomain, number>>;
  const entry: ActionLogEntry = {
    id: `${action.id}-${state.virtualMinute}-${state.actionLog.length + 1}`,
    actionId: action.id,
    label: action.label,
    category: action.category,
    classification,
    virtualMinute: state.virtualMinute,
    feedback,
    rationale: action.rationale,
    selectedElements,
    scoreDelta,
    stateChanges,
    teamResponse,
  };
  state.actionLog.push(entry);
  state.notices.push({
    id: entry.id,
    virtualMinute: state.virtualMinute,
    severity: classification === "critical_error" || classification === "unsafe" ? "critical" : classification === "delayed" || classification === "incomplete" ? "warning" : "info",
    message: feedback,
    stateChanges,
  });
  processEvents(scenario, state);
  recordVitalsSample(state);
  return { state, entry };
}

export function scoreSimulation(scenario: ClinicalScenario, state: PatientState): DomainScore[] {
  const possible = new Map<CompetencyDomain, number>();
  const earned = new Map<CompetencyDomain, number>();
  for (const action of scenario.actions) {
    for (const score of action.score) possible.set(score.domain, (possible.get(score.domain) ?? 0) + score.points);
  }
  for (const entry of state.actionLog) {
    for (const [domain, points] of Object.entries(entry.scoreDelta)) {
      const key = domain as CompetencyDomain;
      earned.set(key, (earned.get(key) ?? 0) + Number(points ?? 0));
    }
  }

  return [...possible.entries()].map(([domain, maximum]) => {
    const achieved = Math.min(maximum, earned.get(domain) ?? 0);
    const ratio = maximum > 0 ? achieved / maximum : 0;
    return {
      domain,
      earned: achieved,
      possible: maximum,
      level: achieved === 0 ? "not-observed" : ratio < 0.6 ? "developing" : ratio < 0.85 ? "competent" : "strong",
    };
  });
}

function firstActionMinute(state: PatientState, predicate: (entry: ActionLogEntry) => boolean) {
  return state.actionLog.find(predicate)?.virtualMinute ?? null;
}

function numericLab(state: PatientState, key: string) {
  const value = Number(state.labs[key]);
  return Number.isFinite(value) ? value : null;
}

function matchingFailureCondition(scenario: ClinicalScenario, state: PatientState) {
  return scenario.completion.failureConditions.find((failure) => conditionMatches(state, failure.condition)) ?? null;
}

function deriveOutcome(
  scenario: ClinicalScenario,
  state: PatientState,
  essentialRatio: number,
  failure: ReturnType<typeof matchingFailureCondition>,
) {
  // A deeply sedated, mechanically ventilated patient has a low GCS by design, so
  // the coma criterion only signals deterioration when it is not explained by
  // sedation. Without this, every neurocritical or ventilated scenario would score
  // as "deteriorated" no matter how well the student performed.
  const pharmacologicallySedated = (state.sedationScore != null && state.sedationScore <= -3)
    || /endotracheal|mechanical ventilation|ventilator/i.test(state.oxygenDevice ?? "");
  const criticalPhysiology = state.vitals.map < 50
    || state.vitals.spo2 < 82
    || (state.gcs != null && state.gcs <= 8 && !pharmacologicallySedated)
    || state.flags.criticalDeterioration === true;
  if (failure || criticalPhysiology || state.criticalErrors.length > 0 || essentialRatio < 0.5) return "deteriorated" as const;

  if (scenario.slug === "septic-shock") {
    const shockTreated = state.flags.antibioticsGiven === true
      && state.flags.vasopressorRunning === true
      && state.flags.shockReassessed === true;
    if (shockTreated && state.vitals.map >= 65 && state.urineOutputMlHr >= 20) return "stabilized" as const;
    return "partially-stabilized" as const;
  }

  return essentialRatio < 1 ? "partially-stabilized" as const : "stabilized" as const;
}

function outcomeExplanation(
  scenario: ClinicalScenario,
  state: PatientState,
  outcome: SimulationDebrief["outcome"],
  missedRequiredActions: string[],
  failure: ReturnType<typeof matchingFailureCondition>,
) {
  const actionById = new Map(scenario.actions.map((action) => [action.id, action.label]));
  const finalTrend = `At minute ${state.virtualMinute}, the patient had a MAP of ${state.vitals.map} mmHg, heart rate ${state.vitals.heartRate}/min, oxygen saturation ${state.vitals.spo2}%, and urine output ${state.urineOutputMlHr} mL/hr.`;
  if (failure) return `${failure.rationale} ${finalTrend}`;
  if (outcome === "stabilized") return `The final physiology improved after the required time-sensitive assessment, treatment, escalation, and reassessment were completed. ${finalTrend}`;
  if (outcome === "partially-stabilized") {
    const missing = missedRequiredActions.map((id) => actionById.get(id) ?? id).join(", ");
    return `Some parameters improved, but the response remained incomplete${missing ? ` because these priorities were not completed: ${missing}` : " because perfusion targets were not fully restored"}. ${finalTrend}`;
  }
  return `The patient remained critically unstable because essential care was missed, delayed, unsafe, or insufficient for the evolving condition. ${finalTrend}`;
}

export function completeSimulation(scenario: ClinicalScenario, current: PatientState) {
  const state = normalizePatientState(current);
  state.status = "completed";
  state.clockPaused = true;
  const required = new Set(scenario.completion.requiredActionIds);
  const completedRequiredActions = state.completedActionIds.filter((id) => required.has(id));
  const missedRequiredActions = scenario.completion.requiredActionIds.filter((id) => !state.completedActionIds.includes(id));
  const domainScores = scoreSimulation(scenario, state);
  const ranked = [...domainScores].filter((score) => score.possible > 0).sort((a, b) => (b.earned / b.possible) - (a.earned / a.possible));
  const essentialRatio = required.size > 0 ? completedRequiredActions.length / required.size : 0;
  const failure = matchingFailureCondition(scenario, state);
  const outcome = deriveOutcome(scenario, state, essentialRatio, failure);
  const delayed = state.actionLog.filter((entry) => entry.classification === "delayed");
  const unsafe = state.actionLog.filter((entry) => entry.classification === "unsafe" || entry.classification === "critical_error");
  const medication = state.actionLog.filter((entry) => entry.category === "medication");
  const causalFactors: string[] = [];
  if (delayed.length) causalFactors.push(`Delayed care: ${delayed.map((entry) => `${entry.label} at minute ${entry.virtualMinute}`).join(", ")}.`);
  if (unsafe.length) causalFactors.push(`Unsafe care: ${unsafe.map((entry) => entry.label).join(", ")}.`);
  if (missedRequiredActions.length) causalFactors.push(`Missed priorities: ${missedRequiredActions.map((id) => scenario.actions.find((action) => action.id === id)?.label ?? id).join(", ")}.`);
  for (const notice of state.notices.filter((item) => item.severity === "critical" && !item.id.includes("action"))) {
    if (!causalFactors.includes(notice.message)) causalFactors.push(notice.message);
  }
  if (!causalFactors.length) causalFactors.push("Required priorities were completed without a recorded unsafe or delayed action.");
  const weakest = ranked.at(-1)?.domain ?? null;
  const replayTarget = missedRequiredActions[0]
    ? scenario.actions.find((action) => action.id === missedRequiredActions[0])?.label ?? missedRequiredActions[0]
    : weakest?.replaceAll("-", " ") ?? "reassessment timing";
  const debrief: SimulationDebrief = {
    outcome,
    domainScores,
    completedRequiredActions,
    missedRequiredActions,
    strongestDomain: ranked[0]?.domain ?? null,
    weakestDomain: weakest,
    criticalErrors: state.criticalErrors,
    timeline: state.actionLog,
    vitalsTrajectory: state.vitalsHistory,
    delayedActionIds: delayed.map((entry) => entry.id),
    unsafeActionIds: unsafe.map((entry) => entry.id),
    medicationActionIds: medication.map((entry) => entry.id),
    patientTrajectory: state.notices.filter((notice) => notice.stateChanges.length > 0 || notice.severity !== "info"),
    causalFactors,
    outcomeExplanation: outcomeExplanation(scenario, state, outcome, missedRequiredActions, failure),
    suggestedReplayFocus: `Replay with attention to ${replayTarget}. Compare the timing and patient response in the next debrief.`,
    triggeredFailureCondition: failure ? { id: failure.id, label: failure.label, rationale: failure.rationale } : null,
    metrics: {
      timeToFirstAssessment: firstActionMinute(state, (entry) => entry.category === "assessment"),
      timeToRecognition: firstActionMinute(state, (entry) => Number(entry.scoreDelta["clinical-recognition"] ?? 0) > 0),
      timeToFirstMajorIntervention: firstActionMinute(state, (entry) => ["intervention", "medication"].includes(entry.category) && ["essential", "high_priority", "appropriate"].includes(entry.classification)),
      timeToEscalation: firstActionMinute(state, (entry) => Number(entry.scoreDelta.escalation ?? 0) > 0),
      timeToReassessment: firstActionMinute(state, (entry) => Number(entry.scoreDelta.reassessment ?? 0) > 0),
      timeToDocumentation: firstActionMinute(state, (entry) => entry.category === "documentation" && entry.classification !== "incomplete"),
    },
    finalPatientState: {
      virtualMinute: state.virtualMinute,
      heartRate: state.vitals.heartRate,
      bloodPressure: `${state.vitals.systolic}/${state.vitals.diastolic}`,
      map: state.vitals.map,
      respiratoryRate: state.vitals.respiratoryRate,
      spo2: state.vitals.spo2,
      temperatureC: state.vitals.temperatureC,
      mentalStatus: `${state.levelOfConsciousness}; ${state.orientation}`,
      urineOutputMlHr: state.urineOutputMlHr,
      lactate: numericLab(state, "lactate"),
      oxygenSupport: `${state.oxygenDevice} ${state.oxygenFlow}`.trim(),
      perfusion: state.perfusion,
      activeComplications: state.activeComplications,
    },
  };
  return { state, debrief };
}

export function canCompleteSimulation(scenario: ClinicalScenario, state: PatientState) {
  return state.actionLog.length >= scenario.completion.minimumActions
    || state.virtualMinute >= scenario.completion.maximumVirtualMinutes
    || Boolean(matchingFailureCondition(scenario, state));
}
