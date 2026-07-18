import { z } from "zod";

export const simulationUnits = [
  "medical-surgical",
  "telemetry",
  "step-down",
  "intensive-care",
  "procedural",
  "psychiatric",
] as const;

export const actionCategories = [
  "chart",
  "assessment",
  "medication",
  "intervention",
  "communication",
  "documentation",
  "safety",
] as const;

export const competencyDomains = [
  "assessment",
  "clinical-recognition",
  "prioritization",
  "safety",
  "medication-administration",
  "intervention",
  "escalation",
  "communication",
  "reassessment",
  "documentation",
  "patient-education",
  "time-management",
] as const;

export const actionClassifications = [
  "essential",
  "high_priority",
  "appropriate",
  "acceptable_alternative",
  "unnecessary_but_harmless",
  "low_value",
  "incomplete",
  "premature",
  "delayed",
  "unsafe",
  "critical_error",
] as const;

export const patientPositions = [
  "supine",
  "semi-fowler",
  "fowler",
  "high-fowler",
  "trendelenburg",
  "reverse-trendelenburg",
  "left-lateral",
  "right-lateral",
  "recovery",
  "prone",
  "tripod",
  "sitting-edge",
] as const;

const evidenceSchema = z.object({
  id: z.string().min(2),
  title: z.string().min(8),
  organization: z.string().min(2),
  publicationDate: z.string().min(4),
  url: z.string().url(),
  guidelineVersion: z.string().min(2),
  applicableRecommendation: z.string().min(12),
  reviewedAt: z.string().min(10),
  reviewerStatus: z.enum(["needs-clinical-review", "clinician-reviewed", "approved"]),
});

const vitalSignsSchema = z.object({
  heartRate: z.number().min(0).max(300),
  systolic: z.number().min(0).max(300),
  diastolic: z.number().min(0).max(200),
  map: z.number().min(0).max(220),
  respiratoryRate: z.number().min(0).max(80),
  spo2: z.number().min(0).max(100),
  temperatureC: z.number().min(25).max(45),
  pain: z.number().min(0).max(10),
});

const initialStateSchema = z.object({
  vitals: vitalSignsSchema,
  levelOfConsciousness: z.string(),
  orientation: z.string(),
  gcs: z.number().min(3).max(15).optional(),
  sedationScore: z.number().min(-5).max(4).optional(),
  pupils: z.string().optional(),
  bloodGlucose: z.number().min(0).optional(),
  urineOutputMlHr: z.number().min(0),
  fluidBalanceMl: z.number(),
  respiratoryEffort: z.string(),
  breathSounds: z.string(),
  oxygenDevice: z.string(),
  oxygenFlow: z.string(),
  position: z.enum(patientPositions).default("semi-fowler"),
  headOfBedDegrees: z.number().min(-15).max(90).default(30),
  ventilator: z.record(z.union([z.string(), z.number(), z.boolean()])).default({}),
  cardiacRhythm: z.string(),
  perfusion: z.string(),
  pulses: z.string().default("Palpable and symmetric"),
  edema: z.string().default("No edema documented"),
  capillaryRefill: z.string().default("Less than 3 seconds"),
  skin: z.string(),
  neurologicDeficits: z.string().default("No focal deficit documented"),
  gastrointestinal: z.string().default("No acute finding documented"),
  behavior: z.string(),
  anxiety: z.number().min(0).max(10),
  agitation: z.number().min(0).max(10),
  hallucinations: z.string().default("None reported or observed"),
  withdrawalSymptoms: z.string().default("None observed"),
  bleedingMl: z.number().min(0),
  drainOutputMl: z.number().min(0),
  ivPatency: z.string().default("Patent without complication"),
  infusionRates: z.record(z.union([z.string(), z.number()])).default({}),
  activeComplications: z.array(z.string()).default([]),
  timeSinceLastReassessment: z.number().int().nonnegative().default(0),
  labs: z.record(z.union([z.string(), z.number()])),
  devices: z.record(z.string()),
  flags: z.record(z.union([z.string(), z.number(), z.boolean()])),
});

const effectSchema = z.object({
  path: z.string().min(1),
  operation: z.enum(["set", "add", "push"]),
  value: z.unknown(),
});

const predicateSchema = z.object({
  path: z.string().min(1),
  operator: z.enum(["eq", "ne", "lt", "lte", "gt", "gte", "includes"]),
  value: z.unknown(),
});

const conditionSchema = z.object({
  all: z.array(predicateSchema).default([]),
  completedAll: z.array(z.string()).default([]),
  completedAny: z.array(z.string()).default([]),
  notCompleted: z.array(z.string()).default([]),
});

const scoreSchema = z.object({
  domain: z.enum(competencyDomains),
  points: z.number().positive().max(20),
});

const medicationSchema = z.object({
  genericName: z.string(),
  brandName: z.string().optional(),
  indication: z.string(),
  orderedDose: z.string(),
  availableConcentration: z.string().optional(),
  route: z.string(),
  frequency: z.string(),
  parameters: z.array(z.string()).default([]),
  holdParameters: z.array(z.string()).default([]),
  requiredAssessment: z.array(z.string()).default([]),
  requiredLabs: z.array(z.string()).default([]),
  highAlert: z.boolean().default(false),
  independentDoubleCheck: z.boolean().default(false),
  compatibility: z.array(z.string()).default([]),
  titrationRange: z.string().optional(),
  maximumRate: z.string().optional(),
  onsetMinutes: z.number().int().nonnegative().default(0),
  peakMinutes: z.number().int().positive().optional(),
  durationMinutes: z.number().int().positive().optional(),
  reassessmentMinutes: z.number().int().positive().optional(),
  expectedEffect: z.string().optional(),
  adverseEffects: z.array(z.string()).default([]),
});

const actionSchema = z.object({
  id: z.string().min(2),
  label: z.string().min(3),
  category: z.enum(actionCategories),
  description: z.string().min(8),
  baseClassification: z.enum(actionClassifications),
  rationale: z.string().min(16),
  evidenceIds: z.array(z.string()).min(1),
  prerequisites: z.array(z.string()).default([]),
  safetyChecks: z.array(z.string()).default([]),
  optimalByMinute: z.number().int().nonnegative().optional(),
  lateAfterMinute: z.number().int().nonnegative().optional(),
  effects: z.array(effectSchema).default([]),
  delayedEffects: z.array(z.object({ delayMinutes: z.number().int().positive(), effects: z.array(effectSchema).min(1), feedback: z.string() })).default([]),
  revealFindings: z.array(z.string()).default([]),
  feedback: z.string().min(4),
  score: z.array(scoreSchema).default([]),
  repeatable: z.boolean().default(false),
  criticalError: z.string().optional(),
  medication: medicationSchema.optional(),
  communication: z.object({
    prompt: z.string(),
    elements: z.array(z.object({ id: z.string(), label: z.string() })).min(2),
    requiredElementIds: z.array(z.string()).min(1),
    responses: z.array(z.object({
      condition: conditionSchema.optional(),
      message: z.string().min(12),
      effects: z.array(effectSchema).default([]),
      delayMinutes: z.number().int().nonnegative().default(0),
    })).default([]),
  }).optional(),
  documentation: z.object({
    prompt: z.string(),
    fields: z.array(z.object({ id: z.string(), label: z.string() })).min(2),
    requiredFieldIds: z.array(z.string()).min(1),
  }).optional(),
});

const eventSchema = z.object({
  id: z.string().min(2),
  atMinute: z.number().int().nonnegative(),
  condition: conditionSchema.optional(),
  effects: z.array(effectSchema).min(1),
  feedback: z.string().min(8),
  severity: z.enum(["info", "warning", "critical"]),
});

export const clinicalScenarioSchema = z.object({
  id: z.string().min(3),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(8),
  unit: z.enum(simulationUnits),
  specialty: z.string().min(3),
  difficulty: z.enum(["novice", "intermediate", "advanced"]),
  estimatedMinutes: z.number().int().min(10).max(120),
  version: z.string().min(1),
  status: z.enum(["draft", "clinical-review", "published"]),
  guidelineReviewDate: z.string().min(10),
  clinicalReviewerStatus: z.enum(["needs-review", "reviewed", "approved"]),
  learningObjectives: z.array(z.string()).min(3),
  prerequisiteKnowledge: z.array(z.string()).min(1),
  prebrief: z.object({
    shift: z.string(),
    role: z.string(),
    resources: z.array(z.string()).min(2),
    handoff: z.string().min(30),
    safetyNote: z.string().min(20),
  }),
  patient: z.object({
    name: z.string(),
    age: z.number().int().min(18).max(110),
    sex: z.string(),
    pronouns: z.string(),
    room: z.string(),
    presentingProblem: z.string(),
    history: z.array(z.string()),
    surgicalHistory: z.array(z.string()).default([]),
    psychiatricHistory: z.array(z.string()).default([]),
    medicationHistory: z.array(z.string()).default([]),
    allergies: z.array(z.string()),
    socialHistory: z.array(z.string()).default([]),
    substanceUseHistory: z.array(z.string()).default([]),
    baselineFunction: z.string(),
    codeStatus: z.string(),
    isolation: z.string(),
    risks: z.object({ fall: z.string(), suicide: z.string(), elopement: z.string(), skin: z.string() }),
  }),
  chart: z.object({
    orders: z.array(z.string()),
    prnOrders: z.array(z.string()).default([]),
    homeMedications: z.array(z.string()).default([]),
    activeMedications: z.array(z.string()).default([]),
    linesDevices: z.array(z.string()).default([]),
    labs: z.array(z.object({
      name: z.string(),
      value: z.string(),
      stateKey: z.string().optional(),
      unit: z.string().optional(),
      flag: z.enum(["normal", "high", "low", "critical"]),
      availableAtMinute: z.number().int().nonnegative().default(0),
    })),
    diagnostics: z.array(z.object({ name: z.string(), result: z.string(), availableAtMinute: z.number().int().nonnegative().default(0) })),
  }),
  initialState: initialStateSchema,
  randomization: z.array(z.object({ path: z.string(), minDelta: z.number(), maxDelta: z.number(), integer: z.boolean().default(true) })).default([]),
  assessments: z.array(z.object({ id: z.string(), category: z.string(), label: z.string(), finding: z.string() })).min(3),
  actions: z.array(actionSchema).min(6),
  events: z.array(eventSchema).min(2),
  completion: z.object({
    minimumActions: z.number().int().min(1),
    requiredActionIds: z.array(z.string()).min(2),
    maximumVirtualMinutes: z.number().int().positive(),
    failureConditions: z.array(z.object({
      id: z.string().min(2),
      label: z.string().min(6),
      rationale: z.string().min(16),
      condition: conditionSchema,
    })).default([]),
  }),
  debrief: z.object({
    overview: z.string().min(20),
    untreatedTrajectory: z.string().min(20),
    keyPrinciples: z.array(z.string()).min(3),
  }),
  evidence: z.array(evidenceSchema).min(1),
});

export type ClinicalScenario = z.infer<typeof clinicalScenarioSchema>;
export type ClinicalScenarioInput = z.input<typeof clinicalScenarioSchema>;
export type ScenarioAction = ClinicalScenario["actions"][number];
export type ScenarioEffect = ScenarioAction["effects"][number];
export type ScenarioCondition = NonNullable<ClinicalScenario["events"][number]["condition"]>;
export type ActionCategory = (typeof actionCategories)[number];
export type CompetencyDomain = (typeof competencyDomains)[number];
export type ActionClassification = (typeof actionClassifications)[number];
export type PatientPosition = (typeof patientPositions)[number];

export type ScenarioValidationIssue = { path: string; message: string };

export function validateScenarioDefinition(input: unknown) {
  const parsed = clinicalScenarioSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      issues: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
    };
  }

  const scenario = parsed.data;
  const issues: ScenarioValidationIssue[] = [];
  const actionIds = new Set<string>();
  const assessmentIds = new Set<string>();
  const eventIds = new Set<string>();
  const evidenceIds = new Set(scenario.evidence.map((source) => source.id));
  for (const assessment of scenario.assessments) {
    if (assessmentIds.has(assessment.id)) issues.push({ path: `assessments.${assessment.id}`, message: "Duplicate assessment id." });
    assessmentIds.add(assessment.id);
  }
  for (const action of scenario.actions) {
    if (actionIds.has(action.id)) issues.push({ path: `actions.${action.id}`, message: "Duplicate action id." });
    actionIds.add(action.id);
    if (action.effects.length === 0 && action.delayedEffects.length === 0 && action.revealFindings.length === 0 && !action.communication && !action.documentation) {
      issues.push({ path: `actions.${action.id}`, message: "Action has no patient, finding, communication, or documentation consequence." });
    }
    if ((action.baseClassification === "essential" || action.baseClassification === "high_priority") && action.score.length === 0) {
      issues.push({ path: `actions.${action.id}.score`, message: "Critical action needs an explicit scoring rule." });
    }
    for (const evidenceId of action.evidenceIds) {
      if (!evidenceIds.has(evidenceId)) issues.push({ path: `actions.${action.id}.evidenceIds`, message: `Unknown evidence id ${evidenceId}.` });
    }
    for (const findingId of action.revealFindings) {
      if (!assessmentIds.has(findingId)) issues.push({ path: `actions.${action.id}.revealFindings`, message: `Unknown assessment finding ${findingId}.` });
    }
    if (action.medication?.reassessmentMinutes && !scenario.actions.some((candidate) => candidate.category === "assessment" && candidate.repeatable)) {
      issues.push({ path: `actions.${action.id}.medication.reassessmentMinutes`, message: "Medication requires reassessment but the scenario has no repeatable assessment action." });
    }
  }

  for (const action of scenario.actions) {
    for (const reference of [...action.prerequisites, ...action.safetyChecks]) {
      if (!actionIds.has(reference)) issues.push({ path: `actions.${action.id}`, message: `Broken action reference ${reference}.` });
    }
  }
  for (const event of scenario.events) {
    if (eventIds.has(event.id)) issues.push({ path: `events.${event.id}`, message: "Duplicate event id." });
    eventIds.add(event.id);
    if (event.atMinute > scenario.completion.maximumVirtualMinutes) {
      issues.push({ path: `events.${event.id}`, message: "Event is unreachable before the scenario deadline." });
    }
    for (const reference of [
      ...(event.condition?.completedAll ?? []),
      ...(event.condition?.completedAny ?? []),
      ...(event.condition?.notCompleted ?? []),
    ]) {
      if (!actionIds.has(reference)) issues.push({ path: `events.${event.id}`, message: `Broken action reference ${reference}.` });
    }
  }
  for (const required of scenario.completion.requiredActionIds) {
    if (!actionIds.has(required)) issues.push({ path: "completion.requiredActionIds", message: `Unknown required action ${required}.` });
  }
  const failureIds = new Set<string>();
  for (const failure of scenario.completion.failureConditions) {
    if (failureIds.has(failure.id)) issues.push({ path: `completion.failureConditions.${failure.id}`, message: "Duplicate failure condition id." });
    failureIds.add(failure.id);
    for (const reference of [...failure.condition.completedAll, ...failure.condition.completedAny, ...failure.condition.notCompleted]) {
      if (!actionIds.has(reference)) issues.push({ path: `completion.failureConditions.${failure.id}`, message: `Broken action reference ${reference}.` });
    }
  }

  return issues.length > 0 ? { success: false as const, issues } : { success: true as const, data: scenario, issues: [] };
}

export function assertValidScenario(input: unknown) {
  const result = validateScenarioDefinition(input);
  if (!result.success) {
    throw new Error(`Invalid clinical simulation scenario:\n${result.issues.map((issue) => `${issue.path}: ${issue.message}`).join("\n")}`);
  }
  return result.data;
}
