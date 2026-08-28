import type { PatientState } from "./engine";
import type { ClinicalScenario } from "./schema";

const coachingClassifications = new Set(["low_value", "incomplete", "premature", "delayed", "unsafe", "critical_error"]);

export type GuidedCoachingTip = {
  tone: "acceptable" | "unsafe";
  title: string;
  message: string;
};

export function getGuidedCoachingTip(state: PatientState, scenario: ClinicalScenario): GuidedCoachingTip | null {
  if (state.mode !== "guided" || state.actionLog.length < 2) return null;
  const lastTwo = state.actionLog.slice(-2);
  if (!lastTwo.every((entry) => coachingClassifications.has(entry.classification))) return null;
  const latest = lastTwo[1];
  const action = scenario.actions.find((candidate) => candidate.id === latest.actionId);
  const unsafe = latest.classification === "unsafe" || latest.classification === "critical_error";
  return {
    tone: unsafe ? "unsafe" : "acceptable",
    title: unsafe ? "Pause before the next action" : "Reassess the priority",
    message: action?.rationale ?? latest.feedback,
  };
}
