"use client";

import type { ReactNode } from "react";
import PracticeTerminalPane from "@/components/practice/PracticeTerminalPane";
import { getDisplayableDistractorRationales } from "@/lib/distractor-rationale-display";
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
  onEnd?: () => void;
  questionNumber: number;
  totalQuestions: number;
  canGoNext: boolean;
  canGoPrev: boolean;
  questionStatuses: Array<{ id: string; answered: boolean; flagged: boolean }>;
  canOpenTutor: boolean;
  tier?: "free" | "plus" | "pro";
  canUseAdvancedAnalytics?: boolean;
  phase: "catalog" | "active" | "review" | "results";
}

const pill =
  "inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em]";

function isCorrectChoice(question: PracticeQuestion, value: string) {
  if (Array.isArray(question.correctAnswer)) return question.correctAnswer.some((answer) => answer.toLowerCase() === value.toLowerCase());
  return typeof question.correctAnswer === "string" && question.correctAnswer.toLowerCase() === value.toLowerCase();
}

function isSelectedChoice(draft: PracticeAnswer, value: string) {
  if (Array.isArray(draft)) return draft.some((item) => item.toLowerCase() === value.toLowerCase());
  return typeof draft === "string" && draft.toLowerCase() === value.toLowerCase();
}

function updateMultiSelect(draft: PracticeAnswer, value: string) {
  const current = Array.isArray(draft) ? draft : typeof draft === "string" && draft ? draft.split(",") : [];
  return current.some((item) => item.toLowerCase() === value.toLowerCase())
    ? current.filter((item) => item.toLowerCase() !== value.toLowerCase())
    : [...current, value];
}

function appendOrderingStep(draft: PracticeAnswer, value: string) {
  const current = Array.isArray(draft) ? draft : typeof draft === "string" && draft ? [draft] : [];
  if (current.some((item) => item.toLowerCase() === value.toLowerCase())) {
    return current;
  }
  return [...current, value];
}

function moveOrderingStep(draft: PracticeAnswer, index: number, direction: -1 | 1) {
  const current = Array.isArray(draft) ? [...draft] : typeof draft === "string" && draft ? [draft] : [];
  const targetIndex = index + direction;
  if (index < 0 || index >= current.length || targetIndex < 0 || targetIndex >= current.length) {
    return current;
  }
  [current[index], current[targetIndex]] = [current[targetIndex], current[index]];
  return current;
}

function removeOrderingStep(draft: PracticeAnswer, value: string) {
  const current = Array.isArray(draft) ? draft : typeof draft === "string" && draft ? [draft] : [];
  return current.filter((item) => item.toLowerCase() !== value.toLowerCase());
}

function formatAnswerValue(answer: PracticeAnswer | undefined) {
  if (!answer) return "";
  if (Array.isArray(answer)) return answer.map((item) => item.toUpperCase()).join(", ");
  if (typeof answer === "object") return Object.entries(answer).map(([label, value]) => `${label} -> ${value}`).join(" | ");
  return answer.toUpperCase();
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 pl-5 text-sm leading-7 text-dark">
      {items.map((item) => (
        <li key={item} className="list-disc">
          {item}
        </li>
      ))}
    </ul>
  );
}

function InsightPill({ tone = "neutral", children }: { tone?: "neutral" | "sage" | "blue" | "gold"; children: ReactNode }) {
  const toneClasses =
    tone === "sage"
      ? "border-[rgba(126,157,134,0.22)] bg-[rgba(126,157,134,0.10)] text-[#55715e]"
      : tone === "blue"
        ? "border-[rgba(90,127,136,0.20)] bg-[rgba(90,127,136,0.10)] text-[#4f6f77]"
        : tone === "gold"
          ? "border-[rgba(194,154,86,0.24)] bg-[rgba(194,154,86,0.12)] text-[#8d6a2e]"
          : "border-[rgba(74,85,89,0.12)] bg-white/72 text-muted";
  return <span className={`${pill} ${toneClasses}`}>{children}</span>;
}

function metricFlagTone(flag?: "low" | "normal" | "high" | "critical") {
  if (flag === "critical") {
    return "border-[rgba(144,72,52,0.18)] bg-[rgba(144,72,52,0.1)] text-[rgba(144,72,52,0.92)]";
  }
  if (flag === "high" || flag === "low") {
    return "border-[rgba(194,154,86,0.2)] bg-[rgba(194,154,86,0.12)] text-[#8d6a2e]";
  }
  return "border-[rgba(90,127,136,0.18)] bg-[rgba(90,127,136,0.08)] text-[#4f6f77]";
}

function exhibitSurfaceTone(type?: string) {
  if (type === "labs") {
    return "border-[rgba(90,127,136,0.12)] bg-[linear-gradient(180deg,rgba(246,251,252,0.92),rgba(239,246,247,0.84))]";
  }
  if (type === "vitals" || type === "assessment") {
    return "border-[rgba(126,157,134,0.16)] bg-[linear-gradient(180deg,rgba(245,250,246,0.92),rgba(238,246,240,0.84))]";
  }
  if (type === "orders") {
    return "border-[rgba(194,154,86,0.16)] bg-[linear-gradient(180deg,rgba(255,249,238,0.92),rgba(248,240,223,0.84))]";
  }
  return "border-[rgba(74,85,89,0.08)] bg-[rgba(255,255,255,0.84)]";
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
  onEnd,
  questionNumber,
  totalQuestions,
  canGoNext,
  canGoPrev,
  questionStatuses,
  canOpenTutor,
  tier,
  canUseAdvancedAnalytics,
  phase,
}: PracticeQuestionPaneProps) {
  return (
    <PracticeTerminalPane
      question={question}
      draftAnswer={draftAnswer}
      answerRecord={answerRecord}
      onChange={onChange}
      onSubmit={onSubmit}
      onNext={onNext}
      onPrev={onPrev}
      onJump={onJump}
      onToggleFlag={onToggleFlag}
      onOpenTutor={onOpenTutor}
      onEnd={onEnd}
      questionNumber={questionNumber}
      totalQuestions={totalQuestions}
      canGoNext={canGoNext}
      canGoPrev={canGoPrev}
      questionStatuses={questionStatuses}
      canOpenTutor={canOpenTutor}
      tier={tier}
      canUseAdvancedAnalytics={canUseAdvancedAnalytics}
      phase={phase}
    />
  );
  /* legacy practice pane retained temporarily for rollback reference
  const answered = Boolean(answerRecord);
  const isLocked = answered || phase === "results";
  const submittedCorrectly = answerRecord?.correct ?? false;
  const isBowTie = question.kind === "bow-tie";
  const isCaseStudy = question.kind === "case-study";
  const isCaseDriven = isCaseStudy || isBowTie;
  const currentFlagged = questionStatuses.find((item) => item.id === question.id)?.flagged ?? false;
  const matrixColumns = question.matrixColumns ?? [];
  const orderingDraft = Array.isArray(draftAnswer) ? draftAnswer : typeof draftAnswer === "string" && draftAnswer ? [draftAnswer] : [];
  const matrixAnswerMap = (draftAnswer && typeof draftAnswer === "object" && !Array.isArray(draftAnswer)
    ? draftAnswer
    : {}) as Record<string, string>;
  const teachingTakeaway = answerRecord?.takeaway ?? question.takeaway;
  const teachingDeepRationale = answerRecord?.deepRationale ?? question.deepRationale ?? answerRecord?.rationale ?? question.rationale;
  const teachingReferences = answerRecord?.references ?? question.references ?? [];
  const teachingCoachingFrame = answerRecord?.coachingFrame ?? question.coachingFrame ?? [];
  const teachingVisual = answerRecord?.visualRationale ?? question.visualRationale;
  const teachingDiagram = answerRecord?.diagramBlueprint ?? question.diagramBlueprint;
  const distractorRationales = getDisplayableDistractorRationales(
    question,
    answerRecord?.distractorRationales ?? question.distractorRationales,
  );
  const evidenceCount = [
    question.chartRows?.length ? 1 : 0,
    question.vitals?.length ? 1 : 0,
    question.labs?.length ? 1 : 0,
    question.hemodynamics?.length ? 1 : 0,
    question.exhibits?.length ? question.exhibits.length : 0,
  ].reduce((sum, count) => sum + count, 0);
  const draftCount = Array.isArray(draftAnswer)
    ? draftAnswer.length
    : draftAnswer && typeof draftAnswer === "object"
      ? Object.keys(draftAnswer).length
      : typeof draftAnswer === "string" && draftAnswer
        ? 1
        : 0;
  const kindBadge =
    question.kind === "multi-select"
      ? "Select all that apply"
      : question.kind === "matrix"
        ? "Matrix matching"
        : question.kind === "ordering"
          ? "Ordered response"
        : question.kind === "chart"
          ? "Trend reading"
          : question.kind === "bow-tie"
            ? "Bow-tie decision map"
        : question.kind === "case-study"
            ? "Case analysis"
            : "Single best answer";

  const statTone = (active: boolean, answeredState: boolean, flagged: boolean) =>
    active
      ? "border-[#4A5559] bg-[#4A5559] text-white"
      : answeredState && flagged
        ? "border-[rgba(194,154,86,0.3)] bg-[rgba(194,154,86,0.18)] text-dark"
        : answeredState
          ? "border-[rgba(90,127,136,0.25)] bg-[rgba(90,127,136,0.12)] text-dark"
          : flagged
            ? "border-[rgba(194,154,86,0.28)] bg-[rgba(194,154,86,0.12)] text-dark"
            : "border-[rgba(74,85,89,0.12)] bg-[rgba(255,252,247,0.9)] text-muted hover:border-[rgba(90,127,136,0.4)]";

  return (
    <div className="question-shell relative overflow-hidden rounded-[32px] border border-[rgba(108,96,79,0.1)] bg-[radial-gradient(circle_at_top_right,rgba(126,157,134,0.16),rgba(126,157,134,0)_24%),radial-gradient(circle_at_bottom_left,rgba(194,154,86,0.12),rgba(194,154,86,0)_24%),linear-gradient(180deg,rgba(255,252,247,0.99),rgba(245,238,228,0.96))] p-6 shadow-[0_24px_68px_rgba(58,46,34,0.08)] md:p-8 lg:p-10">
      <div className="pointer-events-none absolute right-[-4rem] top-[-4rem] h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(126,157,134,0.16),rgba(126,157,134,0)_68%)]" />
      <div className="pointer-events-none absolute bottom-[-5rem] left-[-4rem] h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(194,154,86,0.12),rgba(194,154,86,0)_68%)]" />

      <div className="study-terminal-strip">
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
          <InsightPill>{question.mode === "practice-exam" ? "Practice exam" : question.mode.replace("-", " ")}</InsightPill>
          <InsightPill>{question.exam.toUpperCase()}</InsightPill>
          <InsightPill>
            Q {questionNumber} / {totalQuestions}
          </InsightPill>
          <InsightPill>{question.category}</InsightPill>
          {question.tutorReady ? <InsightPill tone="sage">Tutor ready</InsightPill> : null}
          <InsightPill tone="blue">{kindBadge}</InsightPill>
        </div>
        <div className="study-terminal-metrics">
          <div className="metric-tile">
            <span className="terminal-label">Prompt</span>
            <strong>{questionNumber}</strong>
            <p>Current node in this run.</p>
          </div>
          <div className="metric-tile">
            <span className="terminal-label">Evidence</span>
            <strong>{evidenceCount}</strong>
            <p>Panels or exhibits attached.</p>
          </div>
          <div className="metric-tile">
            <span className="terminal-label">Armed</span>
            <strong>{draftCount}</strong>
            <p>{answered ? "Answer locked in." : "Selections staged."}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.42fr_0.88fr]">
        <div className="space-y-5">
          <div className="question-prompt-zone">
            {(question.caseTitle || question.chartTitle || question.scenarioTitle || question.title) && (
              <div className="mb-4 rounded-[24px] border border-[rgba(108,96,79,0.1)] bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(250,245,237,0.9))] p-4 shadow-[0_14px_30px_rgba(58,46,34,0.05)]">
                <p className="terminal-label">Context</p>
                <p className="mt-2 font-serif text-[1.3rem] leading-[1.2] text-dark">
                  {question.caseTitle ?? question.chartTitle ?? question.scenarioTitle ?? question.title}
                </p>
                {question.caseContext ? <p className="mt-3 text-sm leading-7 text-muted">{question.caseContext}</p> : null}
                {question.chartCaption ? <p className="mt-3 text-sm leading-7 text-muted">{question.chartCaption}</p> : null}
                {question.scenario ? <p className="mt-3 text-sm leading-7 text-muted">{question.scenario}</p> : null}
                {question.additionalInfo ? (
                  <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted">{question.additionalInfo}</p>
                ) : null}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {question.kind === "multi-select" ? <InsightPill tone="blue">Select all that apply</InsightPill> : null}
              {question.kind === "matrix" ? <InsightPill tone="blue">Match each row to the safest column</InsightPill> : null}
              {question.kind === "ordering" ? <InsightPill tone="blue">Build the safest sequence</InsightPill> : null}
              {question.kind === "chart" ? <InsightPill tone="gold">Read the trend first</InsightPill> : null}
              {question.kind === "bow-tie" ? <InsightPill tone="gold">Link the clue, move, and outcome</InsightPill> : null}
              {question.kind === "case-study" ? <InsightPill tone="gold">Use the full case</InsightPill> : null}
            </div>
            <p className="mt-4 font-serif text-[1.5rem] leading-[1.62] text-dark md:text-[1.72rem] lg:text-[1.92rem]">
              {question.stem}
            </p>
          </div>

          {isCaseDriven ? (
            <div className={`grid gap-3 ${isBowTie ? "lg:grid-cols-3" : "md:grid-cols-2 xl:grid-cols-3"}`}>
              <div className="rounded-[24px] border border-[rgba(108,96,79,0.1)] bg-[linear-gradient(180deg,rgba(255,255,255,0.84),rgba(250,244,235,0.92))] p-4 shadow-[0_12px_28px_rgba(58,46,34,0.04)]">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">{isBowTie ? "Recognize first" : "Case anchor"}</p>
                <p className="mt-3 text-sm leading-7 text-dark">
                  {question.takeaway ?? "Start with the unstable clue set before you commit to the final answer choice."}
                </p>
              </div>
              <div className="rounded-[24px] border border-[rgba(90,127,136,0.14)] bg-[linear-gradient(180deg,rgba(228,239,235,0.9),rgba(241,247,245,0.7))] p-4 shadow-[0_12px_28px_rgba(58,46,34,0.04)]">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">{isBowTie ? "Move fastest" : "Speed cue"}</p>
                <p className="mt-3 text-sm leading-7 text-dark">
                  {question.speedCue ?? "Use the case details together, then answer from the highest-risk physiology first."}
                </p>
              </div>
              {isBowTie ? (
                <div className="rounded-[24px] border border-[rgba(194,154,86,0.18)] bg-[linear-gradient(180deg,rgba(255,245,221,0.92),rgba(248,237,210,0.82))] p-4 shadow-[0_14px_32px_rgba(130,93,38,0.08)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">Protect the outcome</p>
                  <p className="mt-3 text-sm leading-7 text-dark">
                    Work this like a decision map: identify the pattern, commit to the stabilizing move, and avoid the response that delays protection of the patient.
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          {question.chartRows?.length ? (
            <div className="overflow-hidden rounded-[24px] border border-[rgba(74,85,89,0.08)] bg-white/88 shadow-[0_12px_28px_rgba(31,38,43,0.04)]">
              <div className="border-b border-[rgba(74,85,89,0.08)] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
                  {question.kind === "chart" ? "Chart view" : "Case timeline"}
                </p>
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
                              <div
                                key={`${row.time}-${value.label}`}
                                className="rounded-[18px] border border-[rgba(74,85,89,0.08)] bg-[rgba(252,250,244,0.96)] px-3 py-2 shadow-[0_8px_18px_rgba(31,38,43,0.025)]"
                              >
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
          ) : null}

          {(isCaseDriven || question.kind === "chart" || question.vitals?.length || question.labs?.length || question.hemodynamics?.length) ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {question.vitals?.length ? (
                <div className="rounded-[24px] border border-[rgba(74,85,89,0.08)] bg-[rgba(255,255,255,0.8)] p-4 shadow-[0_12px_28px_rgba(31,38,43,0.03)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">Vitals</p>
                  <div className="mt-3 grid gap-2">
                    {question.vitals.map((item) => (
                      <div key={`${item.label}-${item.value}`} className="flex items-baseline justify-between gap-3 rounded-[16px] bg-[rgba(245,241,232,0.72)] px-3 py-2">
                        <span className="text-sm text-muted">{item.label}</span>
                        <span className="flex items-center gap-2 text-sm font-semibold text-dark">
                          {item.flag ? <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${metricFlagTone(item.flag)}`}>{item.flag}</span> : null}
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {question.labs?.length ? (
                <div className="rounded-[24px] border border-[rgba(74,85,89,0.08)] bg-[rgba(255,255,255,0.8)] p-4 shadow-[0_12px_28px_rgba(31,38,43,0.03)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">Labs</p>
                  <div className="mt-3 grid gap-2">
                    {question.labs.map((item) => (
                      <div key={`${item.label}-${item.value}`} className="flex items-baseline justify-between gap-3 rounded-[16px] bg-[rgba(245,241,232,0.72)] px-3 py-2">
                        <span className="text-sm text-muted">{item.label}</span>
                        <span className="flex items-center gap-2 text-sm font-semibold text-dark">
                          {item.flag ? <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${metricFlagTone(item.flag)}`}>{item.flag}</span> : null}
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {question.hemodynamics?.length ? (
                <div className="rounded-[24px] border border-[rgba(74,85,89,0.08)] bg-[rgba(255,255,255,0.8)] p-4 shadow-[0_12px_28px_rgba(31,38,43,0.03)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">Hemodynamics</p>
                  <div className="mt-3 grid gap-2">
                    {question.hemodynamics.map((item) => (
                      <div key={`${item.label}-${item.value}`} className="flex items-baseline justify-between gap-3 rounded-[16px] bg-[rgba(245,241,232,0.72)] px-3 py-2">
                        <span className="text-sm text-muted">{item.label}</span>
                        <span className="flex items-center gap-2 text-sm font-semibold text-dark">
                          {item.flag ? <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${metricFlagTone(item.flag)}`}>{item.flag}</span> : null}
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {question.exhibits?.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {question.exhibits.map((exhibit, index) => (
                <div
                  key={`${exhibit.title}-${index}`}
                  className={`rounded-[24px] border p-4 shadow-[0_12px_28px_rgba(31,38,43,0.03)] ${exhibitSurfaceTone(exhibit.type)}`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                    {exhibit.type ?? "Exhibit"}
                  </p>
                  <p className="mt-2 font-serif text-[1.08rem] leading-[1.2] text-dark">{exhibit.title}</p>
                  {exhibit.body ? <p className="mt-3 text-sm leading-7 text-muted">{exhibit.body}</p> : null}
                  {exhibit.items?.length ? (
                    <div className="mt-3 space-y-2">
                      {exhibit.items.map((item) => (
                        <div
                          key={item}
                          className="rounded-[16px] border border-[rgba(108,96,79,0.1)] bg-[rgba(252,250,244,0.92)] px-3 py-2 text-sm leading-6 text-dark"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

          {question.kind === "matrix" && question.matrixRows && question.matrixColumns ? (
            <div className="overflow-hidden rounded-[24px] border border-[rgba(74,85,89,0.08)] bg-white/88 shadow-[0_12px_28px_rgba(31,38,43,0.04)]">
              <div className="flex items-center justify-between gap-3 border-b border-[rgba(74,85,89,0.08)] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">Matrix view</p>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Tap the safest match for each row</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-[rgba(245,241,232,0.7)] text-xs uppercase tracking-[0.2em] text-muted">
                    <tr>
                      <th className="px-4 py-3">Finding</th>
                      {matrixColumns.map((column) => (
                        <th key={column} className="px-4 py-3">
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {question.matrixRows.map((row) => (
                      <tr key={row.label} className="border-t border-[rgba(74,85,89,0.06)]">
                        <td className="px-4 py-3 font-medium text-dark">{row.label}</td>
                        {matrixColumns.map((column) => {
                          const selected = matrixAnswerMap[row.label] === column;
                          const correct = row.answer === column;
                          const cellTone = selected
                            ? "border-[#5A7F88] bg-[rgba(90,127,136,0.12)] text-dark shadow-[0_8px_18px_rgba(90,127,136,0.08)]"
                            : correct && answered
                              ? "border-sage-300 bg-sage-50 text-dark"
                              : "border-[rgba(74,85,89,0.08)] bg-[rgba(252,250,244,0.92)] text-muted hover:border-[rgba(90,127,136,0.3)] hover:bg-white";
                          return (
                            <td key={`${row.label}-${column}`} className="px-4 py-3">
                              <button
                                type="button"
                                disabled={isLocked}
                                onClick={() => onChange({ ...matrixAnswerMap, [row.label]: column })}
                                className={`w-full rounded-[16px] border px-3 py-2 text-left text-sm transition ${cellTone}`}
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
          ) : null}

          {question.kind === "ordering" && question.options ? (
            <div className="grid gap-4 rounded-[24px] border border-[rgba(74,85,89,0.08)] bg-white/84 p-4 shadow-[0_12px_28px_rgba(31,38,43,0.03)]">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">Build the sequence</p>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Tap to add, then nudge into order</p>
              </div>
              <div className="grid gap-3 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Available steps</p>
                  <div className="grid gap-2">
                    {question.options
                      .filter((option) => !orderingDraft.includes(option.id))
                      .map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          disabled={isLocked}
                          onClick={() => onChange(appendOrderingStep(draftAnswer, option.id))}
                          className="flex items-start gap-3 rounded-[18px] border border-[rgba(74,85,89,0.08)] bg-[rgba(252,250,244,0.94)] px-4 py-3 text-left transition hover:border-[rgba(90,127,136,0.35)] hover:bg-white"
                        >
                          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-current text-[11px] font-bold text-muted">
                            {option.id.toUpperCase()}
                          </span>
                          <span className="text-sm leading-7 text-dark">{option.text}</span>
                        </button>
                      ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Current order</p>
                  <div className="grid gap-2">
                    {orderingDraft.length ? (
                      orderingDraft.map((optionId, index) => {
                        const option = question.options?.find((item) => item.id === optionId);
                        if (!option) return null;
                        return (
                          <div key={`${option.id}-${index}`} className="flex items-center gap-3 rounded-[18px] border border-[rgba(90,127,136,0.16)] bg-[rgba(239,246,243,0.72)] px-4 py-3">
                            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#5A7F88] text-[11px] font-bold text-white">
                              {index + 1}
                            </span>
                            <span className="flex-1 text-sm leading-7 text-dark">{option.text}</span>
                            <div className="flex gap-2">
                              <button type="button" disabled={isLocked || index === 0} onClick={() => onChange(moveOrderingStep(draftAnswer, index, -1))} className="rounded-full border border-[rgba(74,85,89,0.12)] px-3 py-1.5 text-xs font-semibold text-dark disabled:opacity-35">
                                Up
                              </button>
                              <button type="button" disabled={isLocked || index === orderingDraft.length - 1} onClick={() => onChange(moveOrderingStep(draftAnswer, index, 1))} className="rounded-full border border-[rgba(74,85,89,0.12)] px-3 py-1.5 text-xs font-semibold text-dark disabled:opacity-35">
                                Down
                              </button>
                              <button type="button" disabled={isLocked} onClick={() => onChange(removeOrderingStep(draftAnswer, option.id))} className="rounded-full border border-[rgba(194,154,86,0.24)] px-3 py-1.5 text-xs font-semibold text-dark disabled:opacity-35">
                                Remove
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="rounded-[18px] border border-dashed border-[rgba(74,85,89,0.14)] bg-[rgba(252,250,244,0.72)] px-4 py-5 text-sm leading-6 text-muted">
                        Add the first step, then keep building the safest order from top to bottom.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {question.kind !== "matrix" && question.kind !== "ordering" && question.options ? (
            <div className={isBowTie ? "rounded-[24px] border border-[rgba(194,154,86,0.14)] bg-[linear-gradient(180deg,rgba(255,252,247,0.98),rgba(248,242,232,0.94))] p-4 shadow-[0_12px_28px_rgba(31,38,43,0.03)]" : ""}>
              {isBowTie ? (
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">Decision map</p>
                    <p className="mt-2 text-sm leading-7 text-dark">Choose the option that best ties the pattern to the safest action path.</p>
                  </div>
                  <InsightPill tone="gold">Pattern - move - protection</InsightPill>
                </div>
              ) : null}
              <div className={`grid gap-3 ${isBowTie ? "md:grid-cols-2" : ""}`}>
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
                      ? isBowTie
                        ? "border-[rgba(194,154,86,0.34)] bg-[rgba(194,154,86,0.12)]"
                        : "border-[#5A7F88] bg-[rgba(90,127,136,0.08)]"
                      : isBowTie
                        ? "border-[rgba(74,85,89,0.08)] bg-[linear-gradient(180deg,rgba(255,252,247,0.96),rgba(249,244,235,0.92))] hover:border-[rgba(194,154,86,0.35)]"
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
                      className={`option-card flex w-full items-start gap-4 rounded-[22px] border px-5 py-4 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(31,38,43,0.05)] ${feedbackClass}`}
                    >
                      <span
                        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                          isBowTie ? "border-[rgba(194,154,86,0.4)] bg-white/82 text-[#8d6a2e]" : "border-current"
                        }`}
                      >
                        {option.id.toUpperCase()}
                      </span>
                      <span className="flex-1 pt-1 text-[1.05rem] leading-7 text-dark">{option.text}</span>
                      {answered ? (
                        <span className="mt-1 inline-flex shrink-0 items-center rounded-full border border-[rgba(74,85,89,0.08)] bg-white/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                          {correct ? "Correct" : selected ? "Selected" : "Unused"}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {answered ? (
            <div
              className={`reward-banner rounded-[24px] border p-6 shadow-[0_14px_32px_rgba(31,38,43,0.04)] ${
                submittedCorrectly ? "border-[rgba(90,138,94,0.28)] bg-[rgba(90,138,94,0.06)]" : "border-red-200 bg-red-50/60"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.2em] ${
                      submittedCorrectly ? "bg-[rgba(90,138,94,0.15)] text-[#3d6b41]" : "bg-red-100 text-red-800"
                    }`}
                  >
                    {submittedCorrectly ? "Correct" : "Needs review"}
                  </span>
                  <span className="text-sm text-muted">
                    Correct: <strong className="text-dark">{formatAnswerValue(answerRecord?.correctAnswer)}</strong>
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                  {teachingReferences.length > 0 ? <InsightPill tone="blue">Sources ready</InsightPill> : null}
                  {teachingDiagram || teachingVisual ? <InsightPill tone="gold">Visual support</InsightPill> : null}
                  {canOpenTutor ? <InsightPill tone="sage">Tutor available</InsightPill> : null}
                </div>
              </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-4">
                  {teachingTakeaway ? (
                    <div className="debrief-card rounded-[20px] border border-[rgba(74,85,89,0.1)] bg-white/78 px-4 py-4 shadow-[0_10px_24px_rgba(31,38,43,0.03)]">
                      <p className="terminal-label">Why this wins</p>
                      <p className="mt-2 text-sm leading-7 text-dark">
                        <strong className="font-semibold">What matters most:</strong> {teachingTakeaway}
                      </p>
                      {question.speedCue ? (
                        <p className="mt-3 rounded-[14px] border border-[rgba(90,127,136,0.14)] bg-[rgba(90,127,136,0.08)] px-3 py-2 text-sm leading-6 text-dark">
                          <strong className="font-semibold">Speed cue:</strong> {question.speedCue}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  <details className="debrief-card rounded-[20px] border border-[rgba(74,85,89,0.1)] bg-white/68 px-4 py-4 open:shadow-[0_12px_28px_rgba(31,38,43,0.03)]">
                    <summary className="cursor-pointer terminal-label">
                      Pattern to remember
                    </summary>
                    <p className="mt-3 text-[1rem] leading-[1.85] text-dark">{teachingDeepRationale}</p>
                  </details>

                  {distractorRationales && Object.keys(distractorRationales).length > 0 ? (
                    <div className="debrief-card rounded-[20px] border border-[rgba(108,96,79,0.1)] bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(250,244,236,0.9))] px-4 py-4">
                      <p className="terminal-label">Why others lose</p>
                      <div className="mt-3 space-y-3 text-sm leading-7 text-dark">
                        {Object.entries(distractorRationales).map(([label, explanation]) => (
                          <div key={label} className="rounded-[16px] border border-[rgba(74,85,89,0.08)] bg-[rgba(252,250,244,0.92)] px-3 py-2">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">{label.toUpperCase()}</p>
                            <p className="mt-1 leading-7">{explanation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-4">
                  {teachingCoachingFrame.length > 0 ? (
                    <div className="debrief-card rounded-[20px] border border-[rgba(74,85,89,0.1)] bg-white/68 px-4 py-4">
                      <p className="terminal-label">Study coaching</p>
                      <div className="mt-3">
                        <BulletList items={teachingCoachingFrame} />
                      </div>
                    </div>
                  ) : null}

                  {teachingDiagram ? (
                    <div className="debrief-card rounded-[20px] border border-[rgba(74,85,89,0.1)] bg-white/68 px-4 py-4">
                      <p className="terminal-label">Diagram focus</p>
                      <p className="mt-2 text-sm font-semibold text-dark">{teachingDiagram.title}</p>
                      <p className="mt-2 text-sm leading-7 text-muted">{teachingDiagram.focus}</p>
                    </div>
                  ) : null}

                  {teachingVisual && teachingVisual.conclusion ? (
                    <div className="debrief-card rounded-[20px] border border-[rgba(74,85,89,0.1)] bg-white/68 px-4 py-4">
                      <p className="terminal-label">Visual rationale</p>
                      <p className="mt-2 text-sm font-semibold text-dark">{teachingVisual.title}</p>
                      <p className="mt-2 text-sm leading-7 text-muted">{teachingVisual.conclusion}</p>
                    </div>
                  ) : null}

                  {teachingReferences.length > 0 ? (
                    <div className="debrief-card rounded-[20px] border border-[rgba(74,85,89,0.1)] bg-white/68 px-4 py-4">
                      <p className="terminal-label">Sources</p>
                      <div className="mt-3 space-y-3 text-sm leading-7 text-dark">
                        {teachingReferences.map((reference, index) => (
                          <div key={`${reference.title}-${index}`} className="rounded-[16px] border border-[rgba(108,96,79,0.1)] bg-[rgba(255,251,243,0.95)] px-3 py-2 shadow-[0_8px_18px_rgba(58,46,34,0.03)]">
                            <p className="font-semibold text-dark">{reference.title}</p>
                            {reference.citation ? <p className="text-muted">{reference.citation}</p> : null}
                            {reference.href ? (
                              <a href={reference.href} target="_blank" rel="noreferrer" className="mt-1 inline-flex text-[#5A7F88] underline underline-offset-2">
                                Open source
                              </a>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <aside className="space-y-4">
          <div className="study-console-panel">
            <div className="flex items-center justify-between gap-3">
              <p className="terminal-label">Question flow</p>
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
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => onJump(index)}
                    className={`aspect-square rounded-[14px] border text-xs font-semibold transition ${statTone(active, isAnswered, isFlagged)}`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="study-console-panel">
            <div className="space-y-2">
              <p className="terminal-label">What to watch for</p>
              <h3 className="font-serif text-[1.18rem] leading-[1.08] text-dark">Read the clue set before the choice.</h3>
              <p className="text-sm leading-6 text-muted">
                Use the stem, chart, and rationale together. The strongest answer usually shows up first in the data, not the options.
              </p>
            </div>
            <div className="mt-4 grid gap-2">
              <div className="rounded-[16px] border border-[rgba(90,127,136,0.12)] bg-[rgba(90,127,136,0.08)] px-3 py-3 text-sm leading-6 text-dark">
                Look for the highest-risk physiology first.
              </div>
              <div className="rounded-[16px] border border-[rgba(74,85,89,0.08)] bg-white/72 px-3 py-3 text-sm leading-6 text-dark">
                Use the stem and data panels together, not separately.
              </div>
              <div className="rounded-[16px] border border-[rgba(194,154,86,0.14)] bg-[rgba(194,154,86,0.08)] px-3 py-3 text-sm leading-6 text-dark">
                For NGN and case work, trace the pattern before the answer choice.
              </div>
              {question.speedCue ? (
                <div className="rounded-[16px] border border-[rgba(90,127,136,0.14)] bg-[rgba(90,127,136,0.08)] px-3 py-3 text-sm leading-6 text-dark">
                  Speed cue: {question.speedCue}
                </div>
              ) : null}
            </div>
          </div>

          <div className="study-console-panel flex flex-col gap-3">
            {canOpenTutor ? (
              <button
                type="button"
                onClick={onOpenTutor}
                className="inline-flex items-center justify-center rounded-full border border-[rgba(74,85,89,0.12)] bg-white px-5 py-3 text-sm font-semibold text-dark transition hover:border-[rgba(90,127,136,0.35)]"
              >
                Open tutor
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
*/
}
