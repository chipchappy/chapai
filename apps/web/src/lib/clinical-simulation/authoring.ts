import type { ClinicalScenarioInput, CompetencyDomain } from "./schema";

// ─────────────────────────────────────────────────────────────────────────────
// Scenario authoring kit.
//
// Shared vocabulary for writing scenarios so every case is built out of the same
// primitives and the schema validator can hold them all to one standard. Extracted
// from scenarios.ts so a second scenario module can reuse it without importing the
// scenario registry (which would be circular).
//
// Nothing clinical lives here — only the shapes. Clinical judgment belongs in the
// individual scenario files where it can be reviewed line by line.
// ─────────────────────────────────────────────────────────────────────────────

export type ActionInput = ClinicalScenarioInput["actions"][number];

export type ActionOptions = Partial<Omit<ActionInput, "id" | "label" | "category" | "baseClassification" | "rationale" | "evidenceIds" | "description" | "feedback">> & {
  description?: string;
  feedback?: string;
};

export function score(domain: CompetencyDomain, points: number) {
  return { domain, points };
}

export function set(path: string, value: unknown) {
  return { path, operation: "set" as const, value };
}

export function add(path: string, value: number) {
  return { path, operation: "add" as const, value };
}

export function push(path: string, value: unknown) {
  return { path, operation: "push" as const, value };
}

export function action(
  id: string,
  label: string,
  category: ActionInput["category"],
  baseClassification: ActionInput["baseClassification"],
  rationale: string,
  evidenceIds: string[],
  options: ActionOptions = {},
): ActionInput {
  return {
    id,
    label,
    category,
    baseClassification,
    rationale,
    evidenceIds,
    description: options.description ?? rationale,
    // Default feedback is the action's own clinical rationale rather than a
    // boilerplate sentence. Feedback is only ever shown AFTER the student has
    // committed to the action, so this teaches the reasoning at the one moment it
    // cannot function as a hint — and it keeps generic filler out of the feed.
    feedback: options.feedback ?? rationale,
    prerequisites: [],
    safetyChecks: [],
    effects: [],
    delayedEffects: [],
    revealFindings: [],
    score: [],
    repeatable: false,
    ...options,
  };
}

/** A physiologically unremarkable adult; scenarios override what their case changes. */
export const baseState = {
  vitals: { heartRate: 88, systolic: 118, diastolic: 72, map: 87, respiratoryRate: 18, spo2: 96, temperatureC: 37.1, pain: 3 },
  levelOfConsciousness: "alert",
  orientation: "oriented to person, place, time, and situation",
  urineOutputMlHr: 40,
  fluidBalanceMl: 0,
  respiratoryEffort: "unlabored",
  breathSounds: "clear bilaterally",
  oxygenDevice: "room air",
  oxygenFlow: "none",
  cardiacRhythm: "sinus rhythm",
  perfusion: "warm extremities with brisk capillary refill",
  skin: "warm and dry",
  behavior: "calm and cooperative",
  anxiety: 2,
  agitation: 0,
  bleedingMl: 0,
  drainOutputMl: 0,
  labs: {},
  devices: {},
  flags: {},
};

/** SBAR is the same skeleton everywhere; what differs is which parts are required. */
export const sbarElements = [
  { id: "identity", label: "Patient identity and location" },
  { id: "concern", label: "Immediate concern" },
  { id: "background", label: "Relevant background" },
  { id: "assessment", label: "Current assessment and trends" },
  { id: "interventions", label: "Actions already taken and response" },
  { id: "request", label: "Specific request or recommendation" },
];

export const documentationFields = [
  { id: "assessment", label: "Focused assessment and objective findings" },
  { id: "intervention", label: "Interventions and medication actions" },
  { id: "response", label: "Patient response and reassessment" },
  { id: "notification", label: "Team notification and new orders" },
  { id: "safety", label: "Safety precautions" },
];
