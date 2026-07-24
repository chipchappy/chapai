import { getQuestionQualityProfile, qualityFirstShuffle, type QualityQuestionLike } from "./question-quality";
import { isClinicalEntryDuplicate } from "./clinical-chart-sections";
import { seededShuffle } from "./seeded-random";

export const CJMM_STEP_ORDER = [
  "recognize-cues",
  "analyze-cues",
  "prioritize-hypotheses",
  "generate-solutions",
  "take-actions",
  "evaluate-outcomes",
] as const;

type CaseStudyQuestionLike = QualityQuestionLike & {
  caseItemNumber?: number | null;
};

function normalizedEntry(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function containsPriorEntries(current: readonly string[], prior: readonly string[]) {
  const currentEntries = new Set(current.map(normalizedEntry));
  return prior.every((entry) => currentEntries.has(normalizedEntry(entry)));
}

export function getCaseStudyReleaseIssues<T extends CaseStudyQuestionLike>(items: readonly T[]) {
  const grouped = new Map<string, T[]>();
  for (const question of items) {
    if (!question.caseStudyId) continue;
    const group = grouped.get(question.caseStudyId) ?? [];
    group.push(question);
    grouped.set(question.caseStudyId, group);
  }

  const issues: string[] = [];
  for (const [caseStudyId, rawQuestions] of grouped) {
    if (rawQuestions.length !== CJMM_STEP_ORDER.length) {
      issues.push(`${caseStudyId}: expected 6 items, found ${rawQuestions.length}`);
      continue;
    }

    const questions = sortCaseStudyItems(rawQuestions);
    const itemNumbers = questions.map((question) => question.caseItemNumber);
    const expectedNumbers = CJMM_STEP_ORDER.map((_, index) => index + 1);
    if (itemNumbers.some((itemNumber, index) => itemNumber !== expectedNumbers[index])) {
      issues.push(`${caseStudyId}: case item numbers must be 1 through 6`);
    }
    if (questions.some((question, index) => question.cjmmStep !== CJMM_STEP_ORDER[index])) {
      issues.push(`${caseStudyId}: CJMM steps are incomplete or out of order`);
    }
    if (new Set(questions.map((question) => normalizedEntry(String(question.rationale ?? "")))).size !== questions.length) {
      issues.push(`${caseStudyId}: rationale text is duplicated across case items`);
    }

    for (const [index, question] of questions.entries()) {
      const itemLabel = `${caseStudyId}: item ${index + 1}`;
      const chart = question.chartReview;
      const hpi = chart?.hpi ?? [];
      const notes = chart?.nursingNotes ?? chart?.notes ?? [];
      const timeline = chart?.unfoldingTimeline ?? [];

      if (hpi.length < 3) issues.push(`${itemLabel}: HPI requires at least 3 distinct entries`);
      if (notes.length < 2) issues.push(`${itemLabel}: nursing notes require at least 2 entries`);
      if (timeline.length < 1) issues.push(`${itemLabel}: unfolding timeline is missing`);
      if (hpi.some((hpiEntry) => notes.some((note) => isClinicalEntryDuplicate(hpiEntry, note)))) {
        issues.push(`${itemLabel}: HPI and nursing notes contain duplicated clinical text`);
      }

      const profile = getQuestionQualityProfile(question);
      if (profile.tier > 1) issues.push(`${itemLabel}: quality tier ${profile.tier} is below the case release threshold`);
      if (!profile.hasStructuredTeaching) issues.push(`${itemLabel}: structured teaching is incomplete`);
      if (!profile.hasReferences || (question.references?.length ?? 0) < 2) {
        issues.push(`${itemLabel}: at least 2 source references are required`);
      }
      if (!profile.hasVisual) issues.push(`${itemLabel}: visual rationale is missing`);
      if (!["source-verified", "clinician-reviewed"].includes(String(question.qualityMetadata?.evidenceStatus ?? ""))) {
        issues.push(`${itemLabel}: evidence status is not release eligible`);
      }
      if (question.qualityMetadata?.clinicalReviewStatus === "changes-requested") {
        issues.push(`${itemLabel}: clinical review requested changes`);
      }
      if (!question.qualityMetadata?.psychometricStatus) {
        issues.push(`${itemLabel}: psychometric lifecycle status is missing`);
      }

      if (index === 0) continue;
      const priorChart = questions[index - 1].chartReview;
      const priorNotes = priorChart?.nursingNotes ?? priorChart?.notes ?? [];
      const priorTimeline = priorChart?.unfoldingTimeline ?? [];
      if (!containsPriorEntries(notes, priorNotes)) {
        issues.push(`${itemLabel}: nursing record removes previously disclosed information`);
      }
      if (!containsPriorEntries(timeline, priorTimeline)) {
        issues.push(`${itemLabel}: unfolding timeline removes previously disclosed information`);
      }
    }
  }

  return issues;
}

function caseStepIndex(question: CaseStudyQuestionLike) {
  if (typeof question.caseItemNumber === "number") return question.caseItemNumber - 1;
  return CJMM_STEP_ORDER.indexOf(question.cjmmStep as (typeof CJMM_STEP_ORDER)[number]);
}

export function sortCaseStudyItems<T extends CaseStudyQuestionLike>(items: readonly T[]) {
  return [...items].sort((left, right) => caseStepIndex(left) - caseStepIndex(right));
}

export function getCompleteCaseStudyGroups<T extends CaseStudyQuestionLike>(items: readonly T[]) {
  const grouped = new Map<string, T[]>();
  for (const question of items) {
    if (!question.caseStudyId) continue;
    const group = grouped.get(question.caseStudyId) ?? [];
    group.push(question);
    grouped.set(question.caseStudyId, group);
  }

  return [...grouped.entries()]
    .filter(([, group]) => {
      if (group.length !== CJMM_STEP_ORDER.length) return false;
      const steps = new Set(group.map((question) => question.cjmmStep));
      return CJMM_STEP_ORDER.every((step) => steps.has(step));
    })
    .map(([id, group]) => ({ id, questions: sortCaseStudyItems(group) }));
}

export function getCaseStudyEligibleQuestions<T extends CaseStudyQuestionLike>(items: readonly T[]) {
  const completeIds = new Set(getCompleteCaseStudyGroups(items).map((group) => group.id));
  return items.filter((question) => {
    const labelledCase = question.type === "case_study" || question.kind === "case-study" || Boolean(question.caseStudyId);
    if (!labelledCase) return true;
    return Boolean(question.caseStudyId && completeIds.has(question.caseStudyId));
  });
}

export function selectCompleteCaseStudyGroups<T extends CaseStudyQuestionLike>(
  items: readonly T[],
  count: number,
  seed: string,
) {
  const groups = seededShuffle(getCompleteCaseStudyGroups(items), `${seed}:case-groups`)
    .sort((left, right) => {
      const leftScore = left.questions.reduce((total, question) => total + getQuestionQualityProfile(question).score, 0);
      const rightScore = right.questions.reduce((total, question) => total + getQuestionQualityProfile(question).score, 0);
      return rightScore - leftScore;
    });

  const selected: T[] = [];
  for (const group of groups) {
    if (selected.length > 0 && selected.length + group.questions.length > count) break;
    selected.push(...group.questions);
    if (selected.length >= count) break;
  }
  return selected;
}

export function shuffleQuestionBlocks<T extends CaseStudyQuestionLike>(items: readonly T[], seed: string) {
  const completeGroups = getCompleteCaseStudyGroups(items);
  const caseIds = new Set(completeGroups.map((group) => group.id));
  const blocks: T[][] = completeGroups.map((group) => group.questions);

  for (const question of items) {
    if (!question.caseStudyId || !caseIds.has(question.caseStudyId)) {
      blocks.push([question]);
    }
  }

  return seededShuffle(blocks, `${seed}:blocks`).flatMap((block) => (
    block.length === 1 ? block : sortCaseStudyItems(block)
  ));
}

export function qualityFirstCaseGroups<T extends CaseStudyQuestionLike>(items: readonly T[], seed: string) {
  return seededShuffle(getCompleteCaseStudyGroups(items), `${seed}:quality-case-groups`)
    .map((group) => ({
      ...group,
      questions: qualityFirstShuffle(group.questions, `${seed}:${group.id}`).sort(
        (left, right) => caseStepIndex(left) - caseStepIndex(right),
      ),
    }))
    .sort((left, right) => {
      const leftScore = left.questions.reduce((total, question) => total + getQuestionQualityProfile(question).score, 0);
      const rightScore = right.questions.reduce((total, question) => total + getQuestionQualityProfile(question).score, 0);
      return rightScore - leftScore;
    });
}
