"use client";

import type { PracticeAnswer, PracticeAnswerRecord, PracticeQuestion } from "@/lib/practice-types";

interface PracticeQuestionPaneProps {
  question: PracticeQuestion;
  draftAnswer: PracticeAnswer;
  answerRecord?: PracticeAnswerRecord;
  onChange: (answer: PracticeAnswer) => void;
  onSubmit: () => void;
  onNext: () => void;
  onPrev: () => void;
  onJump: (index: number) => void;
  onToggleFlag: () => void;
  onOpenTutor: () => void;
  questionNumber: number;
  totalQuestions: number;
  canGoNext: boolean;
  canGoPrev: boolean;
  questionStatuses: Array<{ id: string; answered: boolean; flagged: boolean }>;
  canOpenTutor: boolean;
  phase: "catalog" | "active" | "review" | "results";
}

function isCorrectChoice(question: PracticeQuestion, value: string) {
  if (Array.isArray(question.correctAnswer)) {
    return question.correctAnswer.some((answer) => answer.toLowerCase() === value.toLowerCase());
  }

  return typeof question.correctAnswer === "string" && question.correctAnswer.toLowerCase() === value.toLowerCase();
}

function isSelectedChoice(draft: PracticeAnswer, value: string) {
  if (Array.isArray(draft)) {
    return draft.some((item) => item.toLowerCase() === value.toLowerCase());
  }

  return typeof draft === "string" && draft.toLowerCase() === value.toLowerCase();
}

function updateMultiSelect(draft: PracticeAnswer, value: string) {
  const current = Array.isArray(draft) ? draft : typeof draft === "string" && draft ? draft.split(",") : [];
  const exists = current.some((item) => item.toLowerCase() === value.toLowerCase());
  const next = exists
    ? current.filter((item) => item.toLowerCase() !== value.toLowerCase())
    : [...current, value];
  return next;
}

function formatAnswerValue(answer: PracticeAnswer | undefined) {
  if (!answer) {
    return "";
  }

  if (Array.isArray(answer)) {
    return answer.map((item) => item.toUpperCase()).join(", ");
  }

  if (typeof answer === "object") {
    return Object.entries(answer)
      .map(([label, value]) => `${label} -> ${value}`)
      .join(" | ");
  }

  return answer.toUpperCase();
}

function formatKindLabel(question: PracticeQuestion) {
  if (question.kind === "scenario-mcq") {
    return "Scenario MCQ";
  }
  if (question.kind === "decision-map-mcq") {
    return "Decision map MCQ";
  }
  if (question.kind === "case-study") {
    return "Case study";
  }
  if (question.kind === "multi-select") {
    return "Select all";
  }
  if (question.kind === "matrix") {
    return "Matrix";
  }
  if (question.kind === "chart") {
    return "Chart";
  }
  return "MCQ";
}

export default function PracticeQuestionPane({
  question,
  draftAnswer,
  answerRecord,
  onChange,
  onSubmit,
  onNext,
  onPrev,
  onJump,
  onToggleFlag,
  onOpenTutor,
  questionNumber,
  totalQuestions,
  canGoNext,
  canGoPrev,
  questionStatuses,
  canOpenTutor,
  phase,
}: PracticeQuestionPaneProps) {
  const answered = Boolean(answerRecord);
  const isLocked = answered || phase === "results";
  const submittedCorrectly = answerRecord?.correct ?? false;
  const currentFlagged = questionStatuses.find((item) => item.id === question.id)?.flagged ?? false;
  const matrixColumns = question.matrixColumns ?? [];

  return (
    <div className="rounded-[32px] border border-[rgba(74,85,89,0.08)] bg-[rgba(255,252,247,0.92)] p-6 shadow-[0_20px_55px_rgba(31,38,43,0.06)] md:p-8 lg:p-10">
      <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
        <span className="rounded-full border border-[rgba(74,85,89,0.12)] bg-white/70 px-3 py-1.5 text-dark">
          {question.mode === "practice-exam" ? "Practice exam" : question.mode.replace("-", " ")}
        </span>
        <span className="rounded-full border border-[rgba(74,85,89,0.08)] bg-white/50 px-3 py-1.5">{formatKindLabel(question)}</span>
        <span className="rounded-full border border-[rgba(74,85,89,0.08)] bg-white/50 px-3 py-1.5">{question.exam.toUpperCase()}</span>
        <span className="rounded-full border border-[rgba(74,85,89,0.08)] bg-white/50 px-3 py-1.5">Q {questionNumber} / {totalQuestions}</span>
        <span className="rounded-full border border-[rgba(74,85,89,0.08)] bg-white/50 px-3 py-1.5">{question.category}</span>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.42fr_0.88fr]">
        <div className="space-y-5">
          <div>
            {(question.caseTitle || question.chartTitle || question.scenarioTitle || question.title) && (
              <div className="mb-4 rounded-[24px] border border-[rgba(74,85,89,0.08)] bg-white/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">Context</p>
                <p className="mt-2 font-serif text-[1.3rem] leading-[1.15] text-dark">
                  {question.caseTitle ?? question.chartTitle ?? question.scenarioTitle ?? question.title}
                </p>
                {question.caseContext && <p className="mt-3 text-sm leading-7 text-muted">{question.caseContext}</p>}
                {question.chartCaption && <p className="mt-3 text-sm leading-7 text-muted">{question.chartCaption}</p>}
                {question.scenario && <p className="mt-3 text-sm leading-7 text-muted">{question.scenario}</p>}
                {question.additionalInfo && <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted">{question.additionalInfo}</p>}
              </div>
            )}

            <p className="font-serif text-[1.45rem] leading-[1.6] text-dark md:text-[1.65rem] lg:text-[1.8rem]">
              {question.stem}
            </p>
          </div>

          {question.kind === "chart" && question.chartRows && (
            <div className="overflow-hidden rounded-[24px] border border-[rgba(74,85,89,0.08)] bg-white">
              <div className="border-b border-[rgba(74,85,89,0.08)] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">Chart view</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-[rgba(245,241,232,0.7)] text-xs uppercase tracking-[0.2em] text-muted">
                    <tr>
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3">Measures</th>
                    </tr>
                  </thead>
                  <tbody>
                    {question.chartRows.map((row) => (
                      <tr key={row.time} className="border-t border-[rgba(74,85,89,0.06)] align-top">
                        <td className="px-4 py-3 font-medium text-dark">{row.time}</td>
                        <td className="px-4 py-3">
                          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                            {row.values.map((value) => (
                              <div key={`${row.time}-${value.label}`} className="rounded-[18px] border border-[rgba(74,85,89,0.08)] bg-[rgba(252,250,244,0.92)] px-3 py-2">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">{value.label}</p>
                                <p className="mt-1 text-sm font-medium text-dark">{value.value}</p>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(question.kind === "case-study" || question.kind === "chart") && (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {question.vitals?.length ? (
                <div className="rounded-[24px] border border-[rgba(74,85,89,0.08)] bg-white/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">Vitals</p>
                  <div className="mt-3 grid gap-2">
                    {question.vitals.map((item) => (
                      <div key={`${item.label}-${item.value}`} className="flex items-baseline justify-between gap-3 rounded-[16px] bg-[rgba(245,241,232,0.7)] px-3 py-2">
                        <span className="text-sm text-muted">{item.label}</span>
                        <span className="text-sm font-semibold text-dark">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {question.labs?.length ? (
                <div className="rounded-[24px] border border-[rgba(74,85,89,0.08)] bg-white/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">Labs</p>
                  <div className="mt-3 grid gap-2">
                    {question.labs.map((item) => (
                      <div key={`${item.label}-${item.value}`} className="flex items-baseline justify-between gap-3 rounded-[16px] bg-[rgba(245,241,232,0.7)] px-3 py-2">
                        <span className="text-sm text-muted">{item.label}</span>
                        <span className="text-sm font-semibold text-dark">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {question.hemodynamics?.length ? (
                <div className="rounded-[24px] border border-[rgba(74,85,89,0.08)] bg-white/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">Hemodynamics</p>
                  <div className="mt-3 grid gap-2">
                    {question.hemodynamics.map((item) => (
                      <div key={`${item.label}-${item.value}`} className="flex items-baseline justify-between gap-3 rounded-[16px] bg-[rgba(245,241,232,0.7)] px-3 py-2">
                        <span className="text-sm text-muted">{item.label}</span>
                        <span className="text-sm font-semibold text-dark">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {question.kind === "matrix" && question.matrixRows && question.matrixColumns && (
            <div className="overflow-hidden rounded-[24px] border border-[rgba(74,85,89,0.08)] bg-white">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-[rgba(245,241,232,0.7)] text-xs uppercase tracking-[0.2em] text-muted">
                    <tr>
                      <th className="px-4 py-3">Finding</th>
                      {matrixColumns.map((column) => (
                        <th key={column} className="px-4 py-3">{column}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {question.matrixRows.map((row) => (
                      <tr key={row.label} className="border-t border-[rgba(74,85,89,0.06)]">
                        <td className="px-4 py-3 font-medium text-dark">{row.label}</td>
                        {matrixColumns.map((column) => {
                          const current = (draftAnswer && typeof draftAnswer === "object" && !Array.isArray(draftAnswer) ? draftAnswer : {}) as Record<string, string>;
                          const selected = current[row.label] === column;
                          const correct = row.answer === column;
                          return (
                            <td key={`${row.label}-${column}`} className="px-4 py-3">
                              <button
                                type="button"
                                disabled={isLocked}
                                onClick={() => onChange({ ...current, [row.label]: column })}
                                className={`w-full rounded-[16px] border px-3 py-2 text-left text-sm transition ${
                                  selected
                                    ? "border-[#5A7F88] bg-[rgba(90,127,136,0.12)] text-dark"
                                    : correct && answered
                                      ? "border-sage-300 bg-sage-50 text-dark"
                                      : "border-[rgba(74,85,89,0.08)] bg-[rgba(252,250,244,0.9)] text-muted hover:border-[rgba(90,127,136,0.3)]"
                                }`}
                              >
                                {column}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {question.kind !== "matrix" && question.options && (
            <div className="grid gap-3">
              {question.options.map((option) => {
                const selected = isSelectedChoice(draftAnswer, option.id);
                const correct = isCorrectChoice(question, option.id);
                const feedbackClass = answered
                  ? correct
                    ? "border-sage-300 bg-sage-50"
                    : selected
                      ? "border-red-200 bg-red-50"
                      : "border-[rgba(74,85,89,0.08)] bg-white"
                  : selected
                    ? "border-[#5A7F88] bg-[rgba(90,127,136,0.08)]"
                    : "border-[rgba(74,85,89,0.08)] bg-white hover:border-[rgba(90,127,136,0.35)]";

                return (
                  <button
                    key={option.id}
                    type="button"
                    disabled={isLocked}
                    onClick={() => {
                      if (question.kind === "multi-select") {
                        onChange(updateMultiSelect(draftAnswer, option.id));
                      } else {
                        onChange(option.id);
                      }
                    }}
                    className={`flex w-full items-start gap-4 rounded-[22px] border px-5 py-4 text-left transition hover:shadow-sm ${feedbackClass}`}
                  >
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-current text-xs font-bold">
                      {option.id.toUpperCase()}
                    </span>
                    <span className="pt-1 text-[1.05rem] leading-7 text-dark">{option.text}</span>
                  </button>
                );
              })}
            </div>
          )}

          {answered && (
            <div className={`rounded-[24px] border p-6 ${submittedCorrectly ? "border-[rgba(90,138,94,0.28)] bg-[rgba(90,138,94,0.06)]" : "border-red-200 bg-red-50/60"}`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.2em] ${submittedCorrectly ? "bg-[rgba(90,138,94,0.15)] text-[#3d6b41]" : "bg-red-100 text-red-800"}`}>
                  {submittedCorrectly ? "✓ Correct" : "✗ Missed"}
                </span>
                <span className="text-sm text-muted">
                  Correct: <strong className="text-dark">{formatAnswerValue(answerRecord?.correctAnswer)}</strong>
                </span>
              </div>
              <p className="mt-4 text-[1rem] leading-[1.75] text-dark">{answerRecord?.rationale ?? question.rationale}</p>
              {question.takeaway && (
                <div className="mt-4 rounded-[18px] border border-[rgba(74,85,89,0.1)] bg-white/60 px-4 py-3">
                  <p className="text-sm leading-7 text-dark"><strong className="font-semibold">Takeaway:</strong> {question.takeaway}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-[24px] border border-[rgba(74,85,89,0.08)] bg-white/80 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">Question flow</p>
              <button
                type="button"
                onClick={onToggleFlag}
                className={`inline-flex items-center justify-center rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] transition ${
                  currentFlagged
                    ? "border-[rgba(194,154,86,0.42)] bg-[rgba(194,154,86,0.16)] text-dark"
                    : "border-[rgba(74,85,89,0.12)] bg-white text-muted hover:border-[rgba(194,154,86,0.32)] hover:text-dark"
                }`}
              >
                {currentFlagged ? "Flagged" : "Mark review"}
              </button>
            </div>
            <div className="mt-3 grid grid-cols-6 gap-2 sm:grid-cols-8 xl:grid-cols-6">
              {Array.from({ length: totalQuestions }).map((_, index) => {
                const active = index + 1 === questionNumber;
                const status = questionStatuses[index];
                const isAnswered = Boolean(status?.answered);
                const isFlagged = Boolean(status?.flagged);
                const tone = active
                  ? "border-[#4A5559] bg-[#4A5559] text-white"
                  : isAnswered && isFlagged
                    ? "border-[rgba(194,154,86,0.3)] bg-[rgba(194,154,86,0.18)] text-dark"
                    : isAnswered
                      ? "border-[rgba(90,127,136,0.25)] bg-[rgba(90,127,136,0.12)] text-dark"
                      : isFlagged
                        ? "border-[rgba(194,154,86,0.28)] bg-[rgba(194,154,86,0.12)] text-dark"
                        : "border-[rgba(74,85,89,0.12)] bg-[rgba(255,252,247,0.9)] text-muted hover:border-[rgba(90,127,136,0.4)]";
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => onJump(index)}
                    className={`aspect-square rounded-[14px] border text-xs font-semibold transition ${tone}`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-[24px] border border-[rgba(74,85,89,0.08)] bg-[rgba(255,252,247,0.95)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">What to watch for</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-dark">
              <li>Look for the highest-risk physiology first.</li>
              <li>Use the stem and data panels together, not separately.</li>
              <li>For NGN and case work, trace the pattern before the answer choice.</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3 rounded-[24px] border border-[rgba(74,85,89,0.08)] bg-white/80 p-4">
            {canOpenTutor ? (
              <button
                type="button"
                onClick={onOpenTutor}
                className="inline-flex items-center justify-center rounded-full border border-[rgba(74,85,89,0.12)] bg-white px-5 py-3 text-sm font-semibold text-dark transition hover:border-[rgba(90,127,136,0.35)]"
              >
                Open AI tutor
              </button>
            ) : null}
            <button
              type="button"
              onClick={onSubmit}
              className="inline-flex items-center justify-center rounded-full bg-[#4A5559] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#3B4549]"
            >
              {answered ? "Answer saved" : "Submit answer"}
            </button>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={onPrev}
                disabled={!canGoPrev}
                className="inline-flex items-center justify-center rounded-full border border-[rgba(74,85,89,0.12)] bg-white px-4 py-3 text-sm font-semibold text-dark transition hover:border-[rgba(90,127,136,0.35)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={onNext}
                disabled={!canGoNext}
                className="inline-flex items-center justify-center rounded-full border border-[rgba(74,85,89,0.12)] bg-white px-4 py-3 text-sm font-semibold text-dark transition hover:border-[rgba(90,127,136,0.35)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
