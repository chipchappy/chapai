import assert from "node:assert/strict";
import test from "node:test";
import {
  advanceSimulation,
  applySimulationAction,
  createInitialPatientState,
  rewindSimulation,
} from "../../apps/web/src/lib/clinical-simulation/engine";
import { getClinicalScenarioBySlug } from "../../apps/web/src/lib/clinical-simulation/scenarios";

const scenario = getClinicalScenarioBySlug("septic-shock");
assert.ok(scenario, "septic-shock scenario must exist");

function firstActions(count: number) {
  return scenario!.actions.filter((a) => a.category === "assessment").slice(0, count).map((a) => a.id);
}

test("rewind reproduces the exact state the student had at that decision", () => {
  const ids = firstActions(3);
  assert.ok(ids.length >= 3, "need at least 3 assessment actions");

  let state = createInitialPatientState(scenario!, 260717, "guided");

  // Perform action 1, advance, action 2 — capture the state right here.
  state = applySimulationAction(scenario!, state, ids[0], []).state;
  state = advanceSimulation(scenario!, state, 5);
  state = applySimulationAction(scenario!, state, ids[1], []).state;
  const checkpoint = JSON.parse(JSON.stringify(state));

  // Continue: advance and take a third action.
  state = advanceSimulation(scenario!, state, 4);
  state = applySimulationAction(scenario!, state, ids[2], []).state;
  assert.equal(state.actionLog.length, 3, "three decisions recorded");

  // Rewind to keep only the first two decisions.
  const rewound = rewindSimulation(scenario!, state, 2);

  assert.equal(rewound.actionLog.length, 2, "third decision is undone");
  assert.equal(rewound.virtualMinute, checkpoint.virtualMinute, "clock returns to that moment");
  assert.deepEqual(rewound.vitals, checkpoint.vitals, "vitals match the original moment exactly");
  assert.deepEqual(
    rewound.completedActionIds.slice().sort(),
    checkpoint.completedActionIds.slice().sort(),
    "completed actions match",
  );
  assert.equal(rewound.clockPaused, true, "clock pauses so the student can choose deliberately");
  assert.equal(rewound.status, "in_progress", "rewind resumes an active run");
});

test("rewind is deterministic — repeating it yields identical state", () => {
  const ids = firstActions(2);
  let state = createInitialPatientState(scenario!, 99, "independent");
  state = applySimulationAction(scenario!, state, ids[0], []).state;
  state = advanceSimulation(scenario!, state, 3);
  state = applySimulationAction(scenario!, state, ids[1], []).state;

  const a = rewindSimulation(scenario!, state, 1);
  const b = rewindSimulation(scenario!, state, 1);
  const strip = (s: typeof a) => ({ ...s, notices: s.notices.filter((n) => !n.id.startsWith("rewind-")) });
  assert.deepEqual(strip(a), strip(b), "same input yields byte-identical state");
});

test("rewinding to zero returns the untouched starting patient", () => {
  const ids = firstActions(1);
  const initial = createInitialPatientState(scenario!, 260717, "guided");
  let state = applySimulationAction(scenario!, initial, ids[0], []).state;
  state = advanceSimulation(scenario!, state, 8);

  const rewound = rewindSimulation(scenario!, state, 0);
  assert.equal(rewound.actionLog.length, 0, "no decisions remain");
  assert.equal(rewound.virtualMinute, 0, "clock is back at the start of the shift");
  assert.deepEqual(rewound.vitals, initial.vitals, "patient is back to the handoff state");
});

test("rewind never invents progress beyond what was performed", () => {
  const ids = firstActions(2);
  let state = createInitialPatientState(scenario!, 7, "guided");
  state = applySimulationAction(scenario!, state, ids[0], []).state;
  const noop = rewindSimulation(scenario!, state, 5);
  assert.equal(noop.actionLog.length, 1, "keeping more actions than exist is a no-op");
});
