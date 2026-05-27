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
  scenario_mcq: "scenario-based single best answer",
  decision_map_mcq: "clinical decision map single best answer",
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
    onFinishSession,
    onResetSession,
    onStartMissedReview,
  } = props;
  const nclexExamActive = Boolean(session && phase !== "catalog" && phase !== "results" && currentQuestion?.exam === "nclex");

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
          <div className="quiz-theme-switch" role="group" aria-label="Study theme">
            <button type="button" onClick={() => onSetStudyTheme("light")} className={`quiz-theme-option ${studyTheme === "light" ? "is-active" : ""}`}>light</button>
            <button type="button" onClick={() => onSetStudyTheme("dark")} className={`quiz-theme-option ${studyTheme === "dark" ? "is-active" : ""}`}>dark</button>
          </div>
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
            <div className="quiz-terminal-catalog-grid">
              <section className="quiz-terminal-panel quiz-terminal-panel-hero">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="quiz-chip quiz-chip-accent">mission launch</span>
                  <span className="quiz-chip">access {accessibleLiveCount}/{selectedExam === "nclex" ? liveCounts.nclex : liveCounts.ccrn}</span>
                  <span className="quiz-chip">{questionBankAccessPercent}% unlocked</span>
                  <span className="quiz-chip">{accessExamTrack === "all" ? "dual track" : `${accessExamTrack.toUpperCase()} track`}</span>
                </div>
                <h1 className="mt-4 text-[var(--quiz-ink-strong)]">
                  launch the qbank like a real testing client.
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--quiz-muted)]">
                  Start standard reps, NGN sets, case flow, or a timed practice exam without leaving the same workspace. The launch deck stays short, the text stays legible, and the same question carries chart review, rationale, citations, and tutor follow-up.
                </p>
                <div className="mt-5 grid gap-3 xl:grid-cols-3">
                  <div className="quiz-terminal-stat">
                    <span>live bank</span>
                    <strong>{selectedExam === "nclex" ? liveCounts.nclex : liveCounts.ccrn}</strong>
                    <small>{selectedExam.toUpperCase()} questions available on this route.</small>
                  </div>
                  <div className="quiz-terminal-stat">
                    <span>focus</span>
                    <strong>{activeFilterSummary || "All lanes"}</strong>
                    <small>Client need, item type, or NGN-only launch.</small>
                  </div>
                  <div className="quiz-terminal-stat">
                    <span>study layer</span>
                    <strong>{tier === "free" ? "Preview" : tier === "plus" ? "Base premium" : "Dual premium"}</strong>
                    <small>{tier === "free" ? "Terminal preview with locked premium rail depth." : tier === "plus" ? "Full qbank and richer debrief rail on your track." : "Advanced analytics, tutor, and dual-track immersion."}</small>
                  </div>
                </div>
              </section>

              <section className="quiz-terminal-panel quiz-terminal-panel-controls">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <p className="quiz-terminal-kicker">Exam lane</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(["nclex", "ccrn"] as const).map((exam) => (
                        <button key={exam} type="button" onClick={() => onSetSelectedExam(exam)} className={`quiz-terminal-toggle ${selectedExam === exam ? "is-active" : ""}`} disabled={accessExamTrack !== "all" && accessExamTrack !== exam}>
                          {exam.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="quiz-terminal-kicker">Deck size</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {[10, 20, 50].map((count) => (
                        <button key={count} type="button" onClick={() => onSetStandardCount(count as 10 | 20 | 50)} className={`quiz-terminal-toggle ${standardCount === count ? "is-active" : ""}`}>
                          {count}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  <label className="quiz-terminal-field">
                    <span className="quiz-terminal-kicker">Category</span>
                    <select value={selectedCategory} onChange={(event) => onSetSelectedCategory(event.target.value)}>
                      <option value="">All categories</option>
                      {categoryOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="quiz-terminal-field">
                    <span className="quiz-terminal-kicker">Question type</span>
                    <select value={selectedQuestionType} onChange={(event) => onSetSelectedQuestionType(event.target.value as QuestionType | "")}>
                      <option value="">Any type</option>
                      {questionTypeOptions.map((option) => (
                        <option key={option.value} value={option.value} disabled={ngnOnly && option.value === "mcq"}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => onSetNgnOnly(!ngnOnly)} className={`quiz-terminal-toggle ${ngnOnly ? "is-active" : ""}`}>
                    NGN only
                  </button>
                  <button type="button" onClick={onResetFilters} className="quiz-terminal-link">Reset filters</button>
                  <span className="quiz-terminal-copy">{activeFilterSummary || "All live filters active."}</span>
                </div>
              </section>
            </div>

            {error ? <div className="quiz-terminal-alert">{error}</div> : null}

            <section className="quiz-terminal-section">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="quiz-terminal-kicker">Study by subject</p>
                  <h2 className="text-[var(--quiz-ink-strong)]">{selectedExam.toUpperCase()} categories.</h2>
                </div>
                <p className="quiz-terminal-copy">Choose a lane first, then launch standard, NGN, case, or timed practice.</p>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {categoryOptions.map((option, index) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onSetSelectedCategory(option.value)}
                    className={`quiz-terminal-lane ${selectedCategory === option.value ? "is-featured" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="quiz-chip">{String(index + 1).padStart(2, "0")}</span>
                      <span className="quiz-chip">{selectedCategory === option.value ? "active" : "filter"}</span>
                    </div>
                    <h3 className="mt-4 text-[var(--quiz-ink-strong)]">{option.label}</h3>
                    <p className="mt-3 text-sm leading-6 text-[var(--quiz-muted)]">Route the next deck through this clinical category and keep the rationale tied to the same weakness.</p>
                  </button>
                ))}
              </div>
            </section>

            <section className="quiz-terminal-section">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="quiz-terminal-kicker">Study by question type</p>
                  <h2 className="text-[var(--quiz-ink-strong)]">NGN and classic formats.</h2>
                </div>
                <p className="quiz-terminal-copy">Matrix, ordering, case study, and bow-tie items stay in the same test shell.</p>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {questionTypeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onSetSelectedQuestionType(option.value);
                      if (option.value !== "mcq") {
                        onSetNgnOnly(true);
                      }
                    }}
                    className={`quiz-terminal-lane ${selectedQuestionType === option.value ? "is-featured" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="quiz-chip">{option.value.replace(/_/g, " ")}</span>
                      <span className="quiz-chip">{selectedQuestionType === option.value ? "active" : "choose"}</span>
                    </div>
                    <h3 className="mt-4 text-[var(--quiz-ink-strong)]">{option.label}</h3>
                    <p className="mt-3 text-sm leading-6 text-[var(--quiz-muted)]">{QUESTION_TYPE_DETAILS[option.value]}</p>
                  </button>
                ))}
              </div>
            </section>

            <section className="quiz-terminal-section">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="quiz-terminal-kicker">Study lanes</p>
                  <h2 className="text-[var(--quiz-ink-strong)]">choose the next run.</h2>
                </div>
                <p className="quiz-terminal-copy">{canUseRichModes ? "Rich modes unlocked." : "Standard bank active."}</p>
              </div>
              <div className="mt-5 grid gap-4 xl:grid-cols-3">
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
                      onClick={() => onLaunchCatalogCard(card)}
                      className={`quiz-terminal-lane ${card.featured ? "is-featured" : ""}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="quiz-chip">{card.hint}</span>
                        <span className="quiz-chip">{locked ? "Locked" : card.exam ? card.exam.toUpperCase() : selectedExam.toUpperCase()}</span>
                      </div>
                      <h3 className="mt-5 text-[var(--quiz-ink-strong)]">{card.label}</h3>
                      <p className="mt-3 text-sm leading-7 text-[var(--quiz-muted)]">{card.description}</p>
                      <div className="mt-5 flex items-center justify-between text-sm text-[var(--quiz-muted)]">
                        <span>{card.count} items</span>
                        <span>{locked ? "Upgrade" : "Launch"}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="quiz-terminal-section">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="quiz-terminal-kicker">Timed simulations</p>
                  <h2 className="text-[var(--quiz-ink-strong)]">fixed-length practice exams.</h2>
                </div>
                <p className="quiz-terminal-copy">{practiceExamStatusCopy}{canUseIcuSimBeta ? " ICU sim beta included." : ""}</p>
              </div>
              <div className="mt-5 grid gap-4 lg:grid-cols-5">
                {practiceExamDefinitions.map((definition) => (
                  <button key={definition.id} type="button" onClick={() => onLaunchPracticeExam(definition.id)} className="quiz-terminal-exam-card">
                    <div className="flex items-center justify-between gap-3">
                      <span className="quiz-chip">{definition.exam.toUpperCase()}</span>
                      {!canUsePracticeExams ? <span className="quiz-chip">Locked</span> : null}
                    </div>
                    <strong className="mt-5 block text-[var(--quiz-ink-strong)]">{definition.label}</strong>
                    <p className="mt-3 text-sm leading-6 text-[var(--quiz-muted)]">{definition.description}</p>
                    <div className="mt-5 text-xs uppercase tracking-[0.18em] text-[var(--quiz-muted)]">
                      {definition.length} questions | {definition.timeLimitMinutes} min
                    </div>
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
