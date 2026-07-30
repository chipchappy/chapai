import type { StateChange } from "./engine";

// ─────────────────────────────────────────────────────────────────────────────
// Clinical language layer.
//
// The engine records every effect it applies as a raw { path, before, after }
// triple. That is exactly what a developer needs and exactly what a student must
// never see: `flags.rapidResponseActivated: undefined → true` teaches nothing and
// reads like a bug. Everything the student sees about a state change goes through
// this module, which
//
//   * drops internal bookkeeping (flags, reassessment timers, scaffolding),
//   * names each clinical value the way a nurse would say it,
//   * decides whether the change was an improvement or a deterioration, and
//   * decides whether it is salient enough to be worth a line at all.
//
// If a path has no entry here it is treated as internal and suppressed, so a new
// engine field can never leak raw output into the UI by omission.
// ─────────────────────────────────────────────────────────────────────────────

/** Which direction of travel is good for a numeric value. */
type Better = "lower" | "higher" | "none";

type NumericSpec = {
  label: string;
  unit?: string;
  better: Better;
  /** Absolute change below which the delta is clinical noise and not reported. */
  noise: number;
  /** Absolute change at or above which the change is a headline. */
  salient: number;
  decimals?: number;
};

type TextSpec = { label: string };

export type ClinicalChange = {
  path: string;
  /** One clinical sentence fragment, e.g. "Heart rate 108 → 96 bpm". */
  text: string;
  direction: "improved" | "worsened" | "neutral";
  salient: boolean;
};

const NUMERIC: Record<string, NumericSpec> = {
  "vitals.heartRate": { label: "Heart rate", unit: "bpm", better: "none", noise: 3, salient: 12 },
  "vitals.systolic": { label: "Systolic", unit: "mmHg", better: "higher", noise: 4, salient: 12 },
  "vitals.diastolic": { label: "Diastolic", unit: "mmHg", better: "higher", noise: 4, salient: 12 },
  "vitals.map": { label: "MAP", unit: "mmHg", better: "higher", noise: 3, salient: 8 },
  "vitals.respiratoryRate": { label: "Respiratory rate", unit: "/min", better: "lower", noise: 1, salient: 4 },
  "vitals.spo2": { label: "SpO₂", unit: "%", better: "higher", noise: 1, salient: 3 },
  "vitals.temperatureC": { label: "Temperature", unit: "°C", better: "lower", noise: 0.2, salient: 0.6, decimals: 1 },
  "vitals.pain": { label: "Pain score", unit: "/10", better: "lower", noise: 0, salient: 2 },
  gcs: { label: "Glasgow Coma Scale", better: "higher", noise: 0, salient: 2 },
  sedationScore: { label: "Sedation score (RASS)", better: "none", noise: 0, salient: 1 },
  bloodGlucose: { label: "Blood glucose", unit: "mg/dL", better: "none", noise: 4, salient: 25 },
  urineOutputMlHr: { label: "Urine output", unit: "mL/hr", better: "higher", noise: 3, salient: 10 },
  fluidBalanceMl: { label: "Fluid balance", unit: "mL", better: "none", noise: 100, salient: 750 },
  bleedingMl: { label: "Estimated blood loss", unit: "mL", better: "lower", noise: 20, salient: 100 },
  drainOutputMl: { label: "Drain output", unit: "mL", better: "lower", noise: 20, salient: 75 },
  anxiety: { label: "Anxiety", unit: "/10", better: "lower", noise: 1, salient: 3 },
  agitation: { label: "Agitation", unit: "/10", better: "lower", noise: 1, salient: 3 },
  headOfBedDegrees: { label: "Head of bed", unit: "°", better: "none", noise: 5, salient: 20 },
};

const TEXT: Record<string, TextSpec> = {
  levelOfConsciousness: { label: "Level of consciousness" },
  orientation: { label: "Orientation" },
  pupils: { label: "Pupils" },
  respiratoryEffort: { label: "Work of breathing" },
  breathSounds: { label: "Breath sounds" },
  oxygenDevice: { label: "Oxygen device" },
  oxygenFlow: { label: "Oxygen flow" },
  position: { label: "Position" },
  cardiacRhythm: { label: "Rhythm" },
  perfusion: { label: "Perfusion" },
  pulses: { label: "Pulses" },
  edema: { label: "Edema" },
  capillaryRefill: { label: "Capillary refill" },
  skin: { label: "Skin" },
  neurologicDeficits: { label: "Neurologic exam" },
  gastrointestinal: { label: "Abdomen" },
  behavior: { label: "Behaviour" },
  hallucinations: { label: "Perceptual disturbance" },
  withdrawalSymptoms: { label: "Withdrawal findings" },
  ivPatency: { label: "IV site" },
};

/** Labs worth naming properly; anything else falls back to a de-camel-cased key. */
const LAB_LABELS: Record<string, { label: string; unit?: string; better: Better; noise: number; salient: number; decimals?: number }> = {
  ph: { label: "pH", better: "none", noise: 0.01, salient: 0.05, decimals: 2 },
  pco2: { label: "pCO₂", unit: "mmHg", better: "lower", noise: 2, salient: 8 },
  po2: { label: "pO₂", unit: "mmHg", better: "higher", noise: 3, salient: 10 },
  bicarbonate: { label: "Bicarbonate", unit: "mEq/L", better: "higher", noise: 1, salient: 4 },
  lactate: { label: "Lactate", unit: "mmol/L", better: "lower", noise: 0.2, salient: 1, decimals: 1 },
  hemoglobin: { label: "Haemoglobin", unit: "g/dL", better: "higher", noise: 0.3, salient: 1, decimals: 1 },
  hematocrit: { label: "Haematocrit", unit: "%", better: "higher", noise: 1, salient: 3 },
  potassium: { label: "Potassium", unit: "mEq/L", better: "none", noise: 0.1, salient: 0.5, decimals: 1 },
  sodium: { label: "Sodium", unit: "mEq/L", better: "none", noise: 1, salient: 4 },
  creatinine: { label: "Creatinine", unit: "mg/dL", better: "lower", noise: 0.1, salient: 0.4, decimals: 2 },
  troponin: { label: "Troponin", unit: "ng/L", better: "lower", noise: 5, salient: 20 },
  platelets: { label: "Platelets", unit: "K/µL", better: "higher", noise: 10, salient: 40 },
  inr: { label: "INR", better: "lower", noise: 0.1, salient: 0.4, decimals: 1 },
  glucose: { label: "Glucose", unit: "mg/dL", better: "none", noise: 4, salient: 25 },
};

/** Paths that are engine bookkeeping and must never surface to a student. */
const SUPPRESSED = /^(flags\.|timeSinceLastReassessment$|ventilator\.|randomSeed)/;

/** Clinical acronyms that must not be lower-cased when a key is de-camel-cased. */
const ACRONYMS = new Set([
  "iv", "io", "ecg", "ekg", "niv", "jp", "et", "ng", "og", "prn", "gi", "gu",
  "abg", "vbg", "cvp", "art", "picc", "cvc", "spo2", "etco2", "hr", "bp", "rr",
  "map", "loc", "gcs", "rass", "cpap", "bipap", "ppe", "sq", "im", "po", "ml",
]);

function deCamel(key: string) {
  const words = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((word) => (ACRONYMS.has(word.toLowerCase()) ? word.toUpperCase() : word.toLowerCase()));
  if (!words.length) return key;
  const [first, ...rest] = words;
  const head = ACRONYMS.has(first.toLowerCase()) ? first : first.charAt(0).toUpperCase() + first.slice(1);
  return [head, ...rest].join(" ");
}

function formatNumber(value: number, decimals = 0) {
  return decimals > 0 ? value.toFixed(decimals) : String(Math.round(value));
}

function directionFor(better: Better, before: number, after: number): ClinicalChange["direction"] {
  if (better === "none") return "neutral";
  if (after === before) return "neutral";
  const rose = after > before;
  return (better === "higher") === rose ? "improved" : "worsened";
}

function numericChange(path: string, spec: NumericSpec, before: unknown, after: unknown): ClinicalChange | null {
  const from = Number(before);
  const to = Number(after);
  if (!Number.isFinite(from) || !Number.isFinite(to)) return null;
  const delta = Math.abs(to - from);
  if (delta <= spec.noise) return null;
  const unit = spec.unit ? ` ${spec.unit}` : "";
  return {
    path,
    text: `${spec.label} ${formatNumber(from, spec.decimals)} → ${formatNumber(to, spec.decimals)}${unit}`,
    direction: directionFor(spec.better, from, to),
    salient: delta >= spec.salient,
  };
}

/** Position enum values read as slugs; say them the way a nurse charts them. */
function humanizeValue(value: unknown): string {
  if (value == null || value === "") return "not documented";
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (typeof value === "number") return formatNumber(value, Number.isInteger(value) ? 0 : 1);
  if (Array.isArray(value)) return value.map((item) => humanizeValue(item)).join(", ");
  if (typeof value !== "string") return "updated";
  return value.replace(/-/g, " ");
}

function textChange(path: string, spec: TextSpec, before: unknown, after: unknown): ClinicalChange | null {
  const from = humanizeValue(before);
  const to = humanizeValue(after);
  if (from === to) return null;
  // A finding appearing for the first time reads better as a statement than a
  // transition from "not documented".
  const text = from === "not documented"
    ? `${spec.label}: ${to}`
    : `${spec.label}: ${from} → ${to}`;
  return { path, text, direction: "neutral", salient: false };
}

function labChange(path: string, before: unknown, after: unknown): ClinicalChange | null {
  const key = path.slice("labs.".length);
  const spec = LAB_LABELS[key.toLowerCase()];
  if (spec && Number.isFinite(Number(before)) && Number.isFinite(Number(after))) {
    return numericChange(path, { ...spec }, before, after);
  }
  const from = humanizeValue(before);
  const to = humanizeValue(after);
  if (from === to) return null;
  return { path, text: `${spec?.label ?? deCamel(key)}: ${from} → ${to}`, direction: "neutral", salient: false };
}

function deviceChange(path: string, before: unknown, after: unknown): ClinicalChange | null {
  const key = path.split(".").slice(1).join(".");
  const from = humanizeValue(before);
  const to = humanizeValue(after);
  if (from === to) return null;
  const label = deCamel(key);
  return {
    path,
    text: from === "not documented" ? `${label}: ${to}` : `${label}: ${from} → ${to}`,
    direction: "neutral",
    salient: false,
  };
}

function complicationChange(path: string, before: unknown, after: unknown): ClinicalChange | null {
  const previous = new Set(Array.isArray(before) ? before.map(String) : []);
  const current = Array.isArray(after) ? after.map(String) : [];
  const added = current.filter((item) => !previous.has(item));
  if (!added.length) return null;
  return {
    path,
    text: `New complication: ${added.join(", ")}`,
    direction: "worsened",
    salient: true,
  };
}

/**
 * Turns the engine's raw effect record into clinical sentences, dropping internal
 * bookkeeping and changes too small to matter. Order is preserved so the most
 * clinically important change a scenario author listed first stays first.
 */
export function describeStateChanges(changes: readonly StateChange[]): ClinicalChange[] {
  const described: ClinicalChange[] = [];
  const seen = new Set<string>();
  for (const change of changes) {
    if (SUPPRESSED.test(change.path)) continue;
    if (seen.has(change.path)) continue;
    let result: ClinicalChange | null = null;
    if (change.path === "activeComplications") result = complicationChange(change.path, change.before, change.after);
    else if (NUMERIC[change.path]) result = numericChange(change.path, NUMERIC[change.path], change.before, change.after);
    else if (TEXT[change.path]) result = textChange(change.path, TEXT[change.path], change.before, change.after);
    else if (change.path.startsWith("labs.")) result = labChange(change.path, change.before, change.after);
    else if (change.path.startsWith("devices.") || change.path.startsWith("infusionRates.")) result = deviceChange(change.path, change.before, change.after);
    // Anything unrecognised is treated as internal and intentionally skipped.
    if (!result) continue;
    seen.add(change.path);
    described.push(result);
  }
  return described;
}

/**
 * One-line summary of a set of changes for a feed card, plus the overall
 * direction so the card can be tinted. Salient changes are always kept; noise is
 * already gone by this point.
 */
export function summarizeStateChanges(changes: readonly StateChange[], limit = 3): { text: string; direction: ClinicalChange["direction"]; count: number } | null {
  const described = describeStateChanges(changes);
  if (!described.length) return null;
  const ordered = [...described].sort((a, b) => Number(b.salient) - Number(a.salient));
  const shown = ordered.slice(0, limit);
  const worsened = described.filter((item) => item.direction === "worsened").length;
  const improved = described.filter((item) => item.direction === "improved").length;
  const direction: ClinicalChange["direction"] = worsened > improved ? "worsened" : improved > worsened ? "improved" : "neutral";
  const remainder = described.length - shown.length;
  const text = shown.map((item) => item.text).join(" · ") + (remainder > 0 ? ` · +${remainder} more` : "");
  return { text, direction, count: described.length };
}
