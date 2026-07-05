"use client";

import { useEffect, useState } from "react";
import StartHerePicker from "./StartHerePicker";

import BrandMark from "@/components/brand/BrandMark";
import PracticeQuestionPane from "@/components/practice/PracticeQuestionPane";
import PracticeTutorDrawer from "@/components/practice/PracticeTutorDrawer";
import type { PracticeCatalogCard, PracticeExamDefinition, PracticeAnswerRecord, PracticeQuestion, PracticeSessionState } from "@/lib/practice-types";
import type { PracticeCounts } from "@/lib/practice-data";
import type { PracticePhase } from "@/lib/practice-session";
import type { QuestionType } from "@/lib/types";

type Exam = "nclex" | "ccrn";

function getExamTitle(exam: Exam) {
  return exam === "nclex" ? "NCLEX-RN practice test" : "CCRN practice test";
}

type QuizTerminalShellProps = {
  phase: PracticePhase;
  tier: "free" | "plus" | "pro";
  studyTheme: "light" | "dark";
  error: string | null;
  isPending: boolean;
  accessType: string | null;
  accessExamTrack: "all" | "ccrn" | "nclex";
  accessibleLiveCount: number;
  questionBankAccessPercent: number;
  selectedExam: Exam;
  selectedCategory: string;
  selectedQuestionType: QuestionType | "";
  ngnOnly: boolean;
  standardCount: 10 | 20 | 50 | "unlimited";
  activeFilterSummary: string;
  liveCounts: PracticeCounts;
  nclexStats: {
    mcqLive: number;
    ngnLive: number;
    ngnRatio: number;
  };
  session: PracticeSessionState | null;
  currentQuestion: PracticeQuestion | null;
  currentRecord?: PracticeAnswerRecord;
  tutorQuestion: PracticeQuestion | null;
  tutorRecord?: PracticeAnswerRecord;
  questionStatuses: Array<{ id: string; answered: boolean; flagged: boolean }>;
  scoreSummary: ReturnType<typeof import("@/lib/practice-session").computeSessionScore> | null;
  answeredCount: number;
  correctCount: number;
  sessionProgressPercent: number;
  liveAccuracy: number | null;
  remainingQuestions: number;
  runStatus: string;
  remainingSeconds: number | null;
  elapsedSeconds: number;
  canOpenTutor: boolean;
  canUseTutor: boolean;
  canUseRichModes: boolean;
  canUsePracticeExams: boolean;
  canUseIcuSimBeta: boolean;
  canUseAdvancedAnalytics: boolean;
  practiceExamLimit: number;
  catalogCards: PracticeCatalogCard[];
  practiceExamDefinitions: PracticeExamDefinition[];
  categoryOptions: Array<{ value: string; label: string }>;
  questionTypeOptions: Array<{ value: QuestionType; label: string }>;
  draftAnswer: import("@/lib/practice-types").PracticeAnswer;
  practiceExamStatusCopy: string;
  formatTime: (seconds: number) => string;
  onSetSelectedExam: (exam: Exam) => void;
  onSetStudyTheme: (theme: "light" | "dark") => void;
  onSetStandardCount: (count: 10 | 20 | 50 | "unlimited") => void;
  onSetSelectedCategory: (category: string) => void;
  onSetSelectedQuestionType: (questionType: QuestionType | "") => void;
  onSetNgnOnly: (next: boolean) => void;
  onResetFilters: () => void;
  onLaunchCatalogCard: (card: PracticeCatalogCard) => void;
  onLaunchPracticeExam: (examId: string) => void;
  onBackToCatalog: () => void;
  onQuestionAnswerChange: (answer: import("@/lib/practice-types").PracticeAnswer) => void;
  onSubmitAnswer: () => void;
  onNextQuestion: () => void;
  onPrevQuestion: () => void;
  onJumpQuestion: (index: number) => void;
  onToggleFlag: () => void;
  onOpenTutor: () => void;
  onCloseTutor: () => void;
  onFinishSession: () => void;
  onResetSession: () => void;
  onStartMissedReview: () => void;
};

export default function QuizTerminalShell(props: QuizTerminalShellProps) {
  const {
    phase,
    tier,
    studyTheme,
    error,
    isPending,
    accessType,
    accessExamTrack,
    selectedExam,
    selectedCategory,
    selectedQuestionType,
    ngnOnly,
    standardCount,
    activeFilterSummary,
    liveCounts,
    nclexStats,
    session,
    currentQuestion,
    currentRecord,
    tutorQuestion,
    tutorRecord,
    questionStatuses,
    scoreSummary,
    answeredCount,
    correctCount,
    sessionProgressPercent,
    liveAccuracy,
    remainingQuestions,
    runStatus,
    remainingSeconds,
    elapsedSeconds,
    canOpenTutor,
    canUseTutor,
    canUsePracticeExams,
    canUseAdvancedAnalytics,
    practiceExamLimit,
    catalogCards,
    practiceExamDefinitions,
    categoryOptions,
    questionTypeOptions,
    draftAnswer,
    formatTime,
    onSetSelectedExam,
    onSetStudyTheme,
    onSetStandardCount,
    onSetSelectedCategory,
    onSetSelectedQuestionType,
    onSetNgnOnly,
    onResetFilters,
    onLaunchCatalogCard,
    onLaunchPracticeExam,
    onBackToCatalog,
    onQuestionAnswerChange,
    onSubmitAnswer,
    onNextQuestion,
    onPrevQuestion,
    onJumpQuestion,
    onToggleFlag,
    onOpenTutor,
    onCloseTutor,
    onFinishSession,
    onResetSession,
    onStartMissedReview,
  } = props;
  const nclexExamActive = Boolean(session && phase !== "catalog" && phase !== "results" && currentQuestion?.exam === "nclex");

  // Free-tier meter: lifetime questions used toward the 200 free allowance.
  const [freeUsed, setFreeUsed] = useState<number | null>(null);
  useEffect(() => {
    if (tier !== "free") return;
    let cancelled = false;
    fetch("/api/quiz/history", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        const stats = (payload?.data ?? payload)?.stats;
        if (!cancelled && typeof stats?.totalQuestions === "number") {
          setFreeUsed(stats.totalQuestions);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [tier]);
  const freeRemaining = freeUsed === null ? null : Math.max(0, 200 - freeUsed);

  return (
    <div className={`quiz-terminal-app quiz-terminal-tier-${tier}`} data-study-theme={studyTheme}>
      {!nclexExamActive ? <header className="quiz-terminal-header">
        <div className="flex items-center gap-3">
          <BrandMark compact />
          <div>
            <p className="quiz-terminal-kicker">Clarity terminal</p>
            <p className="quiz-terminal-copy">
              {phase === "catalog"
                ? "Launch a live clinical study run."
                : session
                  ? `${session.exam.toUpperCase()} · ${session.mode.replace("-", " ")} · question ${session.currentIndex + 1} of ${session.questions.length}`
                  : runStatus}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-start gap-2">
          {phase === "catalog" ? (
            <>
              <span className="quiz-chip">nclex {liveCounts.nclex}</span>
              <span className="quiz-chip">ccrn {liveCounts.ccrn}</span>
              <span className="quiz-chip quiz-chip-accent">ngn {nclexStats.ngnRatio}%</span>
              <span className="quiz-chip">{tier}</span>
              {accessType ? <span className="quiz-chip">{accessType}</span> : null}
            </>
          ) : session ? (
            <>
              <span className="quiz-chip">{session.exam.toUpperCase()}</span>
              <span className="quiz-chip">{session.mode.replace("-", " ")}</span>
              <span className="quiz-chip">q {session.currentIndex + 1}/{session.questions.length}</span>
              {currentQuestion?.category ? <span className="quiz-chip">{currentQuestion.category}</span> : null}
            </>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onSetStudyTheme(studyTheme === "light" ? "dark" : "light")}
            className="quiz-theme-icon"
            aria-label={studyTheme === "light" ? "Switch to dark theme" : "Switch to light theme"}
          >
            {studyTheme === "light" ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
          {phase !== "catalog" ? (
            <button type="button" onClick={onBackToCatalog} className="quiz-terminal-link">exit run</button>
          ) : (
            <>
              <a href="/nclex" className="quiz-terminal-link">nclex</a>
              <a href="/ccrn" className="quiz-terminal-link">ccrn</a>
              <a href="/upgrade" className="quiz-terminal-link">plans</a>
            </>
          )}
        </div>
      </header> : null}

      <div className="quiz-terminal-body">
        {phase === "catalog" ? (
          <section className="quiz-terminal-state quiz-terminal-scroll">
            <header className="quiz-catalog-head quiz-catalog-head--slim">
              <div className="quiz-catalog-head__row">
                <p className="quiz-catalog-eyebrow">Practice center</p>
                <div className="quiz-catalog-head__chips">
                  {tier === "free" ? (
                    <a href="/pricing" className="quiz-catalog-free-pill" aria-label="Free plan allowance — view upgrade options">
                      <span>
                        {freeRemaining === null
                          ? "200 free practice questions"
                          : freeRemaining > 0
                            ? `${freeRemaining} of 200 free questions left`
                            : "Free questions used — unlock the full bank"}
                      </span>
                      <span className="quiz-catalog-free-pill__cta">Upgrade &rarr;</span>
                    </a>
                  ) : null}
                </div>
              </div>
            </header>

            {/* Two-card hero: green "Study now" bank launch with filters below,
                orange readiness exam as the equal-weight second option. */}
            <section className="quiz-catalog-hero quiz-catalog-hero--grand">
              <div className="quiz-catalog-hero__main">
                <button
                  type="button"
                  onClick={() => {
                    const card =
                      catalogCards.find((c) => c.mode === "standard" && c.exam === selectedExam) ??
                      catalogCards.find((c) => c.mode === "standard") ??
                      catalogCards[0];
                    if (card) onLaunchCatalogCard(card);
                  }}
                  className="quiz-catalog-hero__cta"
                  disabled={isPending}
                >
                  <span className="quiz-catalog-hero__cta-text">
                    {isPending ? "Loading…" : "Study now"}
                  </span>
                  <span className="quiz-catalog-hero__cta-meta">
                    {standardCount === "unlimited" ? "Unlimited" : standardCount} {selectedExam.toUpperCase()} questions
                    {ngnOnly ? " · NGN only" : ""}
                    {selectedCategory
                      ? ` · ${categoryOptions.find((o) => o.value === selectedCategory)?.label ?? "focused drill"}`
                      : " · adapts to your weak areas"}
                  </span>
                </button>

                <details className="quiz-catalog-advanced">
                  <summary className="quiz-catalog-advanced__summary">Customize filters</summary>
                  <div className="quiz-catalog-advanced__grid">
                    <div className="quiz-catalog-advanced__group">
                      <span className="quiz-catalog-label">Exam</span>
                      <div className="quiz-catalog-pillset">
                        {(["nclex", "ccrn"] as const).map((exam) => (
                          <button
                            key={exam}
                            type="button"
                            onClick={() => onSetSelectedExam(exam)}
                            className={`quiz-catalog-pill ${selectedExam === exam ? "is-active" : ""}`}
                            disabled={accessExamTrack !== "all" && accessExamTrack !== exam}
                          >
                            {exam.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="quiz-catalog-advanced__group">
                      <span className="quiz-catalog-label">Deck size</span>
                      <div className="quiz-catalog-pillset">
                        <button type="button" onClick={() => onSetStandardCount("unlimited")} className={`quiz-catalog-pill ${standardCount === "unlimited" ? "is-active" : ""}`}>
                          Unlimited
                        </button>
                        {[10, 20, 50].map((count) => (
                          <button key={count} type="button" onClick={() => onSetStandardCount(count as 10 | 20 | 50)} className={`quiz-catalog-pill ${standardCount === count ? "is-active" : ""}`}>
                            {count}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="quiz-catalog-advanced__group quiz-catalog-advanced__group--wide">
                      <span className="quiz-catalog-label">Category</span>
                      <select
                        value={selectedCategory}
                        onChange={(event) => onSetSelectedCategory(event.target.value)}
                        className="quiz-catalog-select"
                      >
                        <option value="">All categories</option>
                        {categoryOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="quiz-catalog-advanced__group quiz-catalog-advanced__group--wide">
                      <span className="quiz-catalog-label">Question type</span>
                      <select
                        value={selectedQuestionType}
                        onChange={(event) => onSetSelectedQuestionType(event.target.value as QuestionType | "")}
                        className="quiz-catalog-select"
                      >
                        <option value="">Any type</option>
                        {questionTypeOptions.map((option) => (
                          <option key={option.value} value={option.value} disabled={ngnOnly && option.value === "mcq"}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="quiz-catalog-advanced__toggles">
                      <button type="button" onClick={() => onSetNgnOnly(!ngnOnly)} className={`quiz-catalog-pill ${ngnOnly ? "is-active" : ""}`}>
                        NGN only
                      </button>
                      <button type="button" onClick={onResetFilters} className="quiz-catalog-reset">
                        Reset filters
                      </button>
                      <span className="quiz-catalog-label">{activeFilterSummary || "All live filters active."}</span>
                    </div>
                  </div>
                </details>

                <StartHerePicker />
              </div>

              {(() => {
                const diagnostic = practiceExamDefinitions.find((d) => d.exam === selectedExam) ?? practiceExamDefinitions[0];
                if (!diagnostic) return null;
                return (
                  <aside className="quiz-catalog-baseline">
                    <span className="quiz-catalog-baseline__kicker">Readiness exam</span>
                    <h3 className="quiz-catalog-baseline__title">Take a baseline readiness exam.</h3>
                    <p className="quiz-catalog-baseline__body">
                      One full {diagnostic.exam.toUpperCase()} readiness run pinpoints your weak and strong areas so the dashboard can tune the next 30 days of study to you.
                    </p>
                    <button
                      type="button"
                      onClick={() => onLaunchPracticeExam(diagnostic.id)}
                      className="quiz-catalog-baseline__cta"
                      disabled={!canUsePracticeExams}
                    >
                      {canUsePracticeExams ? `Take ${diagnostic.label} →` : "Upgrade to unlock readiness exams"}
                    </button>
                    <p className="quiz-catalog-baseline__meta">
                      {diagnostic.length} questions · {diagnostic.timeLimitMinutes} min · scored against the blueprint
                    </p>
                  </aside>
                );
              })()}
            </section>

            {error ? (
              <div className="quiz-terminal-alert">
                {error}
                {/free question|upgrade/i.test(error) ? (
                  <a href="/pricing" className="btn-primary mt-3 inline-flex">See plans &rarr;</a>
                ) : null}
              </div>
            ) : null}

            <section className="quiz-terminal-section">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="quiz-terminal-kicker">Readiness exams</p>
                  <h2 className="text-[var(--quiz-ink-strong)]">Five timed forms. One honest verdict.</h2>
                </div>
                <p className="quiz-terminal-copy">Score On Track on all five to unlock the Pass Pledge.</p>
              </div>
              <div className="quiz-readiness-grid" data-testid="readiness-exam-grid">
                {practiceExamDefinitions.filter((definition) => definition.exam === selectedExam).map((definition, index) => (
                  <button
                    key={definition.id}
                    type="button"
                    onClick={() => onLaunchPracticeExam(definition.id)}
                    className="quiz-readiness-card"
                  >
                    <span className="quiz-readiness-card__num">{index + 1}</span>
                    <strong>{definition.label}</strong>
                    <small>
                      {definition.length} questions · {definition.timeLimitMinutes} min
                      {index === 0 && definition.exam === "nclex" ? " · free with account" : !canUsePracticeExams ? " · premium" : ""}
                    </small>
                  </button>
                ))}
              </div>
            </section>
          </section>
        ) : null}

        {session && phase !== "catalog" && phase !== "results" && currentQuestion ? (
          <section className="quiz-terminal-state quiz-terminal-session-state">
            <div className="overflow-hidden rounded-[22px] border border-[rgba(13,102,134,0.2)] bg-white shadow-[0_18px_40px_rgba(21,42,52,0.08)]">
              <div className="grid gap-2 bg-[#0b7598] px-4 py-3 text-sm font-semibold text-white md:grid-cols-[1fr_auto_1fr] md:items-center">
                <span>{getExamTitle(session.exam)}</span>
                <span className="text-center">Clarity Clinical Prep</span>
                <span className="text-left md:text-right">
                  {remainingSeconds !== null ? formatTime(remainingSeconds) : formatTime(elapsedSeconds)} | Question {session.currentIndex + 1} of {session.questions.length}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 bg-[#d9e9f4] px-4 py-2 text-sm font-semibold text-[#17475a]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white/72 px-3 py-1">Calculator</span>
                  <span className="rounded-full bg-white/72 px-3 py-1">Mode: {session.mode.replace("-", " ")}</span>
                  <span className="rounded-full bg-white/72 px-3 py-1">Status: {currentRecord ? "reviewing" : "not answered"}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={onToggleFlag} className="rounded-full bg-white/72 px-3 py-1 transition hover:bg-white">
                    {session.flaggedQuestionIds.includes(currentQuestion.id) ? "Marked" : "Mark for review"}
                  </button>
                  <button type="button" onClick={onBackToCatalog} className="rounded-full bg-white/72 px-3 py-1 transition hover:bg-white">
                    End
                  </button>
                </div>
              </div>
            </div>

            <div className="quiz-session-command-rail">
              <div className="quiz-session-command-main">
                <div className="flex flex-wrap gap-2">
                  <span className="quiz-chip quiz-chip-accent">{session.label}</span>
                  <span className="quiz-chip">{session.exam.toUpperCase()}</span>
                  <span className="quiz-chip">{session.mode.replace("-", " ")}</span>
                  <span className="quiz-chip">q {session.currentIndex + 1}/{session.questions.length}</span>
                </div>
                <div className="quiz-session-status-strip">
                  <div className="quiz-session-mini-stat">
                    <span>progress</span>
                    <strong>{sessionProgressPercent}%</strong>
                  </div>
                  <div className="quiz-session-mini-stat">
                    <span>accuracy</span>
                    <strong>{liveAccuracy !== null ? `${liveAccuracy}%` : "--"}</strong>
                  </div>
                  <div className="quiz-session-mini-stat">
                    <span>timer</span>
                    <strong>{remainingSeconds !== null ? formatTime(remainingSeconds) : formatTime(elapsedSeconds)}</strong>
                  </div>
                  <div className="quiz-session-mini-stat">
                    <span>flags</span>
                    <strong>{session.flaggedQuestionIds.length}</strong>
                  </div>
                  {canUseAdvancedAnalytics ? (
                    <div className="quiz-session-mini-stat">
                      <span>momentum</span>
                      <strong>{answeredCount > 0 ? `${Math.max(correctCount, 0)} / ${answeredCount}` : "warming"}</strong>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="quiz-session-command-side">
                <div className="quiz-session-flow">
                  {questionStatuses.map((status, index) => {
                    const active = index === session.currentIndex;
                    return (
                      <button
                        key={status.id}
                        type="button"
                        onClick={() => onJumpQuestion(index)}
                        className={`quiz-terminal-flow-mini ${active ? "is-active" : ""} ${status.answered ? "is-answered" : ""} ${status.flagged ? "is-flagged" : ""}`}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={onBackToCatalog} className="quiz-terminal-link">deck</button>
                  {answeredCount === session.questions.length ? (
                    <button type="button" onClick={onFinishSession} className="quiz-terminal-toggle is-active">results</button>
                  ) : null}
                  <span className="quiz-terminal-copy">{remainingQuestions} remaining</span>
                  <span className="quiz-chip">keys a-d / 1-4 / enter / n / f / t</span>
                </div>
              </div>
            </div>

            <div className="quiz-session-stage">
              <PracticeQuestionPane
                question={currentQuestion}
                draftAnswer={currentRecord?.selected ?? draftAnswer}
                answerRecord={currentRecord}
                onChange={onQuestionAnswerChange}
                onSubmit={onSubmitAnswer}
                onNext={onNextQuestion}
                onPrev={onPrevQuestion}
                onJump={onJumpQuestion}
                onToggleFlag={onToggleFlag}
                onOpenTutor={onOpenTutor}
                onEnd={onBackToCatalog}
                questionNumber={session.currentIndex + 1}
                totalQuestions={session.questions.length}
                canGoNext={session.currentIndex < session.questions.length - 1 || Boolean(currentRecord)}
                canGoPrev={session.currentIndex > 0}
                questionStatuses={questionStatuses}
                canOpenTutor={canOpenTutor}
                tier={tier}
                canUseAdvancedAnalytics={canUseAdvancedAnalytics}
                phase={phase}
              />
            </div>
          </section>
        ) : null}

        {session && phase !== "catalog" && phase !== "results" && !currentQuestion ? (
          <section className="quiz-terminal-state quiz-terminal-recovery">
            <div className="quiz-terminal-panel quiz-terminal-panel-recovery">
              <p className="quiz-terminal-kicker">Recovery</p>
              <h2 className="mt-4 text-[var(--quiz-ink-strong)]">this run lost its active question pointer.</h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--quiz-muted)]">
                The session state no longer maps cleanly to the current question list. Reopen the deck or reset the session and the route will recover cleanly.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button type="button" onClick={onBackToCatalog} className="quiz-terminal-toggle is-active">Back to launch deck</button>
                <button type="button" onClick={onResetSession} className="quiz-terminal-link">Reset session state</button>
              </div>
            </div>
          </section>
        ) : null}

        {session && phase === "results" && scoreSummary ? (
          <section className="quiz-terminal-state quiz-terminal-scroll">
            <div className="quiz-terminal-panel quiz-terminal-panel-results">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="quiz-terminal-kicker">Debrief</p>
                  <h2 className="mt-4 text-[var(--quiz-ink-strong)]">{session.label}</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="quiz-chip quiz-chip-accent">Score {scoreSummary.score}%</span>
                  <span className="quiz-chip">Correct {scoreSummary.correctAnswers}</span>
                  <span className="quiz-chip">Missed {scoreSummary.totalQuestions - scoreSummary.correctAnswers}</span>
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="quiz-terminal-stat"><span>Weak lanes</span><strong>{scoreSummary.weakCategories.length || 0}</strong><small>{scoreSummary.weakCategories[0] ?? "No weak lane detected."}</small></div>
                  <div className="quiz-terminal-stat"><span>Miss review</span><strong>{scoreSummary.missedQuestionIds.length}</strong><small>Exact questions ready for replay.</small></div>
                  <div className="quiz-terminal-stat"><span>Best lane</span><strong>{Object.entries(scoreSummary.categoryBreakdown).sort((left, right) => (right[1].correct / right[1].total) - (left[1].correct / left[1].total))[0]?.[0] ?? "Building"}</strong><small>Strongest conversion.</small></div>
                  <div className="quiz-terminal-stat"><span>Analytics</span><strong>{canUseAdvancedAnalytics ? "Advanced" : "Base"}</strong><small>{canUseAdvancedAnalytics ? "Trend signals unlocked." : "Upgrade for deeper analytics."}</small></div>
                </div>

                <div className="quiz-terminal-panel quiz-terminal-panel-breakdown">
                  <p className="quiz-terminal-kicker">Category breakdown</p>
                  <div className="mt-4 space-y-4">
                    {Object.entries(scoreSummary.categoryBreakdown).map(([category, bucket]) => (
                      <div key={category}>
                        <div className="flex items-center justify-between gap-3 text-sm text-[var(--quiz-ink-strong)]">
                          <span>{category}</span>
                          <span>{bucket.correct}/{bucket.total}</span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]">
                          <div className="h-full rounded-full bg-[linear-gradient(90deg,#9cb7a4,#d5ae63)]" style={{ width: `${Math.round((bucket.correct / bucket.total) * 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button type="button" onClick={onStartMissedReview} className="quiz-terminal-toggle is-active" disabled={scoreSummary.missedQuestionIds.length === 0}>Review missed</button>
                <button type="button" onClick={onBackToCatalog} className="quiz-terminal-link">New session</button>
              </div>
            </div>
          </section>
        ) : null}
      </div>

      {tutorQuestion && tutorRecord && tier !== "free" ? (
        <PracticeTutorDrawer
          question={tutorQuestion}
          selectedAnswer={tutorRecord.selected}
          answeredCorrectly={tutorRecord.correct}
          onClose={onCloseTutor}
        />
      ) : null}

      {isPending ? <div className="quiz-terminal-toast">Loading the study session...</div> : null}
    </div>
  );
}
