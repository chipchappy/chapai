import type { PracticeQuestion } from "@/lib/practice-types";
import type { QuizQuestion } from "@/lib/types";

type QuestionKindLike =
  | QuizQuestion["type"]
  | PracticeQuestion["kind"]
  | "multi-select"
  | "bow-tie";

type QuestionLike = {
  type?: QuizQuestion["type"];
  kind?: PracticeQuestion["kind"];
  stem?: string | null;
  options?: Array<{ id: string; text: string }> | null;
  answer?: QuizQuestion["answer"] | null;
  correctAnswer?: PracticeQuestion["correctAnswer"] | null;
  scenarioTitle?: string | null;
  scenario?: string | null;
  additionalInfo?: string | null;
  exhibits?: Array<{
    type: "note" | "timeline" | "labs" | "vitals" | "orders" | "assessment";
    title: string;
    body?: string;
    items?: string[] | string;
  }> | null;
  matrixColumns?: string[] | null;
  matrixRows?: Array<{ label: string; answer: string }> | null;
  bowTie?: {
    center?: unknown;
    leftActions?: unknown[];
    rightMonitoring?: unknown[];
  } | null;
};

export type QuestionIntelTab = "prompt" | "chart" | "labs" | "orders" | "notes" | "rationale" | "sources";

function resolveKind(question: QuestionLike): QuestionKindLike {
  if (question.kind) {
    return question.kind;
  }
  if (question.type === "sata") {
    return "multi-select";
  }
  if (question.type === "bow_tie") {
    return "bow-tie";
  }
  return question.type ?? "mcq";
}

function answerLength(question: QuestionLike) {
  const answer = question.answer ?? question.correctAnswer;
  if (Array.isArray(answer)) {
    return answer.length;
  }
  if (answer && typeof answer === "object") {
    return Object.keys(answer).length;
  }
  return String(answer ?? "").trim().length > 0 ? 1 : 0;
}

function exhibitCount(question: QuestionLike, type?: NonNullable<QuestionLike["exhibits"]>[number]["type"]) {
  const exhibits = question.exhibits ?? [];
  if (!type) {
    return exhibits.length;
  }
  return exhibits.filter((exhibit) => exhibit.type === type).length;
}

function hasCaseIntel(question: QuestionLike) {
  return Boolean(
    question.scenarioTitle
      || question.scenario
      || question.additionalInfo
      || exhibitCount(question) > 0,
  );
}

function hasBowTieStructure(question: QuestionLike) {
  return Boolean(
    question.bowTie?.center
      && (question.bowTie.leftActions?.length ?? 0) >= 4
      && (question.bowTie.rightMonitoring?.length ?? 0) >= 4,
  );
}

export function getQuestionIntegrityIssues(question: QuestionLike) {
  const issues: string[] = [];
  const kind = resolveKind(question);

  if (!String(question.stem ?? "").trim()) {
    issues.push("missing-stem");
  }

  if ((kind === "mcq" || kind === "multi-select" || kind === "case-study" || kind === "bow-tie")
    && !(kind === "bow-tie" && hasBowTieStructure(question))
    && (question.options?.length ?? 0) < 2) {
    issues.push("missing-options");
  }

  if (kind === "multi-select" && answerLength(question) === 0) {
    issues.push("missing-multi-answer");
  }

  if (kind === "ordering") {
    if ((question.options?.length ?? 0) < 2) {
      issues.push("missing-ordering-options");
    }
    if (answerLength(question) < 2) {
      issues.push("missing-ordering-answer");
    }
  }

  if (kind === "matrix") {
    if ((question.matrixColumns?.length ?? 0) === 0) {
      issues.push("missing-matrix-columns");
    }
    if ((question.matrixRows?.length ?? 0) === 0) {
      issues.push("missing-matrix-rows");
    }
  }

  if (kind === "case-study" && !hasCaseIntel(question)) {
    issues.push("missing-case-intel");
  }

  if (kind === "bow-tie" && !hasBowTieStructure(question) && !hasCaseIntel(question) && (question.options?.length ?? 0) < 3) {
    issues.push("missing-bow-tie-context");
  }

  return issues;
}

export function isQuestionRenderable(question: QuestionLike) {
  return getQuestionIntegrityIssues(question).length === 0;
}

export function getPreferredIntelTab(question: QuestionLike, answered = false): QuestionIntelTab {
  if (answered) {
    return "rationale";
  }
  if (exhibitCount(question, "labs") > 0) {
    return "labs";
  }
  if (exhibitCount(question, "timeline") > 0 || exhibitCount(question, "assessment") > 0) {
    return "chart";
  }
  if (exhibitCount(question, "orders") > 0) {
    return "orders";
  }
  if (hasCaseIntel(question)) {
    return "notes";
  }
  return "prompt";
}
