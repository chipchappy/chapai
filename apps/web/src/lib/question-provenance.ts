import type { ContentQualityMetadata } from "./types";

const evidenceStatuses = new Set<ContentQualityMetadata["evidenceStatus"]>([
  "unreviewed",
  "source-verified",
  "clinician-reviewed",
  "needs-revision",
]);
const clinicalReviewStatuses = new Set<NonNullable<ContentQualityMetadata["clinicalReviewStatus"]>>([
  "pending",
  "approved",
  "changes-requested",
]);
const psychometricStatuses = new Set<NonNullable<ContentQualityMetadata["psychometricStatus"]>>([
  "precalibration",
  "calibrating",
  "calibrated",
]);

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

export function parseQuestionQualityMetadata(
  provenance: string | null | undefined,
): ContentQualityMetadata | undefined {
  if (!provenance) return undefined;

  try {
    const parsed = JSON.parse(provenance) as {
      qualityMetadata?: Record<string, unknown> | null;
    };
    const metadata = parsed?.qualityMetadata;
    if (!metadata || typeof metadata !== "object") return undefined;

    const gateVersion = optionalString(metadata.gateVersion);
    const contentVersion = metadata.contentVersion;
    const evidenceStatus = metadata.evidenceStatus;
    if (
      !gateVersion
      || !Number.isInteger(contentVersion)
      || Number(contentVersion) < 1
      || !evidenceStatuses.has(evidenceStatus as ContentQualityMetadata["evidenceStatus"])
    ) {
      return undefined;
    }

    const clinicalReviewStatus = clinicalReviewStatuses.has(
      metadata.clinicalReviewStatus as NonNullable<ContentQualityMetadata["clinicalReviewStatus"]>,
    )
      ? metadata.clinicalReviewStatus as NonNullable<ContentQualityMetadata["clinicalReviewStatus"]>
      : undefined;
    const psychometricStatus = psychometricStatuses.has(
      metadata.psychometricStatus as NonNullable<ContentQualityMetadata["psychometricStatus"]>,
    )
      ? metadata.psychometricStatus as NonNullable<ContentQualityMetadata["psychometricStatus"]>
      : undefined;

    return {
      gateVersion,
      contentVersion: Number(contentVersion),
      evidenceStatus: evidenceStatus as ContentQualityMetadata["evidenceStatus"],
      evidenceReviewedAt: optionalString(metadata.evidenceReviewedAt),
      sourceIds: Array.isArray(metadata.sourceIds)
        ? metadata.sourceIds.filter((value): value is string => typeof value === "string" && Boolean(value.trim()))
        : undefined,
      clinicalReviewStatus,
      clinicalReviewChecklistVersion: optionalString(metadata.clinicalReviewChecklistVersion),
      clinicalReviewerId: optionalString(metadata.clinicalReviewerId),
      clinicalReviewedAt: optionalString(metadata.clinicalReviewedAt),
      psychometricStatus,
    };
  } catch {
    return undefined;
  }
}
