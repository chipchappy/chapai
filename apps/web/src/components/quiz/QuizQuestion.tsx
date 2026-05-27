"use client";

import { useEffect, useRef, useState } from "react";
import { getDisplayableDistractorRationales } from "@/lib/distractor-rationale-display";

function getCategoryReferences(category: string | undefined): string[] {
  const cat = (category ?? '').toLowerCase();
  if (cat.includes('hemo') || cat.includes('cardiac') || cat.includes('shock') || cat.includes('vasoactive')) {
    return [
      'AACN CCRN Exam Blueprint 2024 — Cardiovascular (16%)',
      'ACC/AHA Heart Failure Guidelines 2022 (doi:10.1161/CIR.0000000000001063)',
      'AACN Core Curriculum for High Acuity, Progressive, and Critical Care Nursing, 7th ed.',
    ];
  }
  if (cat.includes('vent') || cat.includes('resp') || cat.includes('oxygen') || cat.includes('airway')) {
    return [
      'AACN CCRN Exam Blueprint 2024 — Pulmonary (18%)',
      'AARC Clinical Practice Guidelines: Mechanical Ventilation',
      'ACCP/SCCM Consensus Statement on Mechanical Ventilation',
    ];
  }
  if (cat.includes('deleg') || cat.includes('assign') || cat.includes('priority') || cat.includes('triage')) {
    return [
      'NCSBN NCLEX-RN Next Generation Test Plan 2023 — Clinical Judgment',
      'ANA Principles for Delegation (2005, reaffirmed 2019)',
      'NCSBN National Guidelines for Nursing Delegation (2016)',
    ];
  }
  if (cat.includes('pharm') || cat.includes('med') || cat.includes('drug') || cat.includes('dose')) {
    return [
      'ISMP Guidelines for Preventing Medication Errors (2023)',
      'NCSBN NCLEX-RN Next Generation Test Plan 2023 — Pharmacological Therapies',
      'Institute for Safe Medication Practices: High-Alert Medications',
    ];
  }
  if (cat.includes('neuro') || cat.includes('icp') || cat.includes('stroke') || cat.includes('seizure')) {
    return [
      'AHA/ASA Stroke Guidelines 2021 (Stroke. 2021;52:e364–e467)',
      'Neurocritical Care Society Guidelines',
      'AACN CCRN Exam Blueprint 2024 — Neurological (10%)',
    ];
  }
  if (cat.includes('maternal') || cat.includes('newborn') || cat.includes('ob') || cat.includes('pregnan')) {
    return [
      'AWHONN Perinatal Nursing Standards (5th ed., 2021)',
      'ACOG Practice Bulletins — Obstetrical Care',
      'NCSBN NCLEX-RN Next Generation Test Plan 2023 — Reproduction',
    ];
  }
  if (cat.includes('pedi') || cat.includes('child') || cat.includes('infant')) {
    return [
      'NCSBN NCLEX-RN Next Generation Test Plan 2023 — Health Promotion (Growth & Development)',
      'AAP Pediatric Guidelines (current edition)',
      'AACN CCRN Pediatric Exam Blueprint 2024',
    ];
  }
  if (cat.includes('psych') || cat.includes('mental') || cat.includes('behav')) {
    return [
      'NCSBN NCLEX-RN Next Generation Test Plan 2023 — Psychosocial Integrity',
      'American Psychiatric Association DSM-5-TR (2022)',
      'APNA Psychiatric-Mental Health Nursing Standards',
    ];
  }
  return [
    'NCSBN NCLEX-RN Next Generation Test Plan 2023',
    'AACN CCRN Exam Blueprint 2024',
    'Joint Commission Patient Safety Goals (current year)',
  ];
}

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
  topic?: string;
  difficulty?: number;
  takeaway?: string;
  conceptNotes?: string | string[];
  correctOptionId?: string;
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
  const displayRationales = getDisplayableDistractorRationales(
    question,
    result?.distractorRationales,
  );

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
    <div className="card p-6 md:p-8" style={{ borderColor: "rgba(208,198,181,0.46)", background: "rgba(255,253,249,0.97)" }}>
      <p className="question-stem mb-6">{question.stem}</p>

      <div className="mb-6 flex flex-col gap-3">
        {question.options.map((option) => (
          <button
            key={option.id}
            disabled={answered}
            aria-pressed={selected === option.id}
            data-selected={selected === option.id ? "true" : "false"}
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
          {/* ── Status header ──────────────────────────────────── */}
          <div className="mb-4 flex items-center gap-2.5">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold tracking-[0.06em] uppercase ${
                result.correct
                  ? "border-[rgba(65,132,92,0.3)] bg-[rgba(234,248,239,0.9)] text-[rgba(42,96,62,0.88)]"
                  : "border-[rgba(172,68,58,0.3)] bg-[rgba(254,244,243,0.9)] text-[rgba(130,50,44,0.88)]"
              }`}
            >
              {result.correct ? (
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
              {result.correct ? "Correct" : "Incorrect"}
            </span>
            {!result.correct && (
              <span className="text-[11px] text-muted">
                Correct:{" "}
                <strong
                  className="font-mono font-bold"
                  style={{ color: "rgba(42,96,62,0.9)" }}
                >
                  {result.correctAnswer.toUpperCase()}
                </strong>
              </span>
            )}
            <span className="ml-auto text-[10px] font-mono tracking-[0.12em] uppercase" style={{ color: "rgba(84,106,112,0.5)" }}>
              ◈ rationale
            </span>
          </div>

          {/* ── Primary rationale text ──────────────────────────── */}
          <p className="mb-4 text-sm leading-[1.76] text-dark">{result.rationale}</p>

          {/* ── Clinical data panel (visual rationale + takeaway) ── */}
          {(teachingVisual || teachingTakeaway) && (
            <div
              className="mt-4 rounded-[14px] border p-4"
              style={{
                borderColor: visualTheme?.border ?? "rgba(80,108,120,0.18)",
                background: `linear-gradient(160deg, rgba(248,250,250,0.98), rgba(238,244,243,0.88))`,
                boxShadow: visualTheme
                  ? `inset 3px 0 0 ${visualTheme.border}, 0 1px 8px rgba(40,60,65,0.04)`
                  : "0 1px 8px rgba(40,60,65,0.04)",
              }}
            >
              {teachingVisual && (
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p
                        className="inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.32em]"
                        style={{
                          background: visualTheme?.chip ?? "rgba(80,108,120,0.08)",
                          color: visualTheme?.arrow ?? "#506c78",
                        }}
                      >
                        {teachingVisual.type} analysis
                      </p>
                      <p className="mt-1.5 text-sm font-semibold text-dark">{teachingVisual.title}</p>
                    </div>
                    <div
                      className="h-9 w-9 shrink-0 rounded-full border"
                      style={{
                        borderColor: visualTheme?.border ?? "rgba(80,108,120,0.18)",
                        background: `radial-gradient(circle at 38% 38%, ${visualTheme?.glow ?? "rgba(80,108,120,0.16)"}, rgba(80,108,120,0.02) 70%)`,
                      }}
                    />
                  </div>

                  {teachingVisual.caption && (
                    <p className="text-[13px] leading-relaxed text-muted">{teachingVisual.caption}</p>
                  )}

                  {teachingVisual.metrics && teachingVisual.metrics.length > 0 && (
                    <div className="grid gap-2 sm:grid-cols-3">
                      {teachingVisual.metrics.map((metric) => (
                        <div
                          key={`${metric.label}-${metric.value}`}
                          className="rounded-[10px] border px-3 py-2"
                          style={{
                            borderColor: visualTheme?.border ?? "rgba(80,108,120,0.14)",
                            background: "rgba(255,255,255,0.82)",
                          }}
                        >
                          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.24em] text-muted">{metric.label}</p>
                          <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-dark">
                            <span>{metric.value}</span>
                            {metric.direction ? (
                              <span
                                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em]"
                                style={{
                                  background: visualTheme?.chip ?? "rgba(80,108,120,0.08)",
                                  color: visualTheme?.arrow ?? "#506c78",
                                }}
                              >
                                {metric.direction === "up" ? "↑" : metric.direction === "down" ? "↓" : "→"}
                                {" "}{metric.directionLabel ?? metric.direction}
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
                          className="rounded-[10px] border px-3 py-2"
                          style={{
                            borderColor: visualTheme?.border ?? "rgba(80,108,120,0.14)",
                            background: "rgba(255,255,255,0.72)",
                          }}
                        >
                          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.22em] text-muted">{node.label}</p>
                          <p className="mt-1 text-[13px] text-dark">{node.value}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {teachingVisual.conclusion && (
                    <p className="text-[13px] font-medium leading-relaxed text-dark">{teachingVisual.conclusion}</p>
                  )}
                </div>
              )}

              {teachingTakeaway && (
                <p
                  className={`${
                    teachingVisual ? "mt-3 border-t pt-3" : ""
                  } text-[13px] font-semibold text-dark`}
                  style={{ borderTopColor: "rgba(80,108,120,0.12)" }}
                >
                  {teachingTakeaway}
                </p>
              )}
            </div>
          )}

          {/* ── Distractor rationales ─────────────────────────── */}
          {Object.keys(displayRationales).length > 0 && (
            <div className="mt-4 space-y-2">
              <p
                className="font-mono text-[9px] font-bold uppercase tracking-[0.22em]"
                style={{ color: "rgba(84,106,112,0.62)" }}
              >
                ◈ why the other options are incorrect
              </p>
              {question.options
                .filter(opt => opt.id !== (question.correctOptionId ?? result.correctAnswer))
                .map(opt => {
                  const explanation = displayRationales[opt.id];
                  if (!explanation) return null;
                  return (
                    <div
                      key={opt.id}
                      className="flex gap-3 rounded-md border-l-2 py-2 pl-3 pr-3"
                      style={{
                        borderLeftColor: "rgba(166,132,88,0.44)",
                        background: "rgba(254,252,248,0.82)",
                        borderRadius: "0 10px 10px 0",
                      }}
                    >
                      <span
                        className="mt-0.5 shrink-0 font-mono text-[10px] font-bold uppercase"
                        style={{ color: "rgba(130,104,68,0.7)" }}
                      >
                        {opt.id}.
                      </span>
                      <div>
                        <p className="text-[12px] font-medium" style={{ color: "rgba(40,54,58,0.82)" }}>{opt.text}</p>
                        <p className="mt-0.5 text-[12px] leading-relaxed" style={{ color: "rgba(84,106,112,0.82)" }}>{explanation}</p>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* ── Concept notes accordion ──────────────────────── */}
          {question.conceptNotes && (
            <details className="mt-3">
              <summary
                className="cursor-pointer select-none list-none"
                style={{
                  padding: "0.6rem 1rem",
                  background: "rgba(242,249,250,0.92)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.68rem",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(52,78,84,0.82)",
                  borderRadius: "12px",
                  border: "1px solid rgba(96,138,148,0.18)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span>◈ Deeper Clinical Context</span>
                <span style={{ color: "rgba(68,118,132,0.7)", fontSize: "1rem", fontWeight: 300 }}>+</span>
              </summary>
              <div
                className="text-sm leading-relaxed"
                style={{
                  padding: "0.875rem 1rem",
                  color: "rgba(40,54,58,0.82)",
                  background: "rgba(248,252,252,0.88)",
                  borderRadius: "0 0 12px 12px",
                  border: "1px solid rgba(96,138,148,0.18)",
                  borderTop: "none",
                  marginTop: "-1px",
                }}
              >
                {Array.isArray(question.conceptNotes)
                  ? question.conceptNotes.map((note, i) => <p key={i} className={i > 0 ? "mt-2" : ""}>{note}</p>)
                  : question.conceptNotes}
              </div>
            </details>
          )}

          {/* ── Clinical references accordion ────────────────── */}
          <details className="mt-2">
            <summary
              className="cursor-pointer select-none list-none"
              style={{
                padding: "0.6rem 1rem",
                background: "rgba(242,249,250,0.92)",
                fontFamily: "var(--font-mono)",
                fontSize: "0.68rem",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "rgba(52,78,84,0.82)",
                borderRadius: "12px",
                border: "1px solid rgba(96,138,148,0.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>◈ Clinical References</span>
              <span style={{ color: "rgba(68,118,132,0.7)", fontSize: "1rem", fontWeight: 300 }}>+</span>
            </summary>
            <div
              style={{
                padding: "0.875rem 1rem",
                background: "rgba(248,252,252,0.88)",
                borderRadius: "0 0 12px 12px",
                border: "1px solid rgba(96,138,148,0.18)",
                borderTop: "none",
                marginTop: "-1px",
              }}
            >
              <ul className="space-y-1.5">
                {getCategoryReferences(question.category ?? question.topic).map((ref, i) => (
                  <li key={i} className="flex gap-2">
                    <span
                      className="mt-0.5 shrink-0 font-bold"
                      style={{ color: "rgba(68,118,132,0.76)", fontSize: "0.82rem" }}
                    >
                      ›
                    </span>
                    <span className="text-[12px] leading-relaxed" style={{ color: "rgba(84,106,112,0.82)" }}>{ref}</span>
                  </li>
                ))}
              </ul>
            </div>
          </details>

          <div className="mt-4 flex flex-wrap items-center gap-3 border-t pt-4" style={{ borderTopColor: "rgba(96,138,148,0.16)" }}>
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
