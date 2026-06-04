"use client";

import BrandMark from "@/components/brand/BrandMark";
import PracticeQuestionPane from "@/components/practice/PracticeQuestionPane";
import PracticeTutorDrawer from "@/components/practice/PracticeTutorDrawer";
import type { PracticeCatalogCard, PracticeExamDefinition, PracticeAnswerRecord, PracticeQuestion, PracticeSessionState } from "@/lib/practice-types";
import type { PracticeCounts } from "@/lib/practice-data";
import type { PracticePhase } from "@/lib/practice-session";
import type { QuestionType } from "@/lib/types";

type Exam = "nclex" | "ccrn";

const QUESTION_TYPE_DETAILS: Record<QuestionType, string> = {
  mcq: "single best answer",
  sata: "select all that apply",
  ordering: "sequence the safest steps",
  matrix: "row-by-row clinical judgment",
  case_study: "scenario, exhibits, labs, and rationale",
  bow_tie: "condition, actions, and monitoring",
};

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
  standardCount: 10 | 20 | 50;
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
  categoryProgress?: Record<string, { answered: number; correct: number; accuracy: number }>;
  totalAnsweredByExam?: { nclex: number; ccrn: number };
  isAuthenticated?: boolean;
  streakDays?: number;
  todayAnswered?: number;
  suggestedCategoryLabel?: string | null;
  readinessAttempts?: Record<string, {
    accuracy: number;
    correctAnswers: number;
    totalQuestions: number;
    takenAtMs: number;
  }>;
  ngnMix?: "mcq" | "realistic" | "ngn";
  onSetNgnMix?: (next: "mcq" | "realistic" | "ngn") => void;
  willPersonalize?: boolean;
  draftAnswer: import("@/lib/practice-types").PracticeAnswer;
  practiceExamStatusCopy: string;
  formatTime: (seconds: number) => string;
  onSetSelectedExam: (exam: Exam) => void;
  onSetStudyTheme: (theme: "light" | "dark") => void;
  onSetStandardCount: (count: 10 | 20 | 50) => void;
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
  onContinueDrillFromTutor?: () => void;
  continueDrillLabel?: string | null;
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
    accessibleLiveCount,
    questionBankAccessPercent,
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
    canUseRichModes,
    canUsePracticeExams,
    canUseIcuSimBeta,
    canUseAdvancedAnalytics,
    practiceExamLimit,
    catalogCards,
    practiceExamDefinitions,
    categoryOptions,
    questionTypeOptions,
    categoryProgress = {},
    totalAnsweredByExam = { nclex: 0, ccrn: 0 },
    isAuthenticated = false,
    streakDays = 0,
    todayAnswered = 0,
    suggestedCategoryLabel = null,
    readinessAttempts = {},
    ngnMix = "realistic",
    onSetNgnMix,
    willPersonalize = false,
    draftAnswer,
    practiceExamStatusCopy,
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
    onContinueDrillFromTutor,
    continueDrillLabel,
    onFinishSession,
    onResetSession,
    onStartMissedReview,
  } = props;
  const nclexExamActive = Boolean(session && phase !== "catalog" && phase !== "results" && currentQuestion?.exam === "nclex");

  return (
    <div className={`quiz-terminal-app quiz-terminal-tier-${tier}`} data-study-theme={studyTheme}>
      {!nclexExamActive && phase !== "catalog" ? <header className="quiz-terminal-header">
        <div className="flex items-center gap-3">
          <BrandMark compact />
          <div>
            <p className="quiz-terminal-kicker">Clarity terminal</p>
            <p className="quiz-terminal-copy">
              {session
                ? `${session.exam.toUpperCase()} · ${session.mode.replace("-", " ")} · question ${session.currentIndex + 1} of ${session.questions.length}`
                : runStatus}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-start gap-2">
          {session ? (
            <>
              <span className="quiz-chip">{session.exam.toUpperCase()}</span>
              <span className="quiz-chip">{session.mode.replace("-", " ")}</span>
              <span className="quiz-chip">q {session.currentIndex + 1}/{session.questions.length}</span>
              {currentQuestion?.category ? <span className="quiz-chip">{currentQuestion.category}</span> : null}
            </>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="quiz-theme-switch" role="group" aria-label="Study theme">
            <button type="button" onClick={() => onSetStudyTheme("light")} className={`quiz-theme-option ${studyTheme === "light" ? "is-active" : ""}`}>light</button>
            <button type="button" onClick={() => onSetStudyTheme("dark")} className={`quiz-theme-option ${studyTheme === "dark" ? "is-active" : ""}`}>dark</button>
          </div>
          <button type="button" onClick={onBackToCatalog} className="quiz-terminal-link">exit run</button>
        </div>
      </header> : null}

      <div className="quiz-terminal-body">
        {phase === "catalog" ? (
          <section className="quiz-terminal-state quiz-terminal-scroll">
            <div className="quiz-catalog-shell">
              {/* Slim head — only chips. Visual emphasis goes to the two
                  equal-weight hero CTAs immediately below. */}
              <header className="quiz-catalog-head quiz-catalog-head--slim">
                <div className="quiz-catalog-head__row">
                  <p className="quiz-catalog-eyebrow">Practice center</p>
                  <div className="quiz-catalog-head__chips">
                    {isAuthenticated && (streakDays > 0 || todayAnswered > 0) ? (
                      <span className="quiz-catalog-streak-pill" aria-label={`${streakDays}-day streak, ${todayAnswered} answered today`}>
                        <span aria-hidden="true">🔥</span>
                        <span>
                          <strong>{streakDays}</strong>-day streak
                        </span>
                        <span aria-hidden="true" className="quiz-catalog-streak-pill__sep">·</span>
                        <span>
                          <strong>{todayAnswered}</strong> today
                        </span>
                      </span>
                    ) : null}
                    {tier === "free" ? (
                      <a href="/pricing" className="quiz-catalog-free-pill" aria-label="Free plan limit — view upgrade options">
                        <span>Free plan · 10 questions/day</span>
                        <span className="quiz-catalog-free-pill__cta">Upgrade →</span>
                      </a>
                    ) : null}
                  </div>
                </div>
              </header>

              {/* Hero CTA — big single button with baseline suggestion */}
              <section className="quiz-catalog-hero">
                <div className="quiz-catalog-hero__main">
                  {willPersonalize && isAuthenticated && !selectedCategory ? (
                    <span className="quiz-catalog-hero__adaptive-badge" aria-label="Adaptive selection enabled">
                      <span aria-hidden="true">🎯</span>
                      <span>Tuned to your weak areas</span>
                    </span>
                  ) : null}
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
                      {isPending
                        ? "Loading…"
                        : suggestedCategoryLabel && !selectedCategory
                          ? `Start studying — ${suggestedCategoryLabel}`
                          : selectedCategory
                            ? `Start studying — ${categoryOptions.find((o) => o.value === selectedCategory)?.label ?? "drill"}`
                            : "Start studying"}
                    </span>
                    <span className="quiz-catalog-hero__cta-meta">
                      {standardCount} {selectedExam.toUpperCase()} questions
                      {suggestedCategoryLabel && !selectedCategory ? " · weakest area" : ""}
                      {ngnOnly ? " · NGN only" : ""}
                    </span>
                  </button>
                  <details className="quiz-catalog-advanced">
                    <summary className="quiz-catalog-advanced__summary">Advanced filters</summary>
                    <div className="quiz-catalog-advanced__grid">
                      <div className="quiz-catalog-advanced__group">
                        <span className="quiz-catalog-label">Exam</span>
                        <div className="quiz-catalog-pillset">
                          {(["nclex", "ccrn"] as const).map((exam) => {
                            const trackLocked = accessExamTrack !== "all" && accessExamTrack !== exam;
                            const emptyBank = (exam === "nclex" ? liveCounts.nclex : liveCounts.ccrn) === 0;
                            const isDisabled = trackLocked || emptyBank;
                            const tooltip = trackLocked
                              ? `Your plan covers ${accessExamTrack.toUpperCase()} only — upgrade to add ${exam.toUpperCase()}.`
                              : emptyBank
                                ? `${exam.toUpperCase()} bank is empty — coming soon.`
                                : undefined;
                            return (
                              <button
                                key={exam}
                                type="button"
                                onClick={() => onSetSelectedExam(exam)}
                                className={`quiz-catalog-pill ${selectedExam === exam ? "is-active" : ""} ${isDisabled ? "is-locked" : ""}`}
                                disabled={isDisabled}
                                title={tooltip}
                              >
                                {exam.toUpperCase()}
                                {isDisabled ? <span className="quiz-catalog-pill__lock" aria-hidden="true">·🔒</span> : null}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="quiz-catalog-advanced__group">
                        <span className="quiz-catalog-label">Questions</span>
                        <div className="quiz-catalog-pillset">
                          {[10, 20, 50].map((count) => (
                            <button
                              key={count}
                              type="button"
                              onClick={() => onSetStandardCount(count as 10 | 20 | 50)}
                              className={`quiz-catalog-pill ${standardCount === count ? "is-active" : ""}`}
                            >
                              {count}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="quiz-catalog-advanced__group quiz-catalog-advanced__group--wide">
                        <span className="quiz-catalog-label">Focus</span>
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
                            <option key={option.value} value={option.value} disabled={ngnOnly && option.value === "mcq"}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="quiz-catalog-advanced__group quiz-catalog-advanced__group--wide">
                        <span className="quiz-catalog-label">NGN mix</span>
                        <div className="quiz-catalog-pillset" role="group" aria-label="NGN question mix">
                          {([
                            { value: "mcq" as const, label: "MCQ only", desc: "Classic multiple-choice" },
                            { value: "realistic" as const, label: "Realistic mix", desc: "≈35% NGN — matches the live exam" },
                            { value: "ngn" as const, label: "NGN only", desc: "Case studies, bow-tie, matrix" },
                          ]).map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => onSetNgnMix?.(opt.value)}
                              className={`quiz-catalog-pill ${ngnMix === opt.value ? "is-active" : ""}`}
                              title={opt.desc}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="quiz-catalog-advanced__toggles">
                        <button type="button" onClick={onResetFilters} className="quiz-catalog-reset">
                          Reset filters
                        </button>
                      </div>
                    </div>
                  </details>
                </div>

                {/* Baseline / readiness exam — always visible as the equal-weight
                    second hero option. Copy adapts to whether this is the first
                    attempt or a retake. */}
                {(() => {
                  const totalAnswered = (totalAnsweredByExam.nclex ?? 0) + (totalAnsweredByExam.ccrn ?? 0);
                  const diagnostic = practiceExamDefinitions.find((d) => d.exam === selectedExam) ?? practiceExamDefinitions[0];
                  if (!diagnostic) return null;
                  const isFirstTime = !isAuthenticated || totalAnswered < 25;
                  const hasAttempted = Boolean(readinessAttempts[diagnostic.id]);
                  return (
                    <aside className="quiz-catalog-baseline">
                      <span className="quiz-catalog-baseline__kicker">
                        {hasAttempted ? "Retake readiness exam" : isFirstTime ? "Take first free readiness exam" : "Readiness exam"}
                      </span>
                      <h3 className="quiz-catalog-baseline__title">
                        {hasAttempted ? "Retest after focused study." : "Take a baseline readiness exam."}
                      </h3>
                      <p className="quiz-catalog-baseline__body">
                        {hasAttempted
                          ? `Last attempt: ${readinessAttempts[diagnostic.id]?.accuracy}% on ${readinessAttempts[diagnostic.id]?.takenAtMs ? new Date(readinessAttempts[diagnostic.id]!.takenAtMs).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}. Retest with a fresh non-overlapping form.`
                          : `One full ${diagnostic.exam.toUpperCase()} readiness run pinpoints your weak and strong areas so the dashboard can tune the next 30 days of study to you.`}
                      </p>
                      <button
                        type="button"
                        onClick={() => onLaunchPracticeExam(diagnostic.id)}
                        className="quiz-catalog-baseline__cta"
                        disabled={!canUsePracticeExams}
                      >
                        {canUsePracticeExams
                          ? `${hasAttempted ? "Retake" : "Take"} ${diagnostic.label} →`
                          : "Upgrade to unlock readiness exams"}
                      </button>
                      <p className="quiz-catalog-baseline__meta">
                        {diagnostic.length} questions · {diagnostic.timeLimitMinutes} min · scored against the blueprint
                      </p>
                    </aside>
                  );
                })()}
              </section>

              {error ? <div className="quiz-terminal-alert">{error}</div> : null}

              {/* Category tile grid with progress bars + free-tier lock indicators.
                  On the free plan, the first 2 categories per exam stay unlocked
                  so students can try them; the rest show a lock badge that links
                  to pricing. */}
              <section className="quiz-catalog-block">
                <div className="quiz-catalog-block__head">
                  <p className="quiz-catalog-label">{selectedExam.toUpperCase()} categories</p>
                  <p className="quiz-catalog-block__hint">
                    {isAuthenticated
                      ? "Bars show your current accuracy. Click any to drill the weak ones."
                      : tier === "free"
                        ? `Free preview unlocks the first 2 categories. Click a category to start.`
                        : `Click a category to start a ${standardCount}-question set.`}
                  </p>
                </div>
                <div className="quiz-catalog-tiles">
                  {categoryOptions.map((option, idx) => {
                    const progress = categoryProgress[`${selectedExam}::${option.value}`];
                    const accuracy = progress?.accuracy ?? 0;
                    const answered = progress?.answered ?? 0;
                    const hasProgress = answered > 0;
                    const isLockedFree = tier === "free" && idx >= 2;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          if (isLockedFree) {
                            window.location.href = "/pricing?utm_source=catalog_lock";
                            return;
                          }
                          onSetSelectedCategory(option.value);
                          const card =
                            catalogCards.find((c) => c.mode === "standard" && c.exam === selectedExam) ??
                            catalogCards[0];
                          if (card) onLaunchCatalogCard(card);
                        }}
                        className={`quiz-catalog-tile ${selectedCategory === option.value ? "is-active" : ""} ${isLockedFree ? "is-locked" : ""}`}
                        aria-disabled={isLockedFree}
                        title={isLockedFree ? "Upgrade to unlock this category" : undefined}
                      >
                        <span className="quiz-catalog-tile__name">
                          {option.label}
                          {isLockedFree ? <span className="quiz-catalog-tile__lock-icon" aria-hidden="true"> 🔒</span> : null}
                        </span>
                        {isAuthenticated ? (
                          <div className="quiz-catalog-tile__progress">
                            <div className="quiz-catalog-tile__progress-track">
                              <div
                                className={`quiz-catalog-tile__progress-fill ${accuracy >= 75 ? "is-strong" : accuracy < 60 && hasProgress ? "is-weak" : ""}`}
                                style={{ width: `${hasProgress ? Math.max(3, accuracy) : 0}%` }}
                              />
                            </div>
                            <div className="quiz-catalog-tile__progress-meta">
                              <span>
                                {hasProgress ? (
                                  <>
                                    <span
                                      aria-hidden="true"
                                      className={`quiz-catalog-tile__icon ${accuracy >= 75 ? "is-strong" : accuracy < 60 ? "is-weak" : "is-mid"}`}
                                    >
                                      {accuracy >= 75 ? "↑" : accuracy < 60 ? "↓" : "→"}
                                    </span>
                                    {accuracy}% accuracy
                                  </>
                                ) : "No data yet"}
                              </span>
                              <span>{hasProgress ? `${answered} q` : "Start →"}</span>
                            </div>
                          </div>
                        ) : isLockedFree ? (
                          <span className="quiz-catalog-tile__cta quiz-catalog-tile__cta--locked">Upgrade →</span>
                        ) : (
                          <span className="quiz-catalog-tile__cta">Start →</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Readiness exams — compact bottom strip */}
              <section className="quiz-catalog-block">
                <div className="quiz-catalog-block__head">
                  <p className="quiz-catalog-label">Readiness exams</p>
                  <p className="quiz-catalog-block__hint">
                    {practiceExamStatusCopy}
                    {canUseIcuSimBeta ? " · ICU sim beta included." : ""}
                  </p>
                </div>
                <div className="quiz-catalog-exam-row">
                  {practiceExamDefinitions.map((definition) => {
                    const attempt = readinessAttempts[definition.id];
                    const attemptDate = attempt ? new Date(attempt.takenAtMs) : null;
                    const accuracyTone =
                      attempt && attempt.accuracy >= 75
                        ? "is-strong"
                        : attempt && attempt.accuracy < 60
                          ? "is-weak"
                          : attempt
                            ? "is-mid"
                            : "";
                    return (
                      <button
                        key={definition.id}
                        type="button"
                        onClick={() => onLaunchPracticeExam(definition.id)}
                        className={`quiz-catalog-exam-card ${attempt ? "has-attempt" : ""}`}
                      >
                        <span className="quiz-catalog-exam-card__exam">{definition.exam.toUpperCase()}</span>
                        <strong className="quiz-catalog-exam-card__label">{definition.label}</strong>
                        <span className="quiz-catalog-exam-card__meta">
                          {definition.length} q · {definition.timeLimitMinutes} min
                        </span>
                        {attempt ? (
                          <span className={`quiz-catalog-exam-card__attempt ${accuracyTone}`}>
                            <span aria-hidden="true">
                              {attempt.accuracy >= 75 ? "↑" : attempt.accuracy < 60 ? "↓" : "→"}
                            </span>
                            <strong>{attempt.accuracy}%</strong>
                            <span className="quiz-catalog-exam-card__attempt-date">
                              {attemptDate ? attemptDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
                            </span>
                          </span>
                        ) : null}
                        {!canUsePracticeExams ? (
                          <span className="quiz-catalog-exam-card__locked">Upgrade to unlock</span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>
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
          onContinueDrill={onContinueDrillFromTutor}
          continueDrillLabel={continueDrillLabel ?? undefined}
        />
      ) : null}

      {isPending ? <div className="quiz-terminal-toast">Loading the study session...</div> : null}
    </div>
  );
}
