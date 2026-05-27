"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

interface Q {
  id: string;
  prompt: string;
  options: Array<{ label: string; weight: number }>;
}

const QUESTIONS: Q[] = [
  {
    id: "volume",
    prompt: "How many NCLEX-style practice questions have you completed?",
    options: [
      { label: "Less than 500", weight: 2 },
      { label: "500 to 1,500", weight: 5 },
      { label: "1,500 to 2,500", weight: 8 },
      { label: "More than 2,500", weight: 10 },
    ],
  },
  {
    id: "rationale",
    prompt: "Do you review the rationale for every question, including the ones you got right?",
    options: [
      { label: "Rarely", weight: 1 },
      { label: "When I miss them", weight: 4 },
      { label: "Most of the time", weight: 7 },
      { label: "Every question, always", weight: 10 },
    ],
  },
  {
    id: "ngn",
    prompt: "How many NGN case studies have you done?",
    options: [
      { label: "Zero or unsure what NGN means", weight: 0 },
      { label: "1–10", weight: 4 },
      { label: "11–30", weight: 7 },
      { label: "More than 30", weight: 10 },
    ],
  },
  {
    id: "score",
    prompt: "What's your most recent 75-question practice exam score?",
    options: [
      { label: "Below 55% or haven't taken one", weight: 1 },
      { label: "55–64%", weight: 4 },
      { label: "65–74%", weight: 7 },
      { label: "75% or higher", weight: 10 },
    ],
  },
  {
    id: "weakareas",
    prompt: "Have you identified your 2–3 weakest content categories?",
    options: [
      { label: "No", weight: 1 },
      { label: "Kind of", weight: 4 },
      { label: "Yes, and I'm reviewing them now", weight: 8 },
      { label: "Yes, and my scores in them are climbing", weight: 10 },
    ],
  },
  {
    id: "pharm",
    prompt: "How confident are you with NCLEX pharmacology?",
    options: [
      { label: "Avoidant — it's my worst area", weight: 1 },
      { label: "Shaky — recognize drugs but mix up safety priorities", weight: 4 },
      { label: "Solid on classes and high-yield drugs", weight: 7 },
      { label: "Confident with mechanism, side effects, and antidotes", weight: 10 },
    ],
  },
  {
    id: "prio",
    prompt: "How confident are you with prioritization and delegation questions?",
    options: [
      { label: "Lost — I usually pick the wrong client", weight: 1 },
      { label: "Sometimes — I know ABC but second-guess myself", weight: 4 },
      { label: "Solid — I trust my framework most of the time", weight: 7 },
      { label: "Confident — I can name the priority cue out loud", weight: 10 },
    ],
  },
  {
    id: "sleep",
    prompt: "How many hours of sleep do you average?",
    options: [
      { label: "Less than 5", weight: 1 },
      { label: "5–6", weight: 4 },
      { label: "6–7", weight: 7 },
      { label: "7 or more", weight: 10 },
    ],
  },
  {
    id: "stress",
    prompt: "When you imagine test day, how do you feel?",
    options: [
      { label: "Panic — I shut down", weight: 2 },
      { label: "Anxious — I freeze on hard questions", weight: 4 },
      { label: "Nervous but functional", weight: 7 },
      { label: "Calm and ready", weight: 10 },
    ],
  },
  {
    id: "gap",
    prompt: "How long has it been since you graduated nursing school?",
    options: [
      { label: "Still in school", weight: 7 },
      { label: "Less than 2 months", weight: 10 },
      { label: "2–4 months", weight: 7 },
      { label: "Over 4 months", weight: 4 },
    ],
  },
  {
    id: "plan",
    prompt: "Do you have a written or app-based study plan you actually follow?",
    options: [
      { label: "No plan, studying as I feel", weight: 2 },
      { label: "Loose plan in my head", weight: 4 },
      { label: "Written plan, follow most days", weight: 7 },
      { label: "Structured plan with daily targets I hit", weight: 10 },
    ],
  },
  {
    id: "fullexam",
    prompt: "Have you completed at least one timed 75-question simulated exam?",
    options: [
      { label: "Not yet", weight: 2 },
      { label: "One", weight: 5 },
      { label: "2–3", weight: 8 },
      { label: "4 or more", weight: 10 },
    ],
  },
];

export default function ReadinessClient() {
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const score = useMemo(() => {
    const total = QUESTIONS.reduce((sum, q) => sum + (answers[q.id] ?? 0), 0);
    const maxPossible = QUESTIONS.length * 10;
    return Math.round((total / maxPossible) * 100);
  }, [answers]);

  const complete = Object.keys(answers).length === QUESTIONS.length;

  const verdict =
    score >= 85
      ? { label: "Strong readiness", tone: "sage", advice: "Book the test or keep your scheduled date. Maintain volume with light review for the final week." }
      : score >= 70
        ? { label: "Probable readiness with gaps", tone: "blue", advice: "Identify your two lowest factors and spend 1–2 weeks closing them before testing." }
        : score >= 55
          ? { label: "Uncertain — confirm with a full exam", tone: "gold", advice: "Take a full 75-question readiness exam to confirm. Consider rescheduling 2–4 weeks if scores stay low." }
          : { label: "Not ready yet", tone: "warning", advice: "Volume and rationale-review habits need to change. Reschedule and build a structured 6–8 week plan." };

  const toneClass =
    verdict.tone === "sage"
      ? "bg-[rgba(126,157,134,0.10)] border-[rgba(126,157,134,0.3)]"
      : verdict.tone === "blue"
        ? "bg-[rgba(90,127,136,0.10)] border-[rgba(90,127,136,0.3)]"
        : verdict.tone === "gold"
          ? "bg-[rgba(176,141,87,0.12)] border-[rgba(176,141,87,0.32)]"
          : "bg-[rgba(196,121,86,0.12)] border-[rgba(196,121,86,0.3)]";

  return (
    <div className="space-y-6">
      <ol className="space-y-5">
        {QUESTIONS.map((q, idx) => (
          <li
            key={q.id}
            className="rounded-[12px] border border-[var(--c-border)] bg-[var(--c-bg-elevated)] p-5"
          >
            <p className="text-base font-semibold">
              {idx + 1}. {q.prompt}
            </p>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {q.options.map((opt) => {
                const active = answers[q.id] === opt.weight;
                return (
                  <button
                    type="button"
                    key={opt.label}
                    onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.weight }))}
                    className={`text-left rounded-[8px] border px-4 py-3 text-sm transition ${active ? "border-[var(--c-gold)] bg-[rgba(176,141,87,0.12)]" : "border-[var(--c-border)] bg-white hover:border-[var(--c-gold)]"}`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ol>

      {complete ? (
        <section className={`rounded-[16px] border-2 p-6 ${toneClass}`}>
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em]">Your readiness estimate</div>
          <div className="mt-2 font-serif text-[clamp(3.5rem,6vw,5.5rem)] leading-none">{score}/100</div>
          <div className="mt-3 text-lg font-semibold">{verdict.label}</div>
          <p className="mt-3 text-base leading-7">{verdict.advice}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/auth/signup"
              className="inline-flex rounded-[8px] bg-[var(--c-sage-deep)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--c-sage-deep-hover)]"
            >
              Get a real readiness exam →
            </Link>
            <Link
              href="/free"
              className="inline-flex rounded-[8px] border border-[var(--c-border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--c-text)]"
            >
              Practice your weakest area
            </Link>
          </div>
        </section>
      ) : (
        <p className="text-sm text-[var(--c-text-muted)]">
          Answer all 12 questions to see your readiness score.
        </p>
      )}
    </div>
  );
}
