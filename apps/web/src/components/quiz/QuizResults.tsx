"use client";

interface CategoryResult {
  category: string;
  correct: number;
  total: number;
}

interface QuizResultsData {
  totalQuestions: number;
  correctAnswers: number;
  score: number; // 0-100
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
      <span
        className="absolute text-2xl font-bold tracking-tight"
        style={{ color }}
      >
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
  const atFreeLimit = !isAuthenticated || tier === "free";

  return (
    <div className="card p-6 md:p-8 text-center">
      {/* Score */}
      <div className="flex flex-col items-center gap-4 mb-8">
        <ScoreRing score={results.score} />
        <div>
          <h2 className="text-2xl font-bold text-dark tracking-tight">
            {passed ? "Strong performance" : results.score >= 50 ? "On track — keep going" : "Keep studying — you'll get there"}
          </h2>
          <p className="text-muted mt-1 text-sm">
            {results.correctAnswers} correct out of {results.totalQuestions} questions
          </p>
        </div>
      </div>

      {/* Category breakdown */}
      {results.categoryBreakdown.length > 1 && (
        <div className="text-left mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-muted mb-4">
            Performance by category
          </p>
          <div className="space-y-3">
            {results.categoryBreakdown.map((cat) => {
              const pct = Math.round((cat.correct / cat.total) * 100);
              const isWeak = results.weakCategories.includes(cat.category);
              return (
                <div key={cat.category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-dark flex items-center gap-2">
                      {cat.category}
                      {isWeak && (
                        <span className="text-xs font-bold text-terra-600 bg-terra-50 border border-terra-200 px-2 py-0.5 rounded-full">
                          Focus here
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-muted font-semibold">
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

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
        <button onClick={onRetry} className="btn-secondary text-sm">
          Retry this set
        </button>
        <button onClick={onReviewMissed} className="btn-primary text-sm">
          Review missed →
        </button>
        <button onClick={onNewQuiz} className="btn-secondary text-sm">
          New quiz
        </button>
      </div>

      {/* Upsell for free users */}
      {atFreeLimit && (
        <div className="mt-6 p-4 rounded-xl bg-teal-50 border border-teal-200 text-left">
          <p className="text-sm font-bold text-teal-800 mb-1">
            Unlock AI tutor + spaced repetition
          </p>
          <p className="text-xs text-teal-700 mb-3">
            ChapAI Plus gives you AI-guided explanations after every question and a smart review queue that surfaces your weak spots automatically.
          </p>
          <a
            href="/upgrade"
            className="btn-terra text-sm inline-flex items-center gap-2"
          >
            Upgrade to Plus — $29/mo
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>
      )}
    </div>
  );
}
