"use client";

interface CategoryResult {
  category: string;
  correct: number;
  total: number;
}

interface QuizResultsData {
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  categoryBreakdown: CategoryResult[];
  weakCategories: string[];
}

interface QuizResultsProps {
  results: QuizResultsData;
  onRetry: () => void;
  onReviewMissed: () => void;
  onNewQuiz: () => void;
  isAuthenticated: boolean;
  tier?: "free" | "plus" | "pro";
}

function ScoreRing({ score }: { score: number }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "#5a8a5e" : score >= 65 ? "#2e7d8c" : "#c74b3f";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#e5e3dc" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <span className="absolute text-2xl font-bold tracking-tight" style={{ color }}>
        {score}%
      </span>
    </div>
  );
}

export default function QuizResults({
  results,
  onRetry,
  onReviewMissed,
  onNewQuiz,
  isAuthenticated,
  tier = "free",
}: QuizResultsProps) {
  const passed = results.score >= 65;
  const atAccessLimit = !isAuthenticated || tier === "free";

  return (
    <div className="card p-6 text-center md:p-8">
      <div className="mb-8 flex flex-col items-center gap-4">
        <ScoreRing score={results.score} />
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-dark">
            {passed ? "Strong performance" : results.score >= 50 ? "On track - keep going" : "Keep studying - you'll get there"}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {results.correctAnswers} correct out of {results.totalQuestions} questions
          </p>
        </div>
      </div>

      {results.categoryBreakdown.length > 1 && (
        <div className="mb-8 text-left">
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-muted">Performance by category</p>
          <div className="space-y-3">
            {results.categoryBreakdown.map((cat) => {
              const pct = Math.round((cat.correct / cat.total) * 100);
              const isWeak = results.weakCategories.includes(cat.category);

              return (
                <div key={cat.category}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-medium text-dark">
                      {cat.category}
                      {isWeak ? (
                        <span className="rounded-full border border-terra-200 bg-terra-50 px-2 py-0.5 text-xs font-bold text-terra-600">
                          Focus here
                        </span>
                      ) : null}
                    </span>
                    <span className="text-xs font-semibold text-muted">
                      {cat.correct}/{cat.total}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${pct}%`,
                        background: isWeak ? "#d97757" : undefined,
                        transition: "width 0.6s ease",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mb-4 flex flex-col justify-center gap-3 sm:flex-row">
        <button onClick={onRetry} className="btn-secondary text-sm">
          Retry this set
        </button>
        <button onClick={onReviewMissed} className="btn-primary text-sm">
          Review missed
        </button>
        <button onClick={onNewQuiz} className="btn-secondary text-sm">
          New quiz
        </button>
      </div>

      {atAccessLimit && (
        <div className="mt-6 rounded-[20px] border border-[rgba(74,85,89,0.1)] bg-[linear-gradient(135deg,rgba(249,246,239,0.96),rgba(242,237,226,0.82))] p-5 text-left shadow-[0_10px_28px_rgba(52,48,41,0.05)]">
          <p className="mb-1 text-sm font-bold text-dark">Unlock the full live product</p>
          <p className="mb-3 text-xs leading-6 text-muted">
            Choose a focused 24-hour pass for NCLEX or CCRN, move into a full single-track base plan, or unlock
            both banks, 5 practice exams, AI tutor access, and advanced analytics with Dual Premium.
          </p>
          <div className="mb-4 grid gap-2 text-xs leading-6 text-muted sm:grid-cols-2">
            <span>NCLEX 24-hour access - $4.99</span>
            <span>CCRN 24-hour access - $4.99</span>
            <span>NCLEX or CCRN Base - $9.99/mo</span>
            <span>Dual Premium - $15.99/mo</span>
          </div>
          <a href="/upgrade" className="inline-flex items-center gap-2 rounded-full bg-[#4A5559] px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-[#394245]">
            View launch plans
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      )}
    </div>
  );
}
