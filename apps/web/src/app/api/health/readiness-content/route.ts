import {
  getCaseStudyReleaseIssues,
  getCompleteCaseStudyGroups,
} from "@/lib/clinical-case-study";
import { jsonError, jsonSuccess } from "@/lib/http";
import { getRichDeck } from "@/lib/practice-data";
import { READINESS_ASSEMBLY_VERSION } from "@/lib/readiness-delivery";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const EXPECTED_CASE_COUNT = 15;
const EXPECTED_CASE_ITEM_COUNT = 90;

function normalizedStem(stem: string) {
  return stem
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET() {
  const questions = getRichDeck("case-study").filter((question) => question.exam === "nclex");
  const groups = getCompleteCaseStudyGroups(questions);
  const releaseIssues = getCaseStudyReleaseIssues(questions);
  const uniqueIdCount = new Set(questions.map((question) => question.id)).size;
  const uniqueStemCount = new Set(questions.map((question) => normalizedStem(question.stem))).size;
  const sourceVerifiedCount = questions.filter(
    (question) => question.qualityMetadata?.evidenceStatus === "source-verified",
  ).length;
  const clinicalReviewPendingCount = questions.filter(
    (question) => question.qualityMetadata?.clinicalReviewStatus === "pending",
  ).length;
  const psychometricPrecalibrationCount = questions.filter(
    (question) => question.qualityMetadata?.psychometricStatus === "precalibration",
  ).length;
  const operational = (
    questions.length === EXPECTED_CASE_ITEM_COUNT
    && groups.length === EXPECTED_CASE_COUNT
    && uniqueIdCount === questions.length
    && uniqueStemCount === questions.length
    && releaseIssues.length === 0
  );

  const report = {
    status: operational ? "operational" : "blocked",
    assemblyVersion: READINESS_ASSEMBLY_VERSION,
    caseCount: groups.length,
    caseItemCount: questions.length,
    uniqueIdCount,
    uniqueStemCount,
    sourceVerifiedCount,
    clinicalReviewPendingCount,
    psychometricPrecalibrationCount,
    releaseIssues,
    evidenceNotice: "Source verification is complete. Independent licensed clinical review and psychometric calibration remain pending.",
    timestamp: new Date().toISOString(),
  };

  if (!operational) {
    return jsonError(503, "READINESS_CONTENT_BLOCKED", "Readiness case content failed its release audit.", report);
  }

  return jsonSuccess(report);
}
