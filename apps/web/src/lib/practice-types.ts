import type { BowTieQuestion, CjmmStep, CognitiveLevel, Exam, NclexClientNeed, QuestionType } from "@/lib/types";
import type { StudyResource } from "@/lib/study-resources";

export type PracticeMode = "standard" | "chart" | "case-study" | "ngn" | "practice-exam";
export type PracticeQuestionKind =
  | "mcq"
  | "multi-select"
  | "matrix"
  | "chart"
  | "case-study"
  | "bow-tie"
  | "ordering"
  | "scenario-mcq"
  | "decision-map-mcq";

export interface PracticeOption {
  id: string;
  text: string;
}

export interface PracticeMetric {
  label: string;
  value: string;
  unit?: string;
  flag?: "low" | "normal" | "high" | "critical";
  detail?: string;
}

export interface PracticeChartValue {
  label: string;
  value: string;
  flag?: "low" | "normal" | "high" | "critical";
}

export interface PracticeChartRow {
  time: string;
  values: PracticeChartValue[];
}

export interface PracticeMatrixRow {
  label: string;
  answer: string;
}

export type PracticeAnswer = string | string[] | Record<string, string | string[]>;

export interface PracticeChartReviewMetadata {
  patientTitle?: string;
  patientCaption?: string;
  chiefComplaint?: string;
  history?: string[];
  allergies?: string[];
  medications?: string[];
  hpi?: string[];
  timeline?: string[];
  unfoldingTimeline?: string[];
  vitals?: PracticeMetric[];
  labs?: PracticeMetric[];
  orders?: string[];
  providerOrders?: string[];
  orderStatus?: Array<{
    label: string;
    status: string;
    detail?: string;
  }>;
  diagnostics?: PracticeMetric[];
  notes?: string[];
  nursingNotes?: string[];
  assessments?: string[];
  intakeOutput?: string[];
  medicationAdministrationRecord?: string[];
  carePlan?: string[];
  pastQuestionContext?: string[];
  abnormalValues?: PracticeMetric[];
  priorityCues?: string[];
  diagram?: {
    title?: string;
    nodes?: Array<{ label: string; value: string }>;
  };
  tutorPrompts?: Array<{ label?: string; value: string }>;
}

export interface PracticeQuestion {
  id: string;
  exam: Exam;
  nclexClientNeed?: NclexClientNeed;
  cognitiveLevel?: CognitiveLevel;
  category: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  mode: PracticeMode;
  kind: PracticeQuestionKind;
  questionType?: QuestionType;
  stem: string;
  options?: PracticeOption[];
  correctAnswer: PracticeAnswer;
  rationale: string;
  deepRationale?: string;
  distractorRationales?: Record<string, string>;
  takeaway?: string;
  speedCue?: string;
  references?: Array<{
    title: string;
    citation?: string;
    href?: string;
  }>;
  studyResources?: StudyResource[];
  coachingFrame?: string[];
  tutorReady?: boolean;
  source?: "live" | "demo" | "simulated";
  title?: string;
  caseTitle?: string;
  caseContext?: string;
  caseStudyId?: string;
  caseStudyTitle?: string;
  caseItemNumber?: number;
  caseItemTotal?: number;
  cjmmStep?: CjmmStep;
  clinicalJudgmentSkill?: string;
  nclexScenarioLead?: string;
  nclexInstruction?: string;
  clozeTemplate?: string;
  clozeBlankCount?: number;
  highlightRows?: Array<{
    label: string;
    text: string;
    optionId: string;
  }>;
  vitals?: PracticeMetric[];
  labs?: PracticeMetric[];
  hemodynamics?: PracticeMetric[];
  chartTitle?: string;
  chartCaption?: string;
  chartRows?: PracticeChartRow[];
  scenarioTitle?: string;
  scenario?: string;
  additionalInfo?: string;
  exhibits?: Array<{
    type: "note" | "timeline" | "labs" | "vitals" | "orders" | "assessment";
    title: string;
    body?: string;
    items?: string[];
  }>;
  chartReview?: PracticeChartReviewMetadata;
  matrixColumns?: string[];
  matrixRows?: PracticeMatrixRow[];
  bowTie?: BowTieQuestion;
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
}

export interface PracticeExamDefinition {
  id: string;
  exam: Exam;
  label: string;
  description: string;
  length: number;
  timeLimitMinutes: number;
  seed: string;
}

export interface PracticeCatalogCard {
  id: string;
  mode: PracticeMode;
  exam?: Exam;
  label: string;
  description: string;
  count: number;
  accent: string;
  hint: string;
  featured?: boolean;
}

export interface PracticeAnswerRecord {
  selected: PracticeAnswer;
  correct: boolean;
  correctAnswer: PracticeAnswer;
  rationale: string;
  deepRationale?: string;
  takeaway?: string;
  distractorRationales?: Record<string, string>;
  references?: Array<{
    title: string;
    citation?: string;
    href?: string;
  }>;
  studyResources?: StudyResource[];
  coachingFrame?: string[];
  visualRationale?: PracticeQuestion["visualRationale"];
  diagramBlueprint?: PracticeQuestion["diagramBlueprint"];
  submittedAt: number;
}

export interface PracticeSessionState {
  id: string;
  mode: PracticeMode;
  exam: Exam;
  label: string;
  description: string;
  questions: PracticeQuestion[];
  currentIndex: number;
  startedAt: number;
  timeLimitMinutes?: number;
  flaggedQuestionIds: string[];
  answers: Record<string, PracticeAnswerRecord>;
  finishedAt?: number;
  reviewOnly?: boolean;
}

export interface PracticeEvaluation {
  correct: boolean;
  correctAnswer: PracticeAnswer;
  rationale: string;
  takeaway?: string;
}
