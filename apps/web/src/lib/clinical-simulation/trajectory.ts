import { describeStateChanges } from "./clinical-language";
import type { PatientState } from "./engine";

export type ClinicalTrajectory = {
  status: "watching" | "responding" | "worsening" | "critical";
  label: string;
  detail: string;
};

function isUnexplainedComa(state: PatientState) {
  const sedated = (state.sedationScore != null && state.sedationScore <= -3)
    || /endotracheal|mechanical ventilation|ventilator/i.test(state.oxygenDevice ?? "");
  return state.gcs != null && state.gcs <= 8 && !sedated;
}

export function deriveClinicalTrajectory(state: PatientState): ClinicalTrajectory {
  const criticalPhysiology = state.flags.criticalDeterioration === true
    || state.vitals.map < 50
    || state.vitals.spo2 < 82
    || state.vitals.respiratoryRate === 0
    || isUnexplainedComa(state);
  if (criticalPhysiology) {
    return {
      status: "critical",
      label: "Critical",
      detail: "Immediate rescue and escalation are required while the response to treatment is reassessed.",
    };
  }

  const recent = state.notices
    .filter((notice) => notice.virtualMinute >= Math.max(0, state.virtualMinute - 5))
    .flatMap((notice) => describeStateChanges(notice.stateChanges));
  const improved = recent.filter((change) => change.direction === "improved").length;
  const worsened = recent.filter((change) => change.direction === "worsened").length;
  const recentCritical = state.notices.some(
    (notice) => notice.severity === "critical" && notice.virtualMinute >= Math.max(0, state.virtualMinute - 2),
  );

  if (recentCritical || worsened > improved) {
    return {
      status: "worsening",
      label: "Worsening",
      detail: "The latest objective changes are moving away from stabilization. Reassess priorities and escalate as indicated.",
    };
  }
  if (improved > worsened) {
    return {
      status: "responding",
      label: "Responding",
      detail: "The latest objective findings are moving toward stabilization. Confirm that the response is sustained.",
    };
  }
  return {
    status: "watching",
    label: "Unchanged",
    detail: "No clear objective response is established yet. Continue focused assessment and trend the patient.",
  };
}
