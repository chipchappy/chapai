import type { PatientState } from "./engine";
import type { ClinicalScenario, PatientPosition } from "./schema";

export const skinToneIds = ["porcelain", "sand", "olive", "umber", "deep", "ebony"] as const;
export type SkinToneId = (typeof skinToneIds)[number];

export const roomPresetIds = ["medical-surgical", "telemetry", "step-down", "intensive-care", "procedural", "psychiatric"] as const;
export type RoomPresetId = (typeof roomPresetIds)[number];

export type OxygenDeviceVisual =
  | "room-air"
  | "nasal-cannula"
  | "high-flow-nasal-cannula"
  | "simple-mask"
  | "venturi-mask"
  | "non-rebreather"
  | "cpap"
  | "bipap"
  | "bag-mask"
  | "tracheostomy-collar"
  | "t-piece"
  | "mechanical-ventilation";

export type WorkOfBreathingVisual = "none" | "mild" | "moderate" | "severe" | "exhaustion" | "arrest";
export type ConsciousnessVisual = "alert" | "anxious" | "restless" | "drowsy" | "somnolent" | "confused" | "agitated" | "obtunded" | "unresponsive" | "sedated";
export type BreathingPatternVisual = "quiet" | "tachypnea" | "bradypnea" | "shallow" | "deep" | "kussmaul" | "irregular" | "agonal" | "apnea" | "assisted";
export type SceneQuality = "full" | "reduced";

export type SkinPalette = {
  base: string;
  highlight: string;
  shadow: string;
  lip: string;
  pallor: string;
  flush: string;
  cyanosis: string;
  mottling: string;
};

export const skinPalettes: Record<SkinToneId, SkinPalette> = {
  porcelain: { base: "#e8bea6", highlight: "#f5d5c1", shadow: "#b97962", lip: "#a95f64", pallor: "#eadbd1", flush: "#c75955", cyanosis: "#6e7189", mottling: "#755b76" },
  sand: { base: "#cf9b75", highlight: "#e8b794", shadow: "#965e45", lip: "#91535a", pallor: "#d6b9a5", flush: "#b8514c", cyanosis: "#5f647c", mottling: "#684f71" },
  olive: { base: "#b77d55", highlight: "#d29a70", shadow: "#7c4b34", lip: "#824d50", pallor: "#bea58c", flush: "#a64c43", cyanosis: "#555d73", mottling: "#5d4b6b" },
  umber: { base: "#8b5a3c", highlight: "#aa7652", shadow: "#5b3426", lip: "#71444a", pallor: "#927966", flush: "#8f443f", cyanosis: "#4f586b", mottling: "#51445e" },
  deep: { base: "#65402e", highlight: "#855b42", shadow: "#3f261d", lip: "#603c43", pallor: "#6e6257", flush: "#79423b", cyanosis: "#475466", mottling: "#473d56" },
  ebony: { base: "#432a21", highlight: "#65483a", shadow: "#281814", lip: "#51343b", pallor: "#514943", flush: "#613a35", cyanosis: "#424f60", mottling: "#40384e" },
};

export type PatientVisualProfile = {
  skinTone: SkinToneId;
  palette: SkinPalette;
  bodyVariant: "slender" | "average" | "broad";
  hairStyle: "short" | "cropped" | "coiled" | "bob" | "covered" | "receding";
  hairColor: string;
  apparentAge: "young-adult" | "middle-adult" | "older-adult";
  sexPresentation: string;
  clothing: "standard-gown" | "icu-gown" | "procedural-gown" | "psychiatric-safe";
};

export type RespiratoryVisualState = {
  rate: number;
  pattern: BreathingPatternVisual;
  work: WorkOfBreathingVisual;
  breathDurationSeconds: number;
  chestAmplitude: number;
  abdominalAmplitude: number;
  accessoryMuscleUse: boolean;
  retractions: boolean;
  distressedExpression: boolean;
  spontaneousBreathing: boolean;
};

export type ConsciousnessVisualState = {
  level: ConsciousnessVisual;
  eyeOpenRatio: number;
  tracks: boolean;
  blinkSeconds: number;
  respondsToVoice: boolean;
  purposefulMovement: boolean;
};

export type SkinVisualState = {
  pallor: 0 | 1 | 2 | 3;
  cyanosis: 0 | 1 | 2 | 3;
  mottling: 0 | 1 | 2 | 3 | 4;
  diaphoresis: 0 | 1 | 2 | 3;
  flushing: 0 | 1 | 2;
  jaundice: 0 | 1 | 2;
  edema: 0 | 1 | 2 | 3 | 4;
  bleeding: 0 | 1 | 2 | 3;
  clammy: boolean;
};

export type PupilVisualState = {
  revealed: boolean;
  leftMm: number;
  rightMm: number;
  leftReactive: "brisk" | "sluggish" | "fixed";
  rightReactive: "brisk" | "sluggish" | "fixed";
  gaze: "center" | "left" | "right";
  description: string;
};

export type PositionVisualState = {
  kind: PatientPosition;
  headOfBedDegrees: number;
  lateralDirection: "none" | "left" | "right";
  ambulatory: boolean;
};

export type PumpChannelVisual = {
  id: string;
  label: string;
  state: "running" | "paused" | "complete" | "alarm";
  rate: string;
  tone: "fluid" | "antibiotic" | "vasopressor" | "blood" | "other";
};

export type VisualDeviceState = {
  oxygen: OxygenDeviceVisual;
  oxygenLabel: string;
  oxygenFlow: string;
  mechanicalVentilation: boolean;
  artificialAirway: boolean;
  ventilator: { mode: string; setRate: string; fio2: string; peep: string; synchrony: "synchronous" | "dyssynchronous"; alarm: string | null };
  ecgLeads: boolean;
  arterialLine: boolean;
  defibrillationPads: "none" | "anterior-lateral" | "anterior-posterior";
  defibrillatorVisible: boolean;
  ivSites: Array<{ id: string; side: "left" | "right"; site: "hand" | "forearm" | "upper-arm" | "neck"; status: string }>;
  pumps: PumpChannelVisual[];
  urinaryDrainage: { visible: boolean; outputMlHr: number; fillRatio: number; color: "straw" | "amber" | "dark" | "red"; detailRevealed: boolean };
  drain: { visible: boolean; kind: "jp" | "chest-tube" | "pigtail" | "surgical"; outputMl: number; color: "serous" | "serosanguineous" | "sanguineous"; detailRevealed: boolean };
  chestTube: boolean;
  suction: boolean;
};

export type SceneWarning = {
  code: string;
  severity: "info" | "warning" | "error";
  message: string;
};

export type VisualDebugOverrides = {
  skinTone?: SkinToneId;
  bodyVariant?: PatientVisualProfile["bodyVariant"];
  consciousness?: ConsciousnessVisual;
  respiratoryRate?: number;
  workOfBreathing?: WorkOfBreathingVisual;
  diaphoresis?: 0 | 1 | 2 | 3;
  mottling?: 0 | 1 | 2 | 3 | 4;
  edema?: 0 | 1 | 2 | 3 | 4;
  pupils?: "normal" | "unequal" | "pinpoint" | "dilated" | "fixed";
  oxygenDevice?: OxygenDeviceVisual;
  ventilator?: boolean;
  ecgLeads?: boolean;
  defibrillationPads?: VisualDeviceState["defibrillationPads"];
  ivSites?: "none" | "single" | "dual" | "central";
  drain?: "none" | "jp" | "chest-tube";
  position?: PatientPosition;
  seizure?: boolean;
  respiratoryArrest?: boolean;
  improvement?: boolean;
  roomPreset?: RoomPresetId;
  reducedMotion?: boolean;
};

export type PatientVisualState = {
  scenarioId: string;
  scenarioVersion: string;
  seed: number;
  source: "engine" | "developer-preview";
  profile: PatientVisualProfile;
  roomPreset: RoomPresetId;
  roomLighting: "day" | "night" | "procedure" | "emergency" | "calming";
  position: PositionVisualState;
  respiration: RespiratoryVisualState;
  consciousness: ConsciousnessVisualState;
  skin: SkinVisualState;
  pupils: PupilVisualState;
  movement: { intensity: 0 | 1 | 2 | 3; tremor: boolean; shivering: boolean; seizure: boolean; guarding: boolean; reachesForLines: boolean };
  expression: "neutral" | "anxious" | "pain" | "dyspnea" | "confused" | "agitated" | "fatigued" | "sedated" | "unresponsive";
  devices: VisualDeviceState;
  revealed: { respiratory: boolean; neurologic: boolean; perfusion: boolean; iv: boolean; output: boolean; drain: boolean };
  accessibleDescription: string;
  reducedMotion: boolean;
  quality: SceneQuality;
  warnings: SceneWarning[];
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function includesAny(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term));
}

function numericFlow(value: string) {
  const match = value.match(/(?:^|\s)(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : null;
}

function flag(state: PatientState, key: string) {
  return Boolean(state.flags[key]);
}

function hasRevealed(state: PatientState, patterns: RegExp[]) {
  return state.revealedFindingIds.some((id) => patterns.some((pattern) => pattern.test(id)));
}

export function normalizeOxygenDevice(raw: string): OxygenDeviceVisual {
  const value = raw.toLowerCase().replaceAll("_", " ").trim();
  if (includesAny(value, ["mechanical ventilation", "ventilator", "endotracheal"])) return "mechanical-ventilation";
  if (includesAny(value, ["bag-mask", "bag mask", "bvm"])) return "bag-mask";
  if (includesAny(value, ["bilevel", "bi-level", "bipap"])) return "bipap";
  if (value.includes("cpap")) return "cpap";
  if (includesAny(value, ["non-rebreather", "nonrebreather", "nrb"])) return "non-rebreather";
  if (value.includes("venturi")) return "venturi-mask";
  if (includesAny(value, ["high-flow", "high flow", "hfnc"])) return "high-flow-nasal-cannula";
  if (value.includes("simple mask")) return "simple-mask";
  if (value.includes("tracheostomy collar")) return "tracheostomy-collar";
  if (value.includes("t-piece") || value.includes("t piece")) return "t-piece";
  if (includesAny(value, ["nasal cannula", "nasal oxygen", "nc "])) return "nasal-cannula";
  return "room-air";
}

export function derivePatientProfile(scenario: ClinicalScenario, seed: number, overrides?: VisualDebugOverrides): PatientVisualProfile {
  const profileSeed = hashString(`${scenario.patient.name}|${scenario.patient.age}|${seed}`);
  const skinTone = overrides?.skinTone ?? skinToneIds[profileSeed % skinToneIds.length];
  const bodyVariants: PatientVisualProfile["bodyVariant"][] = ["slender", "average", "broad"];
  const hairStyles: PatientVisualProfile["hairStyle"][] = ["short", "cropped", "coiled", "bob", "covered", "receding"];
  const clothing: PatientVisualProfile["clothing"] = scenario.unit === "intensive-care"
    ? "icu-gown"
    : scenario.unit === "procedural"
      ? "procedural-gown"
      : scenario.unit === "psychiatric"
        ? "psychiatric-safe"
        : "standard-gown";
  return {
    skinTone,
    palette: skinPalettes[skinTone],
    bodyVariant: overrides?.bodyVariant ?? bodyVariants[(profileSeed >>> 4) % bodyVariants.length],
    hairStyle: hairStyles[(profileSeed >>> 7) % hairStyles.length],
    hairColor: scenario.patient.age >= 65 ? "#706d68" : (profileSeed & 1) === 0 ? "#2f2926" : "#4a3428",
    apparentAge: scenario.patient.age >= 65 ? "older-adult" : scenario.patient.age >= 40 ? "middle-adult" : "young-adult",
    sexPresentation: scenario.patient.sex,
    clothing,
  };
}

export function deriveRespiratoryVisual(state: PatientState, overrides?: VisualDebugOverrides): RespiratoryVisualState {
  const raw = state.respiratoryEffort.toLowerCase();
  const rate = overrides?.respiratoryArrest ? 0 : clamp(Math.round(overrides?.respiratoryRate ?? state.vitals.respiratoryRate), 0, 80);
  const assisted = includesAny(raw, ["assisted", "ventilator", "positive-pressure"]);
  let pattern: BreathingPatternVisual = "quiet";
  if (rate === 0 || raw.includes("apne")) pattern = "apnea";
  else if (assisted) pattern = "assisted";
  else if (raw.includes("agonal")) pattern = "agonal";
  else if (includesAny(raw, ["kussmaul", "deep rapid"])) pattern = "kussmaul";
  else if (includesAny(raw, ["cheyne", "irregular"])) pattern = "irregular";
  else if (raw.includes("shallow")) pattern = "shallow";
  else if (raw.includes("deep")) pattern = "deep";
  else if (rate < 10) pattern = "bradypnea";
  else if (rate > 22 || raw.includes("tachyp")) pattern = "tachypnea";

  let work: WorkOfBreathingVisual = "none";
  if (pattern === "apnea") work = "arrest";
  else if (includesAny(raw, ["exhaust", "agonal", "impending"])) work = "exhaustion";
  else if (includesAny(raw, ["severe", "marked", "paradoxical"]) || (rate >= 36 && state.vitals.spo2 < 90)) work = "severe";
  else if (includesAny(raw, ["accessory", "labored", "retraction", "obstruction"]) || rate >= 30) work = "moderate";
  else if (includesAny(raw, ["mild", "tachyp", "shallow", "dyspn"]) || rate >= 23) work = "mild";
  if (overrides?.workOfBreathing) work = overrides.workOfBreathing;
  if (overrides?.improvement) work = "none";

  const effectiveRate = overrides?.improvement ? Math.min(rate, 18) : rate;
  const depth = pattern === "shallow" ? 0.45 : pattern === "deep" || pattern === "kussmaul" ? 1.3 : 1;
  const workMultiplier = { none: 0.65, mild: 0.85, moderate: 1, severe: 1.15, exhaustion: 0.5, arrest: 0 }[work];
  return {
    rate: effectiveRate,
    pattern,
    work,
    breathDurationSeconds: effectiveRate > 0 ? clamp(60 / effectiveRate, 0.7, 8) : 8,
    chestAmplitude: Number(clamp(depth * workMultiplier, 0, 1.4).toFixed(2)),
    abdominalAmplitude: Number(clamp((pattern === "kussmaul" ? 1.2 : 0.7) * workMultiplier, 0, 1.3).toFixed(2)),
    accessoryMuscleUse: work === "moderate" || work === "severe",
    retractions: work === "severe" || raw.includes("retraction"),
    distressedExpression: work === "moderate" || work === "severe" || work === "exhaustion",
    spontaneousBreathing: pattern !== "apnea" || assisted,
  };
}

export function deriveConsciousnessVisual(state: PatientState, overrides?: VisualDebugOverrides): ConsciousnessVisualState {
  const raw = `${state.levelOfConsciousness} ${state.orientation} ${state.behavior}`.toLowerCase();
  let level: ConsciousnessVisual = "alert";
  if ((includesAny(raw, ["unresponsive", "no response"]) && !raw.includes("unresponsive to voice")) || (state.gcs != null && state.gcs <= 7)) level = "unresponsive";
  else if (state.sedationScore != null && state.sedationScore <= -3) level = "sedated";
  else if (includesAny(raw, ["obtunded", "difficult to arouse", "only to pain", "painful stimulus", "unresponsive to voice"]) || (state.gcs != null && state.gcs <= 10)) level = "obtunded";
  else if (includesAny(raw, ["somnolent", "increasingly lethargic"])) level = "somnolent";
  else if (includesAny(raw, ["drowsy", "lethargic", "fatigued"])) level = "drowsy";
  else if (includesAny(raw, ["confused", "disoriented", "oriented to person only"])) level = "confused";
  else if (includesAny(raw, ["agitated", "shouting", "combative"]) || state.agitation >= 7) level = "agitated";
  else if (includesAny(raw, ["restless", "pacing"]) || state.agitation >= 4) level = "restless";
  else if (includesAny(raw, ["anxious", "guarded"]) || state.anxiety >= 6) level = "anxious";
  if (overrides?.consciousness) level = overrides.consciousness;
  if (overrides?.improvement) level = "alert";

  const settings: Record<ConsciousnessVisual, Omit<ConsciousnessVisualState, "level">> = {
    alert: { eyeOpenRatio: 1, tracks: true, blinkSeconds: 5.2, respondsToVoice: true, purposefulMovement: true },
    anxious: { eyeOpenRatio: 1, tracks: true, blinkSeconds: 3.8, respondsToVoice: true, purposefulMovement: true },
    restless: { eyeOpenRatio: 0.95, tracks: true, blinkSeconds: 3.2, respondsToVoice: true, purposefulMovement: true },
    drowsy: { eyeOpenRatio: 0.48, tracks: true, blinkSeconds: 7, respondsToVoice: true, purposefulMovement: true },
    somnolent: { eyeOpenRatio: 0.25, tracks: false, blinkSeconds: 9, respondsToVoice: true, purposefulMovement: false },
    confused: { eyeOpenRatio: 0.85, tracks: false, blinkSeconds: 4.5, respondsToVoice: true, purposefulMovement: true },
    agitated: { eyeOpenRatio: 1, tracks: true, blinkSeconds: 2.8, respondsToVoice: true, purposefulMovement: true },
    obtunded: { eyeOpenRatio: 0.1, tracks: false, blinkSeconds: 12, respondsToVoice: false, purposefulMovement: false },
    unresponsive: { eyeOpenRatio: 0, tracks: false, blinkSeconds: 20, respondsToVoice: false, purposefulMovement: false },
    sedated: { eyeOpenRatio: 0, tracks: false, blinkSeconds: 20, respondsToVoice: false, purposefulMovement: false },
  };
  return { level, ...settings[level] };
}

function severityFromText(raw: string, normalTerms: string[]): 0 | 1 | 2 | 3 | 4 {
  if (normalTerms.some((term) => raw.includes(term))) return 0;
  if (includesAny(raw, ["severe", "generalized", "profound"])) return 4;
  if (includesAny(raw, ["moderate", "progressive", "marked"])) return 3;
  if (includesAny(raw, ["mild", "early", "distal"])) return 2;
  return 1;
}

export function deriveSkinVisual(state: PatientState, overrides?: VisualDebugOverrides): SkinVisualState {
  const raw = `${state.skin} ${state.perfusion} ${state.edema} ${state.capillaryRefill} ${state.activeComplications.join(" ")}`.toLowerCase();
  const shockSeverity = state.vitals.map < 45 ? 3 : state.vitals.map < 55 ? 2 : state.vitals.map < 65 ? 1 : 0;
  const pallor = clamp((includesAny(raw, ["pale", "pallor", "cool", "poorly perfused"]) ? 1 : 0) + shockSeverity, 0, 3) as 0 | 1 | 2 | 3;
  const cyanosis = clamp((raw.includes("cyan") ? 2 : 0) + (state.vitals.spo2 < 82 ? 2 : state.vitals.spo2 < 88 ? 1 : 0), 0, 3) as 0 | 1 | 2 | 3;
  const mottling = clamp((raw.includes("mottl") ? severityFromText(raw, ["no mottling"]) + 1 : 0) + (state.vitals.map < 50 ? 1 : 0), 0, 4) as 0 | 1 | 2 | 3 | 4;
  const diaphoresis = clamp(includesAny(raw, ["diaphoretic", "perspiration", "clammy"]) ? (raw.includes("severe") ? 3 : 2) : state.vitals.temperatureC >= 39 ? 1 : 0, 0, 3) as 0 | 1 | 2 | 3;
  const edema = clamp(raw.includes("edema") ? severityFromText(raw, ["no edema", "without edema"]) : 0, 0, 4) as 0 | 1 | 2 | 3 | 4;
  const bleeding = clamp(state.bleedingMl >= 400 || state.drainOutputMl >= 350 ? 3 : state.bleedingMl >= 180 || state.drainOutputMl >= 180 ? 2 : state.bleedingMl > 0 || state.drainOutputMl > 0 ? 1 : 0, 0, 3) as 0 | 1 | 2 | 3;
  return {
    pallor: overrides?.improvement ? 0 : pallor,
    cyanosis: overrides?.improvement ? 0 : cyanosis,
    mottling: overrides?.improvement ? 0 : (overrides?.mottling ?? mottling),
    diaphoresis: overrides?.improvement ? 0 : (overrides?.diaphoresis ?? diaphoresis),
    flushing: clamp(includesAny(raw, ["hot", "flush"]) || state.vitals.temperatureC >= 38.5 ? (state.vitals.temperatureC >= 39.5 ? 2 : 1) : 0, 0, 2) as 0 | 1 | 2,
    jaundice: clamp(includesAny(raw, ["jaundice", "icteric"]) ? 2 : 0, 0, 2) as 0 | 1 | 2,
    edema: overrides?.edema ?? edema,
    bleeding,
    clammy: includesAny(raw, ["clammy", "cool and diaphoretic"]),
  };
}

export function derivePupilVisual(state: PatientState, neurologicRevealed: boolean, overrides?: VisualDebugOverrides): PupilVisualState {
  const raw = (state.pupils ?? "equal, 3 mm, briskly reactive").toLowerCase();
  let leftMm = raw.includes("pinpoint") ? 1 : raw.includes("dilated") ? 6 : 3;
  let rightMm = leftMm;
  if (includesAny(raw, ["unequal", "anisocoria"])) rightMm = Math.min(8, leftMm + 2);
  let leftReactive: PupilVisualState["leftReactive"] = raw.includes("fixed") ? "fixed" : raw.includes("sluggish") ? "sluggish" : "brisk";
  let rightReactive = leftReactive;
  if (overrides?.pupils === "unequal") rightMm = 6;
  if (overrides?.pupils === "pinpoint") leftMm = rightMm = 1;
  if (overrides?.pupils === "dilated") leftMm = rightMm = 7;
  if (overrides?.pupils === "fixed") leftReactive = rightReactive = "fixed";
  return {
    revealed: neurologicRevealed || Boolean(overrides?.pupils),
    leftMm,
    rightMm,
    leftReactive,
    rightReactive,
    gaze: raw.includes("left gaze") ? "left" : raw.includes("right gaze") ? "right" : "center",
    description: state.pupils ?? "Pupil detail is not documented in the current state.",
  };
}

export function derivePositionVisual(state: PatientState, scenario: ClinicalScenario, overrides?: VisualDebugOverrides): PositionVisualState {
  let kind = overrides?.position ?? state.position ?? "semi-fowler";
  let headOfBedDegrees = Number(state.headOfBedDegrees ?? 30);
  if (flag(state, "upright")) {
    kind = "high-fowler";
    headOfBedDegrees = 75;
  }
  if (overrides?.position) {
    const defaultAngles: Partial<Record<PatientPosition, number>> = { supine: 0, "semi-fowler": 30, fowler: 50, "high-fowler": 75, trendelenburg: -12, "reverse-trendelenburg": 15, tripod: 85, "sitting-edge": 90 };
    headOfBedDegrees = defaultAngles[overrides.position] ?? headOfBedDegrees;
  }
  const ambulatory = scenario.unit === "psychiatric" && (state.agitation >= 4 || state.behavior.toLowerCase().includes("pacing"));
  return {
    kind,
    headOfBedDegrees: clamp(headOfBedDegrees, -15, 90),
    lateralDirection: kind === "left-lateral" ? "left" : kind === "right-lateral" ? "right" : "none",
    ambulatory,
  };
}

function actionMinute(state: PatientState, actionId: string) {
  for (let index = state.actionLog.length - 1; index >= 0; index -= 1) {
    if (state.actionLog[index].actionId === actionId) return state.actionLog[index].virtualMinute;
  }
  return null;
}

export function deriveVisualDevices(scenario: ClinicalScenario, state: PatientState, revealed: PatientVisualState["revealed"], overrides?: VisualDebugOverrides): VisualDeviceState {
  const deviceEntries = Object.entries(state.devices);
  const deviceText = [...scenario.chart.linesDevices, ...deviceEntries.flatMap(([key, detail]) => [key, detail])].join(" ").toLowerCase();
  let oxygen = overrides?.oxygenDevice ?? normalizeOxygenDevice(state.oxygenDevice);
  const artificialAirwayInState = includesAny(deviceText, ["endotracheal", "ett", "tracheostomy", "trach"]);
  const mechanicalVentilation = overrides?.ventilator ?? (oxygen === "mechanical-ventilation" || Object.keys(state.ventilator).length > 0);
  if (overrides?.ventilator === true) oxygen = "mechanical-ventilation";
  if (overrides?.ventilator === false && oxygen === "mechanical-ventilation") oxygen = "room-air";
  const previewOxygenFlow: Record<OxygenDeviceVisual, string> = {
    "room-air": "none",
    "nasal-cannula": "2 L/min",
    "high-flow-nasal-cannula": "40 L/min",
    "simple-mask": "6 L/min",
    "venturi-mask": "28% FiO2",
    "non-rebreather": "15 L/min",
    cpap: "40% FiO2",
    bipap: "40% FiO2",
    "bag-mask": "15 L/min",
    "tracheostomy-collar": "40% FiO2",
    "t-piece": "40% FiO2",
    "mechanical-ventilation": "40% FiO2",
  };
  const oxygenOverridden = overrides?.oxygenDevice !== undefined || overrides?.ventilator !== undefined;
  const oxygenFlow = oxygenOverridden ? previewOxygenFlow[oxygen] : state.oxygenFlow;
  const ventilatorValue = (key: string, fallback: string) => String(state.ventilator[key] ?? fallback);
  const ivEntries = deviceEntries.filter(([key, detail]) => /iv|picc|central|midline|port|intraosseous/i.test(`${key} ${detail}`));
  let ivSites = ivEntries.map(([key, detail], index) => ({
    id: key,
    side: index % 2 === 0 ? "left" as const : "right" as const,
    site: /central|neck/i.test(`${key} ${detail}`) ? "neck" as const : /upper/i.test(`${key} ${detail}`) ? "upper-arm" as const : index % 2 === 0 ? "forearm" as const : "hand" as const,
    status: detail,
  }));
  if (overrides?.ivSites === "none") ivSites = [];
  if (overrides?.ivSites === "single") ivSites = [{ id: "preview-iv", side: "left", site: "forearm", status: "patent" }];
  if (overrides?.ivSites === "dual") ivSites = [{ id: "preview-iv-left", side: "left", site: "forearm", status: "patent" }, { id: "preview-iv-right", side: "right", site: "hand", status: "patent" }];
  if (overrides?.ivSites === "central") ivSites = [{ id: "preview-central", side: "right", site: "neck", status: "patent central venous catheter" }];

  const pumps: PumpChannelVisual[] = [];
  if (flag(state, "vasopressorRunning") || Number(state.infusionRates.norepinephrineMcgKgMin ?? 0) > 0) {
    pumps.push({ id: "norepinephrine", label: "Norepinephrine", state: "running", rate: `${Number(state.infusionRates.norepinephrineMcgKgMin ?? 0).toFixed(2)} mcg/kg/min`, tone: "vasopressor" });
  }
  if (flag(state, "antibioticsGiven")) {
    const minute = actionMinute(state, "give-antibiotics");
    pumps.push({ id: "antibiotic", label: "Empiric antibiotic", state: minute != null && state.virtualMinute - minute >= 8 ? "complete" : "running", rate: "pharmacy programmed", tone: "antibiotic" });
  }
  if (state.completedActionIds.includes("fluid-bolus") || state.completedActionIds.includes("ordered-fluid")) {
    pumps.push({ id: "crystalloid", label: "Balanced crystalloid", state: "complete", rate: "bolus complete", tone: "fluid" });
  }

  const foleyEntry = deviceEntries.find(([key, detail]) => /foley|urinary|uro|catheter/i.test(`${key} ${detail}`));
  const urinaryVisible = Boolean(foleyEntry) || /foley|urinary catheter|urometer/.test(deviceText);
  const urineText = foleyEntry?.[1]?.toLowerCase() ?? "";
  const urineColor: VisualDeviceState["urinaryDrainage"]["color"] = urineText.includes("blood") || urineText.includes("red")
    ? "red"
    : urineText.includes("dark") || state.urineOutputMlHr < 15
      ? "dark"
      : urineText.includes("amber")
        ? "amber"
        : "straw";

  const drainEntry = deviceEntries.find(([key, detail]) => /drain|jp|chest.?tube|pigtail/i.test(`${key} ${detail}`));
  let drainVisible = Boolean(drainEntry) || /drain|chest tube|pigtail/.test(deviceText);
  let drainKind: VisualDeviceState["drain"]["kind"] = /chest.?tube/i.test(`${drainEntry?.[0] ?? ""} ${drainEntry?.[1] ?? ""}`) ? "chest-tube" : /pigtail/i.test(`${drainEntry?.[0] ?? ""} ${drainEntry?.[1] ?? ""}`) ? "pigtail" : /jp/i.test(`${drainEntry?.[0] ?? ""} ${drainEntry?.[1] ?? ""}`) ? "jp" : "surgical";
  if (overrides?.drain === "none") drainVisible = false;
  if (overrides?.drain === "jp") { drainVisible = true; drainKind = "jp"; }
  if (overrides?.drain === "chest-tube") { drainVisible = true; drainKind = "chest-tube"; }

  const pads = overrides?.defibrillationPads ?? (flag(state, "defibrillationPadsApplied") ? "anterior-lateral" : "none");
  const arterialDetail = deviceEntries.find(([key]) => /arterial|a.?line/i.test(key))?.[1]?.toLowerCase() ?? "";
  const arterialLine = includesAny(arterialDetail, ["patent", "transduced", "connected", "waveform"]) && !includesAny(arterialDetail, ["setup", "prepared", "pending"]);

  return {
    oxygen,
    oxygenLabel: oxygenOverridden ? oxygen.replaceAll("-", " ") : state.oxygenDevice,
    oxygenFlow,
    mechanicalVentilation,
    artificialAirway: artificialAirwayInState || mechanicalVentilation,
    ventilator: {
      mode: ventilatorValue("mode", "AC/VC"),
      setRate: ventilatorValue("setRate", String(Math.max(12, state.vitals.respiratoryRate))),
      fio2: ventilatorValue("fio2", mechanicalVentilation ? "40%" : state.oxygenFlow || "40%"),
      peep: ventilatorValue("peep", "5"),
      synchrony: String(state.ventilator.synchrony ?? state.respiratoryEffort).toLowerCase().includes("dys") ? "dyssynchronous" : "synchronous",
      alarm: typeof state.ventilator.alarm === "string" && state.ventilator.alarm ? state.ventilator.alarm : null,
    },
    ecgLeads: overrides?.ecgLeads ?? (["telemetry", "step-down", "intensive-care", "procedural"].includes(scenario.unit) || /telemetry|ecg|cardiac monitor|continuous monitor/.test(deviceText)),
    arterialLine,
    defibrillationPads: pads,
    defibrillatorVisible: pads !== "none" || flag(state, "criticalDeterioration") || scenario.unit === "telemetry",
    ivSites,
    pumps,
    urinaryDrainage: {
      visible: urinaryVisible,
      outputMlHr: state.urineOutputMlHr,
      fillRatio: clamp(state.urineOutputMlHr / 80, 0.05, 1),
      color: urineColor,
      detailRevealed: revealed.output,
    },
    drain: {
      visible: drainVisible,
      kind: drainKind,
      outputMl: state.drainOutputMl,
      color: state.drainOutputMl >= 150 || state.bleedingMl >= 150 ? "sanguineous" : state.drainOutputMl > 0 ? "serosanguineous" : "serous",
      detailRevealed: revealed.drain,
    },
    chestTube: drainVisible && drainKind === "chest-tube",
    suction: /suction/.test(deviceText) || scenario.unit === "procedural",
  };
}

export function detectVisualContradictions(state: PatientState, visual: Omit<PatientVisualState, "warnings" | "accessibleDescription">, overrides?: VisualDebugOverrides): SceneWarning[] {
  const warnings: SceneWarning[] = [];
  const flow = numericFlow(state.oxygenFlow);
  if (visual.devices.oxygen === "room-air" && flow != null && flow > 0) warnings.push({ code: "ROOM_AIR_WITH_FLOW", severity: "error", message: "Patient is rendered on room air while the engine reports oxygen flow." });
  if (visual.devices.oxygen === "high-flow-nasal-cannula" && flow != null && flow < 15) warnings.push({ code: "HFNC_LOW_FLOW", severity: "warning", message: "High-flow nasal cannula is paired with a flow that resembles standard cannula support." });
  if (visual.devices.oxygen === "non-rebreather" && flow != null && flow < 10) warnings.push({ code: "NRB_LOW_FLOW", severity: "warning", message: "Non-rebreather flow may be too low to maintain an inflated reservoir in this visual state." });
  if (visual.devices.mechanicalVentilation && !visual.devices.artificialAirway) warnings.push({ code: "VENT_WITHOUT_AIRWAY", severity: "error", message: "Mechanical ventilation is visible without an artificial airway." });
  if (state.vitals.respiratoryRate === 0 && visual.respiration.pattern !== "apnea" && !visual.devices.mechanicalVentilation) warnings.push({ code: "CHEST_MOVEMENT_DURING_APNEA", severity: "error", message: "Spontaneous chest movement conflicts with an engine respiratory rate of zero." });
  if (visual.devices.arterialLine && !Object.entries(state.devices).some(([key, detail]) => /arterial|a.?line/i.test(`${key} ${detail}`))) warnings.push({ code: "ARTERIAL_LINE_WITHOUT_STATE", severity: "error", message: "Arterial pressure equipment is visible without a matching engine device." });
  if (visual.devices.urinaryDrainage.visible && !Object.entries(state.devices).some(([key, detail]) => /foley|urinary|uro|catheter/i.test(`${key} ${detail}`))) warnings.push({ code: "URINARY_BAG_WITHOUT_DEVICE", severity: "warning", message: "Urinary drainage is visible without a matching current device entry." });
  if (overrides && Object.keys(overrides).length > 0) warnings.push({ code: "DEVELOPER_VISUAL_OVERRIDE", severity: "info", message: "Protected developer preview overrides are active; student mode remains engine-driven." });
  return warnings;
}

function expressionFor(state: PatientState, respiration: RespiratoryVisualState, consciousness: ConsciousnessVisualState): PatientVisualState["expression"] {
  if (consciousness.level === "unresponsive") return "unresponsive";
  if (consciousness.level === "sedated" || consciousness.level === "obtunded") return "sedated";
  if (respiration.distressedExpression) return "dyspnea";
  if (consciousness.level === "agitated") return "agitated";
  if (consciousness.level === "confused") return "confused";
  if (state.vitals.pain >= 6) return "pain";
  if (consciousness.level === "drowsy" || consciousness.level === "somnolent") return "fatigued";
  if (consciousness.level === "anxious" || state.anxiety >= 6) return "anxious";
  return "neutral";
}

function roomLightingFor(scenario: ClinicalScenario, state: PatientState): PatientVisualState["roomLighting"] {
  if (flag(state, "criticalDeterioration") || state.vitals.map < 45 || state.vitals.spo2 < 80) return "emergency";
  if (scenario.unit === "procedural") return "procedure";
  if (scenario.unit === "psychiatric") return "calming";
  return scenario.prebrief.shift.toLowerCase().includes("night") ? "night" : "day";
}

function buildAccessibleDescription(visual: Omit<PatientVisualState, "warnings" | "accessibleDescription">) {
  const oxygenLabel = visual.devices.oxygen.replaceAll("-", " ");
  const observations = [
    `The patient is ${visual.consciousness.level} in ${visual.position.kind.replaceAll("-", " ")} position with the head of bed at ${Math.round(visual.position.headOfBedDegrees)} degrees.`,
    visual.respiration.pattern === "apnea"
      ? "No spontaneous chest movement is visible."
      : `Breathing is ${visual.respiration.pattern} at ${visual.respiration.rate} breaths per minute with ${visual.respiration.work} work of breathing.`,
    visual.devices.oxygen === "room-air"
      ? "No oxygen delivery device is present."
      : `${oxygenLabel.charAt(0).toUpperCase()}${oxygenLabel.slice(1)} is in place at ${visual.devices.oxygenFlow}.`,
  ];
  if (visual.skin.pallor > 0) observations.push("Visible skin and mucosal regions appear pale relative to baseline tone.");
  if (visual.skin.mottling > 0) observations.push("Visible distal perfusion change and mottling are present.");
  if (visual.skin.diaphoresis > 0) observations.push("Moisture is visible at the forehead and hairline.");
  if (visual.skin.cyanosis > 0) observations.push("Lips and nail beds show a visible oxygenation-related color change.");
  if (visual.devices.pumps.length > 0) observations.push(`${visual.devices.pumps.length} infusion channel${visual.devices.pumps.length === 1 ? " is" : "s are"} present.`);
  if (visual.devices.urinaryDrainage.visible) observations.push(visual.revealed.output ? `Urinary drainage is visible with current output ${visual.devices.urinaryDrainage.outputMlHr} milliliters per hour.` : "A urinary drainage system is present; inspect it to reveal output detail.");
  if (visual.devices.drain.visible) observations.push(visual.revealed.drain ? `${visual.devices.drain.kind.replaceAll("-", " ")} drainage is visible with ${visual.devices.drain.outputMl} milliliters recorded.` : "A surgical drainage system is present; inspect it to reveal output detail.");
  return observations.join(" ");
}

export function derivePatientVisualState(scenario: ClinicalScenario, state: PatientState, overrides?: VisualDebugOverrides, quality: SceneQuality = "full"): PatientVisualState {
  const revealed = {
    respiratory: hasRevealed(state, [/respiratory/i, /airway/i]),
    neurologic: hasRevealed(state, [/neuro/i, /mental/i, /pupil/i, /airway-finding/i]),
    perfusion: hasRevealed(state, [/hemodynamic/i, /perfusion/i, /vital/i, /chest-pain/i]),
    iv: hasRevealed(state, [/iv/i, /device/i]),
    output: hasRevealed(state, [/urine/i, /io-/i, /output/i]),
    drain: hasRevealed(state, [/drain/i, /device/i]),
  };
  const profile = derivePatientProfile(scenario, state.seed, overrides);
  const respiration = deriveRespiratoryVisual(state, overrides);
  const consciousness = deriveConsciousnessVisual(state, overrides);
  const skin = deriveSkinVisual(state, overrides);
  const pupils = derivePupilVisual(state, revealed.neurologic, overrides);
  const position = derivePositionVisual(state, scenario, overrides);
  const devices = deriveVisualDevices(scenario, state, revealed, overrides);
  const behavior = state.behavior.toLowerCase();
  const movementIntensity = consciousness.purposefulMovement
    ? clamp(consciousness.level === "agitated" ? 3 : consciousness.level === "restless" ? 2 : 1, 0, 3)
    : 0;
  const base = {
    scenarioId: scenario.id,
    scenarioVersion: scenario.version,
    seed: state.seed,
    source: overrides && Object.keys(overrides).length > 0 ? "developer-preview" as const : "engine" as const,
    profile,
    roomPreset: overrides?.roomPreset ?? scenario.unit,
    roomLighting: roomLightingFor(scenario, state),
    position,
    respiration,
    consciousness,
    skin,
    pupils,
    movement: {
      intensity: movementIntensity as 0 | 1 | 2 | 3,
      tremor: behavior.includes("tremor"),
      shivering: behavior.includes("shiver") || state.vitals.temperatureC < 36,
      seizure: overrides?.seizure ?? includesAny(`${behavior} ${state.activeComplications.join(" ")}`.toLowerCase(), ["seizure", "convulsion"]),
      guarding: behavior.includes("guard") || state.vitals.pain >= 6,
      reachesForLines: includesAny(behavior, ["pulling", "reaching toward", "removing device"]),
    },
    expression: expressionFor(state, respiration, consciousness),
    devices,
    revealed,
    reducedMotion: Boolean(overrides?.reducedMotion),
    quality,
  };
  const warnings = detectVisualContradictions(state, base, overrides);
  return { ...base, accessibleDescription: buildAccessibleDescription(base), warnings };
}
