// ─── Core Domain Types ────────────────────────────────────────────────────────

export type Exam = "nclex" | "ccrn";
export type Tier = "free" | "plus" | "pro";
export type QuestionType =
  | "mcq"
  | "sata"
  | "ordering"
  | "matrix"
  | "case_study"
  | "bow_tie";
export type CjmmStep =
  | "recognize-cues"
  | "analyze-cues"
  | "prioritize-hypotheses"
  | "generate-solutions"
  | "take-actions"
  | "evaluate-outcomes";
export type QuestionAnswer = string | string[] | Record<string, string | string[]>;
export type CognitiveLevel = "apply" | "analyze" | "synthesize" | "evaluate";
export type NclexClientNeed =
  | "management_of_care"
  | "safety_infection_control"
  | "health_promotion"
  | "psychosocial"
  | "basic_care_comfort"
  | "pharmacological"
  | "risk_reduction"
  | "physiological_adaptation";

// CCRN Blueprint categories (% of exam)
export const CCRN_CATEGORIES = {
  cardiovascular:      { label: "Cardiovascular",            pct: 13 },
  respiratory:         { label: "Respiratory",               pct: 12 },
  multisystem:         { label: "Multisystem",               pct: 16 },
  neurological:        { label: "Neurological",              pct: 18 },
  endocrine_hema_gi:   { label: "Endocrine/Hematology/GI",  pct: 21 },
  professional_caring: { label: "Professional Caring & Ethics", pct: 20 },
} as const;

// NCLEX Test Plan categories (% of exam)
export const NCLEX_CATEGORIES = {
  management_of_care:         { label: "Management of Care",             pct: 18 },
  safety_infection_control:   { label: "Safety & Infection Control",     pct: 13 },
  pharmacological:            { label: "Pharmacological & Parenteral",   pct: 16 },
  reduction_of_risk:          { label: "Reduction of Risk Potential",    pct: 12 },
  physiological_adaptation:   { label: "Physiological Adaptation",       pct: 14 },
  basic_care_comfort:         { label: "Basic Care & Comfort",           pct:  9 },
  psychosocial:               { label: "Psychosocial Integrity",         pct:  9 },
  health_promotion:           { label: "Health Promotion & Maintenance", pct:  9 },
} as const;

export type CcrnCategory = keyof typeof CCRN_CATEGORIES;
export type NclexCategory = keyof typeof NCLEX_CATEGORIES;

// ─── Question Types ───────────────────────────────────────────────────────────

export interface QuestionOption {
  id: string;   // "a" | "b" | "c" | "d"
  text: string;
}

export interface BowTieCell {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface BowTieQuestion {
  center: BowTieCell;
  leftActions: BowTieCell[];
  rightMonitoring: BowTieCell[];
}

export interface StructuredRationaleCitation {
  source: string;
  chapter?: string;
  page?: string;
  href?: string;
  note?: string;
}

export interface StructuredRationale {
  overview: string;
  mechanism: string;
  whyCorrect: string;
  whyWrong: Record<string, string>;
  citations: StructuredRationaleCitation[];
}

export interface QuizQuestion {
  id: string;
  exam: Exam;
  type: QuestionType;
  nclexClientNeed?: NclexClientNeed;
  cognitiveLevel?: CognitiveLevel;
  category: string;
  subcategory?: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  stem: string;
  caseStudyId?: string;
  cjmmStep?: CjmmStep;
  scenarioTitle?: string;
  scenario?: string;
  additionalInfo?: string;
  exhibits?: Array<{
    type: "note" | "timeline" | "labs" | "vitals" | "orders" | "assessment";
    title: string;
    body?: string;
    items?: string[];
  }>;
  chartReview?: {
    patientTitle?: string;
    patientCaption?: string;
    hpi?: string[];
    timeline?: string[];
    labs?: Array<{
      label: string;
      value: string;
      unit?: string;
      flag?: "low" | "normal" | "high" | "critical";
      detail?: string;
    }>;
    orders?: string[];
    diagnostics?: Array<{
      label: string;
      value: string;
      unit?: string;
      flag?: "low" | "normal" | "high" | "critical";
      detail?: string;
    }>;
    notes?: string[];
    priorityCues?: string[];
    diagram?: {
      title?: string;
      nodes?: Array<{ label: string; value: string }>;
    };
    tutorPrompts?: Array<{ label?: string; value: string }>;
  };
  options: QuestionOption[];
  answer: QuestionAnswer;
  matrixColumns?: string[];
  matrixRows?: Array<{
    label: string;
    answer: string;
  }>;
  bowTie?: BowTieQuestion;
  rationale: string;
  structuredRationale?: StructuredRationale;
  deepRationale?: string;
  distractorRationales?: Record<string, string>;
  tags?: string[];
  blueprintPct?: number;
  takeaway?: string;
  speedCue?: string;
  conceptNotes?: string[];
  references?: Array<{
    title: string;
    citation?: string;
    href?: string;
  }>;
  provenance?: string;
  reviewStatus?: "draft" | "review" | "approved" | "flagged" | "final-curated-live";
  revision?: number;
  publishState?: "draft" | "published" | "unpublished";
  visualRationale?: {
    type: "trend" | "flow" | "pathway" | "signal" | "overview";
    accent?: string;
    title: string;
    caption?: string;
    metrics?: Array<{
      label: string;
      value: string;
      direction?: "up" | "down" | "steady";
      directionLabel?: string;
    }>;
    nodes?: Array<{ label: string; value: string }>;
    conclusion?: string;
  };
  diagramBlueprint?: {
    questionId: string;
    exam: Exam;
    category: string;
    type: "trend" | "flow" | "pathway" | "signal" | "overview";
    title: string;
    focus: string;
    takeaway?: string;
    rewritePriority?: number;
    diagramWorthiness?: boolean;
  };
  coachingFrame?: string[];
  tutorReady?: boolean;
}

export interface SATAQuestion extends QuizQuestion {
  type: "sata";
  answer: string[];
}

export interface OrderingQuestion extends QuizQuestion {
  type: "ordering";
  answer: string[];
}

// ─── Quiz Session Types ───────────────────────────────────────────────────────

export interface QuizSessionConfig {
  exam: Exam;
  category?: string;    // undefined = all categories (weighted by blueprint)
  count: 5 | 6 | 10 | 20 | 25 | 50 | 75 | 100;
  type?: QuestionType;  // legacy alias for questionType
  questionType?: QuestionType;
  ngnOnly?: boolean;
  personalize?: boolean;
}

export interface QuizSessionState {
  sessionId: string;
  questions: QuizQuestion[];
  currentIndex: number;
  answers: Record<string, {
    selectedAnswer: QuestionAnswer;
    isCorrect: boolean;
    timeSpentMs?: number;
  }>;
  startedAt: number;
  completedAt?: number;
}

export interface QuizResults {
  sessionId: string;
  score: number;          // 0–100
  totalQuestions: number;
  correctCount: number;
  byCategory: Record<string, { correct: number; total: number }>;
  timeSpentMs: number;
  weakCategories: string[];  // categories below 60%
}

export type BoardroomAccessRole = "none" | "viewer" | "operator";
export type BoardroomMeetingLifecycle =
  | "idle"
  | "checkpointing"
  | "ready"
  | "in-meeting"
  | "synthesizing"
  | "resuming"
  | "completed";

export type BoardroomCheckpointStatus =
  | "meeting-hold"
  | "ready"
  | "blocked"
  | "unreachable"
  | "resuming";

export interface EmployeePresentationProfile {
  presentationTitle: string;
  whatTheyDo: string;
  howTheyHelpTheBusinessGrow: string;
  howTheyGrowThemselves: string;
  offHours: string;
  presentationVoice: string;
}

export interface BoardroomLifecycleEvent {
  status: BoardroomMeetingLifecycle;
  at: string;
  note: string;
}

export interface BoardroomCheckpointBundle {
  agentId: string;
  nickname: string;
  runtime: string;
  status: BoardroomCheckpointStatus;
  currentTask: string;
  blocker: string;
  latestFinding: string;
  usefulShareouts: string[];
  candidateDurableMemories: string[];
  candidateSkillUpdates: string[];
  lastCheckpointAt: string | null;
  telemetrySource: "live telemetry" | "derived dashboard state" | "presentation metadata" | "stale telemetry" | "unwired lane";
}

export interface BoardroomMeetingSnapshot {
  meetingId: string;
  status: BoardroomMeetingLifecycle;
  requestedAt: string;
  requestedBy: string;
  reason: string;
  autoResume: boolean;
  quorumTarget: number;
  totalAgents: number;
  arrivedCount: number;
  currentPresenterId: string | null;
  summary: string;
  lifecycle: BoardroomLifecycleEvent[];
  checkpoints: BoardroomCheckpointBundle[];
  knowledgePipeline: {
    rawMeetingNotes: string[];
    candidateMemoryPromotions: string[];
    candidateSkillPromotions: string[];
    approvedDurableUpdates: string[];
  };
}

export interface BoardroomStateSnapshot {
  accessMode: "preview-key-unified";
  cadence: "daily-standup";
  updatedAt: string | null;
  digest: string[];
  activeMeeting: BoardroomMeetingSnapshot | null;
  latestCompletedMeeting: BoardroomMeetingSnapshot | null;
}

export type AgentAdapterStatus =
  | "live"
  | "installed-idle"
  | "configured-missing-state"
  | "legacy-only"
  | "unwired"
  | "blocked"
  | "unknown";

export interface AgentCapabilityContract {
  providerId: string;
  runtime: string;
  adapterStatus: AgentAdapterStatus;
  authStatus: string;
  safeModes: string[];
  blockedCapabilities: string[];
  approvalRequiredFor: string[];
  lastProbeAt: string | null;
  probeEvidence: string[];
  dashboardTruthLevel: string;
}

export interface AgentLearningRecord {
  agentId: string;
  source: string;
  sourceType: string;
  summary: string;
  citations: string[];
  candidateMemory: string | null;
  candidateSkill: string | null;
  confidence: string;
  risk: string;
  allowedUse: string;
  approvalTicketId: string | null;
  promotionStatus: "raw_observation" | "candidate" | "reviewed" | "approved" | "rejected" | string;
}

export interface ApprovalTicket {
  id: string;
  lifecycle: "drafted" | "sent_to_telegram" | "approved" | "rejected" | "expired" | "executed" | "failed" | string;
  title: string;
  agentId: string;
  requestedAction: string;
  risk: string;
  source: string;
  createdAt: string;
  telegramRequired: boolean;
}

export interface UnifiedAgentGuildState {
  generatedAt: string | null;
  version: number;
  title: string;
  sourceRoots: {
    chapai: string;
    chappyVault: string;
    legacyCcrnAgent: string;
  };
  sourceHealth: {
    chapaiBrains: number;
    obsidianGuildNotes: number;
    legacyMemoryLinked: boolean;
    publicLedgerRecords: number;
    approvalQueuePending: number;
    boardroomLinked: boolean;
    guildLoopUpdatedAt: string | null;
  };
  stats: {
    totalAgents: number;
    live: number;
    sleeping: number;
    blocked: number;
    stale: number;
    totalSkills: number;
    totalDurableMemories: number;
    totalExperiments: number;
    totalTrialErrors: number;
  };
  memorySystem: {
    mode: string;
    rawNotes: string[];
    candidatePromotions: string[];
    approvedDurableUpdates: string[];
    hygieneRules: string[];
  };
  sharedContext: {
    legacyDurableFacts: string[];
    legacyAgentNotes: string[];
    legacyFindings: string[];
    publicResearchFindings: string[];
    approvalExperiments: string[];
  };
  providerReadiness: {
    totalProviders: number;
    live: number;
    installedIdle: number;
    configuredMissingState: number;
    legacyOnly: number;
    unwired: number;
    blocked: number;
    unknown: number;
  };
  capabilityMatrix: AgentCapabilityContract[];
  memoryHygiene: {
    mode: string;
    rawObservationCount: number;
    candidateMemoryCount: number;
    reviewedMemoryCount: number;
    approvedDurableCount: number;
    lowSignalCount: number;
    rules: string[];
  };
  learningLedger: AgentLearningRecord[];
  approvalQueue: ApprovalTicket[];
  agents: Array<{
    id: string;
    displayName: string;
    nickname: string;
    role: string;
    runtime: string;
    state: string;
    truthLevel: string;
    currentTask: string;
    latest: string;
    blocker: string;
    plan: string;
    currentWorkingGoal?: string;
    predictions?: string[];
    experimentResults?: string[];
    significantCommunications?: string[];
    significantEvents?: string[];
    humanRequiredBlocks?: string[];
    theories: string[];
    experiments: string[];
    trialsAndErrors: string[];
    stats: {
      level: number;
      xp: number;
      skills: number;
      durableMemories: number;
      memoryEvents: number;
      activeContexts: number;
      pendingExperiments: number;
      completedTasks: number;
      blockedTasks: number;
      sourceCount: number;
    };
    brain: {
      health: string;
      lastCuratedAt: string | null;
      nextSkillTarget: string | null;
      activeContext: string[];
      durableMemory: string[];
      skills: string[];
      recentEvents: string[];
    };
    sources: Array<{
      label: string;
      kind: string;
      path: string;
      updatedAt: string;
    }>;
  }>;
}

export interface GoalDirective {
  schemaVersion: string;
  id: string;
  createdAt: string;
  updatedAt?: string;
  source: string;
  sourcePath?: string;
  text: string;
  owner: string;
  status: "active" | "paused" | "completed" | "superseded";
  linkedLanes: string[];
  successSignals: string[];
  approvalBoundary: string;
  proofPaths: string[];
  progress: {
    state: string;
    percent: number;
    detail: string;
  };
}

export interface AgentInvocationRecord {
  schemaVersion: string;
  id: string;
  agentId: string;
  runId: string;
  recordedAt: string;
  trigger: string;
  inputSummary: string;
  toolsRequested: string[];
  toolsUsed: string[];
  outputArtifacts: string[];
  proofPaths: string[];
  memoryCandidates: string[];
  skillCandidates: string[];
  approvalsNeeded: string[];
  failures: string[];
  status: "planned" | "dry-run" | "blocked" | "completed";
}

export interface MemoryPromotionRecord {
  schemaVersion: string;
  id: string;
  createdAt: string;
  ownerLane: string;
  source: string;
  sourceTaint: string;
  candidateMemory: string;
  promotionStatus: "candidate" | "reviewed" | "approved-durable" | "rejected";
  dedupeState: "pending" | "unique" | "duplicate" | "confounded";
  expectedFutureUse: string;
  proofPaths: string[];
}

export interface SkillGrowthRecord {
  schemaVersion: string;
  id: string;
  skillName: string;
  ownerLane: string;
  firstSeenAt: string;
  lastUsedAt: string;
  proofPath: string;
  successfulApplications: number;
  failedApplications: number;
  confoundedApplications: number;
  status: "candidate" | "active" | "retired";
}

export interface ProfitPatternCandidate {
  schemaVersion: string;
  id: string;
  createdAt: string;
  ownerLane: string;
  source: string;
  sourceProof: string;
  sourceTaint: string;
  pattern: string;
  targetCustomer: string;
  offerMapping: string;
  estimatedBudgetUsd: number;
  expectedUpside: string;
  confidence: number;
  risk: string;
  approvalNeeded: string;
  nextTest: string;
  status: "candidate" | "staged" | "approved" | "rejected";
}

export interface ToolPermissionContract {
  agentId: string;
  mode: "read-only" | "draft-only" | "approval-required" | "blocked";
  allowedTools: string[];
  approvalRequiredFor: string[];
  blockedActions: string[];
  sourceTaintDefault: string;
}

export interface AgentLiveTelemetry {
  agentId: string;
  displayName: string;
  role: string;
  runtime: string;
  laneStatus: string;
  truthLevel: string;
  currentAction: string;
  nextPlan: string;
  blocker: string;
  learningMoment: string;
  proofPath: string;
  queuePending: number;
  approvalState: string;
  sourceTaint: string;
  heartbeatFreshness: string;
  confidence: number;
  toolMode: ToolPermissionContract["mode"];
}

export interface MissionControlSnapshot {
  product: {
    ccrnLiveQuestions: number;
    ccrnDraftQuestions: number;
    nclexLiveQuestions: number;
    nclexDraftQuestions: number;
    nclexMcqLiveQuestions: number;
    nclexNgnLiveQuestions: number;
    nclexNgnRatio: number;
    nclexApprovedRefinedUsable: number;
    nclexTopUpNeeded: boolean;
    nclexRemainingTo5000: number;
    nclexRefinementGeneratedAt: string | null;
  };
  retrospective: {
    generatedAt: string | null;
    roomState: string;
    wins: string[];
    blockers: string[];
    next: string[];
  };
  urgentFixes: Array<{
    id: string;
    title: string;
    detail: string;
    action: string;
    severity: "critical" | "warning" | "info";
    source: string;
  }>;
  liveServices: Array<{
    key: string;
    label: string;
    status: "live" | "degraded" | "down" | "unknown";
    detail: string;
    action: string;
    provenance: string;
  }>;
  brains: Array<{
    agentId: string;
    nickname: string;
    displayName: string;
    runtime: string;
    avatar: {
      key: string;
      sigil: string;
      palette: [string, string, string];
    };
    role: string;
    mission: string;
    durableCount: number;
    skillCount: number;
    memoryEventCount: number;
    growthLevel: number;
    confidence: number;
    lastContribution: string;
    learningVelocity: "quiet" | "steady" | "high";
    swarmReadiness: "seedling" | "operator" | "lead";
    eventsToday: number;
    goals: string[];
    workflowContract: string[];
    recentEvents: Array<{
      id: string;
      summary: string;
      kind: string;
      timestamp: string;
      confidence: number;
    }>;
    nextSkillTarget?: string;
    capabilityFocus?: string[];
    brainHygiene?: "clean" | "watch" | "noisy";
    activeContext: string[];
    durableMemory: string[];
    skills: string[];
    lastCuratedAt: string;
  }>;
  unifiedGuild: UnifiedAgentGuildState;
  employeeRegistry?: Array<{
    agentId: string;
    displayName: string;
    runtime: string;
    role: string;
    avatar: {
      key: string;
      sigil: string;
      palette: [string, string, string];
    };
    goals: string[];
    workflowContract: string[];
    brainPath?: string;
    queuePath?: string;
    statePath?: string;
    heartbeatId?: string;
    presentation?: EmployeePresentationProfile;
  }>;
  agents: Array<{
    id: string;
    nickname: string;
    runtime: string;
    avatar: {
      key: string;
      sigil: string;
      palette: [string, string, string];
    };
    role: string;
    state: "live" | "sleeping" | "blocked" | "stale";
    progress: number;
    eta: string;
    current: string;
    latest: string;
    blocker: string;
    freshness: string;
    provenance: string;
    brainStatus: "linked" | "missing" | "corrupt";
    truthLevel: "live-probe" | "runtime-file" | "stale-telemetry" | "brain-only" | "presentation-only" | "unwired";
    lastRuntimeUpdateAt: string | null;
    lastBrainUpdateAt: string | null;
    blockerSeverity: "critical" | "warning" | "info";
    outputToday: number;
    workflowSuggestion: string;
    presentation?: EmployeePresentationProfile;
    employeeHealth: {
      freshness: "fresh" | "aging" | "stale";
      taskFit: "tight" | "mixed" | "drifting";
      blockerClarity: "clear" | "fuzzy" | "none";
      brainHygiene: "clean" | "watch" | "noisy";
      outputToday: number;
      swarmReadiness: "seedling" | "operator" | "lead";
    };
  }>;
  batches: {
    latestGeneratedAt: string | null;
    latestBatchId: string | null;
    latestBatchFile: string | null;
    validation: "valid" | "invalid" | "missing";
    totalQuestions: number;
    examMix: {
      ccrn: number;
      nclex: number;
    };
  };
  runtime: {
    primaryRepo: string;
    fallbackRepo: string;
    stripeMode: "test" | "live" | "unknown";
    deploymentTarget: string;
    checkoutStatus: string;
    managerCadence: string;
    runtimeState: string;
    openDirectives: number;
  };
  capabilities: {
    providerCount: number;
    unlockedSystems: string[];
    lowCostFirst: string[];
    premiumEscalation: string[];
    highlights: Array<{
      id: string;
      category: string;
      bestUse: string[];
    }>;
  };
  boardroom: BoardroomStateSnapshot;
}

// ─── Spaced Repetition ────────────────────────────────────────────────────────

// SM-2 quality: 0=blackout, 5=perfect instant recall
export type SM2Quality = 0 | 1 | 2 | 3 | 4 | 5;

export interface SM2Result {
  nextIntervalDays: number;
  newEaseFactor: number;
  newRepetitions: number;
}

// ─── User / Auth ──────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  tier: Tier;
  stripeCustomerId?: string;
}

export interface TierLimits {
  questionsPerDay: number | null;  // null = unlimited
  tutorCallsPerDay: number | null;
  hasSpacedRepetition: boolean;
  hasCaseStudies: boolean;
  hasAnalytics: boolean;
  hasPassGuarantee: boolean;
}

export const TIER_LIMITS: Record<Tier, TierLimits> = {
  free: {
    questionsPerDay: 10,
    tutorCallsPerDay: 0,
    hasSpacedRepetition: false,
    hasCaseStudies: false,
    hasAnalytics: false,
    hasPassGuarantee: false,
  },
  plus: {
    questionsPerDay: null,
    tutorCallsPerDay: null,
    hasSpacedRepetition: true,
    hasCaseStudies: true,
    hasAnalytics: true,
    hasPassGuarantee: false,
  },
  pro: {
    questionsPerDay: null,
    tutorCallsPerDay: null,
    hasSpacedRepetition: true,
    hasCaseStudies: true,
    hasAnalytics: true,
    hasPassGuarantee: true,
  },
};

// ─── API Response Types ───────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─── Stripe ───────────────────────────────────────────────────────────────────

export const STRIPE_PRICES = {
  trial_7day:      "price_1TIWiWANUEeCGFKSm1MZaiSh",  // $9 one-time — 7-day access
  base_monthly:    "price_1TIWiXANUEeCGFKSra41taiO",  // $29/mo — Base Monthly
  vip_monthly:     "price_1TIWiXANUEeCGFKSshU1NHDz",  // $39/mo — VIP Monthly
  unlimited_vip:   "price_1TIWiYANUEeCGFKS8dudVUuj",  // $50/mo — Unlimited VIP + analytics
} as const;

export const STRIPE_PRODUCTS = {
  trial_7day:    "prod_UH4sVmCjsqVxzb",
  base_monthly:  "prod_UH4sIEXKDo3uDA",
  vip_monthly:   "prod_UH4sxiJXonbEBP",
  unlimited_vip: "prod_UH4sulT2hGr3Px",
} as const;

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface PerformanceTrend {
  date: string;
  score: number;
  questionsAnswered: number;
  exam: Exam;
}

export interface CategoryPerformance {
  category: string;
  correct: number;
  total: number;
  percentage: number;
  trending: "up" | "down" | "stable";
}

export interface StudyStreak {
  currentStreak: number;
  longestStreak: number;
  lastStudiedAt: string;
}
