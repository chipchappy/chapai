import type { Exam } from "@/lib/types";

export type PracticeMode = "standard" | "chart" | "case-study" | "ngn" | "practice-exam";
export type PracticeQuestionKind = "mcq" | "multi-select" | "matrix" | "chart" | "case-study";

export interface PracticeOption {
  id: string;
  text: string;
}

export interface PracticeMetric {
  label: string;
  value: string;
  unit?: string;
  flag?: "low" | "normal" | "high" | "critical";
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

export type PracticeAnswer = string | string[] | Record<string, string>;

export interface PracticeQuestion {
  id: string;
  exam: Exam;
  category: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  mode: PracticeMode;
  kind: PracticeQuestionKind;
  stem: string;
  options?: PracticeOption[];
  correctAnswer: PracticeAnswer;
  rationale: string;
  distractorRationales?: Record<string, string>;
  takeaway?: string;
  source?: "live" | "demo" | "simulated";
  title?: string;
  caseTitle?: string;
  caseContext?: string;
  vitals?: PracticeMetric[];
  labs?: PracticeMetric[];
  hemodynamics?: PracticeMetric[];
  chartTitle?: string;
  chartCaption?: string;
  chartRows?: PracticeChartRow[];
  scenarioTitle?: string;
  scenario?: string;
  additionalInfo?: string;
  matrixColumns?: string[];
  matrixRows?: PracticeMatrixRow[];
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
  takeaway?: string;
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
