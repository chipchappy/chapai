import type {
  PracticeAnswer,
  PracticeAnswerRecord,
  PracticeEvaluation,
  PracticeQuestion,
  PracticeSessionState,
} from "@/lib/practice-types";

export const PRACTICE_STORAGE_KEY = "clarity-practice-center:v1";

export type PracticePhase = "catalog" | "active" | "review" | "results";

export interface PracticeRuntimeState {
  phase: PracticePhase;
  session: PracticeSessionState | null;
  activeAnswer: PracticeAnswer;
  tutorOpen: boolean;
  tutorQuestionId: string | null;
}

export type PracticeAction =
  | { type: "hydrate"; payload: PracticeRuntimeState }
  | { type: "reset" }
  | { type: "open-catalog" }
  | { type: "start-session"; payload: PracticeSessionState }
  | { type: "set-answer"; payload: PracticeAnswer }
  | { type: "toggle-flag"; questionId: string }
  | { type: "set-index"; index: number }
  | { type: "submit-answer"; questionId: string; record: PracticeAnswerRecord }
  | { type: "finish-session"; finishedAt: number }
  | { type: "open-review" }
  | { type: "open-results" }
  | { type: "open-tutor"; questionId: string }
  | { type: "close-tutor" };

export function createEmptyRuntimeState(): PracticeRuntimeState {
  return {
    phase: "catalog",
    session: null,
    activeAnswer: "",
    tutorOpen: false,
    tutorQuestionId: null,
  };
}

function derivePhaseFromSession(session: PracticeSessionState | null): PracticePhase {
  if (!session) {
    return "catalog";
  }

  if (session.finishedAt) {
    return "results";
  }

  return session.reviewOnly ? "review" : "active";
}

function draftFromSession(session: PracticeSessionState | null, index?: number): PracticeAnswer {
  if (!session || typeof index !== "number") {
    return "";
  }

  const question = session.questions[index];
  if (!question) {
    return "";
  }

  return session.answers[question.id]?.selected ?? "";
}

export function normalizeAnswer(input: PracticeAnswer | undefined) {
  if (Array.isArray(input)) {
    return [...input].sort();
  }

  if (input && typeof input === "object") {
    return Object.fromEntries(Object.entries(input).sort(([left], [right]) => left.localeCompare(right)));
  }

  return typeof input === "string" ? input.trim().toLowerCase() : "";
}

function arraysMatch(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false;
  }

  const nextLeft = [...left].sort();
  const nextRight = [...right].sort();

  return nextLeft.every((value, index) => value.toLowerCase() === nextRight[index]?.toLowerCase());
}

function arraysMatchInOrder(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value.trim().toLowerCase() === right[index]?.trim().toLowerCase());
}

function normalizeRecordValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value.map((item) => item.trim().toLowerCase()).sort().join("|");
  }
  return String(value ?? "").trim().toLowerCase();
}

function recordsMatch(left: Record<string, string | string[]>, right: Record<string, string | string[]>) {
  const leftEntries = Object.entries(left);
  const rightEntries = Object.entries(right);

  if (leftEntries.length !== rightEntries.length) {
    return false;
  }

  return rightEntries.every(([key, value]) => normalizeRecordValue(left[key]) === normalizeRecordValue(value));
}

function bowTieAnswer(question: PracticeQuestion) {
  if (!question.bowTie) {
    return null;
  }

  return {
    center: question.bowTie.center.id,
    leftActions: question.bowTie.leftActions.filter((cell) => cell.isCorrect).map((cell) => cell.id),
    rightMonitoring: question.bowTie.rightMonitoring.filter((cell) => cell.isCorrect).map((cell) => cell.id),
  };
}

function bowTiePoints(selected: Record<string, string | string[]>, correctAnswer: Record<string, string | string[]>) {
  let earned = 0;
  if (normalizeRecordValue(selected.center) === normalizeRecordValue(correctAnswer.center)) {
    earned += 1;
  }

  const selectedLeft = new Set(Array.isArray(selected.leftActions) ? selected.leftActions.map(normalizeRecordValue) : []);
  const selectedRight = new Set(Array.isArray(selected.rightMonitoring) ? selected.rightMonitoring.map(normalizeRecordValue) : []);
  const correctLeft = Array.isArray(correctAnswer.leftActions) ? correctAnswer.leftActions.map(normalizeRecordValue) : [];
  const correctRight = Array.isArray(correctAnswer.rightMonitoring) ? correctAnswer.rightMonitoring.map(normalizeRecordValue) : [];
  earned += correctLeft.filter((id) => selectedLeft.has(id)).length;
  earned += correctRight.filter((id) => selectedRight.has(id)).length;

  return earned;
}

export function evaluateQuestion(question: PracticeQuestion, answer: PracticeAnswer): PracticeEvaluation {
  if (question.kind === "bow-tie" && question.bowTie) {
    const selected = (answer && typeof answer === "object" && !Array.isArray(answer) ? answer : {}) as Record<string, string | string[]>;
    const correctAnswer = bowTieAnswer(question);
    if (correctAnswer) {
      const pointsEarned = bowTiePoints(selected, correctAnswer);
      const pointsPossible = 5;
      return {
        correct: pointsEarned === pointsPossible,
        correctAnswer,
        pointsEarned,
        pointsPossible,
        partialCredit: pointsEarned / pointsPossible,
        rationale: question.rationale,
        takeaway: question.takeaway,
      };
    }
  }

  if (question.kind === "matrix") {
    const selected = (answer && typeof answer === "object" && !Array.isArray(answer) ? answer : {}) as Record<string, string | string[]>;
    const rows = question.matrixRows ?? [];
    const correct = rows.every((row) => String(selected[row.label] ?? "").toLowerCase() === row.answer.toLowerCase());
    return {
      correct,
      correctAnswer: Object.fromEntries(rows.map((row) => [row.label, row.answer])),
      rationale: question.rationale,
      takeaway: question.takeaway,
    };
  }

  if (question.kind === "ordering") {
    const selected = Array.isArray(answer)
      ? answer
      : typeof answer === "string" && answer
        ? answer.split(",").map((item) => item.trim()).filter(Boolean)
        : [];
    const correctAnswer = Array.isArray(question.correctAnswer) ? question.correctAnswer.map(String) : [String(question.correctAnswer)];
    return {
      correct: arraysMatchInOrder(selected, correctAnswer),
      correctAnswer,
      rationale: question.rationale,
      takeaway: question.takeaway,
    };
  }

  if (question.kind === "multi-select") {
    const selected = Array.isArray(answer)
      ? answer
      : typeof answer === "string" && answer
        ? answer.split(",").map((item) => item.trim()).filter(Boolean)
        : [];
    const correctAnswer = Array.isArray(question.correctAnswer) ? question.correctAnswer : [String(question.correctAnswer)];
    return {
      correct: arraysMatch(selected, correctAnswer),
      correctAnswer,
      rationale: question.rationale,
      takeaway: question.takeaway,
    };
  }

  if (question.correctAnswer && typeof question.correctAnswer === "object" && !Array.isArray(question.correctAnswer)) {
    const selected = (answer && typeof answer === "object" && !Array.isArray(answer) ? answer : {}) as Record<string, string | string[]>;
    const correctAnswer = question.correctAnswer as Record<string, string | string[]>;
    return {
      correct: recordsMatch(selected, correctAnswer),
      correctAnswer,
      rationale: question.rationale,
      takeaway: question.takeaway,
    };
  }

  if (Array.isArray(question.correctAnswer)) {
    const selected = Array.isArray(answer)
      ? answer
      : typeof answer === "string" && answer
        ? answer.split(",").map((item) => item.trim()).filter(Boolean)
        : [];
    const correctAnswer = question.correctAnswer.map(String);
    return {
      correct: arraysMatch(selected, correctAnswer),
      correctAnswer,
      rationale: question.rationale,
      takeaway: question.takeaway,
    };
  }

  const selected = typeof answer === "string" ? answer.trim().toLowerCase() : "";
  const correctAnswer = Array.isArray(question.correctAnswer) ? question.correctAnswer[0] ?? "" : String(question.correctAnswer);

  return {
    correct: selected === correctAnswer.trim().toLowerCase(),
    correctAnswer,
    rationale: question.rationale,
    takeaway: question.takeaway,
  };
}

export function buildQuestionRecord(question: PracticeQuestion, answer: PracticeAnswer): PracticeAnswerRecord {
  const evaluation = evaluateQuestion(question, answer);
  return {
    selected: answer,
    correct: evaluation.correct,
    correctAnswer: evaluation.correctAnswer,
    pointsEarned: evaluation.pointsEarned,
    pointsPossible: evaluation.pointsPossible,
    partialCredit: evaluation.partialCredit,
    rationale: evaluation.rationale,
    deepRationale: question.deepRationale,
    takeaway: evaluation.takeaway,
    distractorRationales: question.distractorRationales,
    references: question.references,
    studyResources: question.studyResources,
    coachingFrame: question.coachingFrame,
    visualRationale: question.visualRationale,
    diagramBlueprint: question.diagramBlueprint,
    submittedAt: Date.now(),
  };
}

export function computeSessionScore(session: PracticeSessionState) {
  const totalQuestions = session.questions.length;
  const earnedPoints = Object.values(session.answers).reduce((sum, entry) => sum + (entry.pointsEarned ?? (entry.correct ? 1 : 0)), 0);
  const possiblePoints = Object.values(session.answers).reduce((sum, entry) => sum + (entry.pointsPossible ?? 1), 0);
  const correctAnswers = earnedPoints;
  const score = possiblePoints > 0 ? Math.round((earnedPoints / possiblePoints) * 100) : 0;

  const categoryBreakdown: Record<string, { correct: number; total: number }> = {};

  for (const question of session.questions) {
    const bucket = categoryBreakdown[question.category] ?? { correct: 0, total: 0 };
    bucket.total += 1;
    if (session.answers[question.id]?.correct) {
      bucket.correct += 1;
    }
    categoryBreakdown[question.category] = bucket;
  }

  const weakCategories = Object.entries(categoryBreakdown)
    .filter(([, entry]) => entry.total > 0 && entry.correct / entry.total < 0.65)
    .map(([category]) => category);

  const missedQuestionIds = session.questions
    .filter((question) => session.answers[question.id] && !session.answers[question.id].correct)
    .map((question) => question.id);

  return {
    totalQuestions,
    correctAnswers,
    score,
    categoryBreakdown,
    weakCategories,
    missedQuestionIds,
  };
}

export function createSessionSnapshot(session: PracticeSessionState) {
  return JSON.stringify(session);
}

export function parseSessionSnapshot(snapshot: string | null) {
  if (!snapshot) {
    return null;
  }

  try {
    return JSON.parse(snapshot) as PracticeSessionState;
  } catch {
    return null;
  }
}

export function runtimeFromSnapshot(snapshot: string | null) {
  const session = parseSessionSnapshot(snapshot);
  if (!session) {
    return null;
  }

  const maxIndex = Math.max(0, session.questions.length - 1);
  const currentIndex = Math.min(Math.max(session.currentIndex ?? 0, 0), maxIndex);
  const normalizedSession = {
    ...session,
    currentIndex,
  };

  return {
    phase: derivePhaseFromSession(normalizedSession),
    session: normalizedSession,
    activeAnswer: draftFromSession(normalizedSession, normalizedSession.currentIndex),
    tutorOpen: false,
    tutorQuestionId: null,
  } satisfies PracticeRuntimeState;
}

export function practiceReducer(state: PracticeRuntimeState, action: PracticeAction): PracticeRuntimeState {
  switch (action.type) {
    case "hydrate":
      return action.payload;
    case "reset":
    case "open-catalog":
      return createEmptyRuntimeState();
    case "start-session":
      return {
        phase: derivePhaseFromSession(action.payload),
        session: action.payload,
        activeAnswer: draftFromSession(action.payload, action.payload.currentIndex),
        tutorOpen: false,
        tutorQuestionId: null,
      };
    case "set-answer":
      return {
        ...state,
        activeAnswer: action.payload,
      };
    case "toggle-flag": {
      if (!state.session) {
        return state;
      }

      const flaggedQuestionIds = state.session.flaggedQuestionIds.includes(action.questionId)
        ? state.session.flaggedQuestionIds.filter((id) => id !== action.questionId)
        : [...state.session.flaggedQuestionIds, action.questionId];

      return {
        ...state,
        session: {
          ...state.session,
          flaggedQuestionIds,
        },
      };
    }
    case "set-index": {
      if (!state.session) {
        return state;
      }

      return {
        ...state,
        session: {
          ...state.session,
          currentIndex: action.index,
        },
        activeAnswer: draftFromSession(state.session, action.index),
      };
    }
    case "submit-answer": {
      if (!state.session) {
        return state;
      }

      return {
        ...state,
        session: {
          ...state.session,
          answers: {
            ...state.session.answers,
            [action.questionId]: action.record,
          },
        },
      };
    }
    case "finish-session": {
      if (!state.session) {
        return state;
      }

      return {
        ...state,
        phase: "results",
        session: {
          ...state.session,
          finishedAt: action.finishedAt,
        },
        tutorOpen: false,
      };
    }
    case "open-review": {
      if (!state.session) {
        return state;
      }

      return {
        ...state,
        phase: "review",
        session: {
          ...state.session,
          reviewOnly: true,
        },
      };
    }
    case "open-results":
      return {
        ...state,
        phase: "results",
      };
    case "open-tutor":
      return {
        ...state,
        tutorOpen: true,
        tutorQuestionId: action.questionId,
      };
    case "close-tutor":
      return {
        ...state,
        tutorOpen: false,
        tutorQuestionId: null,
      };
    default:
      return state;
  }
}
