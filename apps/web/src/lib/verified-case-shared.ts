import type {
  PracticeChartReviewMetadata,
  PracticeQuestion,
} from "./practice-types";

export type CaseReference = NonNullable<PracticeQuestion["references"]>[number];

export type VerifiedCaseDefinition = {
  id: string;
  title: string;
  references: CaseReference[];
  sourceIds: string[];
  evidenceReviewedAt: string;
  buildChartReview: (caseItemNumber: number) => PracticeChartReviewMetadata;
};

export type VerifiedCaseQuestionInput = Omit<
  PracticeQuestion,
  | "exam"
  | "mode"
  | "source"
  | "caseStudyId"
  | "caseStudyTitle"
  | "caseItemTotal"
  | "chartReview"
  | "references"
  | "structuredRationale"
  | "tutorReady"
  | "qualityMetadata"
> & {
  rationaleMechanism: string;
  whyCorrect: string;
};

export const NCLEX_REFERENCE: CaseReference = {
  title: "2026 NCLEX-RN Test Plan",
  citation: "NCSBN, effective April 1, 2026 through March 31, 2029",
  href: "https://www.ncsbn.org/public-files/2026_RN_Test-Plan_English-F.pdf",
};

export function makeVerifiedCaseQuestion(
  definition: VerifiedCaseDefinition,
  input: VerifiedCaseQuestionInput,
): PracticeQuestion {
  const {
    rationaleMechanism,
    whyCorrect,
    distractorRationales = {},
    ...question
  } = input;

  return {
    exam: "nclex",
    mode: "case-study",
    source: "simulated",
    caseStudyId: definition.id,
    caseStudyTitle: definition.title,
    caseItemTotal: 6,
    chartReview: definition.buildChartReview(input.caseItemNumber ?? 1),
    tutorReady: true,
    references: definition.references,
    structuredRationale: {
      overview: input.rationale,
      mechanism: rationaleMechanism,
      whyCorrect,
      whyWrong: distractorRationales,
      citations: definition.references.map((reference) => ({
        source: reference.citation ?? reference.title,
        href: reference.href,
        note: reference.title,
      })),
    },
    distractorRationales,
    qualityMetadata: {
      gateVersion: "nclex-publication-v1",
      contentVersion: 1,
      evidenceStatus: "source-verified",
      evidenceReviewedAt: definition.evidenceReviewedAt,
      sourceIds: definition.sourceIds,
      clinicalReviewStatus: "pending",
      clinicalReviewChecklistVersion: "nclex-clinical-review-v1",
      psychometricStatus: "precalibration",
    },
    ...question,
  };
}
