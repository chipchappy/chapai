import type { Exam, QuestionAnswer, QuizQuestion, QuizResults, QuizSessionConfig } from "@/lib/types";
import { getQuestionBank } from "@/lib/content-bank";
import { matchesQuestionCategory } from "@/lib/nclex-client-needs";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

type LocalAnswer = {
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  timeSpentMs?: number;
};

type LocalSession = {
  id: string;
  exam: Exam;
  category?: string;
  totalQuestions: number;
  questionIds: string[];
  startedAt: number;
  completedAt?: number;
  answers: LocalAnswer[];
};

type LocalStore = {
  sessions: Record<string, LocalSession>;
};

function workspaceRoot() {
  let current = process.cwd();
  for (let i = 0; i < 6; i += 1) {
    if (fs.existsSync(path.join(current, "packages", "content"))) {
      return current;
    }
    const next = path.dirname(current);
    if (next === current) {
      break;
    }
    current = next;
  }
  return process.cwd();
}

function storePath() {
  const root = workspaceRoot();
  return path.join(root, ".local-state", "quiz-sessions.json");
}

function loadStore(): LocalStore {
  const filePath = storePath();
  if (!fs.existsSync(filePath)) {
    return { sessions: {} };
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as LocalStore;
  } catch {
    return { sessions: {} };
  }
}

function saveStore(store: LocalStore) {
  const filePath = storePath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2) + "\n", "utf8");
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function matchesQuizFilters(question: QuizQuestion, config: QuizSessionConfig) {
  const questionType = config.questionType ?? config.type;

  if (!matchesQuestionCategory(question, config.category)) {
    return false;
  }

  if (questionType && question.type !== questionType) {
    return false;
  }

  if (config.ngnOnly && question.type === "mcq") {
    return false;
  }

  return true;
}

function serializeAnswer(answer: QuestionAnswer) {
  if (Array.isArray(answer)) {
    return JSON.stringify(answer);
  }

  if (answer && typeof answer === "object") {
    return JSON.stringify(answer);
  }

  return String(answer ?? "");
}

function parseComparableAnswer(input: QuestionAnswer | string | null | undefined) {
  if (Array.isArray(input)) {
    return [...input]
      .map((item) => String(item).trim().toLowerCase())
      .filter(Boolean)
      .sort();
  }

  if (input && typeof input === "object") {
    return Object.entries(input)
      .map(([key, value]) => `${String(key).trim().toLowerCase()}:${String(value).trim().toLowerCase()}`)
      .sort();
  }

  const raw = String(input ?? "").trim();
  if (!raw) {
    return "";
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return [...parsed]
        .map((item) => String(item).trim().toLowerCase())
        .sort();
    }
    if (parsed && typeof parsed === "object") {
      return Object.entries(parsed as Record<string, unknown>)
        .map(([key, value]) => `${String(key).trim().toLowerCase()}:${String(value).trim().toLowerCase()}`)
        .sort();
    }
  } catch {
    // fall through to scalar handling
  }

  if (raw.includes(",")) {
    return raw
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
      .sort();
  }

  return raw.toLowerCase();
}

function answersMatch(left: QuestionAnswer | string, right: QuestionAnswer | string) {
  const normalizedLeft = parseComparableAnswer(left);
  const normalizedRight = parseComparableAnswer(right);

  if (Array.isArray(normalizedLeft) && Array.isArray(normalizedRight)) {
    return normalizedLeft.length === normalizedRight.length
      && normalizedLeft.every((value, index) => value === normalizedRight[index]);
  }

  return normalizedLeft === normalizedRight;
}

export function startLocalSession(config: QuizSessionConfig) {
  const bank = getQuestionBank(config.exam);
  const filtered = bank.filter((question) => matchesQuizFilters(question, config));
  const deduped = [...new Map(filtered.map((question) => [question.id, question])).values()];
  const questions = shuffle(deduped).slice(0, config.count);

  if (questions.length === 0) {
    return null;
  }

  const store = loadStore();
  const sessionId = crypto.randomUUID();
  store.sessions[sessionId] = {
    id: sessionId,
    exam: config.exam,
    category: config.category,
    totalQuestions: questions.length,
    questionIds: questions.map((question) => question.id),
    startedAt: Date.now(),
    answers: [],
  };
  saveStore(store);

  return { sessionId, questions };
}

export function answerLocalSession(params: {
  sessionId: string;
  questionId: string;
  selectedAnswer: string | QuestionAnswer;
  timeSpentMs?: number;
}) {
  const store = loadStore();
  const session = store.sessions[params.sessionId];
  if (!session) {
    return null;
  }

  const question = getQuestionBank(session.exam).find((candidate) => candidate.id === params.questionId);
  if (!question) {
    return null;
  }

  const isCorrect = answersMatch(params.selectedAnswer, question.answer);
  const existingIndex = session.answers.findIndex((answer) => answer.questionId === params.questionId);
  const payload = {
    questionId: params.questionId,
    selectedAnswer: serializeAnswer(params.selectedAnswer),
    isCorrect,
    timeSpentMs: params.timeSpentMs,
  };

  if (existingIndex >= 0) {
    session.answers[existingIndex] = payload;
  } else {
    session.answers.push(payload);
  }

  if (session.answers.length >= session.totalQuestions) {
    session.completedAt = Date.now();
  }

  store.sessions[params.sessionId] = session;
  saveStore(store);

  return {
    question,
    isCorrect,
  };
}

export function resultsForLocalSession(sessionId: string): QuizResults | null {
  const store = loadStore();
  const session = store.sessions[sessionId];
  if (!session) {
    return null;
  }

  const bank = getQuestionBank(session.exam);
  const questions = session.questionIds
    .map((questionId) => bank.find((question) => question.id === questionId))
    .filter(Boolean) as QuizQuestion[];

  const byCategory: Record<string, { correct: number; total: number }> = {};
  for (const question of questions) {
    const category = question.category;
    if (!byCategory[category]) {
      byCategory[category] = { correct: 0, total: 0 };
    }
    byCategory[category].total += 1;
    const answer = session.answers.find((entry) => entry.questionId === question.id);
    if (answer?.isCorrect) {
      byCategory[category].correct += 1;
    }
  }

  const correctCount = session.answers.filter((answer) => answer.isCorrect).length;
  const weakCategories = Object.entries(byCategory)
    .filter(([, value]) => value.total > 0 && value.correct / value.total < 0.6)
    .map(([category]) => category);

  return {
    sessionId,
    score: session.totalQuestions > 0 ? Math.round((correctCount / session.totalQuestions) * 100) : 0,
    totalQuestions: session.totalQuestions,
    correctCount,
    byCategory,
    timeSpentMs: (session.completedAt ?? Date.now()) - session.startedAt,
    weakCategories,
  };
}
