"use client";

import { useEffect, useState } from "react";
import { PRACTICE_STORAGE_KEY } from "@/lib/practice-session";

type ResumeSnapshot = {
  exam?: string;
  mode?: string;
  label?: string;
  currentIndex?: number;
  totalQuestions?: number;
  questions?: Array<{ id: string } | null> | null;
};

function readSnapshot(): ResumeSnapshot | null {
  try {
    const raw =
      window.localStorage.getItem(PRACTICE_STORAGE_KEY) ??
      window.sessionStorage.getItem(PRACTICE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Find session details inside the stored runtime snapshot
    const session = parsed?.session ?? parsed;
    if (!session || typeof session !== "object") return null;
    const total = session.questions?.length ?? session.totalQuestions ?? 0;
    const current = session.currentIndex ?? 0;
    // Finished sessions: skip
    if (total > 0 && current >= total) return null;
    if (!session.exam || !session.mode) return null;
    return {
      exam: session.exam,
      mode: session.mode,
      label: session.label,
      currentIndex: current,
      totalQuestions: total,
      questions: session.questions ?? null,
    };
  } catch {
    return null;
  }
}

export default function ResumeLastSession({ onResume }: { onResume: () => void }) {
  const [snapshot, setSnapshot] = useState<ResumeSnapshot | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSnapshot(readSnapshot());
  }, []);

  if (!mounted || !snapshot) return null;

  const progress = snapshot.totalQuestions
    ? Math.round(((snapshot.currentIndex ?? 0) / snapshot.totalQuestions) * 100)
    : 0;
  const remaining = (snapshot.totalQuestions ?? 0) - (snapshot.currentIndex ?? 0);
  const modeLabel = snapshot.mode?.replace(/[-_]/g, " ") ?? "session";
  const examLabel = snapshot.exam?.toUpperCase() ?? "";

  return (
    <aside className="quiz-resume" role="region" aria-label="Resume last session">
      <div className="quiz-resume__copy">
        <span className="quiz-resume__kicker">Pick up where you left off</span>
        <strong className="quiz-resume__title">
          {examLabel} {modeLabel} · question {(snapshot.currentIndex ?? 0) + 1} of {snapshot.totalQuestions}
        </strong>
        <div className="quiz-resume__track">
          <div className="quiz-resume__fill" style={{ width: `${Math.max(3, progress)}%` }} />
        </div>
        <span className="quiz-resume__meta">{remaining} question{remaining === 1 ? "" : "s"} left</span>
      </div>
      <button type="button" onClick={onResume} className="quiz-resume__cta">
        Resume →
      </button>
    </aside>
  );
}
