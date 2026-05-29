"use client";

import { useEffect, useMemo, useReducer, useRef, useState, useTransition } from "react";
import BrandMark from "@/components/brand/BrandMark";
import PracticeQuestionPane from "@/components/practice/PracticeQuestionPane";
import PracticeTutorDrawer from "@/components/practice/PracticeTutorDrawer";
import QuizTerminalShell from "./QuizTerminalShell";
import { getAccessibleQuestionBankCount } from "@/lib/launch-offers";
import {
  getPracticeCatalogCards,
  getPracticeExamDefinitions,
  getPracticeQuestionByMode,
  mapLiveQuestionBank,
  type PracticeCounts,
} from "@/lib/practice-data";
import { CCRN_CATEGORIES, NCLEX_CATEGORIES } from "@/lib/types";
import {
  PRACTICE_STORAGE_KEY,
  buildQuestionRecord,
  computeSessionScore,
  createEmptyRuntimeState,
  createSessionSnapshot,
  practiceReducer,
  runtimeFromSnapshot,
} from "@/lib/practice-session";
import type { Exam, QuestionType } from "@/lib/types";
import type { PracticeAnswer, PracticeExamDefinition, PracticeMode, PracticeQuestion, PracticeSessionState } from "@/lib/practice-types";

type Tier = "free" | "plus" | "pro";
type StudyTheme = "light" | "dark";

const STANDARD_COUNTS = [10, 20, 50] as const;
const STUDY_THEME_STORAGE_KEY = "chapai-study-theme";
const QUESTION_TYPE_OPTIONS: Array<{ value: QuestionType; label: string }> = [
  { value: "mcq", label: "MCQ" },
  { value: "sata", label: "SATA" },
  { value: "ordering", label: "Ordering" },
  { value: "matrix", label: "Matrix" },
  { value: "case_study", label: "Case study" },
  { value: "bow_tie", label: "Bow tie" },
];

function loadPracticeSnapshot() {
  try {
    return window.localStorage.getItem(PRACTICE_STORAGE_KEY) ?? window.sessionStorage.getItem(PRACTICE_STORAGE_KEY);
  } catch {
    try {
      return window.sessionStorage.getItem(PRACTICE_STORAGE_KEY);
    } catch {
      return null;
    }
  }
}

function savePracticeSnapshot(snapshot: string) {
  try {
    window.localStorage.setItem(PRACTICE_STORAGE_KEY, snapshot);
  } catch {
    // Fall back to tab-only persistence when durable browser storage is blocked.
  }

  try {
    window.sessionStorage.setItem(PRACTICE_STORAGE_KEY, snapshot);
  } catch {
    // Ignore storage access issues; the active in-memory session still works.
  }
}

const READINESS_ATTEMPTS_KEY = "chapai-readiness-attempts";

type ReadinessAttempt = {
  accuracy: number;
  correctAnswers: number;
  totalQuestions: number;
  takenAtMs: number;
};

function loadReadinessAttempts(): Record<string, ReadinessAttempt> {
  try {
    const raw = window.localStorage.getItem(READINESS_ATTEMPTS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

function saveReadinessAttempt(examId: string, attempt: ReadinessAttempt) {
  try {
    const current = loadReadinessAttempts();
    current[examId] = attempt;
    window.localStorage.setItem(READINESS_ATTEMPTS_KEY, JSON.stringify(current));
  } catch {
    // ignore — best-effort persistence
  }
}

function clearPracticeSnapshot() {
  try {
    window.localStorage.removeItem(PRACTICE_STORAGE_KEY);
  } catch {
    // Ignore storage access issues.
  }

  try {
    window.sessionStorage.removeItem(PRACTICE_STORAGE_KEY);
  } catch {
    // Ignore storage access issues.
  }
}

function sanitizeExam(value: string | undefined): Exam {
  return value === "ccrn" ? "ccrn" : "nclex";
}

function resolveAccessibleExam(value: string | undefined, accessExamTrack: "all" | "ccrn" | "nclex"): Exam {
  if (accessExamTrack === "ccrn" || accessExamTrack === "nclex") {
    return accessExamTrack;
  }
  return sanitizeExam(value);
}

function sanitizeMode(value: string | undefined): PracticeMode | null {
  if (value === "standard" || value === "chart" || value === "case-study" || value === "ngn" || value === "practice-exam") {
    return value;
  }
  return null;
}

function sanitizeQuestionType(value: string | undefined): QuestionType | "" {
  return QUESTION_TYPE_OPTIONS.some((option) => option.value === value) ? (value as QuestionType) : "";
}

function sanitizeNgnOnly(value: string | undefined) {
  return value === "1" || value === "true" || value === "yes";
}

function getCategoryOptions(exam: Exam) {
  const source = exam === "nclex" ? NCLEX_CATEGORIES : CCRN_CATEGORIES;
  return Object.entries(source).map(([value, meta]) => ({ value, label: meta.label }));
}

function getCategoryLabel(exam: Exam, category: string) {
  const source = (exam === "nclex" ? NCLEX_CATEGORIES : CCRN_CATEGORIES) as Record<string, { label: string }>;
  return source[category]?.label ?? category;
}

function createClientSession(input: {
  id?: string;
  mode: PracticeMode;
  exam: Exam;
  label: string;
  description: string;
  questions: PracticeQuestion[];
  timeLimitMinutes?: number;
  reviewOnly?: boolean;
}): PracticeSessionState {
  return {
    id: input.id ?? globalThis.crypto.randomUUID(),
    mode: input.mode,
    exam: input.exam,
    label: input.label,
    description: input.description,
    questions: input.questions,
    currentIndex: 0,
    startedAt: Date.now(),
    timeLimitMinutes: input.timeLimitMinutes,
    flaggedQuestionIds: [],
    answers: {},
    reviewOnly: input.reviewOnly,
  };
}

function hasDraftAnswer(answer: PracticeAnswer) {
  if (Array.isArray(answer)) {
    return answer.length > 0;
  }

  if (answer && typeof answer === "object") {
    return Object.keys(answer).length > 0;
  }

  return typeof answer === "string" && answer.trim().length > 0;
}

function formatTime(seconds: number) {
  const safe = Math.max(0, seconds);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

function createMissedReviewSession(session: PracticeSessionState) {
  const missedQuestions = session.questions.filter((question) => session.answers[question.id] && !session.answers[question.id].correct);

  if (missedQuestions.length === 0) {
    return null;
  }

  return createClientSession({
    mode: session.mode,
    exam: session.exam,
    label: `${session.label} missed review`,
    description: "Redo only the items you missed in the previous run.",
    questions: missedQuestions,
    reviewOnly: true,
    timeLimitMinutes: undefined,
  });
}

function getPremiumLockMessage(mode: "rich" | "practice-exams") {
  return mode === "practice-exams"
    ? "The 24-hour plans include 1 practice exam, the base plans include 2 practice exams on the purchased track, and Dual Premium unlocks all 5."
    : "Base plans and Dual Premium unlock chart mode, case flow, and NGN practice. The 24-hour plans stay focused on standard qbank sets and the included exam.";
}

function getPracticeExamStatusCopy(limit: number, total: number, canUseIcuSimBeta: boolean) {
  if (limit <= 0) {
    return "The 24-hour plans include 1 practice exam, the base plans include 2 practice exams on the purchased track, and Dual Premium unlocks all 5.";
  }

  if (limit >= total) {
    return canUseIcuSimBeta
      ? "This account can open all 5 timed exams and includes ICU clinical simulations beta."
      : `This account can open all ${total} timed practice exams.`;
  }

  return `This account can open ${limit} of ${total} timed practice exams. Upgrade for broader simulation access.`;
}

export default function QuizPage({
  tier,
  initialExam,
  initialMode,
  initialPracticeExam,
  initialCategory,
  initialQuestionType,
  initialNgnOnly,
  liveCounts,
  nclexStats,
  accessType,
  planCode,
  accessExamTrack,
  questionBankAccessPercent,
  canUseTutor,
  canUseRichModes,
  canUsePracticeExams,
  practiceExamLimit,
  canUseIcuSimBeta,
  canUseAdvancedAnalytics,
  categoryProgress = {},
  totalAnsweredByExam = { nclex: 0, ccrn: 0 },
  isAuthenticated = false,
  streakDays = 0,
  todayAnswered = 0,
  suggestedCategoryLabel = null,
  serverReadinessAttempts = {},
  willPersonalize = false,
  deepLinkQuestionId = null,
  deepLinkOpenTutor = false,
}: {
  tier: Tier;
  initialExam?: string;
  initialMode?: string;
  initialPracticeExam?: string;
  initialCategory?: string;
  initialQuestionType?: string;
  initialNgnOnly?: string;
  liveCounts: PracticeCounts;
  nclexStats: {
    mcqLive: number;
    ngnLive: number;
    ngnRatio: number;
  };
  accessType: string | null;
  planCode: string | null;
  accessExamTrack: "all" | "ccrn" | "nclex";
  questionBankAccessPercent: number;
  canUseTutor: boolean;
  canUseRichModes: boolean;
  canUsePracticeExams: boolean;
  practiceExamLimit: number;
  canUseIcuSimBeta: boolean;
  canUseAdvancedAnalytics: boolean;
  categoryProgress?: Record<string, { answered: number; correct: number; accuracy: number }>;
  totalAnsweredByExam?: { nclex: number; ccrn: number };
  isAuthenticated?: boolean;
  streakDays?: number;
  todayAnswered?: number;
  suggestedCategoryLabel?: string | null;
  serverReadinessAttempts?: Record<string, { accuracy: number; correctAnswers: number; totalQuestions: number; takenAtMs: number }>;
  willPersonalize?: boolean;
  deepLinkQuestionId?: string | null;
  deepLinkOpenTutor?: boolean;
}) {
  const [state, dispatch] = useReducer(practiceReducer, undefined, createEmptyRuntimeState);
  const [selectedExam, setSelectedExam] = useState<Exam>(resolveAccessibleExam(initialExam, accessExamTrack));
  const [standardCount, setStandardCount] = useState<(typeof STANDARD_COUNTS)[number]>(10);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory ?? "");
  const [selectedQuestionType, setSelectedQuestionType] = useState<QuestionType | "">(sanitizeQuestionType(initialQuestionType));
  const [ngnOnly, setNgnOnly] = useState<boolean>(sanitizeNgnOnly(initialNgnOnly));
  const [studyTheme, setStudyTheme] = useState<StudyTheme>("light");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [now, setNow] = useState(Date.now());
  const hydratedRef = useRef(false);
  const deepLinkHandledRef = useRef(false);

  const catalogCards = useMemo(() => (
    getPracticeCatalogCards(liveCounts).map((card) => {
      if (card.mode !== "standard" || !card.exam) {
        return card;
      }

      const total = card.exam === "nclex" ? liveCounts.nclex : liveCounts.ccrn;
      const allowed = accessExamTrack === "all" || accessExamTrack === card.exam;
      return {
        ...card,
        count: allowed ? getAccessibleQuestionBankCount(total, questionBankAccessPercent) : total,
        description: allowed
          ? questionBankAccessPercent >= 100
            ? card.description
            : `${questionBankAccessPercent}% of the ${card.exam.toUpperCase()} qbank is unlocked on this access tier, with rationales, diagrams, citations, and sources connected in flow.`
          : `${card.exam.toUpperCase()} standard sessions are outside this plan's scope. Upgrade to unlock both tracks.`,
      };
    })
  ), [accessExamTrack, liveCounts, questionBankAccessPercent]);
  const practiceExamDefinitions = useMemo(() => getPracticeExamDefinitions(liveCounts), [liveCounts]);
  const categoryOptions = useMemo(() => getCategoryOptions(selectedExam), [selectedExam]);
  const accessibleLiveCount = useMemo(() => {
    const total = selectedExam === "nclex" ? liveCounts.nclex : liveCounts.ccrn;
    return getAccessibleQuestionBankCount(total, questionBankAccessPercent);
  }, [liveCounts.ccrn, liveCounts.nclex, questionBankAccessPercent, selectedExam]);

  useEffect(() => {
    if (selectedCategory && !categoryOptions.some((option) => option.value === selectedCategory)) {
      setSelectedCategory("");
    }
  }, [categoryOptions, selectedCategory]);

  useEffect(() => {
    if (accessExamTrack !== "all" && selectedExam !== accessExamTrack) {
      setSelectedExam(accessExamTrack);
    }
  }, [accessExamTrack, selectedExam]);

  useEffect(() => {
    if (ngnOnly && selectedQuestionType === "mcq") {
      setSelectedQuestionType("");
    }
  }, [ngnOnly, selectedQuestionType]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    try {
      const storedTheme = window.localStorage.getItem(STUDY_THEME_STORAGE_KEY);
      if (storedTheme === "dark" || storedTheme === "light") {
        setStudyTheme(storedTheme);
      }
    } catch {
      // Ignore storage access issues and keep the light default.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STUDY_THEME_STORAGE_KEY, studyTheme);
    } catch {
      // Ignore storage access issues; the in-memory theme still works.
    }
  }, [studyTheme]);

  useEffect(() => {
    if (hydratedRef.current) {
      return;
    }

    hydratedRef.current = true;
    const hasDeepLink = Boolean(initialPracticeExam || sanitizeMode(initialMode));
    if (hasDeepLink) {
      return;
    }

    const snapshot = runtimeFromSnapshot(loadPracticeSnapshot());
    if (snapshot) {
      dispatch({ type: "hydrate", payload: snapshot });
    }
  }, [initialMode, initialPracticeExam]);

  useEffect(() => {
    if (deepLinkHandledRef.current) {
      return;
    }

    const mode = sanitizeMode(initialMode);
    const exam = sanitizeExam(initialExam);
    if (!mode && !initialPracticeExam) {
      return;
    }

    deepLinkHandledRef.current = true;
    startTransition(() => {
      void (async () => {
        try {
          if (initialPracticeExam) {
            await openPracticeExam(initialPracticeExam);
            return;
          }

          if (mode === "standard") {
            await openStandardSession(exam, standardCount);
            return;
          }

          if (mode && mode !== "practice-exam") {
            await openRichSession(mode, exam);
          }
        } catch {
          // individual loaders already set UI error state
        }
      })();
    });
  }, [initialExam, initialMode, initialPracticeExam, standardCount]);

  useEffect(() => {
    if (!state.session) {
      clearPracticeSnapshot();
      return;
    }

    savePracticeSnapshot(createSessionSnapshot(state.session));
  }, [state.session]);

  // Persist practice-exam cursor server-side (cross-device resume). Coalesced
  // by sessionId+index so a fast Next/Prev loop doesn't spam the endpoint.
  const lastPositionRef = useRef<{ id: string; index: number } | null>(null);
  useEffect(() => {
    if (!isAuthenticated) return;
    const session = state.session;
    if (!session || session.mode !== "practice-exam") return;
    const sig = { id: session.id, index: session.currentIndex };
    if (
      lastPositionRef.current &&
      lastPositionRef.current.id === sig.id &&
      lastPositionRef.current.index === sig.index
    ) {
      return;
    }
    lastPositionRef.current = sig;
    fetch(`/api/quiz/sessions/${encodeURIComponent(session.id)}/position`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentIndex: session.currentIndex }),
      keepalive: true,
    }).catch(() => undefined);
  }, [isAuthenticated, state.session]);

  // Deep-link: ?question=<id> or ?tutorQuestion=<id>
  // Fetches a single question and starts a 1-item review-style session. If the
  // tutorQuestion variant is used, auto-opens the tutor drawer once the session
  // is in place. Snapshot in storage takes precedence — we don't clobber an
  // active in-progress session.
  const deepLinkQuestionHandledRef = useRef(false);
  useEffect(() => {
    if (deepLinkQuestionHandledRef.current) return;
    if (!deepLinkQuestionId) return;
    if (state.session) return; // active session — skip
    deepLinkQuestionHandledRef.current = true;
    void (async () => {
      try {
        const response = await fetch(
          `/api/quiz/question/${encodeURIComponent(deepLinkQuestionId)}`,
          { headers: { Accept: "application/json" } },
        );
        if (!response.ok) {
          setError("That question is no longer available. Pick a fresh category to keep studying.");
          return;
        }
        const payload = await response.json().catch(() => null);
        const rawQuestion = payload?.data?.question ?? null;
        if (!rawQuestion) {
          setError("That question is no longer available. Pick a fresh category to keep studying.");
          return;
        }
        const [question] = mapLiveQuestionBank([rawQuestion], "standard");
        if (!question) return;
        const session = createClientSession({
          mode: "standard",
          exam: question.exam,
          label: deepLinkOpenTutor ? "Tutor follow-up" : "Daily question",
          description: deepLinkOpenTutor
            ? "Walk through this missed item with the tutor, then keep going."
            : "Today's daily question. One full rationale, one tutor follow-up on tap.",
          questions: [question],
        });
        dispatch({ type: "start-session", payload: session });
        if (deepLinkOpenTutor) {
          // Defer one tick so the session has settled into state before opening
          // the tutor drawer.
          setTimeout(() => {
            dispatch({ type: "open-tutor", questionId: question.id });
          }, 0);
        }
      } catch {
        setError("Could not load that question. Pick a fresh category to keep studying.");
      }
    })();
  }, [deepLinkQuestionId, deepLinkOpenTutor, state.session]);

  const liveQuestionType = ngnOnly && selectedQuestionType === "mcq" ? "" : selectedQuestionType;
  const liveNgnOnly = liveQuestionType === "mcq" ? false : ngnOnly;

  const activeFilterSummary = [
    selectedCategory ? getCategoryLabel(selectedExam, selectedCategory) : null,
    liveQuestionType ? QUESTION_TYPE_OPTIONS.find((option) => option.value === liveQuestionType)?.label ?? liveQuestionType : null,
    liveNgnOnly ? "NGN only" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  function getLiveSessionPayload() {
    const questionType = ngnOnly && selectedQuestionType === "mcq" ? "" : selectedQuestionType;
    const liveNgnOnly = questionType === "mcq" ? false : ngnOnly;
    return {
      category: selectedCategory || undefined,
      questionType: questionType || undefined,
      ngnOnly: liveNgnOnly || undefined,
    };
  }

  function buildLiveSessionLabel(exam: Exam) {
    const questionType = ngnOnly && selectedQuestionType === "mcq" ? "" : selectedQuestionType;
    const liveNgnOnly = questionType === "mcq" ? false : ngnOnly;
    const parts = [`${exam.toUpperCase()} live bank`];
    if (selectedCategory) {
      parts.push(getCategoryLabel(exam, selectedCategory));
    }
    if (questionType) {
      const typeLabel = QUESTION_TYPE_OPTIONS.find((option) => option.value === questionType)?.label ?? questionType;
      parts.push(typeLabel);
    }
    if (liveNgnOnly) {
      parts.push("NGN only");
    }
    return parts.join(" · ");
  }

  function buildLiveSessionDescription(exam: Exam) {
    const questionType = ngnOnly && selectedQuestionType === "mcq" ? "" : selectedQuestionType;
    const liveNgnOnly = questionType === "mcq" ? false : ngnOnly;
    const summary = [
      selectedCategory ? `filtered to ${getCategoryLabel(exam, selectedCategory)}` : null,
      questionType ? `question type ${QUESTION_TYPE_OPTIONS.find((option) => option.value === questionType)?.label ?? questionType}` : null,
      liveNgnOnly ? "NGN-only items" : null,
    ]
      .filter(Boolean)
      .join(", ");

    return summary
      ? `Standard live-bank question flow with rationale, citations, diagrams, and ${canUseTutor ? "tutor support" : "guided review"}. ${summary}.`
      : `Standard live-bank question flow with rationale, citations, diagrams, and ${canUseTutor ? "tutor support" : "guided review"}.`;
  }

  async function openStandardSession(exam: Exam, count: number) {
    setError(null);
    const response = await fetch("/api/quiz/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exam,
        count,
        personalize: isAuthenticated,
        ...getLiveSessionPayload(),
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.error ?? "Could not start the live-bank session. Please try again.");
      return;
    }

    const payload = await response.json();
    const data = payload.data ?? payload;
    const questions = mapLiveQuestionBank(data.questions, "standard");
    dispatch({
      type: "start-session",
      payload: createClientSession({
        id: data.sessionId,
        mode: "standard",
        exam,
        label: buildLiveSessionLabel(exam),
        description: buildLiveSessionDescription(exam),
        questions,
      }),
    });
  }

  async function openLiveDerivedSession(input: {
    exam: Exam;
    count: number;
    label: string;
    description: string;
    mode: Extract<PracticeMode, "chart" | "case-study" | "ngn">;
    questionType?: QuestionType;
    ngnOnly?: boolean;
    requireScenarioData?: boolean;
  }) {
    const response = await fetch("/api/quiz/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exam: input.exam,
        count: input.count,
        questionType: input.questionType,
        ngnOnly: input.ngnOnly,
      }),
    });

    if (!response.ok) {
      return false;
    }

    const payload = await response.json();
    const data = payload.data ?? payload;
    let questions = mapLiveQuestionBank(data.questions, input.mode);
    if (input.requireScenarioData) {
      questions = questions.filter((question) =>
        Boolean(question.exhibits?.length || question.scenarioTitle || question.additionalInfo || question.visualRationale || question.diagramBlueprint),
      );
    }

    if (questions.length === 0) {
      return false;
    }

    dispatch({
      type: "start-session",
      payload: createClientSession({
        id: data.sessionId,
        mode: input.mode,
        exam: input.exam,
        label: input.label,
        description: input.description,
        questions,
      }),
    });
    return true;
  }

  async function openRichSession(mode: Extract<PracticeMode, "chart" | "case-study" | "ngn">, exam: Exam) {
    setError(null);
    if (!canUseRichModes) {
      setError(getPremiumLockMessage("rich"));
      return;
    }

    if (mode === "case-study" && exam !== "nclex") {
      const loaded = await openLiveDerivedSession({
        exam,
        count: standardCount,
        mode,
        questionType: "case_study",
        label: `${exam.toUpperCase()} live case studies`,
        description: "Live multipart case-study questions with fuller context, rationale, and source-backed review.",
        requireScenarioData: true,
      });
      if (loaded) {
        return;
      }
    }

    if (mode === "ngn") {
      const loaded = await openLiveDerivedSession({
        exam,
        count: standardCount,
        mode,
        ngnOnly: true,
        label: `${exam.toUpperCase()} NGN live bank`,
        description: "Live NGN items with matrix, ordering, bow-tie, and case logic in the same review flow.",
      });
      if (loaded) {
        return;
      }
    }

    if (mode === "chart") {
      const loaded = await openLiveDerivedSession({
        exam,
        count: standardCount,
        mode,
        ngnOnly: true,
        label: `${exam.toUpperCase()} chart and signal review`,
        description: "Data-heavy live questions prioritized for scenario context, exhibits, diagrams, and signal-first review.",
        requireScenarioData: true,
      });
      if (loaded) {
        return;
      }
    }

    const deck = getPracticeQuestionByMode(mode).filter((question) => question.exam === exam);
    if (deck.length === 0) {
      setError("That practice deck is not ready yet.");
      return;
    }

    const label =
      mode === "chart"
        ? "Chart reading deck"
        : mode === "case-study"
          ? exam === "nclex" ? "NCLEX NGN case study" : "CCRN case studies"
          : "NGN-style deck";

    const description =
      mode === "chart"
        ? "Wider data-first question taking for chart excerpts and trends."
        : mode === "case-study"
          ? exam === "nclex"
            ? "A six-item unfolding NGN case with notes, history, vitals, orders, matrix, cloze, and rationale review."
            : "Clinical cases with vitals, labs, hemodynamics, and bedside context."
          : "Layered next-generation interactions with matrix and multi-select scoring.";

    dispatch({
      type: "start-session",
      payload: createClientSession({
        mode,
        exam,
        label,
        description,
        questions: deck,
      }),
    });
  }

  async function openPracticeExam(examId: string) {
    setError(null);
    if (!canUsePracticeExams) {
      setError(getPremiumLockMessage("practice-exams"));
      return;
    }

    const response = await fetch(`/api/quiz/practice-exams/${examId}`);

    if (!response.ok) {
      const payload = await response.json().catch(() => null);

      if (response.status === 401 && payload?.loginUrl) {
        window.location.href = payload.loginUrl;
        return;
      }

      if (response.status === 403) {
        setError(
          payload?.error
            ?? `This account can open ${practiceExamLimit} practice exam${practiceExamLimit === 1 ? "" : "s"}. Upgrade to unlock more simulations.`,
        );
        return;
      }

      setError(payload?.error ?? "That simulation could not be loaded right now.");
      return;
    }

    const payload = await response.json();
    const data = payload.data ?? payload;
    // If the server has an in-progress session for this exam, resume into it
    // rather than minting a new attempt id. Cross-device resume.
    const resume = data.resume as { sessionId?: string; currentIndex?: number } | undefined;
    const attemptId = resume?.sessionId ??
      (typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `exam-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);
    const startIndex = typeof resume?.currentIndex === "number" ? resume.currentIndex : 0;
    if (startIndex > 0) {
      setResumeToast(`Picked up where you left off (Q${startIndex + 1})`);
    }
    const base = createClientSession({
      id: attemptId,
      mode: "practice-exam",
      exam: data.definition.exam,
      label: data.definition.label,
      description: data.definition.description,
      questions: data.questions,
      timeLimitMinutes: data.definition.timeLimitMinutes,
    });
    dispatch({
      type: "start-session",
      payload: {
        ...base,
        practiceExamId: data.definition.id,
        currentIndex: Math.min(startIndex, Math.max(0, base.questions.length - 1)),
      },
    });
  }

  async function handleSubmitAnswer() {
    if (!state.session) {
      return;
    }

    const question = state.session.questions[state.session.currentIndex];
    if (!question || !hasDraftAnswer(state.activeAnswer) || state.session.answers[question.id]) {
      return;
    }

    if (state.session.mode === "standard") {
      const selectedValue = Array.isArray(state.activeAnswer)
        ? JSON.stringify(state.activeAnswer)
        : typeof state.activeAnswer === "string"
          ? state.activeAnswer
          : JSON.stringify(state.activeAnswer);

      const response = await fetch("/api/quiz/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: state.session.id,
          questionId: question.id,
          selectedOptionId: selectedValue,
          timeSpentMs: Math.max(1000, Date.now() - state.session.startedAt),
        }),
      });

      if (!response.ok) {
        setError("Could not submit this answer. Please try again.");
        return;
      }

      const payload = await response.json();
      const data = payload.data ?? payload;
      dispatch({
        type: "submit-answer",
        questionId: question.id,
        record: {
          selected: state.activeAnswer,
          correct: data.correct,
          correctAnswer: question.correctAnswer ?? data.correctAnswer,
          rationale: data.rationale,
          deepRationale: data.deepRationale ?? question.deepRationale,
          takeaway: data.takeaway ?? question.takeaway,
          distractorRationales: data.distractorRationales ?? question.distractorRationales,
          references: data.references ?? question.references,
          coachingFrame: data.coachingFrame ?? question.coachingFrame,
          visualRationale: data.visualRationale ?? question.visualRationale,
          diagramBlueprint: data.diagramBlueprint ?? question.diagramBlueprint,
          submittedAt: Date.now(),
        },
      });
      return;
    }

    if (state.session.mode === "practice-exam" && isAuthenticated) {
      // Server-side sync of practice-exam answers — lazy-creates the quiz_sessions
      // row on the first answer so cross-device readiness history works.
      const selectedValue = Array.isArray(state.activeAnswer)
        ? JSON.stringify(state.activeAnswer)
        : typeof state.activeAnswer === "string"
          ? state.activeAnswer
          : JSON.stringify(state.activeAnswer);
      try {
        await fetch("/api/quiz/answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: state.session.id,
            questionId: question.id,
            selectedOptionId: selectedValue,
            timeSpentMs: Math.max(1000, Date.now() - state.session.startedAt),
            practiceExamId: state.session.practiceExamId ?? state.session.id,
            examTrack: state.session.exam,
            totalQuestions: state.session.questions.length,
            questionIds: state.session.questions.map((q) => q.id),
          }),
        });
      } catch {
        // Best-effort sync — UI still proceeds with local correctness from the question metadata.
      }
    }

    dispatch({
      type: "submit-answer",
      questionId: question.id,
      record: buildQuestionRecord(question, state.activeAnswer),
    });
  }

  function handleNext() {
    if (!state.session) {
      return;
    }

    const isLastQuestion = state.session.currentIndex >= state.session.questions.length - 1;
    if (isLastQuestion) {
      dispatch({ type: "finish-session", finishedAt: Date.now() });
      return;
    }

    dispatch({ type: "set-index", index: state.session.currentIndex + 1 });
  }

  function handlePrev() {
    if (!state.session || state.session.currentIndex === 0) {
      return;
    }

    dispatch({ type: "set-index", index: state.session.currentIndex - 1 });
  }

  function handleJump(index: number) {
    if (!state.session) {
      return;
    }

    dispatch({ type: "set-index", index });
  }

  function startMissedReview() {
    if (!state.session) {
      return;
    }

    const reviewSession = createMissedReviewSession(state.session);
    if (!reviewSession) {
      return;
    }

    dispatch({ type: "start-session", payload: reviewSession });
  }

  // Drill → tutor handoff: build the missed-review session AND auto-open the
  // tutor drawer on the first miss. Gated by canUseTutor on the UI side so this
  // function is safe to call even for free-tier users (the tutor drawer itself
  // enforces tier gating).
  function startMissedReviewWithTutor() {
    if (!state.session) return;
    const reviewSession = createMissedReviewSession(state.session);
    if (!reviewSession || reviewSession.questions.length === 0) return;
    const firstQuestionId = reviewSession.questions[0]?.id;
    dispatch({ type: "start-session", payload: reviewSession });
    if (firstQuestionId) {
      // Defer so the session reducer settles before we layer the tutor open
      setTimeout(() => {
        dispatch({ type: "open-tutor", questionId: firstQuestionId });
      }, 0);
    }
  }

  const session = state.session;
  const currentQuestion = session ? session.questions[session.currentIndex] : null;
  const currentRecord = currentQuestion ? session?.answers[currentQuestion.id] : undefined;
  const tutorQuestion = session
    ? session.questions.find((question) => question.id === state.tutorQuestionId) ?? null
    : null;
  const tutorRecord = tutorQuestion ? session?.answers[tutorQuestion.id] : undefined;
  const questionStatuses = session
    ? session.questions.map((question) => ({
        id: question.id,
        answered: Boolean(session.answers[question.id]),
        flagged: session.flaggedQuestionIds.includes(question.id),
      }))
    : [];
  const scoreSummary = session ? computeSessionScore(session) : null;

  // Local readiness-attempt history (per device). Avoids schema changes.
  const [readinessAttempts, setReadinessAttempts] = useState<Record<string, ReadinessAttempt>>({});

  // Transient "Picked up where you left off (QN)" toast for cross-device
  // practice-exam resumes. Auto-dismisses after 4.5s.
  const [resumeToast, setResumeToast] = useState<string | null>(null);
  useEffect(() => {
    if (!resumeToast) return;
    const id = setTimeout(() => setResumeToast(null), 4500);
    return () => clearTimeout(id);
  }, [resumeToast]);

  // Drug-card recommendation surfaced on the results screen for missed pharm
  // questions. Lazily fetched once when the results phase opens.
  const [drugCardRec, setDrugCardRec] = useState<{
    id: string;
    genericName: string;
    drugClass: string;
  } | null>(null);
  const drugCardFetchRef = useRef<string | null>(null);
  useEffect(() => {
    if (state.phase !== "results" || !session || !scoreSummary) {
      setDrugCardRec(null);
      drugCardFetchRef.current = null;
      return;
    }
    const missed = scoreSummary.missedQuestionIds[0];
    const missedQuestion = missed
      ? session.questions.find((q) => q.id === missed)
      : null;
    if (!missedQuestion) return;
    const category = missedQuestion.category ?? "";
    // Question metadata varies; coerce defensively
    const rawTags = (missedQuestion as { tags?: unknown }).tags;
    const tags = Array.isArray(rawTags)
      ? (rawTags as unknown[]).filter((t): t is string => typeof t === "string").slice(0, 6)
      : [];
    const sig = `${session.id}::${category}::${tags.join(",")}`;
    if (drugCardFetchRef.current === sig) return;
    drugCardFetchRef.current = sig;
    if (!category && tags.length === 0) return;
    const url = new URL("/api/drug-cards/recommend", window.location.origin);
    url.searchParams.set("category", category);
    if (tags.length > 0) url.searchParams.set("tags", tags.join(","));
    fetch(url.toString())
      .then((r) => (r.ok ? r.json() : null))
      .then((payload) => {
        const card = payload?.data;
        if (card?.id && card?.genericName && card?.drugClass) {
          setDrugCardRec({
            id: card.id,
            genericName: card.genericName,
            drugClass: card.drugClass,
          });
        }
      })
      .catch(() => undefined);
  }, [state.phase, session, scoreSummary]);

  useEffect(() => {
    const local = loadReadinessAttempts();
    const merged: typeof local = { ...local };
    for (const [examId, server] of Object.entries(serverReadinessAttempts)) {
      const existing = merged[examId];
      if (!existing || server.takenAtMs >= existing.takenAtMs) {
        merged[examId] = server;
      }
    }
    setReadinessAttempts(merged);
  }, [serverReadinessAttempts]);

  useEffect(() => {
    if (
      state.phase === "results" &&
      session &&
      session.mode === "practice-exam" &&
      scoreSummary &&
      scoreSummary.totalQuestions > 0
    ) {
      const attempt: ReadinessAttempt = {
        accuracy: scoreSummary.score,
        correctAnswers: scoreSummary.correctAnswers,
        totalQuestions: scoreSummary.totalQuestions,
        takenAtMs: Date.now(),
      };
      const key = session.practiceExamId ?? session.id;
      saveReadinessAttempt(key, attempt);
      setReadinessAttempts((prev) => ({ ...prev, [key]: attempt }));
    }
  }, [state.phase, session, scoreSummary]);

  // NGN mix derivation (3-position): "mcq" | "realistic" | "ngn"
  const ngnMix: "mcq" | "realistic" | "ngn" = ngnOnly
    ? "ngn"
    : selectedQuestionType === "mcq"
      ? "mcq"
      : "realistic";

  const setNgnMix = (next: "mcq" | "realistic" | "ngn") => {
    if (next === "mcq") {
      setNgnOnly(false);
      setSelectedQuestionType("mcq");
    } else if (next === "ngn") {
      setNgnOnly(true);
      if (selectedQuestionType === "mcq") setSelectedQuestionType("");
    } else {
      // realistic — natural blueprint mix
      setNgnOnly(false);
      if (selectedQuestionType === "mcq") setSelectedQuestionType("");
    }
  };
  const answeredCount = session ? Object.keys(session.answers).length : 0;
  const correctCount = session ? Object.values(session.answers).filter((item) => item.correct).length : 0;
  const sessionProgressPercent = session ? Math.round(((session.currentIndex + 1) / session.questions.length) * 100) : 0;
  const liveAccuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : null;
  const remainingQuestions = session ? Math.max(session.questions.length - answeredCount, 0) : 0;
  const elapsedSeconds = session ? Math.floor((now - session.startedAt) / 1000) : 0;
  const runStatus = !session
    ? "Command deck ready."
    : answeredCount === 0
      ? "Warm start: read the data before the options."
      : answeredCount === session.questions.length
        ? "Run complete: debrief ready."
        : `${remainingQuestions} question${remainingQuestions === 1 ? "" : "s"} remain in this run.`;
  const remainingSeconds = session?.timeLimitMinutes
    ? Math.max(0, session.timeLimitMinutes * 60 - Math.floor((now - session.startedAt) / 1000))
    : null;
  const canOpenTutor = Boolean(canUseTutor && currentQuestion && currentRecord);
  const canAdvanceQuestion = Boolean(
    session && currentQuestion && (session.currentIndex < session.questions.length - 1 || currentRecord),
  );

  useEffect(() => {
    if (!session || state.phase === "catalog" || !currentQuestion) {
      return;
    }
    const activeSession = session;
    const activeQuestion = currentQuestion;

    function isFormTarget(target: EventTarget | null) {
      if (!(target instanceof HTMLElement)) {
        return false;
      }

      const tagName = target.tagName.toLowerCase();
      return tagName === "input" || tagName === "textarea" || tagName === "select" || target.isContentEditable;
    }

    function toggleHotkeyOption(answer: PracticeAnswer, optionId: string) {
      if (activeQuestion.kind === "multi-select") {
        const current = Array.isArray(answer) ? answer : typeof answer === "string" && answer ? [answer] : [];
        return current.includes(optionId) ? current.filter((item) => item !== optionId) : [...current, optionId];
      }

      return optionId;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (isFormTarget(event.target) || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      const key = event.key.toLowerCase();
      if (key === "enter" && !currentRecord && hasDraftAnswer(state.activeAnswer)) {
        event.preventDefault();
        void handleSubmitAnswer();
        return;
      }

      if (key === "n" || key === "arrowright") {
        if (canAdvanceQuestion) {
          event.preventDefault();
          handleNext();
        }
        return;
      }

      if (key === "arrowleft") {
        if (activeSession.currentIndex > 0) {
          event.preventDefault();
          handlePrev();
        }
        return;
      }

      if (key === "f") {
        event.preventDefault();
        dispatch({ type: "toggle-flag", questionId: activeQuestion.id });
        return;
      }

      if (key === "t" && canOpenTutor) {
        event.preventDefault();
        dispatch({ type: "open-tutor", questionId: activeQuestion.id });
        return;
      }

      if (!activeQuestion.options || activeQuestion.kind === "matrix" || activeQuestion.kind === "ordering" || currentRecord) {
        return;
      }

      const optionIndex = /^[1-9]$/.test(key)
        ? Number(key) - 1
        : /^[a-z]$/.test(key)
          ? key.charCodeAt(0) - 97
          : -1;
      const option = optionIndex >= 0 ? activeQuestion.options[optionIndex] : null;

      if (!option) {
        return;
      }

      event.preventDefault();
      dispatch({
        type: "set-answer",
        payload: toggleHotkeyOption(state.activeAnswer, option.id),
      });
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canAdvanceQuestion, canOpenTutor, currentQuestion, currentRecord, session, state.activeAnswer, state.phase]);
  return (
    <>
    {resumeToast ? (
      <div className="quiz-resume-toast" role="status" aria-live="polite">
        <span aria-hidden="true">⤴</span>
        {resumeToast}
      </div>
    ) : null}
    <QuizTerminalShell
      phase={state.phase}
      tier={tier}
      studyTheme={studyTheme}
      error={error}
      isPending={isPending}
      accessType={accessType}
      accessExamTrack={accessExamTrack}
      accessibleLiveCount={accessibleLiveCount}
      questionBankAccessPercent={questionBankAccessPercent}
      selectedExam={selectedExam}
      selectedCategory={selectedCategory}
      selectedQuestionType={selectedQuestionType}
      ngnOnly={ngnOnly}
      standardCount={standardCount}
      activeFilterSummary={activeFilterSummary}
      liveCounts={liveCounts}
      nclexStats={nclexStats}
      session={session}
      currentQuestion={currentQuestion}
      currentRecord={currentRecord}
      tutorQuestion={state.tutorOpen ? tutorQuestion : null}
      tutorRecord={tutorRecord}
      questionStatuses={questionStatuses}
      scoreSummary={scoreSummary}
      answeredCount={answeredCount}
      correctCount={correctCount}
      sessionProgressPercent={sessionProgressPercent}
      liveAccuracy={liveAccuracy}
      remainingQuestions={remainingQuestions}
      runStatus={runStatus}
      remainingSeconds={remainingSeconds}
      elapsedSeconds={elapsedSeconds}
      canOpenTutor={canOpenTutor}
      canUseTutor={canUseTutor}
      canUseRichModes={canUseRichModes}
      canUsePracticeExams={canUsePracticeExams}
      canUseIcuSimBeta={canUseIcuSimBeta}
      canUseAdvancedAnalytics={canUseAdvancedAnalytics}
      practiceExamLimit={practiceExamLimit}
      catalogCards={catalogCards}
      practiceExamDefinitions={practiceExamDefinitions}
      categoryOptions={categoryOptions}
      categoryProgress={categoryProgress}
      totalAnsweredByExam={totalAnsweredByExam}
      isAuthenticated={isAuthenticated}
      streakDays={streakDays}
      todayAnswered={todayAnswered}
      suggestedCategoryLabel={suggestedCategoryLabel}
      readinessAttempts={readinessAttempts}
      ngnMix={ngnMix}
      onSetNgnMix={setNgnMix}
      willPersonalize={willPersonalize}
      questionTypeOptions={QUESTION_TYPE_OPTIONS}
      draftAnswer={currentRecord?.selected ?? state.activeAnswer}
      practiceExamStatusCopy={getPracticeExamStatusCopy(practiceExamLimit, practiceExamDefinitions.length, canUseIcuSimBeta)}
      formatTime={formatTime}
      onSetSelectedExam={setSelectedExam}
      onSetStudyTheme={setStudyTheme}
      onSetStandardCount={setStandardCount}
      onSetSelectedCategory={setSelectedCategory}
      onSetSelectedQuestionType={(next) => {
        if (next === "mcq" && ngnOnly) {
          setNgnOnly(false);
        }
        setSelectedQuestionType(next);
      }}
      onSetNgnOnly={(next) => {
        if (next && selectedQuestionType === "mcq") {
          setSelectedQuestionType("");
        }
        setNgnOnly(next);
      }}
      onResetFilters={() => {
        setSelectedCategory("");
        setSelectedQuestionType("");
        setNgnOnly(false);
      }}
      onLaunchCatalogCard={(card) => {
        startTransition(() => {
          void (async () => {
            const standardTrackLocked = card.mode === "standard"
              && Boolean(card.exam)
              && accessExamTrack !== "all"
              && card.exam !== accessExamTrack;

            if (card.mode === "standard") {
              if (standardTrackLocked) {
                setError(`This plan currently unlocks ${accessExamTrack.toUpperCase()} question-bank access only.`);
                return;
              }
              await openStandardSession(card.exam ?? selectedExam, standardCount);
              return;
            }

            if (card.mode === "practice-exam") {
              const examDefinition = practiceExamDefinitions.find((item) => item.exam === selectedExam) ?? practiceExamDefinitions[0];
              await openPracticeExam(examDefinition.id);
              return;
            }

            await openRichSession(card.mode, selectedExam);
          })();
        });
      }}
      onLaunchPracticeExam={(examId) => {
        startTransition(() => {
          void openPracticeExam(examId);
        });
      }}
      onBackToCatalog={() => dispatch({ type: "open-catalog" })}
      onQuestionAnswerChange={(answer) => dispatch({ type: "set-answer", payload: answer })}
      onSubmitAnswer={() => void handleSubmitAnswer()}
      onNextQuestion={handleNext}
      onPrevQuestion={handlePrev}
      onJumpQuestion={handleJump}
      onToggleFlag={() => currentQuestion ? dispatch({ type: "toggle-flag", questionId: currentQuestion.id }) : undefined}
      onOpenTutor={() => currentQuestion ? dispatch({ type: "open-tutor", questionId: currentQuestion.id }) : undefined}
      onCloseTutor={() => dispatch({ type: "close-tutor" })}
      onContinueDrillFromTutor={
        // Only meaningful for single-question deep-link sessions. Swaps the
        // session for a 10-question category drill of the same topic.
        state.session && state.session.questions.length === 1 && currentQuestion?.category
          ? () => {
              const category = currentQuestion.category;
              const exam = state.session?.exam ?? selectedExam;
              // Telemetry: did the tutor follow-up convert into more practice?
              void import("@/lib/analytics").then(({ trackEvent }) => {
                trackEvent("tutor_continue_drill_clicked", {
                  category,
                  exam,
                  source_question_id: currentQuestion.id,
                });
              }).catch(() => undefined);
              dispatch({ type: "close-tutor" });
              setSelectedCategory(category);
              startTransition(() => {
                void openStandardSession(exam, 10);
              });
            }
          : undefined
      }
      continueDrillLabel={
        state.session && state.session.questions.length === 1 && currentQuestion?.category
          ? `Continue with 9 more in ${getCategoryLabel(state.session.exam, currentQuestion.category)} →`
          : null
      }
      onFinishSession={() => dispatch({ type: "finish-session", finishedAt: Date.now() })}
      onResetSession={() => dispatch({ type: "reset" })}
      onStartMissedReview={startMissedReview}
    />
    </>
  );
  /* legacy quiz renderer retained temporarily for rollback reference
  return (
    <div className="space-y-6">
      {state.phase === "catalog" ? (
        <section className="space-y-6">
          <div className="study-command-deck flex flex-col gap-4 rounded-[30px] border border-[rgba(74,85,89,0.08)] bg-[rgba(255,252,247,0.92)] p-5 shadow-card md:flex-row md:items-center md:justify-between md:p-6">
            <div>
              <p className="terminal-label">Launch surface</p>
              <h2 className="mt-3 font-serif text-[2.1rem] leading-[0.98] text-dark">NCLEX first, with the deeper study tools layered in.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
                Start from the reviewed live NCLEX bank, then move into NGN, charts, or timed exams without leaving the
                same calmer study surface. Rationales, citations, and tutor coaching stay connected to the same item.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
                <span className="signal-pill signal-pill-blue">NCLEX live {liveCounts.nclex}</span>
                <span className="signal-pill signal-pill-blue">NGN {nclexStats.ngnLive} ({nclexStats.ngnRatio}%)</span>
                <span className="signal-pill signal-pill-blue">MCQ {nclexStats.mcqLive}</span>
                <span className="signal-pill signal-pill-gold">
                  Access {accessibleLiveCount}/{selectedExam === "nclex" ? liveCounts.nclex : liveCounts.ccrn}
                </span>
                <span className="signal-pill">
                  {accessExamTrack === "all" ? "NCLEX + CCRN scope" : `${accessExamTrack.toUpperCase()} scope`}
                </span>
                <span className="signal-pill signal-pill-sage">
                  {canUseTutor ? "AI tutor active" : "Tutor locked to premium"}
                </span>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <div className="metric-tile">
                  <span className="terminal-label">Access lane</span>
                  <strong>{accessExamTrack === "all" ? "Dual track" : `${accessExamTrack.toUpperCase()} only`}</strong>
                  <p>{questionBankAccessPercent}% qbank access on this plan, with rationale and source-backed review included.</p>
                </div>
                <div className="metric-tile">
                  <span className="terminal-label">Filter focus</span>
                  <strong>{activeFilterSummary || "All live filters"}</strong>
                  <p>Steer the bank toward NGN, labs, chart review, or a narrower clinical lane before you launch.</p>
                </div>
                <div className="metric-tile">
                  <span className="terminal-label">Study mode</span>
                  <strong>{canUseRichModes ? "Rich modes unlocked" : "Standard bank active"}</strong>
                  <p>{canUseTutor ? "Tutor, diagrams, and citations stay attached to the same question flow." : "The standard qbank stays fast, warm, and focused on answer conversion."}</p>
                </div>
              </div>
            </div>

            <div className="study-console-panel grid gap-4 lg:w-[52%]">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">Exam focus</p>
                  <div className="flex gap-2">
                    {(["nclex", "ccrn"] as const).map((exam) => (
                      <button
                        key={exam}
                        type="button"
                        onClick={() => setSelectedExam(exam)}
                        disabled={accessExamTrack !== "all" && accessExamTrack !== exam}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                          selectedExam === exam
                            ? "bg-[#4A5559] text-white"
                            : accessExamTrack !== "all" && accessExamTrack !== exam
                              ? "cursor-not-allowed border border-[rgba(74,85,89,0.08)] bg-[rgba(249,246,240,0.76)] text-[rgba(74,85,89,0.45)]"
                              : "border border-[rgba(74,85,89,0.12)] bg-white text-dark hover:border-[rgba(90,127,136,0.35)]"
                        }`}
                      >
                        {exam.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">Live-bank count</p>
                  <div className="flex gap-2">
                    {STANDARD_COUNTS.map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setStandardCount(count)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                          standardCount === count
                            ? "bg-[#4A5559] text-white"
                            : "border border-[rgba(74,85,89,0.12)] bg-white text-dark hover:border-[rgba(90,127,136,0.35)]"
                        }`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">Category</span>
                  <select
                    value={selectedCategory}
                    onChange={(event) => setSelectedCategory(event.target.value)}
                    className="w-full rounded-[18px] border border-[rgba(74,85,89,0.12)] bg-white px-4 py-3 text-sm text-dark shadow-sm outline-none transition focus:border-[rgba(90,127,136,0.45)]"
                  >
                    <option value="">All categories</option>
                    {categoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">Question type</span>
                  <select
                    value={selectedQuestionType}
                    onChange={(event) => {
                      const next = sanitizeQuestionType(event.target.value);
                      if (next === "mcq" && ngnOnly) {
                        setNgnOnly(false);
                      }
                      setSelectedQuestionType(next);
                    }}
                    className="w-full rounded-[18px] border border-[rgba(74,85,89,0.12)] bg-white px-4 py-3 text-sm text-dark shadow-sm outline-none transition focus:border-[rgba(90,127,136,0.45)]"
                  >
                    <option value="">Any type</option>
                    {QUESTION_TYPE_OPTIONS.map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                        disabled={ngnOnly && option.value === "mcq"}
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (!ngnOnly && selectedQuestionType === "mcq") {
                      setSelectedQuestionType("");
                    }
                    setNgnOnly((current) => !current);
                  }}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    ngnOnly
                      ? "bg-[#4A5559] text-white"
                      : "border border-[rgba(74,85,89,0.12)] bg-white text-dark hover:border-[rgba(90,127,136,0.35)]"
                  }`}
                >
                  NGN only
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("");
                    setSelectedQuestionType("");
                    setNgnOnly(false);
                  }}
                  className="rounded-full border border-[rgba(74,85,89,0.12)] bg-white px-4 py-2 text-sm font-semibold text-dark transition hover:border-[rgba(90,127,136,0.35)]"
                >
                  Reset filters
                </button>
                <span className="terminal-label">
                  {activeFilterSummary || "All live NCLEX filters"}
                </span>
              </div>
            </div>
          </div>

          {error ? (
            <div className="rounded-[22px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-3">
            {catalogCards.map((card) => {
              const standardTrackLocked = card.mode === "standard"
                && Boolean(card.exam)
                && accessExamTrack !== "all"
                && card.exam !== accessExamTrack;
              const locked = standardTrackLocked || (card.mode === "practice-exam"
                ? !canUsePracticeExams
                : card.mode === "standard"
                  ? false
                  : !canUseRichModes);

              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => {
                    startTransition(() => {
                      void (async () => {
                        if (card.mode === "standard") {
                          if (standardTrackLocked) {
                            setError(`This plan currently unlocks ${accessExamTrack.toUpperCase()} question-bank access only.`);
                            return;
                          }
                          await openStandardSession(card.exam ?? selectedExam, standardCount);
                          return;
                        }

                        if (card.mode === "practice-exam") {
                          const examDefinition = practiceExamDefinitions.find((item) => item.exam === selectedExam) ?? practiceExamDefinitions[0];
                          await openPracticeExam(examDefinition.id);
                          return;
                        }

                        await openRichSession(card.mode, selectedExam);
                      })();
                    });
                  }}
                  className={`study-mode-card rounded-[28px] border border-[rgba(74,85,89,0.08)] p-6 text-left shadow-card transition-transform duration-200 hover:-translate-y-1 ${card.accent} ${locked ? "opacity-95" : ""}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="section-label">{card.hint}</span>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {locked ? (
                        <span className="rounded-full border border-[rgba(194,154,86,0.28)] bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-dark">
                          Upgrade
                        </span>
                      ) : null}
                      {card.featured ? (
                        <span className="rounded-full border border-[rgba(74,85,89,0.12)] bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-dark">
                          Featured
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <h3 className="mt-4 font-serif text-[2rem] leading-[0.98] text-dark">{card.label}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted">{card.description}</p>
                  <div className="mt-5 flex items-center justify-between text-sm text-dark">
                    <span>{card.count} items</span>
                    <span>{card.exam ? card.exam.toUpperCase() : selectedExam.toUpperCase()}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <section className="rounded-[30px] border border-[rgba(74,85,89,0.08)] bg-[rgba(255,252,247,0.94)] p-5 shadow-card md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">Test-day simulations</p>
                <h3 className="mt-3 font-serif text-[2rem] leading-[0.98] text-dark">Five fixed-length practice exams.</h3>
                <p className="mt-3 text-sm leading-6 text-muted">
                  {getPracticeExamStatusCopy(practiceExamLimit, practiceExamDefinitions.length, canUseIcuSimBeta)}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  NCLEX simulations now pull from the same reviewed unique bank used for public counts, so the exam flow,
                  tutor context, and marketing proof stay aligned.
                </p>
              </div>
              {accessType ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-[rgba(74,85,89,0.12)] bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-dark">
                    {accessType}
                  </span>
                  {planCode ? (
                    <span className="rounded-full border border-[rgba(126,157,134,0.2)] bg-[rgba(126,157,134,0.1)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6F8D76]">
                      {practiceExamLimit} exam{practiceExamLimit === 1 ? "" : "s"}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-5">
              {practiceExamDefinitions.map((definition: PracticeExamDefinition) => (
                <button
                  key={definition.id}
                  type="button"
                  onClick={() => {
                    startTransition(() => {
                      void openPracticeExam(definition.id);
                    });
                  }}
                  className={`practice-exam-card rounded-[24px] border border-[rgba(74,85,89,0.08)] bg-[rgba(251,249,243,0.96)] p-5 text-left shadow-card transition-transform duration-200 hover:-translate-y-1 ${
                    canUsePracticeExams ? "" : "opacity-95"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="section-label">{definition.exam.toUpperCase()}</span>
                    {!canUsePracticeExams ? (
                      <span className="rounded-full border border-[rgba(194,154,86,0.28)] bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-dark">
                        Upgrade
                      </span>
                    ) : null}
                  </div>
                  <strong className="mt-3 block font-serif text-[1.5rem] leading-[1] text-dark">{definition.label}</strong>
                  <p className="mt-3 text-sm leading-6 text-muted">{definition.description}</p>
                  <div className="mt-4 text-xs uppercase tracking-[0.18em] text-muted">
                    {definition.length} questions | {definition.timeLimitMinutes} minutes
                  </div>
                </button>
              ))}
            </div>
          </section>
        </section>
      ) : null}

      {session && state.phase !== "catalog" && currentQuestion ? (
        <section className="space-y-5">
          <div className="study-mission-shell">
            <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
              <div>
                <div className="flex flex-wrap gap-2">
                  <span className="signal-pill">{session.label}</span>
                  <span className="signal-pill">{session.exam.toUpperCase()}</span>
                  <span className="signal-pill signal-pill-blue">{session.mode.replace("-", " ")}</span>
                  {canOpenTutor ? <span className="signal-pill signal-pill-sage">Tutor armed</span> : null}
                </div>
                <h2 className="mt-4 font-serif text-[2.35rem] leading-[0.96] text-dark">{session.description}</h2>
                <p className="mt-3 text-sm leading-7 text-muted">{runStatus}</p>
                <div className="mt-4">
                  <div className="study-progress-rail">
                    <div className="study-progress-fill" style={{ width: `${sessionProgressPercent}%` }} />
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                    <span>Run progress</span>
                    <span>{sessionProgressPercent}% complete</span>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="metric-tile">
                  <span className="terminal-label">Answered</span>
                  <strong>{answeredCount}/{session.questions.length}</strong>
                  <p>{remainingQuestions} still in queue.</p>
                </div>
                <div className="metric-tile">
                  <span className="terminal-label">Accuracy</span>
                  <strong>{liveAccuracy !== null ? `${liveAccuracy}%` : "--"}</strong>
                  <p>{correctCount} correct so far.</p>
                </div>
                <div className="metric-tile">
                  <span className="terminal-label">Flagged</span>
                  <strong>{session.flaggedQuestionIds.length}</strong>
                  <p>Questions held for review.</p>
                </div>
                <div className="metric-tile">
                  <span className="terminal-label">Timer</span>
                  <strong>{remainingSeconds !== null ? formatTime(remainingSeconds) : formatTime(Math.floor((now - session.startedAt) / 1000))}</strong>
                  <p>{remainingSeconds !== null ? "Time remaining" : "Elapsed study time"}</p>
                </div>
              </div>
            </div>
          </div>

          <PracticeQuestionPane
            question={currentQuestion}
            draftAnswer={currentRecord?.selected ?? state.activeAnswer}
            answerRecord={currentRecord}
            onChange={(answer) => dispatch({ type: "set-answer", payload: answer })}
            onSubmit={() => void handleSubmitAnswer()}
            onNext={handleNext}
            onPrev={handlePrev}
            onJump={handleJump}
            onToggleFlag={() => dispatch({ type: "toggle-flag", questionId: currentQuestion.id })}
            onOpenTutor={() => dispatch({ type: "open-tutor", questionId: currentQuestion.id })}
            onEnd={() => dispatch({ type: "open-catalog" })}
            questionNumber={session.currentIndex + 1}
            totalQuestions={session.questions.length}
            canGoNext={session.currentIndex < session.questions.length - 1 || Boolean(currentRecord)}
            canGoPrev={session.currentIndex > 0}
            questionStatuses={questionStatuses}
            canOpenTutor={canOpenTutor}
            phase={state.phase}
          />

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => dispatch({ type: "open-catalog" })}
              className="btn-secondary"
            >
              Back to catalog
            </button>
            {answeredCount === session.questions.length ? (
              <button
                type="button"
                onClick={() => dispatch({ type: "finish-session", finishedAt: Date.now() })}
                className="btn-primary"
              >
                See results
              </button>
            ) : null}
          </div>
        </section>
      ) : null}

      {session && state.phase !== "catalog" && !currentQuestion ? (
        <section className="rounded-[28px] border border-[rgba(194,154,86,0.18)] bg-[rgba(255,249,240,0.96)] p-6 shadow-card">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">Session recovery</p>
          <h2 className="mt-3 font-serif text-[2rem] leading-[0.98] text-dark">This session lost its current question pointer.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
            The saved study state no longer matches the current question list. Reopen the deck and the study flow will resume cleanly.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={() => dispatch({ type: "open-catalog" })} className="btn-primary">
              Back to catalog
            </button>
            <button type="button" onClick={() => dispatch({ type: "reset" })} className="btn-secondary">
              Reset study state
            </button>
          </div>
        </section>
      ) : null}

      {session && state.phase === "results" && scoreSummary ? (
        <section className="space-y-5">
          <div className="study-results-shell rounded-[32px] border border-[rgba(74,85,89,0.08)] bg-[rgba(255,252,247,0.96)] p-6 shadow-card md:p-8">
            <span className="section-label">Session results</span>
            <h2 className="mt-3 font-serif text-[2.8rem] leading-[0.94] text-dark">{session.label}</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <div className="study-results-stat rounded-[24px] border border-[rgba(74,85,89,0.08)] bg-white/70 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">Score</p>
                <p className="mt-3 text-3xl font-semibold text-dark">{scoreSummary.score}%</p>
              </div>
              <div className="study-results-stat rounded-[24px] border border-[rgba(74,85,89,0.08)] bg-white/70 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">Correct</p>
                <p className="mt-3 text-3xl font-semibold text-dark">{scoreSummary.correctAnswers}</p>
              </div>
              <div className="study-results-stat rounded-[24px] border border-[rgba(74,85,89,0.08)] bg-white/70 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">Missed</p>
                <p className="mt-3 text-3xl font-semibold text-dark">{scoreSummary.totalQuestions - scoreSummary.correctAnswers}</p>
              </div>
              <div className="study-results-stat rounded-[24px] border border-[rgba(74,85,89,0.08)] bg-white/70 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">Weak areas</p>
                <p className="mt-3 text-base font-semibold text-dark">
                  {scoreSummary.weakCategories.length > 0 ? scoreSummary.weakCategories.length : "None"}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="rounded-[24px] border border-[rgba(74,85,89,0.08)] bg-white/70 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">Category breakdown</p>
                <div className="mt-4 space-y-3">
                  {Object.entries(scoreSummary.categoryBreakdown).map(([category, bucket]) => (
                    <div key={category}>
                      <div className="flex items-center justify-between gap-3 text-sm text-dark">
                        <span>{category}</span>
                        <span>{bucket.correct}/{bucket.total}</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[rgba(74,85,89,0.08)]">
                        <div
                          className="h-full rounded-full bg-[#5A7F88]"
                          style={{ width: `${Math.round((bucket.correct / bucket.total) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[24px] border border-[rgba(74,85,89,0.08)] bg-white/70 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">Next move</p>
                <p className="mt-4 text-sm leading-7 text-muted">
                  Use missed-question review to rework the exact items that broke your first pass, or open a fresh deck
                  if you want another clean timed rep.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button type="button" onClick={startMissedReview} className="btn-primary" disabled={scoreSummary.missedQuestionIds.length === 0}>
                    Review missed
                  </button>
                  {canUseTutor && scoreSummary.missedQuestionIds.length >= 3 ? (
                    <button
                      type="button"
                      onClick={startMissedReviewWithTutor}
                      className="btn-terra"
                      title="Walk through your top misses with the AI tutor"
                    >
                      🤖 Walk through misses with tutor →
                    </button>
                  ) : null}
                  {isAuthenticated ? (
                    <a href="/dashboard" className="btn-secondary">
                      View dashboard →
                    </a>
                  ) : null}
                  {drugCardRec ? (
                    <a
                      href={`/drug-cards/${encodeURIComponent(drugCardRec.id)}`}
                      className="quiz-drug-card-link"
                      title={`Drug card: ${drugCardRec.genericName} (${drugCardRec.drugClass})`}
                    >
                      📖 Brush up: {drugCardRec.genericName} ({drugCardRec.drugClass})
                    </a>
                  ) : null}
                  <button type="button" onClick={() => dispatch({ type: "open-catalog" })} className="btn-secondary">
                    New session
                  </button>
                </div>
                {isAuthenticated ? (
                  <p className="mt-3 text-xs leading-5 text-muted">
                    {canUseTutor && scoreSummary.missedQuestionIds.length >= 3
                      ? `${scoreSummary.missedQuestionIds.length} misses ready for tutor walk-through. Your dashboard just updated too.`
                      : "Your dashboard just updated — readiness score, weak areas, and the next-best-move all reflect this run."}
                  </p>
                ) : null}
              </div>

              {canUseAdvancedAnalytics ? (
                <div className="rounded-[24px] border border-[rgba(74,85,89,0.08)] bg-white/70 p-5 lg:col-span-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">Advanced analytics</p>
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted">Accuracy trend</p>
                      <p className="mt-2 text-2xl font-semibold text-dark">{scoreSummary.score}%</p>
                      <p className="mt-2 text-sm leading-6 text-muted">Current session accuracy across the active question mix.</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted">Strongest lane</p>
                      <p className="mt-2 text-lg font-semibold text-dark">
                        {Object.entries(scoreSummary.categoryBreakdown)
                          .sort((left, right) => (right[1].correct / right[1].total) - (left[1].correct / left[1].total))[0]?.[0] ?? "Building"}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-muted">Use this to press the categories you are already converting well.</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted">Coaching focus</p>
                      <p className="mt-2 text-lg font-semibold text-dark">
                        {scoreSummary.weakCategories[0] ?? "Maintain"}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-muted">Your next improvement target based on weak-category drag in this run.</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {state.tutorOpen && tutorQuestion && tutorRecord && tier !== "free" ? (
        <PracticeTutorDrawer
          question={tutorQuestion}
          selectedAnswer={tutorRecord.selected}
          answeredCorrectly={tutorRecord.correct}
          onClose={() => dispatch({ type: "close-tutor" })}
        />
      ) : null}

      {isPending ? (
        <div className="loading-console rounded-[22px] border border-[rgba(74,85,89,0.08)] bg-[rgba(255,252,247,0.92)] px-4 py-3 text-sm text-muted shadow-card">
          Loading the study session...
        </div>
      ) : null}
    </div>
  );
  */
  // (No-op fallback above is unreachable — the live render lives in
  // QuizTerminalShell. Resume toast is rendered globally below.)
}

