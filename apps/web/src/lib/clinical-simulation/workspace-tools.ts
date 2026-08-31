import type { ScenarioAction } from "./schema";

export type SimulationToolId = "assessment" | "care" | "medications" | "fluids" | "orders" | "chart" | "team";

const FLUID_ACTION_PATTERN = /\b(?:iv|intravenous|fluid|bolus|infusion|crystalloid|saline|lactated|ringer|blood|plasma|platelet|transfus)/i;

export function toolForAction(action: ScenarioAction): SimulationToolId {
  if (action.category === "assessment") return "assessment";
  if (action.category === "medication") return "medications";
  if (action.category === "communication") return "team";
  if (action.category === "documentation") return "chart";
  if (action.category === "intervention" && FLUID_ACTION_PATTERN.test(`${action.label} ${action.description}`)) return "fluids";
  return "care";
}

export function actionsForTool(actions: ScenarioAction[], tool: SimulationToolId): ScenarioAction[] {
  return actions.filter((action) => toolForAction(action) === tool);
}
