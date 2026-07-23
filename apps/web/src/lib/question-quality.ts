import { seededShuffle } from "./seeded-random";

type AnswerLike = string | string[] | Record<string, string | string[]> | null | undefined;

export type QualityQuestionLike = {
  id: string;
  type?: string | null;
  kind?: string | null;
  reviewStatus?: string | null;
  rationale?: string | null;
  deepRationale?: string | null;
  structuredRationale?: {
    overview?: string | null;
    mechanism?: string | null;
    whyCorrect?: string | null;
    whyWrong?: Record<string, string> | null;
    citations?: unknown[] | null;
  } | null;
  distractorRationales?: Record<string, string> | null;
  options?: Array<{ id: string; text: string }> | null;
  answer?: AnswerLike;
  correctAnswer?: AnswerLike;
  references?: unknown[] | null;
  visualRationale?: unknown;
  caseStudyId?: string | null;
  cjmmStep?: string | null;
  scenario?: string | null;
  exhibits?: unknown[] | null;
  chartReview?: {
    hpi?: string[] | null;
    history?: string[] | null;
    notes?: string[] | null;
    nursingNotes?: string[] | null;
    vitals?: unknown[] | null;
    labs?: unknown[] | null;
    orders?: string[] | null;
    providerOrders?: string[] | null;
  } | null;
};

export type QuestionQualityProfile = {
  score: number;
  tier: 0 | 1 | 2 | 3 | 4;
  rationaleWords: number;
  distractorCoverage: number;
  hasStructuredTeaching: boolean;
  hasReferences: boolean;
  hasVisual: boolean;
  hasRichCaseContext: boolean;
  risks: string[];
};

const PLACEHOLDER_RATIONALE = /\b(?:n\/a|not applicable|no rationale|rationale unavailable|this is (?:a )?correct choice|this choice is correct)\b/i;
const GENERIC_RATIONALE = /^(?:the correct answer is|this option is correct|this is the best answer)[^.]{0,80}\.?$/i;

function wordCount(value: string | null | undefined) {
  return String(value ?? "").trim().split(/\s+/).filter(Boolean).length;
}

function usableTeachingText(value: string | null | undefined, minimumWords = 8) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return wordCount(text) >= minimumWords
    && !PLACEHOLDER_RATIONALE.test(text)
    && !GENERIC_RATIONALE.test(text);
}

function answerIds(answer: AnswerLike) {
  if (Array.isArray(answer)) return new Set(answer.map((value) => String(value).toLowerCase()));
  if (typeof answer === "string") return new Set([answer.toLowerCase()]);
  return new Set<string>();
}

function getDistractorCoverage(question: QualityQuestionLike) {
  const kind = question.kind ?? question.type ?? "mcq";
  if (kind === "matrix" || kind === "ordering" || kind === "bow-tie" || kind === "bow_tie") {
    const structuredCount = Object.values(question.structuredRationale?.whyWrong ?? {}).filter((text) => usableTeachingText(text, 6)).length;
    return structuredCount > 0 ? 1 : 0;
  }

  const correct = answerIds(question.correctAnswer ?? question.answer);
  const distractorIds = (question.options ?? [])
    .map((option) => option.id.toLowerCase())
    .filter((id) => !correct.has(id));
  if (distractorIds.length === 0) return 0;

  const authored = {
    ...(question.structuredRationale?.whyWrong ?? {}),
    ...(question.distractorRationales ?? {}),
  };
  const covered = distractorIds.filter((id) => {
    const text = authored[id]
      ?? authored[id.toUpperCase()];
    return usableTeachingText(text, 6);
  }).length;
  return covered / distractorIds.length;
}

function hasRichCaseContext(question: QualityQuestionLike) {
  if (!question.caseStudyId && question.type !== "case_study" && question.kind !== "case-study") return false;
  const chart = question.chartReview;
  const hpiCount = (chart?.hpi?.length ?? 0) + (chart?.history?.length ?? 0);
  const notesCount = (chart?.notes?.length ?? 0) + (chart?.nursingNotes?.length ?? 0);
  const chartDataCount = (chart?.vitals?.length ?? 0)
    + (chart?.labs?.length ?? 0)
    + (chart?.orders?.length ?? 0)
    + (chart?.providerOrders?.length ?? 0);
  const hasStructuredChart = hpiCount >= 2 && notesCount >= 1 && chartDataCount >= 3;
  const hasExhibitSet = String(question.scenario ?? "").trim().length >= 80
    && (question.exhibits?.length ?? 0) >= 3;
  return hasStructuredChart || hasExhibitSet;
}

export function getQuestionQualityProfile(question: QualityQuestionLike): QuestionQualityProfile {
  const rationale = String(question.deepRationale ?? question.rationale ?? "").trim();
  const rationaleWords = wordCount(rationale);
  const risks: string[] = [];
  let score = 0;

  if (question.reviewStatus === "final-curated-live") score += 25;
  else if (question.reviewStatus === "curated-live") score += 14;
  else if (question.reviewStatus === "approved") score += 6;

  if (rationaleWords >= 140) score += 20;
  else if (rationaleWords >= 90) score += 16;
  else if (rationaleWords >= 55) score += 11;
  else if (rationaleWords >= 30) score += 6;

  if (!usableTeachingText(rationale, 20)) {
    risks.push("weak-rationale");
    score -= 20;
  }
  if (PLACEHOLDER_RATIONALE.test(rationale)) {
    risks.push("placeholder-rationale");
    score -= 30;
  }

  const structured = question.structuredRationale;
  const hasStructuredTeaching = Boolean(
    usableTeachingText(structured?.overview, 12)
      && usableTeachingText(structured?.mechanism, 12)
      && usableTeachingText(structured?.whyCorrect, 10),
  );
  if (hasStructuredTeaching) score += 20;

  const distractorCoverage = getDistractorCoverage(question);
  score += Math.round(distractorCoverage * 15);
  if (distractorCoverage < 0.66 && (question.options?.length ?? 0) >= 3) {
    risks.push("incomplete-distractor-teaching");
  }

  const hasReferences = (question.references?.length ?? 0) > 0
    || (structured?.citations?.length ?? 0) > 0;
  if (hasReferences) score += 10;

  const hasVisual = Boolean(question.visualRationale);
  if (hasVisual) score += 5;

  const hasCaseShape = Boolean(question.caseStudyId || question.type === "case_study" || question.kind === "case-study");
  const richCaseContext = hasRichCaseContext(question);
  if (richCaseContext) score += 5;
  else if (hasCaseShape) {
    risks.push("incomplete-case-context");
    score -= 20;
  }

  const normalizedScore = Math.max(0, Math.min(100, score));
  const tier: QuestionQualityProfile["tier"] =
    risks.includes("placeholder-rationale") ? 4
    : normalizedScore >= 78 ? 0
    : normalizedScore >= 62 ? 1
    : normalizedScore >= 44 ? 2
    : normalizedScore >= 28 ? 3
    : 4;

  return {
    score: normalizedScore,
    tier,
    rationaleWords,
    distractorCoverage,
    hasStructuredTeaching,
    hasReferences,
    hasVisual,
    hasRichCaseContext: richCaseContext,
    risks,
  };
}

function rankedQualityItems<T extends QualityQuestionLike>(items: readonly T[], seed: string) {
  return seededShuffle(items, seed)
    .map((question) => ({ question, profile: getQuestionQualityProfile(question) }))
    .sort((left, right) => {
      if (left.profile.tier !== right.profile.tier) return left.profile.tier - right.profile.tier;

      // Keep meaningful quality differences while allowing varied order inside a
      // narrow band so students do not receive identical sessions.
      const leftBand = Math.floor(left.profile.score / 8);
      const rightBand = Math.floor(right.profile.score / 8);
      return rightBand - leftBand;
    });
}

export function qualityFirstShuffle<T extends QualityQuestionLike>(items: readonly T[], seed: string) {
  return rankedQualityItems(items, seed).map(({ question }) => question);
}

function questionFormat(question: QualityQuestionLike) {
  const format = String(question.kind ?? question.type ?? "mcq").toLowerCase().replace(/_/g, "-");
  if (format === "sata" || format === "multi-select") return "sata";
  if (format === "case-study") return "case-study";
  if (format === "bow-tie") return "bow-tie";
  if (format === "matrix" || format === "ordering") return format;
  return "mcq";
}

export function qualityFirstDiverseOrder<T extends QualityQuestionLike>(items: readonly T[], seed: string) {
  const ranked = rankedQualityItems(items, seed);
  const ordered: T[] = [];

  for (const tier of [0, 1, 2, 3, 4] as const) {
    const tierItems = ranked
      .filter(({ profile }) => profile.tier === tier)
      .map(({ question }) => question);
    const firstByFormat = new Map<string, T>();
    for (const question of tierItems) {
      const format = questionFormat(question);
      if (!firstByFormat.has(format)) firstByFormat.set(format, question);
    }

    const formatLeaders = seededShuffle([...firstByFormat.values()], `${seed}:tier:${tier}:formats`);
    const leaderIds = new Set(formatLeaders.map((question) => question.id));
    ordered.push(...formatLeaders, ...tierItems.filter((question) => !leaderIds.has(question.id)));
  }

  return ordered;
}
