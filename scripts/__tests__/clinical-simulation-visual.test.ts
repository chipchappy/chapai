import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  advanceSimulation,
  applySimulationAction,
  createInitialPatientState,
  getPendingReassessments,
  triggerScenarioEvent,
  type PatientState,
} from "../../apps/web/src/lib/clinical-simulation/engine";
import { getSceneAnchors, getSceneConnections, sceneGeometryIsFinite } from "../../apps/web/src/lib/clinical-simulation/scene-geometry";
import { findMissingSceneAssets, getActiveSceneAssetIds, sceneAssetRegistry } from "../../apps/web/src/lib/clinical-simulation/scene-assets";
import { derivePatientPresentationStage, getPatientPresentation } from "../../apps/web/src/lib/clinical-simulation/patient-presentations";
import { clinicalScenarios } from "../../apps/web/src/lib/clinical-simulation/scenarios";
import type { ClinicalScenario, ScenarioAction } from "../../apps/web/src/lib/clinical-simulation/schema";
import {
  deriveConsciousnessVisual,
  derivePatientProfile,
  derivePatientVisualState,
  deriveRespiratoryVisual,
  deriveSkinVisual,
  normalizeOxygenDevice,
  skinPalettes,
} from "../../apps/web/src/lib/clinical-simulation/visual-state";

function scenario(slug: string) {
  const value = clinicalScenarios.find((item) => item.slug === slug);
  assert.ok(value, `scenario ${slug} exists`);
  return value;
}

function selectedElements(action: ScenarioAction) {
  return action.communication?.requiredElementIds ?? action.documentation?.requiredFieldIds ?? [];
}

function performWithDependencies(currentScenario: ClinicalScenario, initial: PatientState, actionId: string, visiting = new Set<string>()): PatientState {
  if (initial.completedActionIds.includes(actionId)) return initial;
  assert.ok(!visiting.has(actionId), `dependency cycle at ${actionId}`);
  const action = currentScenario.actions.find((item) => item.id === actionId);
  assert.ok(action, `action ${actionId} exists`);
  visiting.add(actionId);
  let state = initial;
  for (const dependency of [...action.prerequisites, ...action.safetyChecks]) state = performWithDependencies(currentScenario, state, dependency, visiting);
  visiting.delete(actionId);
  const reassessment = getPendingReassessments(currentScenario, state)
    .find((loop) => loop.followUpActionIds.includes(actionId));
  if (reassessment && state.virtualMinute < reassessment.dueMinute) {
    state = advanceSimulation(currentScenario, state, reassessment.dueMinute - state.virtualMinute);
  }
  return applySimulationAction(currentScenario, state, action.id, selectedElements(action)).state;
}

describe("clinical simulation visual-state adapter", () => {
  it("normalizes supported oxygen devices without inventing physiology", () => {
    assert.equal(normalizeOxygenDevice("room air"), "room-air");
    assert.equal(normalizeOxygenDevice("5 L/min nasal cannula"), "nasal-cannula");
    assert.equal(normalizeOxygenDevice("high-flow nasal cannula"), "high-flow-nasal-cannula");
    assert.equal(normalizeOxygenDevice("Venturi mask"), "venturi-mask");
    assert.equal(normalizeOxygenDevice("bilevel noninvasive ventilation"), "bipap");
    assert.equal(normalizeOxygenDevice("mechanical ventilator"), "mechanical-ventilation");
  });

  it("maps respiratory rate, depth, distress, and arrest from engine state", () => {
    const septic = scenario("septic-shock");
    const state = createInitialPatientState(septic, 4102, "guided");
    const initial = deriveRespiratoryVisual(state);
    assert.equal(initial.rate, state.vitals.respiratoryRate);
    assert.equal(initial.pattern, "tachypnea");
    assert.ok(["mild", "moderate"].includes(initial.work));
    assert.ok(initial.breathDurationSeconds < 3);
    const arrested = deriveRespiratoryVisual({ ...state, vitals: { ...state.vitals, respiratoryRate: 0 }, respiratoryEffort: "apneic" });
    assert.equal(arrested.pattern, "apnea");
    assert.equal(arrested.work, "arrest");
    assert.equal(arrested.chestAmplitude, 0);
  });

  it("maps consciousness conservatively rather than equating fatigue with coma", () => {
    const septic = scenario("septic-shock");
    const state = createInitialPatientState(septic, 4102, "guided");
    assert.equal(deriveConsciousnessVisual({ ...state, levelOfConsciousness: "fatigued but conversational" }).level, "drowsy");
    assert.equal(deriveConsciousnessVisual({ ...state, levelOfConsciousness: "responds only to painful stimulus", gcs: 8 }).level, "obtunded");
    assert.equal(deriveConsciousnessVisual({ ...state, levelOfConsciousness: "unresponsive", gcs: 6 }).level, "unresponsive");
    assert.equal(deriveConsciousnessVisual({ ...state, levelOfConsciousness: "unresponsive to voice", sedationScore: -4 }).level, "sedated");
    assert.equal(deriveConsciousnessVisual({ ...state, levelOfConsciousness: "alert", orientation: "oriented x4", behavior: "calm", agitation: 0, anxiety: 0 }).level, "alert");
  });

  it("maps engine deterioration to authored patient presentations without identity drift", () => {
    const respiratory = scenario("acute-respiratory-deterioration");
    const initial = createInitialPatientState(respiratory, 4102, "guided");
    const stable = {
      ...initial,
      vitals: { ...initial.vitals, spo2: 96, respiratoryRate: 18, temperatureC: 37, pain: 0 },
      levelOfConsciousness: "alert",
      respiratoryEffort: "unlabored",
      skin: "warm and dry",
      anxiety: 1,
      agitation: 0,
      gcs: 15,
    };
    assert.equal(derivePatientPresentationStage(stable), 1);
    assert.equal(derivePatientPresentationStage({ ...stable, skin: "pale and diaphoretic" }), 2);
    assert.equal(derivePatientPresentationStage({ ...stable, vitals: { ...stable.vitals, spo2: 72 } }), 2);
    assert.equal(derivePatientPresentationStage({ ...stable, levelOfConsciousness: "difficult to arouse", gcs: 11 }), 3);
    assert.equal(derivePatientPresentationStage({ ...stable, behavior: "confused and agitated", agitation: 8 }), 4);
    assert.equal(derivePatientPresentationStage({ ...stable, levelOfConsciousness: "responds only to painful stimulus", gcs: 7 }), 5);
    assert.match(getPatientPresentation(respiratory.slug, respiratory.patient.name, stable)?.src ?? "", /james-carter-stable-baseline/);
    assert.equal(getPatientPresentation(respiratory.slug, "Different Patient", stable), null);
  });

  it("derives regional perfusion overlays while preserving all baseline palettes", () => {
    const septic = scenario("septic-shock");
    const state = createInitialPatientState(septic, 4102, "guided");
    const skin = deriveSkinVisual(state);
    assert.ok(skin.mottling >= 1);
    assert.ok(skin.pallor >= 1);
    assert.ok(skin.diaphoresis >= 1);
    for (const palette of Object.values(skinPalettes)) {
      assert.match(palette.base, /^#[0-9a-f]{6}$/i);
      assert.notEqual(palette.base, palette.cyanosis);
      assert.notEqual(palette.base, palette.mottling);
    }
  });

  it("keeps patient identity deterministic for the same scenario seed", () => {
    const septic = scenario("septic-shock");
    assert.deepEqual(derivePatientProfile(septic, 7618), derivePatientProfile(septic, 7618));
    const first = derivePatientProfile(septic, 7618);
    const second = derivePatientProfile(septic, 7619);
    assert.notDeepEqual({ skin: first.skinTone, body: first.bodyVariant, hair: first.hairStyle }, { skin: second.skinTone, body: second.bodyVariant, hair: second.hairStyle });
  });

  it("protects focused pupils and output details until the matching assessment", () => {
    const septic = scenario("septic-shock");
    let state = createInitialPatientState(septic, 4102, "guided");
    state = { ...state, pupils: "unequal, sluggish pupils" };
    const hidden = derivePatientVisualState(septic, state);
    assert.equal(hidden.pupils.revealed, false);
    assert.ok(!hidden.accessibleDescription.toLowerCase().includes("unequal"));
    assert.equal(hidden.devices.urinaryDrainage.detailRevealed, false);
    state = performWithDependencies(septic, state, "assess-neuro");
    state = performWithDependencies(septic, state, "measure-urine");
    const revealed = derivePatientVisualState(septic, state);
    assert.equal(revealed.pupils.revealed, true);
    assert.equal(revealed.devices.urinaryDrainage.detailRevealed, true);
    assert.match(revealed.accessibleDescription, /12 milliliters per hour/i);
  });

  it("moves bed, body anchors, and connected tubing together after positioning", () => {
    const septic = scenario("septic-shock");
    let state = createInitialPatientState(septic, 4102, "guided");
    const beforeVisual = derivePatientVisualState(septic, state);
    const beforeAnchors = getSceneAnchors(beforeVisual);
    state = performWithDependencies(septic, state, "position-for-breathing");
    const afterVisual = derivePatientVisualState(septic, state);
    const afterAnchors = getSceneAnchors(afterVisual);
    const connections = getSceneConnections(afterVisual, afterAnchors);
    assert.equal(afterVisual.position.kind, "fowler");
    assert.equal(afterVisual.position.headOfBedDegrees, 50);
    assert.ok(afterAnchors.nose.y < beforeAnchors.nose.y);
    assert.ok(sceneGeometryIsFinite(afterAnchors, connections));
    assert.ok(connections.some((item) => item.kind === "oxygen" && item.to.x === afterAnchors.nose.x));
  });

  it("updates oxygen equipment from an actual intervention", () => {
    const respiratory = scenario("acute-respiratory-deterioration");
    let state = createInitialPatientState(respiratory, 2001, "guided");
    assert.equal(derivePatientVisualState(respiratory, state).devices.oxygen, "nasal-cannula");
    state = performWithDependencies(respiratory, state, "titrate-oxygen");
    assert.equal(derivePatientVisualState(respiratory, state).devices.oxygen, "venturi-mask");
    state = performWithDependencies(respiratory, state, "start-niv");
    const visual = derivePatientVisualState(respiratory, state);
    assert.equal(visual.devices.oxygen, "bipap");
    assert.equal(visual.respiration.rate, state.vitals.respiratoryRate);
  });

  it("shows engine-backed infusions and only renders arterial monitoring after connection", () => {
    const septic = scenario("septic-shock");
    let state = createInitialPatientState(septic, 4102, "guided");
    state = performWithDependencies(septic, state, "give-antibiotics");
    state = performWithDependencies(septic, state, "start-norepinephrine");
    state = advanceSimulation(septic, state, 5);
    const visual = derivePatientVisualState(septic, state);
    assert.ok(visual.devices.pumps.some((pump) => pump.id === "norepinephrine" && pump.rate.includes("0.05")));
    assert.ok(visual.devices.pumps.some((pump) => pump.id === "antibiotic"));
    assert.equal(visual.devices.arterialLine, false);
    const connected = derivePatientVisualState(septic, { ...state, devices: { ...state.devices, arterialLine: "patent, leveled, zeroed, and transduced" } });
    assert.equal(connected.devices.arterialLine, true);
    assert.ok(["alert", "drowsy", "confused"].includes(visual.consciousness.level));
  });

  it("renders delayed shock deterioration from event-driven state changes", () => {
    const septic = scenario("septic-shock");
    let state = createInitialPatientState(septic, 4102, "guided");
    state = triggerScenarioEvent(septic, state, "shock-worsens").state;
    state = triggerScenarioEvent(septic, state, "critical-deterioration").state;
    const visual = derivePatientVisualState(septic, state);
    assert.equal(visual.consciousness.level, "obtunded");
    assert.ok(visual.skin.pallor >= 2);
    assert.ok(visual.skin.mottling >= 2);
    assert.equal(visual.roomLighting, "emergency");
    assert.equal(visual.devices.defibrillatorVisible, true);
  });

  it("represents postoperative drainage without leaking output before inspection", () => {
    const postoperative = scenario("postoperative-deterioration");
    let state = createInitialPatientState(postoperative, 711, "guided");
    let visual = derivePatientVisualState(postoperative, state);
    assert.equal(visual.devices.drain.visible, true);
    assert.equal(visual.devices.drain.kind, "jp");
    assert.equal(visual.devices.drain.detailRevealed, false);
    state = performWithDependencies(postoperative, state, "assess-drain");
    visual = derivePatientVisualState(postoperative, state);
    assert.equal(visual.devices.drain.detailRevealed, true);
    assert.match(visual.accessibleDescription, new RegExp(`${state.drainOutputMl} milliliters`, "i"));
  });

  it("supports ventilator, pads, chest tube, edema, and reduced-motion previews only through protected overrides", () => {
    const septic = scenario("septic-shock");
    const state = createInitialPatientState(septic, 4102, "guided");
    const visual = derivePatientVisualState(septic, state, { ventilator: true, defibrillationPads: "anterior-lateral", drain: "chest-tube", edema: 3, reducedMotion: true });
    assert.equal(visual.source, "developer-preview");
    assert.equal(visual.devices.mechanicalVentilation, true);
    assert.equal(visual.devices.oxygen, "mechanical-ventilation");
    assert.equal(visual.devices.oxygenFlow, "40% FiO2");
    assert.match(visual.accessibleDescription, /mechanical ventilation is in place at 40% FiO2/i);
    assert.equal(visual.devices.artificialAirway, true);
    assert.equal(visual.devices.defibrillationPads, "anterior-lateral");
    assert.equal(visual.devices.chestTube, true);
    assert.equal(visual.skin.edema, 3);
    assert.equal(visual.reducedMotion, true);
    assert.ok(visual.warnings.some((item) => item.code === "DEVELOPER_VISUAL_OVERRIDE"));
  });

  it("surfaces contradictory device combinations for the protected inspector", () => {
    const septic = scenario("septic-shock");
    const state = createInitialPatientState(septic, 4102, "guided");
    const inconsistent = { ...state, oxygenDevice: "room air", oxygenFlow: "8 L/min" };
    const visual = derivePatientVisualState(septic, inconsistent);
    assert.ok(visual.warnings.some((item) => item.code === "ROOM_AIR_WITH_FLOW" && item.severity === "error"));
  });

  it("derives finite scene geometry for every playable scenario", () => {
    assert.ok(sceneAssetRegistry.length >= 25);
    for (const item of clinicalScenarios) {
      const state = createInitialPatientState(item, 8000 + item.title.length, "guided");
      const visual = derivePatientVisualState(item, state);
      const anchors = getSceneAnchors(visual);
      const connections = getSceneConnections(visual, anchors);
      assert.ok(sceneGeometryIsFinite(anchors, connections), item.slug);
      assert.ok(getActiveSceneAssetIds(visual).length >= 4, item.slug);
      assert.deepEqual(findMissingSceneAssets(visual), [], item.slug);
      assert.ok(visual.accessibleDescription.length > 80, item.slug);
      assert.equal(visual.warnings.filter((warning) => warning.severity === "error").length, 0, `${item.slug}: ${JSON.stringify(visual.warnings)}`);
    }
  });
});
