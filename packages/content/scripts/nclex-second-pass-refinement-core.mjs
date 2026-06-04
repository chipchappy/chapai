import crypto from "node:crypto";

export const TARGET_APPROVED_UNIQUE = 5000;

export const CLIENT_NEED_TARGETS = {
  management_of_care: 0.18,
  safety_infection_control: 0.13,
  health_promotion: 0.09,
  psychosocial: 0.09,
  basic_care_comfort: 0.09,
  pharmacological: 0.16,
  risk_reduction: 0.12,
  physiological_adaptation: 0.14,
};

export const TYPE_TARGETS = {
  mcq: 0.3,
  sata: 0.15,
  case_study: 0.175,
  bow_tie: 0.175,
  ordering: 0.1,
  matrix: 0.1,
};

const ITEM_TYPES = new Set(["mcq", "sata", "ordering", "matrix", "case_study", "bow_tie"]);
const APPROVED_STATUSES = new Set(["approved", "refined", "final-curated-live"]);
const URL_RE = /^https?:\/\/[^\s]+$/i;
const UNSAFE_PATTERNS = [
  /\bignore\s+(the\s+)?provider\b/i,
  /\bskip\s+(the\s+)?assessment\b/i,
  /\bwithout\s+(assessing|assessment|provider|prescription|order)\b/i,
  /\bdiagnose\b.*\bat home\b/i,
  /\bguarantee(s|d)?\b.*\b(outcome|cure|safe)\b/i,
];

export function normalizeText(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function stableHash(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex").slice(0, 24);
}

export function buildRefinementFingerprint(question) {
  const explicit = question?.waveMetadata?.duplicateFingerprint;
  if (explicit) return normalizeText(explicit);
  const optionText = (question?.options ?? [])
    .map((option) => normalizeText(option.text))
    .sort()
    .join("|");
  return [
    normalizeText(question?.nclexClientNeed ?? "unknown"),
    normalizeText(question?.category),
    normalizeText(question?.subcategory),
    normalizeText(question?.type),
    normalizeText(question?.stem),
    optionText,
  ].join("::");
}

export function buildAngleSignature(question) {
  return stableHash([
    normalizeText(question?.nclexClientNeed ?? "unknown"),
    normalizeText(question?.category),
    normalizeText(question?.subcategory),
    normalizeText(question?.type),
    normalizeText(question?.stem).split(" ").slice(0, 28).join(" "),
    normalizeText(question?.takeaway ?? question?.speedCue ?? question?.rationale).split(" ").slice(0, 22).join(" "),
  ].join("::"));
}

function answerValues(answer) {
  if (Array.isArray(answer)) return answer.map((item) => String(item).toLowerCase());
  if (answer && typeof answer === "object") return Object.values(answer).map((item) => String(item).toLowerCase());
  if (answer === undefined || answer === null) return [];
  return [String(answer).toLowerCase()];
}

function optionIds(question) {
  return new Set((question?.options ?? []).map((option) => String(option.id).toLowerCase()));
}

function hasEncodingNoise(question) {
  return JSON.stringify(question).includes("�") || JSON.stringify(question).includes("â");
}

function rationaleMentionsCorrect(question) {
  const rationale = normalizeText(`${question?.rationale ?? ""} ${question?.deepRationale ?? ""}`);
  const ids = optionIds(question);
  const answers = answerValues(question?.answer);
  if (!rationale || !answers.length) return false;
  return answers.some((answer) => rationale.includes(normalizeText(answer)) || ids.has(answer));
}

function assessAnswerShape(question) {
  const issues = [];
  const ids = optionIds(question);
  const type = question?.type ?? "mcq";
  const answers = answerValues(question?.answer);

  if (type === "matrix") {
    const rows = Array.isArray(question?.matrixRows) ? question.matrixRows : [];
    const columns = new Set((question?.matrixColumns ?? []).map((column) => String(column).toLowerCase()));
    if (!rows.length) issues.push("matrix_missing_rows");
    if (!columns.size) issues.push("matrix_missing_columns");
    for (const row of rows) {
      if (!row?.label || !columns.has(String(row.answer ?? "").toLowerCase())) {
        issues.push("matrix_row_answer_invalid");
        break;
      }
    }
    return issues;
  }

  if (type === "ordering") {
    if (!Array.isArray(question?.answer) || !question.answer.length) issues.push("ordering_answer_missing");
    for (const answer of answers) {
      if (!ids.has(answer)) issues.push("ordering_answer_not_in_options");
    }
    return [...new Set(issues)];
  }

  if (type === "sata" && (!Array.isArray(question?.answer) || !question.answer.length)) {
    issues.push("sata_answer_must_be_array");
  }

  for (const answer of answers) {
    if (!ids.has(answer)) issues.push("answer_not_in_options");
  }

  return [...new Set(issues)];
}

function assessRenderability(question) {
  const issues = [];
  if (!question?.id) issues.push("missing_id");
  if (question?.exam !== "nclex") issues.push("not_nclex");
  if (!ITEM_TYPES.has(question?.type ?? "mcq")) issues.push("unsupported_item_type");
  if (!String(question?.stem ?? "").trim()) issues.push("missing_stem");
  if (!Array.isArray(question?.options) || question.options.length < 2) issues.push("missing_options");
  if (!String(question?.rationale ?? "").trim()) issues.push("missing_rationale");
  if (["case_study", "bow_tie"].includes(question?.type) && !question?.scenario && !question?.caseContext && !(question?.exhibits ?? []).length && !question?.chartReview) {
    issues.push("case_item_missing_context");
  }
  return issues;
}

function assessMetadata(question) {
  const issues = [];
  if (!question?.nclexClientNeed) issues.push("missing_client_need");
  if (!question?.cognitiveLevel) issues.push("missing_cognitive_level");
  if (!question?.category) issues.push("missing_category");
  if (!question?.difficulty) issues.push("missing_difficulty");
  if (!Array.isArray(question?.tags) || question.tags.length < 2) issues.push("thin_tags");
  if (!question?.waveMetadata?.familyKey) issues.push("missing_family_key");
  if (!question?.waveMetadata?.angleSignature) issues.push("missing_angle_signature");
  return issues;
}

function assessCitations(question) {
  const refs = Array.isArray(question?.references) ? question.references : [];
  const issues = [];
  if (!refs.length) issues.push("missing_references");
  for (const ref of refs) {
    if (!String(ref?.title ?? "").trim()) issues.push("reference_missing_title");
    if (ref?.href && !URL_RE.test(ref.href)) issues.push("reference_href_malformed");
    if (!ref?.href && !ref?.citation) issues.push("reference_unverified");
  }
  return [...new Set(issues)];
}

function assessMedia(question) {
  const issues = [];
  if (!question?.visualRationale && !question?.diagramBlueprint && !question?.chartReview?.diagram) {
    issues.push("missing_diagram_or_visual_rationale");
  }
  if (question?.diagramBlueprint && question.diagramBlueprint.questionId !== question.id) {
    issues.push("diagram_question_id_mismatch");
  }
  return issues;
}

function assessChartReview(question) {
  const chart = question?.chartReview;
  const issues = [];
  const hasExhibits = Array.isArray(question?.exhibits) && question.exhibits.length > 0;
  const isNgn = ["case_study", "bow_tie", "matrix", "ordering", "sata"].includes(question?.type);
  if (isNgn && !chart && !hasExhibits) issues.push("ngn_missing_chart_context");
  if (chart) {
    const hasHpi = Boolean(chart.chiefComplaint) || (chart.hpi ?? []).length || (chart.history ?? []).length;
    const hasDecisionData = (chart.timeline ?? []).length || (chart.labs ?? []).length || (chart.vitals ?? []).length || (chart.diagnostics ?? []).length || (chart.notes ?? []).length;
    if (!hasHpi) issues.push("chart_missing_hpi");
    if (!hasDecisionData) issues.push("chart_missing_decision_data");
    if (!(chart.orders ?? []).length && !(chart.providerOrders ?? []).length && isNgn) issues.push("chart_orders_not_provided");
  }
  return issues;
}

function assessClinicalSafety(question) {
  const text = `${question?.stem ?? ""} ${question?.rationale ?? ""} ${question?.deepRationale ?? ""}`;
  return UNSAFE_PATTERNS.filter((pattern) => pattern.test(text)).map((pattern) => `unsafe_pattern:${pattern.source.slice(0, 28)}`);
}

function scoreFromIssues(base, issues, weights) {
  let score = base;
  for (const issue of issues) {
    score -= weights[issue] ?? weights.default ?? 5;
  }
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function assessQuestion(question, duplicateCount = 1) {
  const renderIssues = assessRenderability(question);
  const answerIssues = assessAnswerShape(question);
  const metadataIssues = assessMetadata(question);
  const citationIssues = assessCitations(question);
  const mediaIssues = assessMedia(question);
  const chartIssues = assessChartReview(question);
  const safetyIssues = assessClinicalSafety(question);
  const rationaleIssues = [];
  if (String(question?.rationale ?? "").trim().length < 80) rationaleIssues.push("rationale_too_thin");
  if (!question?.distractorRationales && ["mcq", "sata", "case_study", "bow_tie"].includes(question?.type ?? "mcq")) rationaleIssues.push("missing_distractor_rationales");
  if (!rationaleMentionsCorrect(question)) rationaleIssues.push("rationale_key_alignment_weak");
  if (hasEncodingNoise(question)) rationaleIssues.push("encoding_noise_detected");

  const duplicateIssues = duplicateCount > 1 ? ["duplicate_fingerprint_collision"] : [];
  const allIssues = [...renderIssues, ...answerIssues, ...metadataIssues, ...citationIssues, ...mediaIssues, ...chartIssues, ...safetyIssues, ...rationaleIssues, ...duplicateIssues];
  const blockerIssues = [...renderIssues, ...answerIssues, ...safetyIssues];
  const citationQualityScore = scoreFromIssues(100, citationIssues, { missing_references: 40, reference_href_malformed: 35, reference_unverified: 18, default: 10 });
  const rationaleQualityScore = scoreFromIssues(100, rationaleIssues, { rationale_too_thin: 35, missing_distractor_rationales: 16, rationale_key_alignment_weak: 22, encoding_noise_detected: 30, default: 10 });
  const clinicalAccuracyScore = scoreFromIssues(100, [...safetyIssues, ...answerIssues], { default: 28 });
  const realismScore = scoreFromIssues(100, [...chartIssues, ...metadataIssues], { chart_orders_not_provided: 4, missing_family_key: 4, missing_angle_signature: 4, default: 8 });
  const duplicateRiskScore = duplicateCount > 1 ? Math.min(100, 50 + duplicateCount * 10) : 0;
  const mediaValidationStatus = mediaIssues.length ? "needs_review" : "valid";
  const qualityScore = Math.round((citationQualityScore + rationaleQualityScore + clinicalAccuracyScore + realismScore + (100 - duplicateRiskScore)) / 5);
  const status = blockerIssues.length
    ? "needs_review"
    : duplicateIssues.length
      ? "needs_review"
      : qualityScore >= 86 && APPROVED_STATUSES.has(question?.reviewStatus)
        ? "approved"
        : qualityScore >= 74
          ? "refined"
          : "needs_review";

  return {
    questionId: question?.id ?? "missing-id",
    status,
    itemType: question?.type ?? "mcq",
    nclexClientNeed: question?.nclexClientNeed ?? "missing",
    nursingProcess: question?.nursingProcess ?? inferNursingProcess(question),
    clinicalJudgmentArea: inferClinicalJudgmentArea(question),
    difficulty: question?.difficulty ?? null,
    specialtyTopic: question?.subcategory ?? question?.category ?? "unknown",
    safetyRiskLevel: safetyIssues.length ? "high" : ["physiological_adaptation", "risk_reduction", "safety_infection_control"].includes(question?.nclexClientNeed) ? "moderate" : "standard",
    scores: {
      qualityScore,
      rationaleQualityScore,
      citationQualityScore,
      duplicateRiskScore,
      clinicalAccuracyScore,
      realismScore,
    },
    issues: allIssues,
    reviewerNotes: buildReviewerNotes(allIssues),
    source: {
      reviewStatus: question?.reviewStatus ?? "unknown",
      sourceStage: question?.sourceStage ?? "unknown",
      sourcePath: question?.sourcePath ?? null,
      duplicateFingerprint: buildRefinementFingerprint(question),
      angleSignature: question?.waveMetadata?.angleSignature ?? buildAngleSignature(question),
    },
    media: {
      diagramValidationStatus: mediaValidationStatus,
      hasVisualRationale: Boolean(question?.visualRationale),
      hasDiagramBlueprint: Boolean(question?.diagramBlueprint),
      hasChartDiagram: Boolean(question?.chartReview?.diagram),
    },
    citations: {
      count: Array.isArray(question?.references) ? question.references.length : 0,
      status: citationIssues.length ? "needs_review" : "format_ok",
      issues: citationIssues,
    },
    revisionHistory: [
      {
        at: new Date().toISOString(),
        action: "second_pass_audit",
        by: "deterministic-refinement-core",
        notes: allIssues.length ? allIssues.join(", ") : "No deterministic issues found.",
      },
    ],
  };
}

function inferNursingProcess(question) {
  const text = normalizeText(`${question?.stem ?? ""} ${question?.takeaway ?? ""} ${question?.speedCue ?? ""}`);
  if (/\bassess|recognize|which finding|cue|priority finding\b/.test(text)) return "assessment";
  if (/\bimplement|administer|take action|first action|intervene\b/.test(text)) return "implementation";
  if (/\bevaluate|effective|outcome|response\b/.test(text)) return "evaluation";
  if (/\bteach|educate|instruct|learning\b/.test(text)) return "teaching_learning";
  if (/\bplan|goal|expected outcome\b/.test(text)) return "planning";
  return "clinical_judgment";
}

function inferClinicalJudgmentArea(question) {
  const text = normalizeText(`${question?.stem ?? ""} ${question?.takeaway ?? ""} ${question?.speedCue ?? ""}`);
  if (/\bcue|finding|recognize|notice\b/.test(text)) return "recognize_cues";
  if (/\bpattern|interpret|means|conclusion\b/.test(text)) return "analyze_cues";
  if (/\bpriority|first|highest risk|urgent\b/.test(text)) return "prioritize_hypotheses";
  if (/\bsolution|expected outcome|plan\b/.test(text)) return "generate_solutions";
  if (/\baction|intervention|administer|notify|delegate\b/.test(text)) return "take_action";
  if (/\bevaluate|response|effective|monitor\b/.test(text)) return "evaluate_outcomes";
  return "not_classified";
}

function buildReviewerNotes(issues) {
  if (!issues.length) return ["Deterministic audit found no blocking issues; ready for sampled clinical review."];
  return issues.slice(0, 6).map((issue) => `Review ${issue.replace(/_/g, " ")}.`);
}

export function buildDuplicateCounts(questions) {
  const map = new Map();
  for (const question of questions) {
    const fingerprint = buildRefinementFingerprint(question);
    map.set(fingerprint, (map.get(fingerprint) ?? 0) + 1);
  }
  return map;
}

function countBy(items, getKey) {
  const output = {};
  for (const item of items) {
    const key = getKey(item) ?? "unknown";
    output[key] = (output[key] ?? 0) + 1;
  }
  return output;
}

function buildDeficits(approvedItems, targetCount, targets, getKey) {
  const current = countBy(approvedItems, getKey);
  return Object.entries(targets)
    .map(([key, ratio]) => {
      const target = Math.round(targetCount * ratio);
      const live = current[key] ?? 0;
      return { key, target, live, deficit: Math.max(0, target - live) };
    })
    .filter((item) => item.deficit > 0)
    .sort((left, right) => right.deficit - left.deficit);
}

export function buildRefinementReport(questions, options = {}) {
  const generatedAt = new Date().toISOString();
  const targetCount = options.targetCount ?? TARGET_APPROVED_UNIQUE;
  const duplicateCounts = buildDuplicateCounts(questions);
  const manifest = questions.map((question) => assessQuestion(question, duplicateCounts.get(buildRefinementFingerprint(question)) ?? 1));
  const usableQuestionIds = new Set(
    manifest
      .filter((entry) => ["approved", "refined"].includes(entry.status))
      .filter((entry) => entry.scores.qualityScore >= 74)
      .filter((entry) => entry.scores.clinicalAccuracyScore >= 75)
      .filter((entry) => entry.scores.duplicateRiskScore < 50)
      .map((entry) => entry.questionId),
  );
  const approvedItems = questions.filter((question) => usableQuestionIds.has(question.id));
  const typeMix = countBy(approvedItems, (question) => question.type ?? "mcq");
  const clientNeedMix = countBy(approvedItems, (question) => question.nclexClientNeed ?? "missing");
  const topUpNeeded = usableQuestionIds.size < targetCount;
  const statusCounts = countBy(manifest, (entry) => entry.status);
  const issueCounts = countBy(manifest.flatMap((entry) => entry.issues), (issue) => issue);

  return {
    generatedAt,
    exam: "nclex",
    policy: {
      rawBulkBatching: "disabled",
      targetApprovedRefinedUnique: targetCount,
      governingSources: [
        "https://www.ncsbn.org/publications/2026-nclex-rn-test-plan",
        "https://www.ncsbn.org/public-files/2026_RN_Test-Plan_English-F.pdf",
        "https://www.nclex.com/clinical-judgment-measurement-model.page",
      ],
    },
    summary: {
      sourceCount: questions.length,
      uniqueIds: new Set(questions.map((question) => question.id)).size,
      approvedRefinedUsableUnique: usableQuestionIds.size,
      needsReview: statusCounts.needs_review ?? 0,
      approved: statusCounts.approved ?? 0,
      refined: statusCounts.refined ?? 0,
      rejected: statusCounts.rejected ?? 0,
      topUpNeeded,
      remainingTo5000: Math.max(0, targetCount - usableQuestionIds.size),
    },
    mix: {
      typeMix,
      clientNeedMix,
      ngnCoreCount: approvedItems.filter((question) => ["case_study", "bow_tie", "matrix", "ordering"].includes(question.type)).length,
      ngnWithSataCount: approvedItems.filter((question) => ["case_study", "bow_tie", "matrix", "ordering", "sata"].includes(question.type)).length,
      chartReviewCount: approvedItems.filter((question) => question.chartReview).length,
      diagramCount: approvedItems.filter((question) => question.visualRationale || question.diagramBlueprint || question.chartReview?.diagram).length,
      citedCount: approvedItems.filter((question) => (question.references ?? []).length).length,
    },
    topUp: {
      status: topUpNeeded ? "top_up_needed_after_refinement" : "target_met_no_batching_needed",
      itemDeficits: buildDeficits(approvedItems, targetCount, TYPE_TARGETS, (question) => question.type ?? "mcq"),
      clientNeedDeficits: buildDeficits(approvedItems, targetCount, CLIENT_NEED_TARGETS, (question) => question.nclexClientNeed ?? "missing"),
      nextAction: topUpNeeded
        ? "Do not run blind bulk batching. Use these deficits to allocate reviewed, non-overlapping refinement/generation slices only after the flagged existing bank is reviewed."
        : "Keep generation disabled and continue sampled quality audits.",
    },
    issueCounts,
    manifest,
  };
}
