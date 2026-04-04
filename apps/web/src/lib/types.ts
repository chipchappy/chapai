// ─── Core Domain Types ────────────────────────────────────────────────────────

export type Exam = "nclex" | "ccrn";
export type Tier = "free" | "plus" | "pro";
export type QuestionType = "mcq" | "sata" | "ordering" | "matrix" | "case_study" | "bow_tie";

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

export interface QuizQuestion {
  id: string;
  exam: Exam;
  type: QuestionType;
  category: string;
  subcategory?: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  stem: string;
  options: QuestionOption[];
  answer: string;           // "b" for MCQ, ["a","c"] serialized for SATA
  rationale: string;
  distractorRationales?: Record<string, string>;
  tags?: string[];
  blueprintPct?: number;
  takeaway?: string;
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
  answer: string; // JSON: ["a","c"]
}

export interface OrderingQuestion extends QuizQuestion {
  type: "ordering";
  correctOrder: string[]; // ["c","a","d","b"]
}

// ─── Quiz Session Types ───────────────────────────────────────────────────────

export interface QuizSessionConfig {
  exam: Exam;
  category?: string;    // undefined = all categories (weighted by blueprint)
  count: 5 | 10 | 20 | 25 | 50 | 75 | 100;
  type?: QuestionType;  // undefined = mixed
}

export interface QuizSessionState {
  sessionId: string;
  questions: QuizQuestion[];
  currentIndex: number;
  answers: Record<string, {
    selectedAnswer: string;
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

export interface MissionControlSnapshot {
  product: {
    ccrnLiveQuestions: number;
    ccrnDraftQuestions: number;
    nclexLiveQuestions: number;
    nclexDraftQuestions: number;
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
    brainStatus: "linked" | "missing";
    truthLevel: "live-probe" | "runtime-file" | "stale-telemetry" | "brain-only";
    lastRuntimeUpdateAt: string | null;
    lastBrainUpdateAt: string | null;
    blockerSeverity: "critical" | "warning" | "info";
    outputToday: number;
    workflowSuggestion: string;
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
