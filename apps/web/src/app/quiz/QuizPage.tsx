"use client";

import { useEffect, useMemo, useReducer, useRef, useState, useTransition } from "react";
import PracticeQuestionPane from "@/components/practice/PracticeQuestionPane";
import PracticeTutorDrawer from "@/components/practice/PracticeTutorDrawer";
import {
  getPracticeCatalogCards,
  getPracticeExamDefinitions,
  getPracticeQuestionByMode,
  mapLiveQuestionBank,
  type PracticeCounts,
} from "@/lib/practice-data";
import {
  PRACTICE_STORAGE_KEY,
  buildQuestionRecord,
  computeSessionScore,
  createEmptyRuntimeState,
  createSessionSnapshot,
  practiceReducer,
  runtimeFromSnapshot,
} from "@/lib/practice-session";
import type { Exam } from "@/lib/types";
import type { PracticeAnswer, PracticeExamDefinition, PracticeMode, PracticeQuestion, PracticeSessionState } from "@/lib/practice-types";

type Tier = "free" | "plus" | "pro";

const STANDARD_COUNTS = [10, 20, 50] as const;

function sanitizeExam(value: string | undefined): Exam {
  return value === "ccrn" ? "ccrn" : "nclex";
}

function sanitizeMode(value: string | undefined): PracticeMode | null {
  if (value === "standard" || value === "chart" || value === "case-study" || value === "ngn" || value === "practice-exam") {
    return value;
  }
  return null;
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
    ? "Plus unlocks all 5 full simulations. Use your founder key or upgrade to continue."
    : "Plus unlocks chart reading, case studies, NGN modes, and tutor access.";
}

export default function QuizPage({
  tier,
  initialExam,
  initialMode,
  initialPracticeExam,
  liveCounts,
  accessType,
  canUseTutor,
  canUseRichModes,
  canUsePracticeExams,
}: {
  tier: Tier;
  initialExam?: string;
  initialMode?: string;
  initialPracticeExam?: string;
  liveCounts: PracticeCounts;
  accessType: string | null;
  canUseTutor: boolean;
  canUseRichModes: boolean;
  canUsePracticeExams: boolean;
}) {
  const [state, dispatch] = useReducer(practiceReducer, undefined, createEmptyRuntimeState);
  const [selectedExam, setSelectedExam] = useState<Exam>(sanitizeExam(initialExam));
  const [standardCount, setStandardCount] = useState<(typeof STANDARD_COUNTS)[number]>(10);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [now, setNow] = useState(Date.now());
  const hydratedRef = useRef(false);
  const deepLinkHandledRef = useRef(false);

  const catalogCards = useMemo(() => getPracticeCatalogCards(liveCounts), [liveCounts]);
  const practiceExamDefinitions = useMemo(() => getPracticeExamDefinitions(), []);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (hydratedRef.current) {
      return;
    }

    hydratedRef.current = true;
    const hasDeepLink = Boolean(initialPracticeExam || sanitizeMode(initialMode));
    if (hasDeepLink) {
      return;
    }

    const snapshot = runtimeFromSnapshot(window.sessionStorage.getItem(PRACTICE_STORAGE_KEY));
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
            openRichSession(mode, exam);
          }
        } catch {
          // individual loaders already set UI error state
        }
      })();
    });
  }, [initialExam, initialMode, initialPracticeExam, standardCount]);

  useEffect(() => {
    if (!state.session) {
      window.sessionStorage.removeItem(PRACTICE_STORAGE_KEY);
      return;
    }

    window.sessionStorage.setItem(PRACTICE_STORAGE_KEY, createSessionSnapshot(state.session));
  }, [state.session]);

  async function openStandardSession(exam: Exam, count: number) {
    setError(null);
    const response = await fetch("/api/quiz/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exam,
        count,
      }),
    });

    if (!response.ok) {
      setError("Could not start the live-bank session. Please try again.");
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
        label: `${exam.toUpperCase()} live bank`,
        description: "Standard live-bank question flow with rationale, progress, and tutor support.",
        questions,
      }),
    });
  }

  function openRichSession(mode: Extract<PracticeMode, "chart" | "case-study" | "ngn">, exam: Exam) {
    setError(null);
    if (!canUseRichModes) {
      setError(getPremiumLockMessage("rich"));
      return;
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
          ? "CCRN case studies"
          : "NGN-style deck";

    const description =
      mode === "chart"
        ? "Wider data-first question taking for chart excerpts and trends."
        : mode === "case-study"
          ? "Clinical cases with vitals, labs, hemodynamics, and bedside context."
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
      setError("That simulation could not be loaded right now.");
      return;
    }

    const payload = await response.json();
    const data = payload.data ?? payload;
    dispatch({
      type: "start-session",
      payload: createClientSession({
        id: data.definition.id,
        mode: "practice-exam",
        exam: data.definition.exam,
        label: data.definition.label,
        description: data.definition.description,
        questions: data.questions,
        timeLimitMinutes: data.definition.timeLimitMinutes,
      }),
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
          correctAnswer: data.correctAnswer,
          rationale: data.rationale,
          takeaway: data.takeaway ?? question.takeaway,
          submittedAt: Date.now(),
        },
      });
      return;
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
  const answeredCount = session ? Object.keys(session.answers).length : 0;
  const correctCount = session ? Object.values(session.answers).filter((item) => item.correct).length : 0;
  const remainingSeconds = session?.timeLimitMinutes
    ? Math.max(0, session.timeLimitMinutes * 60 - Math.floor((now - session.startedAt) / 1000))
    : null;
  const canOpenTutor = Boolean(canUseTutor && currentQuestion && currentRecord);

  return (
    <div className="space-y-6">
      {state.phase === "catalog" ? (
        <section className="space-y-6">
          <div className="flex flex-col gap-4 rounded-[30px] border border-[rgba(74,85,89,0.08)] bg-[rgba(255,252,247,0.92)] p-5 shadow-card md:flex-row md:items-center md:justify-between md:p-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">Launch surface</p>
              <h2 className="mt-3 font-serif text-[2.1rem] leading-[0.98] text-dark">Choose the kind of rep you need next.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
                Standard sessions use the live bank. Rich formats and simulations open inside the same larger study
                environment so the product feels real instead of fragmented.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">Exam focus</p>
                <div className="flex gap-2">
                  {(["nclex", "ccrn"] as const).map((exam) => (
                    <button
                      key={exam}
                      type="button"
                      onClick={() => setSelectedExam(exam)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        selectedExam === exam
                          ? "bg-[#4A5559] text-white"
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
          </div>

          {error ? (
            <div className="rounded-[22px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-3">
            {catalogCards.map((card) => {
              const locked = card.mode === "practice-exam"
                ? !canUsePracticeExams
                : card.mode === "standard"
                  ? false
                  : !canUseRichModes;

              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => {
                    startTransition(() => {
                      void (async () => {
                        if (card.mode === "standard") {
                          await openStandardSession(card.exam ?? selectedExam, standardCount);
                          return;
                        }

                        if (card.mode === "practice-exam") {
                          const examDefinition = practiceExamDefinitions.find((item) => item.exam === selectedExam) ?? practiceExamDefinitions[0];
                          await openPracticeExam(examDefinition.id);
                          return;
                        }

                        openRichSession(card.mode, selectedExam);
                      })();
                    });
                  }}
                  className={`rounded-[28px] border border-[rgba(74,85,89,0.08)] p-6 text-left shadow-card transition-transform duration-200 hover:-translate-y-1 ${card.accent} ${locked ? "opacity-95" : ""}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="section-label">{card.hint}</span>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {locked ? (
                        <span className="rounded-full border border-[rgba(194,154,86,0.28)] bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-dark">
                          Plus unlock
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
                {!canUsePracticeExams ? (
                  <p className="mt-3 text-sm leading-6 text-muted">
                    Plus unlocks all 5 simulations inside the same premium practice center.
                  </p>
                ) : null}
              </div>
              {accessType ? (
                <span className="rounded-full border border-[rgba(74,85,89,0.12)] bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-dark">
                  {accessType}
                </span>
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
                  className={`rounded-[24px] border border-[rgba(74,85,89,0.08)] bg-[rgba(251,249,243,0.96)] p-5 text-left shadow-card transition-transform duration-200 hover:-translate-y-1 ${
                    canUsePracticeExams ? "" : "opacity-95"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="section-label">{definition.exam.toUpperCase()}</span>
                    {!canUsePracticeExams ? (
                      <span className="rounded-full border border-[rgba(194,154,86,0.28)] bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-dark">
                        Plus unlock
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
          <div className="grid gap-4 rounded-[30px] border border-[rgba(74,85,89,0.08)] bg-[rgba(255,252,247,0.94)] p-5 shadow-card xl:grid-cols-[1.18fr_0.82fr]">
            <div>
              <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
                <span className="rounded-full border border-[rgba(74,85,89,0.12)] bg-white/70 px-3 py-1">{session.label}</span>
                <span className="rounded-full border border-[rgba(74,85,89,0.12)] bg-white/70 px-3 py-1">{session.exam.toUpperCase()}</span>
                <span className="rounded-full border border-[rgba(74,85,89,0.12)] bg-white/70 px-3 py-1">{session.mode.replace("-", " ")}</span>
              </div>
              <h2 className="mt-4 font-serif text-[2.2rem] leading-[0.98] text-dark">{session.description}</h2>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-[rgba(74,85,89,0.08)]">
                <div
                  className="h-full rounded-full bg-[#5A7F88] transition-all duration-300"
                  style={{ width: `${Math.round(((session.currentIndex + 1) / session.questions.length) * 100)}%` }}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[22px] border border-[rgba(74,85,89,0.08)] bg-white/80 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">Answered</p>
                <p className="mt-3 text-2xl font-semibold text-dark">{answeredCount}/{session.questions.length}</p>
              </div>
              <div className="rounded-[22px] border border-[rgba(74,85,89,0.08)] bg-white/80 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">Correct</p>
                <p className="mt-3 text-2xl font-semibold text-dark">{correctCount}</p>
              </div>
              <div className="rounded-[22px] border border-[rgba(74,85,89,0.08)] bg-white/80 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">Flagged</p>
                <p className="mt-3 text-2xl font-semibold text-dark">{session.flaggedQuestionIds.length}</p>
              </div>
              <div className="rounded-[22px] border border-[rgba(74,85,89,0.08)] bg-white/80 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">Timer</p>
                <p className="mt-3 text-2xl font-semibold text-dark">
                  {remainingSeconds !== null ? formatTime(remainingSeconds) : formatTime(Math.floor((now - session.startedAt) / 1000))}
                </p>
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

      {session && state.phase === "results" && scoreSummary ? (
        <section className="space-y-5">
          <div className="rounded-[32px] border border-[rgba(74,85,89,0.08)] bg-[rgba(255,252,247,0.96)] p-6 shadow-card md:p-8">
            <span className="section-label">Session results</span>
            <h2 className="mt-3 font-serif text-[2.8rem] leading-[0.94] text-dark">{session.label}</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <div className="rounded-[24px] border border-[rgba(74,85,89,0.08)] bg-white/70 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">Score</p>
                <p className="mt-3 text-3xl font-semibold text-dark">{scoreSummary.score}%</p>
              </div>
              <div className="rounded-[24px] border border-[rgba(74,85,89,0.08)] bg-white/70 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">Correct</p>
                <p className="mt-3 text-3xl font-semibold text-dark">{scoreSummary.correctAnswers}</p>
              </div>
              <div className="rounded-[24px] border border-[rgba(74,85,89,0.08)] bg-white/70 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">Missed</p>
                <p className="mt-3 text-3xl font-semibold text-dark">{scoreSummary.totalQuestions - scoreSummary.correctAnswers}</p>
              </div>
              <div className="rounded-[24px] border border-[rgba(74,85,89,0.08)] bg-white/70 p-4">
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
                  <button type="button" onClick={() => dispatch({ type: "open-catalog" })} className="btn-secondary">
                    New session
                  </button>
                </div>
              </div>
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
        <div className="rounded-[22px] border border-[rgba(74,85,89,0.08)] bg-[rgba(255,252,247,0.92)] px-4 py-3 text-sm text-muted shadow-card">
          Loading the study session...
        </div>
      ) : null}
    </div>
  );
}
