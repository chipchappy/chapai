"use client";

import { useEffect, useMemo, useState } from "react";
import { BowTieSelector } from "@/components/practice/BowTieSelector";
import RationaleDiagram from "@/components/practice/RationaleDiagram";
import { getDisplayableDistractorRationales, isDisplayableRationaleText } from "@/lib/distractor-rationale-display";
import type { PracticeAnswer, PracticeAnswerRecord, PracticeQuestion } from "@/lib/practice-types";

type NclexChartTab = "notes" | "history" | "vitals" | "labs" | "orders";

interface NclexExamPaneProps {
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
  phase: "catalog" | "active" | "review" | "results";
}

function isRecordAnswer(answer: PracticeAnswer | undefined): answer is Record<string, string> {
  return Boolean(answer && typeof answer === "object" && !Array.isArray(answer));
}

function selectedIds(answer: PracticeAnswer | undefined) {
  if (Array.isArray(answer)) return answer;
  if (typeof answer === "string" && answer) return [answer];
  return [];
}

function correctIds(question: PracticeQuestion) {
  if (Array.isArray(question.correctAnswer)) return question.correctAnswer.map(String);
  if (typeof question.correctAnswer === "string") return [question.correctAnswer];
  return [];
}

function formatAnswerValue(answer: PracticeAnswer | undefined, question: PracticeQuestion) {
  if (!answer) return "--";
  if (Array.isArray(answer)) {
    return answer.map((id) => question.options?.find((option) => option.id === id)?.text ?? id.toUpperCase()).join(", ");
  }
  if (typeof answer === "object") {
    return Object.entries(answer).map(([label, value]) => `${label}: ${value}`).join(" | ");
  }
  return question.options?.find((option) => option.id === answer)?.text ?? answer.toUpperCase();
}

function buildFallbackDiagram(
  question: PracticeQuestion,
  answerRecord: PracticeAnswerRecord | undefined,
  rationale: string,
): NonNullable<PracticeQuestion["visualRationale"]> {
  const structured = answerRecord?.structuredRationale ?? question.structuredRationale;
  const answerTarget = formatAnswerValue(answerRecord?.correctAnswer ?? question.correctAnswer, question);
  const cue = question.speedCue ?? question.takeaway ?? splitSentences(rationale)[0] ?? "highest-risk cue";
  const pattern = question.diagramBlueprint?.focus ?? structured?.overview ?? question.category;
  const mechanism = structured?.mechanism ?? question.takeaway ?? "match the cue to the safest priority action";

  return {
    type: question.diagramBlueprint?.type ?? "pathway",
    title: question.diagramBlueprint?.title ?? "Decision pathway",
    caption: "Trace the clue, pattern, and safest move before reviewing distractors.",
    nodes: [
      { label: "Cue", value: cue },
      { label: "Pattern", value: pattern },
      { label: "Safest move", value: answerTarget },
      { label: "Why it wins", value: mechanism },
    ],
    conclusion: question.takeaway ?? "On the next rep, name the cue before choosing the action.",
  };
}

function scoringRule(question: PracticeQuestion) {
  if (question.kind === "matrix") return "+ / - scoring";
  if (question.kind === "ordering") return "Ordered response";
  if (question.kind === "multi-select") return "Select all that apply";
  if (question.kind === "bow-tie") return "Bow-tie clinical judgment";
  return "Single best answer";
}

function getQuestionDirection(question: PracticeQuestion) {
  if (question.kind === "multi-select") {
    return {
      tone: "multi",
      label: "Select all that apply",
      primary: question.nclexInstruction ?? "Select every answer that applies. More than one option may be correct.",
      detail: "Do not stop after one good option; check each choice independently.",
    };
  }
  if (question.kind === "matrix") {
    return {
      tone: "matrix",
      label: "Complete every row",
      primary: question.nclexInstruction ?? "For each client finding, select the best response in that row.",
      detail: "Each row is scored independently; do not leave any row blank.",
    };
  }
  if (question.kind === "ordering") {
    return {
      tone: "sequence",
      label: "Ordered response",
      primary: question.nclexInstruction ?? "Place the options in the correct sequence before submitting.",
      detail: "Prioritize safety, ABCs, and immediate stabilization before later tasks.",
    };
  }
  if (question.kind === "bow-tie") {
    return {
      tone: "clinical",
      label: "Bow-tie clinical judgment",
      primary: question.nclexInstruction ?? "Link the highest-risk cues to the condition, actions, and outcomes.",
      detail: "Anchor the center diagnosis before choosing interventions and monitoring targets.",
    };
  }
  return {
    tone: "single",
    label: "Single best answer",
    primary: question.nclexInstruction ?? "Select the one option that best answers the question.",
    detail: "Use the safest priority action supported by the stem.",
  };
}

function formatClock(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function splitSentences(text?: string) {
  if (!text) return [];
  return text
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitRationaleParagraphs(text: string) {
  const sentences = splitSentences(text);
  if (sentences.length <= 2) return [text];
  return [sentences.slice(0, 2).join(" "), sentences.slice(2).join(" ")].filter(Boolean);
}

function selectTeachingRationale(question: PracticeQuestion, answerRecord?: PracticeAnswerRecord) {
  const structured = answerRecord?.structuredRationale ?? question.structuredRationale;
  const candidates = [
    answerRecord?.deepRationale,
    question.deepRationale,
    answerRecord?.rationale,
    question.rationale,
    [structured?.overview, structured?.mechanism].filter(Boolean).join(" "),
    question.takeaway,
  ];
  return candidates.find(isDisplayableRationaleText)
    ?? "Use the safest answer supported by the highest-risk cue in the stem, then compare each distractor against that priority before moving on.";
}

function readableKey(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatChartLine(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(formatChartLine).filter(Boolean).join("; ");

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const title = formatChartLine(record.title ?? record.label);
    const status = formatChartLine(record.status);
    const detail = formatChartLine(record.detail ?? record.body ?? record.value);
    if (title || status || detail) {
      return [title, [status, detail].filter(Boolean).join(" - ")].filter(Boolean).join(": ");
    }

    return Object.entries(record)
      .map(([key, entry]) => {
        const text = formatChartLine(entry);
        return text ? `${readableKey(key)}: ${text}` : "";
      })
      .filter(Boolean)
      .join("; ");
  }

  return "";
}

function chartLines(values: unknown[]) {
  const seen = new Set<string>();
  return values
    .flatMap((value) => formatChartLine(value).split(/\n+/))
    .map((line) => line.trim())
    .filter((line) => {
      if (!line || seen.has(line)) return false;
      seen.add(line);
      return true;
    });
}

function splitChartTime(line: string, fallback: string) {
  const match = line.match(/^(\d{4}:)\s*(.+)$/);
  if (match) {
    return { time: match[1], text: match[2] };
  }
  return { time: fallback, text: line };
}

function metricRows(question: PracticeQuestion, tab: "vitals" | "labs") {
  const chart = question.chartReview;
  const direct =
    tab === "vitals"
      ? [...(chart?.vitals ?? []), ...(question.vitals ?? []), ...(question.hemodynamics ?? [])]
      : [...(chart?.labs ?? []), ...(question.labs ?? [])];
  const fromCharts =
    tab === "vitals"
      ? (question.chartRows ?? []).flatMap((row) => row.values.map((value) => ({ ...value, time: row.time, unit: undefined })))
      : [];

  return [...direct.map((item) => ({ ...item, time: "" })), ...fromCharts];
}

function exhibitLines(question: PracticeQuestion, types: Array<"note" | "timeline" | "assessment" | "orders" | "labs" | "vitals">) {
  return (question.exhibits ?? [])
    .filter((item) => types.includes(item.type))
    .flatMap((item) => [
      item.body ? `${item.title}: ${formatChartLine(item.body)}` : "",
      ...(item.items ?? []).map((entry) => `${item.title}: ${formatChartLine(entry)}`),
    ])
    .filter(Boolean);
}

function nursingNoteFallback(question: PracticeQuestion) {
  const objectiveFindings = [...metricRows(question, "vitals"), ...metricRows(question, "labs")]
    .slice(0, 4)
    .map((item) => `Current assessment: ${item.label} ${item.value}${item.unit ? ` ${item.unit}` : ""}${item.flag && item.flag !== "normal" ? ` (${item.flag})` : ""}`);
  return chartLines([
    question.additionalInfo,
    ...objectiveFindings,
    "No separate nurses' note was supplied for this item. Use the objective findings in the available chart tabs.",
  ]);
}

function historyFallback(question: PracticeQuestion) {
  return chartLines([
    question.scenario,
    question.caseContext,
    question.scenarioTitle,
    question.caseTitle,
    splitSentences(question.stem)[0],
  ]);
}

function toggleArrayValue(current: PracticeAnswer, value: string) {
  const ids = selectedIds(current);
  return ids.some((id) => id.toLowerCase() === value.toLowerCase())
    ? ids.filter((id) => id.toLowerCase() !== value.toLowerCase())
    : [...ids, value];
}

export default function NclexExamPane({
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
  phase,
}: NclexExamPaneProps) {
  const answered = Boolean(answerRecord) || phase === "results";
  const locked = answered;
  const [chartTab, setChartTab] = useState<NclexChartTab>("notes");
  const [seconds, setSeconds] = useState(0);
  const currentFlagged = questionStatuses.find((item) => item.id === question.id)?.flagged ?? false;
  const activeAnswer = answerRecord?.selected ?? draftAnswer;
  const activeIds = selectedIds(activeAnswer);
  const correct = correctIds(question);
  const matrixAnswer = isRecordAnswer(activeAnswer) ? activeAnswer : {};
  const pointsEarned = answerRecord?.pointsEarned ?? (answerRecord?.correct ? 1 : 0);
  const pointsPossible = answerRecord?.pointsPossible ?? 1;
  const caseItemNumber = question.caseItemNumber ?? questionNumber;
  const caseItemTotal = question.caseItemTotal ?? totalQuestions;
  const clozeBlankCount = question.clozeBlankCount ?? (question.kind === "ordering" ? Math.max(correct.length, 3) : 1);
  const direction = getQuestionDirection(question);
  const rationale = selectTeachingRationale(question, answerRecord);
  const rationaleParagraphs = splitRationaleParagraphs(rationale);
  const structuredRationale = answerRecord?.structuredRationale ?? question.structuredRationale;
  // Prefer the vetted distractor rationales; the generated structured whyWrong is
  // only a fallback for items that never had per-option explanations.
  const vettedDistractors = getDisplayableDistractorRationales(
    question,
    answerRecord?.distractorRationales ?? question.distractorRationales,
  );
  const vettedStructuredWrong = getDisplayableDistractorRationales(question, structuredRationale?.whyWrong);
  const incorrectExplanations = Object.keys(vettedDistractors).length
    ? vettedDistractors
    : vettedStructuredWrong;
  const references = answerRecord?.references ?? question.references ?? [];
  const structuredCitations = structuredRationale?.citations ?? [];
  const visualDiagram = answerRecord?.visualRationale
    ?? question.visualRationale
    ?? buildFallbackDiagram(question, answerRecord, rationale);
  const selectedTexts = activeIds
    .map((id) => question.options?.find((option) => option.id === id)?.text ?? id.toUpperCase())
    .filter(Boolean);

  useEffect(() => {
    const id = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  const chartContent = useMemo(() => {
    const notes = chartLines([
      ...(question.chartReview?.nursingNotes ?? []),
      ...(question.chartReview?.notes ?? []),
      ...(question.chartReview?.assessments ?? []),
      ...(question.chartReview?.intakeOutput ?? []).map((item) => `Intake/output: ${item}`),
      ...(question.chartReview?.medicationAdministrationRecord ?? []).map((item) => `MAR: ${item}`),
      ...(question.chartReview?.carePlan ?? []).map((item) => `Care plan: ${item}`),
      question.additionalInfo,
      ...exhibitLines(question, ["note", "timeline", "assessment"]),
    ]);
    const history = chartLines([
      ...(question.chartReview?.hpi ?? []),
      ...(question.chartReview?.history ?? []),
      question.chartReview?.chiefComplaint ? `Chief complaint: ${question.chartReview.chiefComplaint}` : "",
      question.scenario,
      question.caseContext,
      ...(question.chartReview?.allergies ?? []).map((item) => `Allergy: ${item}`),
      ...(question.chartReview?.medications ?? []).map((item) => `Home medication: ${item}`),
      question.scenarioTitle,
      question.caseTitle,
    ]);
    const orders = chartLines([
      ...(question.chartReview?.orders ?? []),
      ...(question.chartReview?.providerOrders ?? []),
      ...exhibitLines(question, ["orders"]),
    ]);

    return {
      notes,
      history,
      orders,
      vitals: metricRows(question, "vitals"),
      labs: metricRows(question, "labs"),
    };
  }, [question]);

  const availableTabs = useMemo(() => {
    const tabs: Array<{ id: NclexChartTab; label: string }> = [
      { id: "notes", label: "Nurses' Notes" },
      { id: "history", label: "History and Physical" },
    ];

    if (chartContent.vitals.length) tabs.push({ id: "vitals", label: "Vital Signs" });
    if (chartContent.labs.length) tabs.push({ id: "labs", label: "Labs" });
    if (chartContent.orders.length) tabs.push({ id: "orders", label: "Orders" });

    return tabs;
  }, [chartContent]);

  useEffect(() => {
    setChartTab(availableTabs[0]?.id ?? "notes");
    setSeconds(0);
  }, [availableTabs, question.id]);

  const handleChoice = (id: string) => {
    if (locked) return;
    if (question.kind === "multi-select") {
      onChange(toggleArrayValue(activeAnswer, id));
      return;
    }
    if (question.kind === "ordering") {
      if (activeIds.includes(id)) {
        onChange(activeIds.filter((value) => value !== id));
        return;
      }
      if (activeIds.length < clozeBlankCount) onChange([...activeIds, id]);
      return;
    }
    onChange(id);
  };

  const renderChartPanel = () => {
    if (chartTab === "vitals" || chartTab === "labs") {
      const rows = chartTab === "vitals" ? chartContent.vitals : chartContent.labs;
      return rows.length ? (
        <table className="nclex-chart-table">
          <thead>
            <tr>
              {rows.some((row) => row.time) ? <th>Time</th> : null}
              <th>{chartTab === "vitals" ? "Assessment" : "Result"}</th>
              <th>Value</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row.label}-${row.value}-${index}`}>
                {rows.some((item) => item.time) ? <td>{row.time || "current"}</td> : null}
                <td>{row.label}</td>
                <td>{row.value}{row.unit ? ` ${row.unit}` : ""}</td>
                <td>{row.flag && row.flag !== "normal" ? row.flag : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="nclex-empty">No {chartTab} exhibit is attached to this item.</p>
      );
    }

    const lines = chartTab === "orders" ? chartContent.orders : chartTab === "history" ? chartContent.history : chartContent.notes;
    const fallback = chartTab === "notes"
      ? nursingNoteFallback(question)
      : chartTab === "history"
        ? historyFallback(question)
        : [];

    return (lines.length ? lines : fallback).length ? (
      <div className="nclex-note-stack">
        {(lines.length ? lines : fallback).map((line, index) => {
          const safeLine = String(line);
          const fallbackLabel = chartTab === "notes"
            ? `Entry ${index + 1}:`
            : chartTab === "history"
              ? (index === 0 ? "HPI:" : "History:")
              : "";
          const entry = splitChartTime(safeLine, fallbackLabel);
          return (
            <p key={`${safeLine}-${index}`}>
              <strong>{entry.time}</strong>
              <span>{entry.text}</span>
            </p>
          );
        })}
      </div>
    ) : (
      <p className="nclex-empty">No {chartTab} exhibit is attached to this item.</p>
    );
  };

  const renderClozeSentence = () => {
    if (!question.clozeTemplate) {
      return (
        <>
          {/* No cloze template on this item: keep the prompt neutral — never
              fabricate clinical framing that may contradict the actual stem. */}
          <p className="nclex-fill-sentence">
            {question.kind === "ordering"
              ? <>Place the options in the <strong>correct sequence</strong> to complete the response.</>
              : question.kind === "multi-select"
                ? <>Select <strong>all choices that apply</strong>. More than one option may be correct.</>
              : <>Select the choice that <strong>best completes</strong> the response.</>}
          </p>
          {question.kind === "multi-select" ? (
            <div className="nclex-selected-chip-row" aria-label="selected answers">
              {selectedTexts.length ? selectedTexts.map((text) => <span key={text}>{text}</span>) : <em>No selections yet</em>}
            </div>
          ) : (
            <div className="nclex-blank-row" aria-label="selected answer blanks">
              {(question.kind === "ordering" ? Array.from({ length: clozeBlankCount }, (_, slot) => slot) : [0]).map((slot) => (
                <span key={slot} className="nclex-blank">{selectedTexts[slot] ?? ""}</span>
              ))}
            </div>
          )}
        </>
      );
    }

    const segments = question.clozeTemplate.split("{blank}");
    return (
      <p className="nclex-cloze-sentence">
        {segments.map((segment, index) => (
          <span key={`${segment}-${index}`}>
            {segment}
            {index < clozeBlankCount ? <span className="nclex-blank">{selectedTexts[index] ?? ""}</span> : null}
          </span>
        ))}
      </p>
    );
  };

  const renderAnswerArea = () => {
    if (question.kind === "bow-tie" && question.bowTie) {
      return (
        <BowTieSelector
          bowTie={question.bowTie}
          value={activeAnswer}
          correctAnswer={answerRecord?.correctAnswer ?? question.correctAnswer}
          answered={answered}
          disabled={locked}
          onChange={onChange}
        />
      );
    }

    if (question.kind === "multi-select" && question.highlightRows?.length) {
      return (
        <div className="nclex-highlight-wrap">
          <table className="nclex-highlight-table">
            <thead>
              <tr>
                <th>Body System</th>
                <th>Findings</th>
              </tr>
            </thead>
            <tbody>
              {question.highlightRows.map((row, index) => {
                const selected = activeIds.includes(row.optionId);
                const isCorrect = correct.includes(row.optionId);
                return (
                  <tr key={`${row.label}-${row.optionId}-${index}`}>
                    <td>{row.label}</td>
                    <td>
                      <button
                        type="button"
                        disabled={locked}
                        onClick={() => handleChoice(row.optionId)}
                        className={`nclex-highlight-choice ${selected ? "is-selected" : ""} ${answered && isCorrect ? "is-correct" : ""} ${answered && selected && !isCorrect ? "is-wrong" : ""}`}
                      >
                        {row.text}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    if (question.kind === "matrix" && question.matrixRows?.length && question.matrixColumns?.length) {
      return (
        <div className="nclex-matrix-wrap">
          <table className="nclex-answer-matrix">
            <thead>
              <tr>
                <th>Client Finding</th>
                {question.matrixColumns.map((column) => <th key={column}>{column}</th>)}
              </tr>
            </thead>
            <tbody>
              {question.matrixRows.map((row, index) => (
                <tr key={`${row.label}-${index}`}>
                  <td>{index + 1}. {row.label}</td>
                  {question.matrixColumns?.map((column) => {
                    const selected = matrixAnswer[row.label] === column;
                    const correctColumn = row.answer === column;
                    return (
                      <td key={`${row.label}-${column}`}>
                        <button
                          type="button"
                          className={`nclex-radio-cell ${selected ? "is-selected" : ""} ${answered && correctColumn ? "is-correct" : ""} ${answered && selected && !correctColumn ? "is-wrong" : ""}`}
                          disabled={locked}
                          onClick={() => onChange({ ...matrixAnswer, [row.label]: column })}
                          aria-label={`${row.label}: ${column}`}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="nclex-note">Note: Each row must have 1 response option selected.</p>
        </div>
      );
    }

    return (
      <div className="nclex-word-response">
        {renderClozeSentence()}
        <div className="nclex-word-box">
          <div className="nclex-word-title">
            {question.kind === "multi-select" ? "Answer Choices - Select All That Apply" : question.kind === "ordering" ? "Word Choices - Order the Response" : "Word Choices"}
          </div>
          {(question.options ?? []).map((option) => {
            const selected = activeIds.includes(option.id);
            const isCorrect = correct.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                disabled={locked}
                onClick={() => handleChoice(option.id)}
                className={`nclex-word-choice ${selected ? "is-selected" : ""} ${answered && isCorrect ? "is-correct" : ""} ${answered && selected && !isCorrect ? "is-wrong" : ""}`}
              >
                {option.text}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="nclex-exam-shell">
      <header className="nclex-topbar">
        <div>NCLEX-RN Test</div>
        <div>ClarityPrep.com</div>
        <div className="nclex-topbar-right">
          <span>{formatClock(seconds)}</span>
          <span>Question {questionNumber} of {totalQuestions}</span>
        </div>
      </header>
      <div className="nclex-toolrow">
        <span>Calculator</span>
        <span className="nclex-toolrow-right">Settings&nbsp;&nbsp;&nbsp;{currentFlagged ? "Marked for Review" : "Mark for Review"}</span>
      </div>

      <main className="nclex-exam-main">
        <section className="nclex-left-pane">
          <div className="nclex-item-meta">
            <strong>Item {caseItemNumber} of {caseItemTotal}</strong>
            <span>{question.nclexScenarioLead || question.caseContext || question.scenarioTitle || "The nurse reviews the client record before answering."}</span>
          </div>
          <div className="nclex-chart-tabs" role="tablist" aria-label="client record tabs">
            {availableTabs.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={chartTab === id}
                className={chartTab === id ? "is-active" : ""}
                onClick={() => setChartTab(id)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="nclex-chart-card">
            <h3>{chartTab === "notes" ? question.chartReview?.patientTitle ?? "Day 1: Emergency Department" : chartTab === "history" ? "History and Physical" : chartTab === "vitals" ? "Vital Signs" : chartTab === "labs" ? "Laboratory Results" : "Orders"}</h3>
            {renderChartPanel()}
          </div>
        </section>

        <section className="nclex-right-pane">
          <div className={`nclex-direction-banner is-${direction.tone}`}>
            <span>{direction.label}</span>
            <strong>{direction.primary}</strong>
            <em>{direction.detail}</em>
          </div>
          <p className="nclex-question-lead">{question.stem}</p>
          <p className="nclex-instruction">
            <span aria-hidden="true">›</span>
            <strong>{direction.label}.</strong> {direction.primary}
          </p>

          {renderAnswerArea()}

          <button type="button" className="nclex-submit" onClick={onSubmit} disabled={answered}>
            Submit
          </button>

          {answered ? (
            <section className="nclex-rationale-panel">
              <h3>{answerRecord?.correct ? "Correct" : "Not Answered"}</h3>
              <div className="nclex-score-table">
                <div><span>Credit</span><strong>{pointsEarned} / {pointsPossible}</strong></div>
                <div><span>Avg Points Scored</span><strong>{pointsEarned} / {pointsPossible}</strong></div>
                <div><span>Scoring Rule</span><strong>{scoringRule(question)}</strong></div>
                <div><span>Time Spent</span><strong>{formatClock(seconds)}</strong></div>
              </div>
              <h3 className="nclex-explanation-title">Explanation</h3>

              {/* Correct-answer rationale — the full high-quality deep rationale is
                  ALWAYS the primary content; the structured overview/mechanism is
                  supplemental context beneath it, never a replacement. */}
              <div className="nclex-correct-rationale">
                <span className="nclex-correct-label" aria-hidden="true">✓ Why this is correct</span>
                <div className="nclex-rationale-copy">
                  {rationaleParagraphs.map((paragraph, index) => <p key={`${paragraph}-${index}`}>{paragraph}</p>)}
                </div>
                {structuredRationale && (structuredRationale.overview || structuredRationale.mechanism) ? (
                  <div className="nclex-correct-detail">
                    {structuredRationale.overview ? <p><b>Overview.</b> {structuredRationale.overview}</p> : null}
                    {structuredRationale.mechanism ? <p><b>Clinical mechanism.</b> {structuredRationale.mechanism}</p> : null}
                  </div>
                ) : null}
              </div>

              {/* Uniform visual rationale diagram — renders when the item carries one. */}
              <RationaleDiagram data={visualDiagram} />

              {/* Distractor rationales — always visible, no click-to-expand. */}
              {Object.keys(incorrectExplanations).length ? (
                <div className="nclex-distractor-list">
                  <strong className="nclex-distractor-heading">Why each other option is wrong</strong>
                  {Object.entries(incorrectExplanations).map(([label, text]) => (
                    <div key={label} className="nclex-distractor-row">
                      <b>Option {label.toUpperCase()}</b>
                      <p>{text}</p>
                    </div>
                  ))}
                </div>
              ) : null}

              {question.takeaway ? (
                <div className="nclex-key-takeaway">
                  <strong>Key Takeaway:</strong>
                  <ul>
                    <li>{question.takeaway}</li>
                    {question.speedCue ? <li>{question.speedCue}</li> : null}
                  </ul>
                </div>
              ) : null}
              <p className="nclex-version">Version 2026</p>
              {structuredCitations.length ? (
                <div className="nclex-incorrect-block">
                  <strong>Citations:</strong>
                  {structuredCitations.map((citation, index) => (
                    <p key={`${citation.source}-${index}`}>
                      <b>{citation.source}</b>{citation.chapter ? ` - ${citation.chapter}` : ""}
                    </p>
                  ))}
                </div>
              ) : null}
              {references.length ? <button type="button" className="nclex-source-link">View Sources</button> : null}

              {/* AI tutor — warm periwinkle chat entry that opens the working streaming tutor. */}
              {canOpenTutor ? (
                <div className="nclex-tutor-box">
                  <div className="nclex-tutor-box__head">
                    <span className="nclex-tutor-box__spark" aria-hidden="true">✦</span>
                    <div>
                      <strong>Ask Clarity AI</strong>
                      <small>Your built-in study coach — ask why an answer is right or wrong, get a test-taking strategy, or drill the concept.</small>
                    </div>
                  </div>
                  <button type="button" className="nclex-tutor-box__entry" onClick={onOpenTutor}>
                    <span className="nclex-tutor-box__placeholder">Ask about this question, a distractor, or the concept…</span>
                    <span className="nclex-tutor-box__send" aria-hidden="true">➤</span>
                  </button>
                </div>
              ) : null}
            </section>
          ) : null}
        </section>
      </main>

      <footer className="nclex-bottombar">
        <button type="button" onClick={onEnd ?? (() => onJump(0))}>End</button>
        <span />
        <button type="button" onClick={onPrev} disabled={!canGoPrev}>Previous</button>
        <button type="button" onClick={onToggleFlag}>{currentFlagged ? "Unmark" : "Navigate"}</button>
        <button type="button" onClick={onNext} disabled={!canGoNext}>Next</button>
      </footer>
    </div>
  );
}
