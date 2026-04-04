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
    <main className="min-h-screen bg-bg px-4 py-10 md:py-12">
      <div className="mx-auto max-w-5xl">
        <section className="rounded-[34px] border border-[rgba(74,85,89,0.08)] bg-[linear-gradient(135deg,rgba(247,242,233,0.98),rgba(241,245,241,0.94))] p-6 shadow-card md:p-8">
          <span className="inline-flex rounded-full border border-border bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
            Practice center fallback
          </span>
          <h1 className="mt-4 font-serif text-[clamp(2.5rem,5vw,4rem)] leading-[0.94] text-dark">
            The study surface hit an issue.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
            Your broader site session is still intact. Retry the practice center or return to a stable launch page while
            we keep the experience steady.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={() => reset()} className="btn-primary">
              Retry practice center
            </button>
            <a href="/demo" className="btn-secondary">
              Open preview hub
            </a>
            <a href="/upgrade" className="btn-secondary">
              View plans
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
