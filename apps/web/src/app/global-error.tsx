"use client";

import { useEffect } from "react";
import BrandMark from "@/components/brand/BrandMark";

export default function GlobalAppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global app error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-bg px-4 py-10 text-dark">
        <main className="mx-auto max-w-4xl">
          <section className="rounded-[34px] border border-[rgba(74,85,89,0.08)] bg-[linear-gradient(135deg,rgba(247,242,233,0.98),rgba(241,245,241,0.94))] p-6 shadow-card md:p-8">
            <BrandMark />
            <span className="mt-6 inline-flex rounded-full border border-border bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
              Global recovery
            </span>
            <h1 className="mt-4 font-serif text-[clamp(2.6rem,5vw,4.1rem)] leading-[0.92] text-dark">
              We hit a top-level app error, but the product can still recover.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
              This fallback protects the launch surface from a full blank-screen failure. Retry the app or jump back to a
              known-good page below.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={() => reset()} className="btn-primary">
                Retry app
              </button>
              <a href="/" className="btn-secondary">
                Return home
              </a>
              <a href="/quiz" className="btn-secondary">
                Open practice center
              </a>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
