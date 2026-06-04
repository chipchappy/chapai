import { z } from "zod";

export const questionOptionSchema = z.object({
  id: z.string(),
  text: z.string(),
});

export const questionAnswerSchema = z.union([
  z.string(),
  z.array(z.string()).min(1),
  z.record(z.string(), z.string()),
]);

export const nclexClientNeedSchema = z.enum([
  "management_of_care",
  "safety_infection_control",
  "health_promotion",
  "psychosocial",
  "basic_care_comfort",
  "pharmacological",
  "risk_reduction",
  "physiological_adaptation",
]);

export const cognitiveLevelSchema = z.enum(["apply", "analyze", "synthesize", "evaluate"]);

export const visualRationaleMetricSchema = z.object({
  label: z.string(),
  value: z.string(),
  direction: z.enum(["up", "down", "steady"]).optional(),
  directionLabel: z.string().optional(),
});

export const visualRationaleNodeSchema = z.object({
  label: z.string(),
  value: z.string(),
});

export const visualRationaleSchema = z.object({
  type: z.enum(["trend", "flow", "pathway", "signal", "overview"]),
  accent: z.string().optional(),
  title: z.string(),
  caption: z.string().optional(),
  metrics: z.array(visualRationaleMetricSchema).optional(),
  nodes: z.array(visualRationaleNodeSchema).optional(),
  conclusion: z.string().optional(),
});

export const questionReferenceSchema = z.object({
  title: z.string(),
  citation: z.string().optional(),
  href: z.string().url().optional(),
});

export const questionWaveMetadataSchema = z.object({
  familyKey: z.string().optional(),
  angleSignature: z.string().optional(),
  duplicateFingerprint: z.string().optional(),
  sourceLane: z.string().optional(),
  sourceBatchId: z.string().optional(),
  duplicateRisk: z.boolean().optional(),
  promotionDecision: z.enum(["promote", "hold_duplicate", "hold_review"]).optional(),
}).partial();

export const diagramBlueprintSchema = z.object({
  questionId: z.string(),
  exam: z.enum(["ccrn", "nclex"]),
  category: z.string(),
  type: z.enum(["trend", "flow", "pathway", "signal", "overview"]),
  title: z.string(),
  focus: z.string(),
  takeaway: z.string().optional(),
  rewritePriority: z.number().optional(),
  diagramWorthiness: z.boolean().optional(),
});

export const questionExhibitSchema = z.object({
  type: z.enum(["note", "timeline", "labs", "vitals", "orders", "assessment"]).default("note"),
  title: z.string(),
  body: z.string().optional(),
  items: z.array(z.string()).default([]),
});

export const chartReviewMetricSchema = z.object({
  label: z.string(),
  value: z.string(),
  unit: z.string().optional(),
  flag: z.enum(["low", "normal", "high", "critical"]).optional(),
  detail: z.string().optional(),
});

export const chartReviewSchema = z.object({
  patientTitle: z.string().optional(),
  patientCaption: z.string().optional(),
  chiefComplaint: z.string().optional(),
  history: z.array(z.string()).default([]),
  allergies: z.array(z.string()).default([]),
  medications: z.array(z.string()).default([]),
  hpi: z.array(z.string()).default([]),
  timeline: z.array(z.string()).default([]),
  unfoldingTimeline: z.array(z.string()).default([]),
  vitals: z.array(chartReviewMetricSchema).default([]),
  labs: z.array(chartReviewMetricSchema).default([]),
  orders: z.array(z.string()).default([]),
  providerOrders: z.array(z.string()).default([]),
  orderStatus: z.array(z.object({
    label: z.string(),
    status: z.string(),
    detail: z.string().optional(),
  })).default([]),
  diagnostics: z.array(chartReviewMetricSchema).default([]),
  notes: z.array(z.string()).default([]),
  nursingNotes: z.array(z.string()).default([]),
  assessments: z.array(z.string()).default([]),
  intakeOutput: z.array(z.string()).default([]),
  medicationAdministrationRecord: z.array(z.string()).default([]),
  carePlan: z.array(z.string()).default([]),
  pastQuestionContext: z.array(z.string()).default([]),
  abnormalValues: z.array(chartReviewMetricSchema).default([]),
  priorityCues: z.array(z.string()).default([]),
  diagram: z.object({
    title: z.string().optional(),
    nodes: z.array(visualRationaleNodeSchema).default([]),
  }).optional(),
  tutorPrompts: z.array(z.object({
    label: z.string().optional(),
    value: z.string(),
  })).default([]),
}).partial();

export const canonicalQuestionSchema = z.object({
  id: z.string(),
  exam: z.enum(["ccrn", "nclex"]),
  type: z.enum(["mcq", "sata", "ordering", "matrix", "case_study", "bow_tie"]).default("mcq"),
  nclexClientNeed: nclexClientNeedSchema.optional(),
  cognitiveLevel: cognitiveLevelSchema.optional(),
  category: z.string(),
  subcategory: z.string().optional(),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  stem: z.string(),
  scenarioTitle: z.string().optional(),
  scenario: z.string().optional(),
  additionalInfo: z.string().optional(),
  ngnInteractionType: z.string().optional(),
  interactionType: z.string().optional(),
  caseStudyId: z.string().optional(),
  caseStudyTitle: z.string().optional(),
  caseItemNumber: z.number().int().positive().optional(),
  caseItemTotal: z.number().int().positive().optional(),
  clozeTemplate: z.string().optional(),
  clozeBlankCount: z.number().int().positive().optional(),
  highlightRows: z.array(z.object({
    id: z.string(),
    text: z.string(),
    correct: z.boolean().optional(),
    rationale: z.string().optional(),
  })).optional(),
  bowTie: z.object({
    cause: z.string().optional(),
    actions: z.array(z.string()).optional(),
    outcomes: z.array(z.string()).optional(),
  }).optional(),
  exhibits: z.array(questionExhibitSchema).default([]),
  chartReview: chartReviewSchema.optional(),
  options: z.array(questionOptionSchema).min(2),
  answer: questionAnswerSchema,
  matrixColumns: z.array(z.string()).optional(),
  matrixRows: z.array(z.object({
    label: z.string(),
    answer: z.string(),
  })).optional(),
  rationale: z.string(),
  deepRationale: z.string().optional(),
  distractorRationales: z.record(z.string(), z.string()).optional(),
  tags: z.array(z.string()).default([]),
  blueprintPct: z.number().optional(),
  takeaway: z.string().optional(),
  speedCue: z.string().optional(),
  conceptNotes: z.array(z.string()).default([]),
  references: z.array(questionReferenceSchema).default([]),
  provenance: z.string().optional(),
  reviewStatus: z.enum(["draft", "review", "approved", "flagged", "final-curated-live"]).default("draft"),
  revision: z.number().int().positive().default(1),
  publishState: z.enum(["draft", "published", "unpublished"]).default("draft"),
  sourceStage: z.enum(["draft", "approved", "live"]).default("draft"),
  sourcePath: z.string().optional(),
  waveMetadata: questionWaveMetadataSchema.optional(),
  visualRationale: visualRationaleSchema.optional(),
  diagramBlueprint: diagramBlueprintSchema.optional(),
  coachingFrame: z.array(z.string()).default([]),
  tutorReady: z.boolean().default(false),
});

export const canonicalQuestionBatchSchema = z.object({
  batchId: z.string(),
  generatedAt: z.string(),
  generatedBy: z.object({
    agentId: z.string(),
    runtime: z.string(),
    promptSource: z.string().optional(),
  }),
  examMix: z.record(z.string(), z.number()),
  validation: z.object({
    valid: z.boolean(),
    errors: z.array(z.string()).default([]),
  }),
  questions: z.array(canonicalQuestionSchema),
});

export const nclexFingerprintClusterSchema = z.object({
  duplicateFingerprint: z.string(),
  familyKey: z.string(),
  angleSignature: z.string(),
  count: z.number().int().nonnegative(),
  questionIds: z.array(z.string()).default([]),
  duplicateRisk: z.boolean().default(false),
});

export const nclexBankHealthReportSchema = z.object({
  generatedAt: z.string(),
  exam: z.literal("nclex"),
  sourceFiles: z.object({
    rawLive: z.string(),
    canonicalLive: z.string(),
    reviewReport: z.string().optional(),
    curationReport: z.string().optional(),
    syncReport: z.string().optional(),
  }),
  counts: z.object({
    rawLive: z.number().int().nonnegative(),
    eligibleLive: z.number().int().nonnegative(),
    canonicalLive: z.number().int().nonnegative(),
    duplicateFamiliesCollapsed: z.number().int().nonnegative(),
    duplicateFingerprintsCollapsed: z.number().int().nonnegative(),
    draftLive: z.number().int().nonnegative(),
    promotedCount: z.number().int().nonnegative(),
  }),
  mix: z.object({
    formatMix: z.record(z.string(), z.number()),
    clientNeedMix: z.record(z.string(), z.number()),
    rawCategoryMix: z.record(z.string(), z.number()),
    thinFamilies: z.array(z.object({
      family: z.string(),
      liveCount: z.number().int().nonnegative(),
      missingPreferredTypes: z.array(z.string()),
    })),
  }),
  fingerprints: z.object({
    uniqueCount: z.number().int().nonnegative(),
    collisionCount: z.number().int().nonnegative(),
    collisionRate: z.number().nonnegative(),
    maxClusterSize: z.number().int().nonnegative(),
    clusters: z.array(nclexFingerprintClusterSchema),
  }),
  rollout: z.object({
    targetCount: z.number().int().positive(),
    remainingToTarget: z.number().int().nonnegative(),
    progressPct: z.number().nonnegative(),
    waveTargets: z.array(z.number().int().positive()),
  }),
  parity: z.object({
    deployment: z.object({
      status: z.enum(["matched", "mismatch", "unknown"]),
      deployedCount: z.number().int().nonnegative().nullable(),
      canonicalCount: z.number().int().nonnegative(),
      source: z.string().optional(),
    }),
    sync: z.object({
      status: z.enum(["matched", "mismatch", "unknown"]),
      syncedCount: z.number().int().nonnegative().nullable(),
      canonicalCount: z.number().int().nonnegative(),
      source: z.string().optional(),
    }),
  }),
});

export const nclexWavePromotionEntrySchema = z.object({
  id: z.string(),
  exam: z.literal("nclex"),
  category: z.string(),
  subcategory: z.string().optional(),
  type: z.enum(["mcq", "sata", "ordering", "matrix", "case_study", "bow_tie"]),
  nclexClientNeed: z.string().optional(),
  familyKey: z.string(),
  angleSignature: z.string(),
  decisiveCue: z.string(),
  duplicateFingerprint: z.string(),
  sourceBatchId: z.string().optional(),
  sourceLane: z.string().optional(),
  duplicateRisk: z.boolean().default(false),
  promotionDecision: z.enum(["promote", "hold_duplicate", "hold_review"]).default("promote"),
});

export const nclexWavePromotionManifestSchema = z.object({
  generatedAt: z.string(),
  exam: z.literal("nclex"),
  sourceFiles: z.object({
    candidateFile: z.string(),
    canonicalLive: z.string(),
    bankHealth: z.string().optional(),
  }),
  batchId: z.string(),
  sourceLane: z.string().optional(),
  finalGateRule: z.string().optional(),
  bankSnapshot: z.object({
    rawLiveCount: z.number().int().nonnegative(),
    canonicalLiveCount: z.number().int().nonnegative(),
    duplicateFamiliesCollapsed: z.number().int().nonnegative(),
    duplicateFingerprintsCollapsed: z.number().int().nonnegative(),
  }),
  summary: z.object({
    candidateCount: z.number().int().nonnegative(),
    uniqueFingerprintCount: z.number().int().nonnegative(),
    duplicateFingerprintCount: z.number().int().nonnegative(),
    promotableCount: z.number().int().nonnegative(),
    heldDuplicateCount: z.number().int().nonnegative(),
    intraBatchCollisionCount: z.number().int().nonnegative(),
    liveCollisionCount: z.number().int().nonnegative(),
  }),
  clusters: z.array(nclexFingerprintClusterSchema),
  candidates: z.array(nclexWavePromotionEntrySchema),
});

export const nclexRefinementItemSchema = z.object({
  questionId: z.string(),
  status: z.enum(["draft", "needs_review", "refined", "approved", "rejected"]),
  itemType: z.string(),
  nclexClientNeed: z.string(),
  nursingProcess: z.string(),
  clinicalJudgmentArea: z.string(),
  difficulty: z.number().nullable(),
  specialtyTopic: z.string(),
  safetyRiskLevel: z.enum(["standard", "moderate", "high"]),
  scores: z.object({
    qualityScore: z.number(),
    rationaleQualityScore: z.number(),
    citationQualityScore: z.number(),
    duplicateRiskScore: z.number(),
    clinicalAccuracyScore: z.number(),
    realismScore: z.number(),
  }),
  issues: z.array(z.string()).default([]),
  reviewerNotes: z.array(z.string()).default([]),
  source: z.object({
    reviewStatus: z.string(),
    sourceStage: z.string(),
    sourcePath: z.string().nullable(),
    duplicateFingerprint: z.string(),
    angleSignature: z.string(),
  }),
  media: z.object({
    diagramValidationStatus: z.string(),
    hasVisualRationale: z.boolean(),
    hasDiagramBlueprint: z.boolean(),
    hasChartDiagram: z.boolean(),
  }),
  citations: z.object({
    count: z.number().int().nonnegative(),
    status: z.string(),
    issues: z.array(z.string()).default([]),
  }),
  revisionHistory: z.array(z.object({
    at: z.string(),
    action: z.string(),
    by: z.string(),
    notes: z.string(),
  })).default([]),
});

export const nclexRefinementManifestSchema = z.object({
  generatedAt: z.string(),
  exam: z.literal("nclex"),
  sourceFile: z.string(),
  targetApprovedRefinedUnique: z.number().int().positive(),
  summary: z.object({
    sourceCount: z.number().int().nonnegative(),
    uniqueIds: z.number().int().nonnegative(),
    approvedRefinedUsableUnique: z.number().int().nonnegative(),
    needsReview: z.number().int().nonnegative(),
    approved: z.number().int().nonnegative(),
    refined: z.number().int().nonnegative(),
    rejected: z.number().int().nonnegative(),
    topUpNeeded: z.boolean(),
    remainingTo5000: z.number().int().nonnegative(),
  }),
  items: z.array(nclexRefinementItemSchema),
});

export type CanonicalQuestion = z.infer<typeof canonicalQuestionSchema>;
export type CanonicalQuestionBatch = z.infer<typeof canonicalQuestionBatchSchema>;
export type QuestionAnswer = z.infer<typeof questionAnswerSchema>;
export type QuestionWaveMetadata = z.infer<typeof questionWaveMetadataSchema>;
export type NclexFingerprintCluster = z.infer<typeof nclexFingerprintClusterSchema>;
export type NclexBankHealthReport = z.infer<typeof nclexBankHealthReportSchema>;
export type NclexWavePromotionEntry = z.infer<typeof nclexWavePromotionEntrySchema>;
export type NclexWavePromotionManifest = z.infer<typeof nclexWavePromotionManifestSchema>;
export type NclexRefinementItem = z.infer<typeof nclexRefinementItemSchema>;
export type NclexRefinementManifest = z.infer<typeof nclexRefinementManifestSchema>;
