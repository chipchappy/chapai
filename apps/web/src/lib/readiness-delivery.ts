import type { PracticeQuestion } from "./practice-types";

export const READINESS_ASSEMBLY_VERSION = "nclex-readiness-v2";

export function concealReadinessAnswer(question: PracticeQuestion) {
  const {
    correctAnswer: _correctAnswer,
    rationale: _rationale,
    structuredRationale: _structuredRationale,
    deepRationale: _deepRationale,
    distractorRationales: _distractorRationales,
    takeaway: _takeaway,
    speedCue: _speedCue,
    references: _references,
    studyResources: _studyResources,
    coachingFrame: _coachingFrame,
    visualRationale: _visualRationale,
    diagramBlueprint: _diagramBlueprint,
    ...studentQuestion
  } = question;

  return studentQuestion;
}
