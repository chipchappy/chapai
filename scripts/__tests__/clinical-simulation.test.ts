import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  advanceSimulation,
  applySimulationAction,
  canCompleteSimulation,
  completeSimulation,
  createInitialPatientState,
  minutesToNextMeaningfulEvent,
  normalizePatientState,
  scoreSimulation,
  setSimulationPaused,
  triggerScenarioEvent,
  type PatientState,
} from "../../apps/web/src/lib/clinical-simulation/engine";
import { clinicalScenarios } from "../../apps/web/src/lib/clinical-simulation/scenarios";
import { futureScenarioOutlines } from "../../apps/web/src/lib/clinical-simulation/future-scenario-outlines";
import {
  validateScenarioDefinition,
  type ClinicalScenario,
  type ScenarioAction,
} from "../../apps/web/src/lib/clinical-simulation/schema";

function selectedElements(action: ScenarioAction) {
  return action.communication?.requiredElementIds ?? action.documentation?.requiredFieldIds ?? [];
}

function performWithDependencies(
  scenario: ClinicalScenario,
  initial: PatientState,
  actionId: string,
  visiting = new Set<string>(),
) {
  if (initial.completedActionIds.includes(actionId)) return initial;
  assert.ok(!visiting.has(actionId), `dependency cycle at ${actionId}`);
  const action = scenario.actions.find((candidate) => candidate.id === actionId);
  assert.ok(action, `action ${actionId} exists`);
  visiting.add(actionId);
  let state = initial;
  for (const dependency of [...action.prerequisites, ...action.safetyChecks]) {
    state = performWithDependencies(scenario, state, dependency, visiting);
  }
  visiting.delete(actionId);
  return applySimulationAction(scenario, state, action.id, selectedElements(action)).state;
}

function septicScenario() {
  const scenario = clinicalScenarios.find((candidate) => candidate.slug === "septic-shock");
  assert.ok(scenario);
  return scenario;
}

describe("clinical simulation scenario library", () => {
  it("loads six unique, fully validated clinical environments", () => {
    assert.equal(clinicalScenarios.length, 6);
    assert.equal(new Set(clinicalScenarios.map((scenario) => scenario.id)).size, 6);
    assert.deepEqual(new Set(clinicalScenarios.map((scenario) => scenario.unit)), new Set([
      "medical-surgical",
      "telemetry",
      "step-down",
      "intensive-care",
      "procedural",
      "psychiatric",
    ]));
    for (const scenario of clinicalScenarios) {
      assert.equal(validateScenarioDefinition(scenario).success, true, scenario.slug);
      assert.ok(scenario.actions.length >= 6, scenario.slug);
      assert.ok(scenario.assessments.length >= 3, scenario.slug);
      assert.ok(scenario.events.length >= 2, scenario.slug);
      assert.equal(scenario.status, "clinical-review");
      assert.equal(scenario.clinicalReviewerStatus, "needs-review");
      assert.ok(scenario.evidence.every((source) => source.url.startsWith("https://")));
    }
  });

  it("rejects broken references before a scenario can load", () => {
    const invalid = structuredClone(clinicalScenarios[0]);
    invalid.completion.requiredActionIds.push("missing-action");
    const result = validateScenarioDefinition(invalid);
    assert.equal(result.success, false);
    if (!result.success) assert.ok(result.issues.some((issue) => issue.message.includes("missing-action")));
  });

  it("keeps the future library structured, unique, and explicitly non-playable", () => {
    assert.ok(futureScenarioOutlines.length >= 100);
    assert.equal(new Set(futureScenarioOutlines.map((outline) => outline.id)).size, futureScenarioOutlines.length);
    assert.ok(futureScenarioOutlines.every((outline) => outline.status === "outline" && outline.playable === false));
    assert.ok(futureScenarioOutlines.every((outline) => outline.requiredCapabilities.length >= 5));
    assert.ok(futureScenarioOutlines.every((outline) => outline.preferredSourceOrganizations.length >= 3));
  });

  it("reproduces the same controlled variance for the same seed", () => {
    for (const scenario of clinicalScenarios) {
      const first = createInitialPatientState(scenario, 731_991, "guided");
      const replay = createInitialPatientState(scenario, 731_991, "guided");
      assert.deepEqual(first, replay, scenario.slug);
    }
  });

  it("runs a deterministic required-action path through debrief for every scenario", () => {
    for (const scenario of clinicalScenarios) {
      let state = createInitialPatientState(scenario, 20_260_717, "independent");
      for (const requiredId of scenario.completion.requiredActionIds) {
        state = performWithDependencies(scenario, state, requiredId);
      }
      if (scenario.slug === "septic-shock") state = advanceSimulation(scenario, state, 5);
      const completed = completeSimulation(scenario, state);
      assert.equal(completed.state.status, "completed", scenario.slug);
      assert.equal(completed.debrief.missedRequiredActions.length, 0, scenario.slug);
      assert.equal(completed.debrief.criticalErrors.length, 0, scenario.slug);
      assert.equal(completed.debrief.outcome, "stabilized", scenario.slug);
      assert.ok(completed.debrief.timeline.length >= scenario.completion.minimumActions, scenario.slug);
      assert.ok(completed.debrief.domainScores.length >= 4, scenario.slug);
    }
  });
});

describe("clinical simulation state engine", () => {
  it("triggers time-dependent deterioration when care is delayed", () => {
    const scenario = clinicalScenarios[0];
    const initial = createInitialPatientState(scenario, 1234, "independent");
    const advanced = advanceSimulation(scenario, initial, 15);
    assert.ok(advanced.processedEventIds.length > 0);
    assert.ok(advanced.notices.some((notice) => notice.severity === "warning" || notice.severity === "critical"));
    assert.notDeepEqual(advanced.vitals, initial.vitals);
  });

  it("applies and announces delayed treatment effects at the scheduled minute", () => {
    const scenario = clinicalScenarios.find((candidate) => candidate.actions.some((action) => action.delayedEffects.length > 0));
    assert.ok(scenario);
    const target = scenario.actions.find((action) => action.delayedEffects.length > 0);
    assert.ok(target);
    let state = createInitialPatientState(scenario, 9201, "guided");
    state = performWithDependencies(scenario, state, target.id);
    assert.ok(state.pendingEffects.length > 0);
    const due = Math.max(...state.pendingEffects.map((effect) => effect.dueMinute));
    const advanced = advanceSimulation(scenario, state, due - state.virtualMinute);
    assert.equal(advanced.pendingEffects.length, 0);
    assert.ok(advanced.notices.some((notice) => notice.id.startsWith(target.id)));
  });

  it("classifies a medication attempt without required safety checks as unsafe", () => {
    const pair = clinicalScenarios.flatMap((scenario) => scenario.actions
      .filter((action) => action.category === "medication" && action.safetyChecks.length > 0)
      .map((action) => ({ scenario, action })))[0];
    assert.ok(pair);
    const state = createInitialPatientState(pair.scenario, 44, "independent");
    const result = applySimulationAction(pair.scenario, state, pair.action.id);
    assert.ok(["unsafe", "critical_error"].includes(result.entry.classification));
    assert.equal(result.state.completedActionIds.includes(pair.action.id), false);
  });

  it("classifies incomplete SBAR or documentation without accepting the action", () => {
    const pair = clinicalScenarios.flatMap((scenario) => scenario.actions
      .filter((action) => action.communication || action.documentation)
      .map((action) => ({ scenario, action })))[0];
    assert.ok(pair);
    let state = createInitialPatientState(pair.scenario, 77, "guided");
    for (const dependency of [...pair.action.prerequisites, ...pair.action.safetyChecks]) {
      state = performWithDependencies(pair.scenario, state, dependency);
    }
    const result = applySimulationAction(pair.scenario, state, pair.action.id, []);
    assert.equal(result.entry.classification, "incomplete");
    assert.equal(result.state.completedActionIds.includes(pair.action.id), false);
  });

  it("scores only performed, credit-bearing actions by competency domain", () => {
    const scenario = clinicalScenarios[1];
    const action = scenario.actions.find((candidate) => candidate.score.length > 0);
    assert.ok(action);
    let state = createInitialPatientState(scenario, 88, "guided");
    state = performWithDependencies(scenario, state, action.id);
    const scores = scoreSimulation(scenario, state);
    assert.ok(scores.some((score) => score.earned > 0));
    assert.ok(scores.every((score) => score.earned <= score.possible));
  });

  it("marks indicated actions delayed after their clinical window", () => {
    const pair = clinicalScenarios.flatMap((scenario) => scenario.actions
      .filter((action) => action.lateAfterMinute != null)
      .map((action) => ({ scenario, action })))[0];
    assert.ok(pair);
    let state = createInitialPatientState(pair.scenario, 99, "independent");
    for (const dependency of [...pair.action.prerequisites, ...pair.action.safetyChecks]) {
      state = performWithDependencies(pair.scenario, state, dependency);
    }
    state = advanceSimulation(pair.scenario, state, (pair.action.lateAfterMinute ?? 0) + 1);
    const result = applySimulationAction(pair.scenario, state, pair.action.id, selectedElements(pair.action));
    assert.equal(result.entry.classification, "delayed");
  });

  it("persists clock state, assessment timestamps, and bounded physiology", () => {
    const scenario = septicScenario();
    let state = createInitialPatientState(scenario, 2126, "guided");
    state = setSimulationPaused(state, true);
    assert.equal(state.clockPaused, true);
    state = setSimulationPaused(state, false);
    state = performWithDependencies(scenario, state, "assess-hemodynamics");
    assert.deepEqual(state.assessmentRecords[0], {
      assessmentId: "hemodynamic-finding",
      actionId: "assess-hemodynamics",
      virtualMinute: 0,
    });
    state = advanceSimulation(scenario, state, 5);
    assert.equal(state.timeSinceLastReassessment, 5);

    state.vitals.spo2 = 140;
    state.vitals.map = -20;
    state.gcs = 1;
    state.urineOutputMlHr = -8;
    const normalized = normalizePatientState(state);
    assert.equal(normalized.vitals.spo2, 100);
    assert.equal(normalized.vitals.map, 0);
    assert.equal(normalized.gcs, 3);
    assert.equal(normalized.urineOutputMlHr, 0);
  });

  it("finds and can manually trigger the next deterministic event", () => {
    const scenario = septicScenario();
    const state = createInitialPatientState(scenario, 7001, "independent");
    assert.equal(minutesToNextMeaningfulEvent(scenario, state), 3);
    const triggered = triggerScenarioEvent(scenario, state, "recognition-delay");
    assert.equal(triggered.state.processedEventIds.includes("recognition-delay"), true);
    assert.ok(triggered.notice.message.startsWith("[Test event]"));
    assert.ok(triggered.notice.stateChanges.some((change) => change.path === "vitals.map"));
  });
});

describe("ICU septic shock trajectories", () => {
  it("stabilizes only after timely definitive care and physiologic response", () => {
    const scenario = septicScenario();
    let state = createInitialPatientState(scenario, 20_260_717, "independent");
    for (const actionId of scenario.completion.requiredActionIds) {
      state = performWithDependencies(scenario, state, actionId);
    }
    assert.equal(completeSimulation(scenario, state).debrief.outcome, "partially-stabilized");
    state = advanceSimulation(scenario, state, 5);
    const { debrief } = completeSimulation(scenario, state);
    assert.equal(debrief.outcome, "stabilized");
    assert.ok(debrief.finalPatientState.map >= 65);
    assert.ok(debrief.finalPatientState.urineOutputMlHr >= 20);
    assert.equal(debrief.metrics.timeToEscalation, 0);
    assert.match(debrief.outcomeExplanation, /MAP of \d+ mmHg/);
  });

  it("worsens hemodynamics, mentation, urine output, and lactate after delayed recognition", () => {
    const scenario = septicScenario();
    const initial = createInitialPatientState(scenario, 431, "independent");
    const delayed = advanceSimulation(scenario, initial, 10);
    assert.ok(delayed.vitals.map < initial.vitals.map);
    assert.ok(delayed.vitals.heartRate > initial.vitals.heartRate);
    assert.ok(delayed.urineOutputMlHr < initial.urineOutputMlHr);
    assert.ok(Number(delayed.labs.lactate) > Number(initial.labs.lactate));
    assert.equal(delayed.levelOfConsciousness, "difficult to arouse");
    assert.ok(delayed.processedEventIds.includes("recognition-delay"));
    assert.ok(delayed.processedEventIds.includes("antibiotic-delay"));
  });

  it("reports incomplete treatment when only part of the shock bundle is completed", () => {
    const scenario = septicScenario();
    let state = createInitialPatientState(scenario, 808, "independent");
    for (const actionId of ["assess-hemodynamics", "give-antibiotics", "assess-fluid-response", "notify-intensivist"]) {
      state = performWithDependencies(scenario, state, actionId);
    }
    const { debrief } = completeSimulation(scenario, state);
    assert.equal(debrief.outcome, "partially-stabilized");
    assert.ok(debrief.missedRequiredActions.includes("start-norepinephrine"));
    assert.match(debrief.outcomeExplanation, /response remained incomplete/);
  });

  it("logs unassessed repeat fluid as unsafe and worsens oxygenation", () => {
    const scenario = septicScenario();
    const initial = createInitialPatientState(scenario, 991, "independent");
    const result = applySimulationAction(scenario, initial, "repeat-blind-fluid");
    assert.equal(result.entry.classification, "unsafe");
    assert.ok(result.state.vitals.spo2 < initial.vitals.spo2);
    assert.ok(result.state.activeComplications.includes("fluid-associated pulmonary edema"));
    const { debrief } = completeSimulation(scenario, result.state);
    assert.equal(debrief.unsafeActionIds.length, 1);
    assert.match(debrief.causalFactors.join(" "), /Unsafe care/);
  });

  it("records a missed reassessment window after vasopressor initiation", () => {
    const scenario = septicScenario();
    let state = createInitialPatientState(scenario, 514, "independent");
    state = performWithDependencies(scenario, state, "start-norepinephrine");
    state = advanceSimulation(scenario, state, 12);
    assert.equal(state.flags.reassessmentWindowMissed, true);
    assert.ok(state.processedEventIds.includes("reassessment-missed"));
    assert.ok(state.notices.some((notice) => notice.id === "reassessment-missed" && notice.severity === "critical"));
  });

  it("delays team response and reaches the explicit critical failure state without escalation", () => {
    const scenario = septicScenario();
    let state = createInitialPatientState(scenario, 773, "independent");
    state = advanceSimulation(scenario, state, 18);
    assert.equal(state.flags.teamResponseDelayed, true);
    assert.equal(state.flags.criticalDeterioration, true);
    assert.equal(state.gcs, 8);
    assert.equal(state.urineOutputMlHr, 0);
    assert.equal(canCompleteSimulation(scenario, state), true);
    const { debrief } = completeSimulation(scenario, state);
    assert.equal(debrief.outcome, "deteriorated");
    assert.equal(debrief.triggeredFailureCondition?.id, "critical-shock");
    assert.match(debrief.outcomeExplanation, /Severe persistent hypotension/);
  });

  it("returns different provider responses for refractory and improving shock", () => {
    const scenario = septicScenario();
    let refractory = createInitialPatientState(scenario, 1002, "independent");
    refractory = performWithDependencies(scenario, refractory, "assess-hemodynamics");
    refractory.vitals.map = 50;
    const refractoryResult = applySimulationAction(
      scenario,
      refractory,
      "notify-intensivist",
      selectedElements(scenario.actions.find((action) => action.id === "notify-intensivist")!),
    );

    let improving = createInitialPatientState(scenario, 1002, "independent");
    improving = performWithDependencies(scenario, improving, "give-antibiotics");
    improving = performWithDependencies(scenario, improving, "start-norepinephrine");
    improving.vitals.map = 70;
    const improvingResult = applySimulationAction(
      scenario,
      improving,
      "notify-intensivist",
      selectedElements(scenario.actions.find((action) => action.id === "notify-intensivist")!),
    );
    assert.match(refractoryResult.entry.teamResponse ?? "", /refractory hypotension/);
    assert.match(improvingResult.entry.teamResponse ?? "", /improving MAP/);
    assert.notEqual(refractoryResult.entry.teamResponse, improvingResult.entry.teamResponse);
  });
});
