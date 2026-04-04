"use client";

import { useEffect, useRef, useState } from "react";

const visualAccentMap: Record<
  NonNullable<QuizQuestionData["visualRationale"]>["type"],
  { border: string; chip: string; glow: string; arrow: string }
> = {
  trend: {
    border: "rgba(99, 127, 169, 0.32)",
    chip: "rgba(99, 127, 169, 0.12)",
    glow: "rgba(99, 127, 169, 0.18)",
    arrow: "#637fa9",
  },
  flow: {
    border: "rgba(80, 132, 118, 0.3)",
    chip: "rgba(80, 132, 118, 0.12)",
    glow: "rgba(80, 132, 118, 0.18)",
    arrow: "#508476",
  },
  pathway: {
    border: "rgba(120, 101, 164, 0.3)",
    chip: "rgba(120, 101, 164, 0.12)",
    glow: "rgba(120, 101, 164, 0.18)",
    arrow: "#7865a4",
  },
  signal: {
    border: "rgba(180, 114, 70, 0.3)",
    chip: "rgba(180, 114, 70, 0.12)",
    glow: "rgba(180, 114, 70, 0.18)",
    arrow: "#b47246",
  },
  overview: {
    border: "rgba(117, 126, 131, 0.26)",
    chip: "rgba(117, 126, 131, 0.12)",
    glow: "rgba(117, 126, 131, 0.16)",
    arrow: "#757e83",
  },
};

interface QuizQuestionData {
  id: string;
  stem: string;
  options: Array<{ id: string; text: string }>;
  category?: string;
  difficulty?: number;
  takeaway?: string;
  visualRationale?: {
    type: "trend" | "flow" | "pathway" | "signal" | "overview";
    accent?: string;
    title: string;
    caption?: string;
    metrics?: Array<{
      label: string;
      value: string;
      direction?: "up" | "down" | "steady";
      directionLabel?: string;
    }>;
    nodes?: Array<{ label: string; value: string }>;
    conclusion?: string;
  };
}

interface AnswerResult {
  correct: boolean;
  correctAnswer: string;
  rationale: string;
  distractorRationales?: Record<string, string>;
  takeaway?: string | null;
  visualRationale?: QuizQuestionData["visualRationale"] | null;
}

interface QuizQuestionProps {
  question: QuizQuestionData;
  onAnswer: (selectedId: string, timeSpentMs: number) => Promise<AnswerResult>;
  onNext: () => void;
  onAskTutor: () => void;
  showTutor: boolean;
  questionNumber: number;
  totalQuestions: number;
}

export default function QuizQuestion({
  question,
  onAnswer,
  onNext,
  onAskTutor,
  showTutor,
  questionNumber,
  totalQuestions,
}: QuizQuestionProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showRationale, setShowRationale] = useState(false);
  const startTime = useRef(Date.now());

  useEffect(() => {
    setSelected(null);
    setResult(null);
    setShowRationale(false);
    startTime.current = Date.now();
  }, [question.id]);

  async function handleSubmit() {
    if (!selected || submitting) {
      return;
    }

    setSubmitting(true);
    const timeSpentMs = Date.now() - startTime.current;
    const response = await onAnswer(selected, timeSpentMs);
    setResult(response);
    setShowRationale(true);
    setSubmitting(false);
  }

  function optionClass(optionId: string) {
    const base = "answer-option";
    if (!result) {
      return selected === optionId ? `${base} selected` : base;
    }
    if (optionId === result.correctAnswer) {
      return `${base} correct`;
    }
    if (optionId === selected && !result.correct) {
      return `${base} incorrect`;
    }
    return base;
  }

  const answered = result !== null;
  const teachingTakeaway = result?.takeaway ?? question.takeaway;
  const teachingVisual = result?.visualRationale ?? question.visualRationale;
  const visualTheme = teachingVisual ? visualAccentMap[teachingVisual.type] : null;

  return (
    <div className="card p-6 md:p-8">
      <p className="question-stem mb-6">{question.stem}</p>

      <div className="mb-6 flex flex-col gap-3">
        {question.options.map((option) => (
          <button
            key={option.id}
            disabled={answered}
            onClick={() => !answered && setSelected(option.id)}
            className={`${optionClass(option.id)} w-full text-left`}
          >
            <span className="mr-3 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-current text-xs font-bold opacity-60">
              {option.id.toUpperCase()}
            </span>
            {option.text}
          </button>
        ))}
      </div>

      {!answered && (
        <button
          onClick={handleSubmit}
          disabled={!selected || submitting}
          className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? "Checking..." : "Submit answer"}
        </button>
      )}

      {showRationale && result && (
        <div
          className="rationale-box mt-6 animate-in slide-in-from-bottom-2 duration-300"
          style={{ animationFillMode: "both" }}
        >
          <div className="mb-3 flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${
                result.correct
                  ? "border-sage-300 bg-sage-100 text-sage-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {result.correct ? (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
              {result.correct ? "Correct" : "Incorrect"}
            </span>
            {!result.correct && (
              <span className="text-xs text-muted">
                Correct answer: <strong className="text-dark">{result.correctAnswer.toUpperCase()}</strong>
              </span>
            )}
          </div>

          <p className="mb-4 text-sm leading-relaxed text-dark">{result.rationale}</p>

          {(teachingVisual || teachingTakeaway) && (
            <div
              className="mt-4 rounded-2xl border bg-[linear-gradient(180deg,rgba(248,247,243,0.96),rgba(239,243,241,0.88))] p-4"
              style={{
                borderColor: visualTheme?.border ?? "rgba(80,108,120,0.18)",
                boxShadow: visualTheme ? `inset 4px 0 0 ${visualTheme.border}` : undefined,
              }}
            >
              {teachingVisual && (
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p
                        className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-muted"
                        style={{ background: visualTheme?.chip ?? "rgba(80,108,120,0.08)" }}
                      >
                        Visual rationale
                      </p>
                      <p className="mt-1 text-sm font-semibold text-dark">{teachingVisual.title}</p>
                    </div>
                    <div
                      className="h-10 w-10 shrink-0 rounded-full border"
                      style={{
                        borderColor: visualTheme?.border ?? "rgba(80,108,120,0.18)",
                        background: `radial-gradient(circle_at_center,${visualTheme?.glow ?? "rgba(80,108,120,0.16)"},rgba(80,108,120,0.03)_70%)`,
                      }}
                    />
                  </div>

                  {teachingVisual.caption && (
                    <p className="text-sm leading-relaxed text-muted">{teachingVisual.caption}</p>
                  )}

                  {teachingVisual.metrics && teachingVisual.metrics.length > 0 && (
                    <div className="grid gap-2 sm:grid-cols-3">
                      {teachingVisual.metrics.map((metric) => (
                        <div
                          key={`${metric.label}-${metric.value}`}
                          className="rounded-xl border border-[rgba(80,108,120,0.14)] bg-white/80 px-3 py-2"
                          style={{ borderColor: visualTheme?.border ?? "rgba(80,108,120,0.14)" }}
                        >
                          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">{metric.label}</p>
                          <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-dark">
                            <span>{metric.value}</span>
                            {metric.direction ? (
                              <span
                                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]"
                                style={{
                                  background: visualTheme?.chip ?? "rgba(80,108,120,0.08)",
                                  color: visualTheme?.arrow ?? "#506c78",
                                }}
                              >
                                {metric.direction === "up" ? "Up" : metric.direction === "down" ? "Down" : "Steady"}
                                {metric.directionLabel ?? metric.direction}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {teachingVisual.nodes && teachingVisual.nodes.length > 0 && (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {teachingVisual.nodes.map((node) => (
                        <div
                          key={`${node.label}-${node.value}`}
                          className="rounded-xl border border-[rgba(80,108,120,0.14)] bg-white/70 px-3 py-2"
                        >
                          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">{node.label}</p>
                          <p className="mt-1 text-sm text-dark">{node.value}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {teachingVisual.conclusion && (
                    <p className="text-sm font-medium text-dark">{teachingVisual.conclusion}</p>
                  )}
                </div>
              )}

              {teachingTakeaway && (
                <p className={`${teachingVisual ? "mt-3 border-t border-[rgba(80,108,120,0.12)] pt-3" : ""} text-sm font-medium text-dark`}>
                  {teachingTakeaway}
                </p>
              )}
            </div>
          )}

          {result.distractorRationales && Object.keys(result.distractorRationales).length > 0 && (
            <div className="mt-3 space-y-2 border-t border-teal-200 pt-3">
              {Object.entries(result.distractorRationales).map(([id, text]) => (
                <p key={id} className="text-xs leading-relaxed text-muted">
                  <strong className="text-dark">{id.toUpperCase()}:</strong> {text}
                </p>
              ))}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-teal-200 pt-4">
            {showTutor ? (
              <button onClick={onAskTutor} className="btn-secondary inline-flex items-center gap-2 text-sm">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M5.5 5.5C5.5 4.67 6.17 4 7 4s1.5.67 1.5 1.5c0 1-1.5 1.5-1.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="7" cy="10.5" r=".75" fill="currentColor" />
                </svg>
                Ask AI Tutor
              </button>
            ) : (
              <button
                disabled
                title="Upgrade to Plus for AI tutor access"
                className="btn-secondary inline-flex cursor-not-allowed items-center gap-2 text-sm opacity-40"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="3" y="6" width="8" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M5 6V4.5a2 2 0 0 1 4 0V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                AI Tutor - Plus only
              </button>
            )}

            <button onClick={onNext} className="btn-primary ml-auto inline-flex items-center gap-2 text-sm">
              {questionNumber >= totalQuestions ? "See results" : "Next question"}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
