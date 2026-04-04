"use client";

interface QuizProgressProps {
  current: number;   // 1-based
  total: number;
  correct: number;
  exam: "nclex" | "ccrn";
  category?: string;
}

export default function QuizProgress({
  current,
  total,
  correct,
  exam,
  category,
}: QuizProgressProps) {
  const pct = Math.round(((current - 1) / total) * 100);

  return (
    <div className="mb-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-widest text-muted">
        <span className="text-teal-600">
          {exam === "ccrn" ? "CCRN" : "NCLEX"}
        </span>
        {category && (
          <>
            <span className="text-border">›</span>
            <span>{category}</span>
          </>
        )}
      </div>

      {/* Progress bar */}
      <div className="progress-bar mb-3">
        <div
          className="progress-fill transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Counter row */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-dark">
          Question{" "}
          <span className="text-teal-600">{current}</span>
          <span className="text-muted"> of {total}</span>
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-bold">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {correct} correct
        </span>
      </div>
    </div>
  );
}
