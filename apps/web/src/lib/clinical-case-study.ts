import { getQuestionQualityProfile, qualityFirstShuffle, type QualityQuestionLike } from "./question-quality";
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
  return getCompleteCaseStudyGroups(items)
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
