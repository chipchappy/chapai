import assert from "node:assert/strict";
import test from "node:test";
import { advanceSimulation, applySimulationAction, createInitialPatientState } from "../../apps/web/src/lib/clinical-simulation/engine";
import { gradeBestPracticeRoute, idealRoute } from "../../apps/web/src/lib/clinical-simulation/best-practice";
import { getClinicalScenarioBySlug } from "../../apps/web/src/lib/clinical-simulation/scenarios";

const scenario = getClinicalScenarioBySlug("septic-shock");
assert.ok(scenario, "septic-shock scenario must exist");

test("the ideal route is derived from the scenario's own expert timings", () => {
  const route = idealRoute(scenario!);
  assert.ok(route.length >= 3, "route should contain the essential/required actions");
  // Every required completion action must appear in the route.
  for (const id of scenario!.completion.requiredActionIds) {
    assert.ok(route.some((a) => a.id === id), `required action ${id} is part of the ideal route`);
  }
  // Ordering is non-decreasing by optimal timing.
  const times = route.map((a) => a.optimalByMinute ?? a.lateAfterMinute ?? Number.MAX_SAFE_INTEGER);
  const sorted = [...times].sort((x, y) => x - y);
  assert.deepEqual(times, sorted, "route is ordered by expert timing");
});

test("doing nothing grades as incomplete, not as success", () => {
  const state = createInitialPatientState(scenario!, 260717, "guided");
  const grade = gradeBestPracticeRoute(scenario!, state);
  assert.equal(grade.coverage, 0, "no essential care performed");
  assert.ok(grade.score < 50, `idle run should score low, got ${grade.score}`);
  assert.ok(grade.steps.every((s) => s.status === "missed"), "every route step is missed");
  assert.match(grade.nextFocus, /Missed/i);
});

test("following the route promptly grades far better than ignoring it", () => {
  const route = idealRoute(scenario!);

  // Good run: perform the route in order, immediately.
  let good = createInitialPatientState(scenario!, 260717, "guided");
  for (const action of route) {
    good = applySimulationAction(scenario!, good, action.id, []).state;
  }
  const goodGrade = gradeBestPracticeRoute(scenario!, good);

  // Poor run: let a lot of time pass, then do only the last route item.
  let poor = createInitialPatientState(scenario!, 260717, "guided");
  poor = advanceSimulation(scenario!, poor, 25);
  poor = applySimulationAction(scenario!, poor, route[route.length - 1].id, []).state;
  const poorGrade = gradeBestPracticeRoute(scenario!, poor);

  assert.ok(goodGrade.coverage > poorGrade.coverage, "good run covers more essential care");
  assert.ok(goodGrade.score > poorGrade.score, `good run must outscore poor run (${goodGrade.score} vs ${poorGrade.score})`);
});

test("unsafe actions are penalised and drive the next-run focus", () => {
  const unsafe = scenario!.actions.find((a) => a.baseClassification === "unsafe" || a.baseClassification === "critical_error");
  if (!unsafe) return; // scenario has no unsafe distractor; nothing to assert

  let clean = createInitialPatientState(scenario!, 260717, "guided");
  const route = idealRoute(scenario!);
  clean = applySimulationAction(scenario!, clean, route[0].id, []).state;
  const cleanGrade = gradeBestPracticeRoute(scenario!, clean);

  let harmed = createInitialPatientState(scenario!, 260717, "guided");
  harmed = applySimulationAction(scenario!, harmed, route[0].id, []).state;
  harmed = applySimulationAction(scenario!, harmed, unsafe.id, []).state;
  const harmedGrade = gradeBestPracticeRoute(scenario!, harmed);

  assert.ok(harmedGrade.unsafeCount >= 1, "unsafe action is counted");
  assert.ok(harmedGrade.score < cleanGrade.score, "unsafe action lowers the grade");
  assert.match(harmedGrade.nextFocus, /unsafe/i, "next focus points at the unsafe decision");
});

test("grading is deterministic for the same run", () => {
  const route = idealRoute(scenario!);
  let state = createInitialPatientState(scenario!, 42, "independent");
  state = applySimulationAction(scenario!, state, route[0].id, []).state;
  const a = gradeBestPracticeRoute(scenario!, state);
  const b = gradeBestPracticeRoute(scenario!, state);
  assert.deepEqual(a, b, "same run grades identically every time");
});
