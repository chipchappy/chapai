export const PUBLICATION_GATE_VERSION = "nclex-publication-v1";

const CJMM_STEPS = [
  "recognize-cues",
  "analyze-cues",
  "prioritize-hypotheses",
  "generate-solutions",
  "take-actions",
  "evaluate-outcomes",
];

const PLACEHOLDER_TEXT = /\b(?:n\/a|not applicable|no rationale|rationale unavailable|this is (?:a )?correct choice|this choice is correct|lorem ipsum|todo|tbd)\b/i;
const GENERIC_RATIONALE = /^(?:the correct answer is|this option is correct|this is the best answer)[^.]{0,90}\.?$/i;

function normalizeText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function wordCount(value) {
  return normalizeText(value).split(/\s+/).filter(Boolean).length;
}

function isTeachingText(value, minimumWords) {
  const text = normalizeText(value);
  return wordCount(text) >= minimumWords
    && !PLACEHOLDER_TEXT.test(text)
    && !GENERIC_RATIONALE.test(text);
}

function normalizedAnswerIds(answer) {
  if (Array.isArray(answer)) {
    return new Set(answer.map((value) => normalizeText(value).toLowerCase()));
  }
  if (typeof answer === "string") {
    return new Set([normalizeText(answer).toLowerCase()]);
  }
  return new Set();
}

function questionType(question) {
  return normalizeText(question.type ?? question.kind ?? "mcq").toLowerCase().replaceAll("_", "-");
}

function optionIds(question) {
  return Array.isArray(question.options)
    ? question.options.map((option) => normalizeText(option?.id).toLowerCase()).filter(Boolean)
    : [];
}

function distractorIds(question) {
  const type = questionType(question);
  if (type === "bow-tie") {
    return [
      ...(question.bowTie?.leftActions ?? []),
      ...(question.bowTie?.rightMonitoring ?? []),
    ]
      .filter((cell) => cell && cell.isCorrect === false)
      .map((cell) => normalizeText(cell.id).toLowerCase())
      .filter(Boolean);
  }

  const correct = normalizedAnswerIds(question.answer ?? question.correctAnswer);
  return optionIds(question).filter((id) => !correct.has(id));
}

function rationaleMap(question) {
  return {
    ...(question.structuredRationale?.whyWrong ?? {}),
    ...(question.distractorRationales ?? {}),
  };
}

function hasRationaleFor(map, id) {
  const direct = map[id] ?? map[id.toUpperCase()];
  return isTeachingText(direct, 6);
}

function hasDistinctClinicalSections(question) {
  const hpi = question.chartReview?.hpi ?? [];
  const nursingNotes = question.chartReview?.nursingNotes ?? question.chartReview?.notes ?? [];
  if (hpi.length < 3 || nursingNotes.length < 2) return false;

  const normalizedHpi = hpi.map((line) => normalizeText(line).toLowerCase());
  return nursingNotes.every((note) => {
    const normalizedNote = normalizeText(note).toLowerCase();
    return normalizedHpi.every((hpiLine) => normalizedNote !== hpiLine);
  });
}

export function evaluatePublicationQuality(question) {
  const issues = [];
  const warnings = [];
  const rationale = normalizeText(question.deepRationale ?? question.rationale);
  const structured = question.structuredRationale;
  const references = question.references ?? question.referencesJson ?? [];
  const qualityMetadata = question.qualityMetadata;
  const type = questionType(question);

  if (!normalizeText(question.id)) issues.push("missing-id");
  if (!["nclex", "ccrn"].includes(question.exam)) issues.push("invalid-exam");
  if (wordCount(question.stem) < 10) issues.push("stem-too-short");
  if (PLACEHOLDER_TEXT.test(question.stem)) issues.push("placeholder-stem");

  if (!isTeachingText(rationale, 60)) issues.push("rationale-below-premium-floor");
  if (PLACEHOLDER_TEXT.test(rationale)) issues.push("placeholder-rationale");

  if (!isTeachingText(structured?.overview, 35)) issues.push("missing-structured-overview");
  if (!isTeachingText(structured?.mechanism, 18)) issues.push("missing-clinical-mechanism");
  if (!isTeachingText(structured?.whyCorrect, 18)) issues.push("missing-correct-answer-teaching");

  const ids = distractorIds(question);
  const authoredRationales = rationaleMap(question);
  const missingDistractors = ids.filter((id) => !hasRationaleFor(authoredRationales, id));
  if (missingDistractors.length > 0) {
    issues.push(`missing-distractor-rationales:${missingDistractors.join(",")}`);
  }

  if (!Array.isArray(references) || references.length === 0) {
    issues.push("missing-references");
  } else if (!references.some((reference) => /^https:\/\//i.test(normalizeText(reference?.href)))) {
    issues.push("missing-authoritative-reference-link");
  }

  if (!qualityMetadata || !["source-verified", "clinician-reviewed"].includes(qualityMetadata.evidenceStatus)) {
    issues.push("missing-evidence-status");
  }
  if (!Number.isInteger(qualityMetadata?.contentVersion) || qualityMetadata.contentVersion < 1) {
    issues.push("missing-content-version");
  }
  if (!Array.isArray(qualityMetadata?.sourceIds) || qualityMetadata.sourceIds.length === 0) {
    issues.push("missing-source-ids");
  }

  if (question.reviewStatus !== "final-curated-live") {
    issues.push("missing-final-review-status");
  }

  const isCaseItem = Boolean(question.caseStudyId || type === "case-study");
  if (isCaseItem) {
    if (!normalizeText(question.caseStudyId)) issues.push("missing-case-study-id");
    if (!CJMM_STEPS.includes(question.cjmmStep)) issues.push("invalid-cjmm-step");
    if (!hasDistinctClinicalSections(question)) issues.push("weak-or-duplicated-clinical-record");
  }

  if (type === "matrix") {
    if (!Array.isArray(question.matrixColumns) || question.matrixColumns.length < 2) issues.push("invalid-matrix-columns");
    if (!Array.isArray(question.matrixRows) || question.matrixRows.length < 3) issues.push("invalid-matrix-rows");
  }

  if (type === "ordering") {
    const answer = question.answer ?? question.correctAnswer;
    if (!Array.isArray(answer) || answer.length < 3) issues.push("invalid-ordering-answer");
  }

  if (type === "bow-tie") {
    if (!question.bowTie?.center?.id) issues.push("invalid-bow-tie-center");
    if ((question.bowTie?.leftActions?.length ?? 0) < 4) issues.push("invalid-bow-tie-actions");
    if ((question.bowTie?.rightMonitoring?.length ?? 0) < 4) issues.push("invalid-bow-tie-monitoring");
    if ((question.bowTie?.leftActions ?? []).filter((cell) => cell.isCorrect).length !== 2) issues.push("invalid-bow-tie-correct-actions");
    if ((question.bowTie?.rightMonitoring ?? []).filter((cell) => cell.isCorrect).length !== 2) issues.push("invalid-bow-tie-correct-monitoring");
  }

  if (!question.visualRationale) warnings.push("no-visual-rationale");
  if (wordCount(rationale) < 95) warnings.push("rationale-below-target-depth");
  if (qualityMetadata?.evidenceStatus !== "clinician-reviewed") warnings.push("clinician-signoff-pending");

  const score = Math.max(0, 100 - issues.length * 12 - warnings.length * 3);
  return {
    id: normalizeText(question.id) || "(missing-id)",
    gateVersion: PUBLICATION_GATE_VERSION,
    passed: issues.length === 0 && score >= 85,
    score,
    issues,
    warnings,
  };
}

export function evaluatePublicationBatch(questions) {
  const reports = questions.map(evaluatePublicationQuality);
  const caseGroups = new Map();

  for (const question of questions) {
    if (!question.caseStudyId) continue;
    const group = caseGroups.get(question.caseStudyId) ?? [];
    group.push(question);
    caseGroups.set(question.caseStudyId, group);
  }

  const batchIssues = [];
  for (const [caseStudyId, group] of caseGroups) {
    if (group.length !== 6) {
      batchIssues.push(`case-study-${caseStudyId}-must-contain-six-items`);
      continue;
    }
    const steps = new Set(group.map((question) => question.cjmmStep));
    const missingSteps = CJMM_STEPS.filter((step) => !steps.has(step));
    if (missingSteps.length > 0) {
      batchIssues.push(`case-study-${caseStudyId}-missing-steps:${missingSteps.join(",")}`);
    }
  }

  return {
    gateVersion: PUBLICATION_GATE_VERSION,
    passed: reports.every((report) => report.passed) && batchIssues.length === 0,
    reports,
    batchIssues,
  };
}

export function assertPublishableBatch(questions) {
  const result = evaluatePublicationBatch(questions);
  if (result.passed) return result;

  const itemFailures = result.reports
    .filter((report) => !report.passed)
    .map((report) => `${report.id}: ${report.issues.join(", ") || `score ${report.score}`}`);
  const details = [...result.batchIssues, ...itemFailures].join("\n");
  throw new Error(`Publication quality gate failed (${PUBLICATION_GATE_VERSION}):\n${details}`);
}
