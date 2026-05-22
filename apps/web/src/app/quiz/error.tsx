"use client";

import { useEffect } from "react";

export default function QuizError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Quiz route error:", error);
  }, [error]);

  return (
    <main className="quiz-route-screen">
      <div className="quiz-terminal-app">
        <header className="quiz-terminal-header">
          <div>
            <p className="quiz-terminal-kicker">Clarity terminal</p>
            <p className="quiz-terminal-copy">Recovery state</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="quiz-chip">Session intact</span>
            <span className="quiz-chip quiz-chip-accent">Fallback active</span>
          </div>
        </header>

        <div className="quiz-terminal-body">
          <section className="quiz-terminal-state">
            <div className="quiz-terminal-panel quiz-terminal-panel-hero max-w-4xl">
              <span className="quiz-chip quiz-chip-accent">Practice center fallback</span>
              <h1 className="mt-5 font-serif text-[clamp(2.5rem,5vw,4.4rem)] leading-[0.88] text-[#f4ede0]">
                The study surface hit an issue.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[rgba(230,223,209,0.76)]">
                Your account session is still safe. Retry the terminal, jump back to the launch deck, or check plans while
                we keep the route stable.
              </p>

              {error?.message ? (
                <div className="quiz-terminal-alert mt-6">
                  <strong>Diagnostic</strong>
                  <p className="mt-2 text-sm leading-7 text-[rgba(232,224,211,0.76)]">{error.message}</p>
                </div>
              ) : null}

              <div className="mt-6 flex flex-wrap gap-3">
                <button type="button" onClick={() => reset()} className="quiz-terminal-toggle is-active">
                  Retry terminal
                </button>
                <a href="/quiz" className="quiz-terminal-link">
                  Return to launch
                </a>
                <a href="/upgrade" className="quiz-terminal-link">
                  View plans
                </a>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
