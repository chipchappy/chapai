"use client";

import { useState } from "react";

// "Not sure where to start?" — 3 quick questions that resolve to an existing,
// smoke-covered deep link. Pure client state, no API, no new styles: reuses the
// terminal shell's toggle/chip classes. Full <a> navigation so the quiz shell
// re-initializes with the chosen params.

type Exam = "nclex" | "ccrn";
type Timeline = "soon" | "later" | "none";
type Need = "fundamentals" | "ngn" | "readiness" | "weak";

function recommend(exam: Exam, timeline: Timeline, need: Need) {
  if (exam === "ccrn") {
    return {
      href: "/quiz?exam=ccrn&mode=standard",
      title: "CCRN adaptive run",
      why: "Endless critical-care reps that auto-weight your weaker categories as you answer.",
    };
  }
  if (need === "readiness" || timeline === "soon") {
    return {
      href: "/quiz?mode=practice-exam&practiceExam=nclex-sim-1",
      title: "Timed readiness exam",
      why: timeline === "soon"
        ? "Your date is close — get a real readiness read first, then drill what it exposes."
        : "A timed, fixed-length simulation is the honest way to check test-day readiness.",
    };
  }
  if (need === "ngn") {
    return {
      href: "/quiz?exam=nclex&mode=ngn",
      title: "NGN focus set",
      why: "Matrix, ordering, bow-tie, and case-study reps — the formats that surprise people on test day.",
    };
  }
  if (need === "weak") {
    return {
      href: "/quiz?exam=nclex&mode=standard",
      title: "Adaptive endless run",
      why: "The unlimited deck auto-weights toward your weak categories and skips what you've seen.",
    };
  }
  return {
    href: "/quiz?exam=nclex&mode=standard",
    title: "Adaptive endless run",
    why: "Start stacking clean reps with full rationales — the bank adapts as you answer.",
  };
}

const STEPS: Array<{ key: "exam" | "timeline" | "need"; label: string; options: Array<{ value: string; label: string }> }> = [
  { key: "exam", label: "Which exam?", options: [
    { value: "nclex", label: "NCLEX" },
    { value: "ccrn", label: "CCRN" },
  ] },
  { key: "timeline", label: "When do you test?", options: [
    { value: "soon", label: "Under 4 weeks" },
    { value: "later", label: "1–3 months" },
    { value: "none", label: "No date yet" },
  ] },
  { key: "need", label: "What do you need most?", options: [
    { value: "fundamentals", label: "Build fundamentals" },
    { value: "ngn", label: "NGN formats" },
    { value: "weak", label: "Fix weak spots" },
    { value: "readiness", label: "Test-day readiness" },
  ] },
];

export default function StartHerePicker() {
  const [open, setOpen] = useState(false);
  const [picks, setPicks] = useState<Record<string, string>>({});
  const done = STEPS.every((step) => picks[step.key]);
  const rec = done ? recommend(picks.exam as Exam, picks.timeline as Timeline, picks.need as Need) : null;

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="quiz-terminal-toggle mt-4">
        Not sure where to start? 3 quick questions
      </button>
    );
  }

  return (
    <div className="mt-4 rounded-[14px] border border-[rgba(148,163,184,0.22)] p-4" data-testid="start-here-picker">
      <div className="flex items-center justify-between gap-3">
        <p className="quiz-terminal-kicker">Start here</p>
        <button type="button" onClick={() => { setOpen(false); setPicks({}); }} className="text-xs text-[var(--quiz-muted)] hover:text-[var(--quiz-ink-strong)]">
          Close
        </button>
      </div>
      <div className="mt-3 space-y-3">
        {STEPS.map((step) => (
          <div key={step.key}>
            <p className="text-xs text-[var(--quiz-muted)]">{step.label}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {step.options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPicks((prev) => ({ ...prev, [step.key]: option.value }))}
                  className={`quiz-terminal-toggle ${picks[step.key] === option.value ? "is-active" : ""}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {rec ? (
        <div className="mt-4 rounded-[12px] border border-[rgba(148,163,184,0.22)] p-3">
          <p className="text-sm font-semibold text-[var(--quiz-ink-strong)]">{rec.title}</p>
          <p className="mt-1 text-xs leading-5 text-[var(--quiz-muted)]">{rec.why}</p>
          <a href={rec.href} className="quiz-terminal-toggle is-active mt-3 inline-flex" data-testid="start-here-launch">
            Start this &rarr;
          </a>
        </div>
      ) : null}
    </div>
  );
}
