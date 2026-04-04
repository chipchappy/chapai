"use client";

import { useEffect } from "react";
import BrandMark from "@/components/brand/BrandMark";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global route error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-bg px-4 py-10 text-dark">
        <main className="mx-auto max-w-4xl">
          <section className="rounded-[34px] border border-[rgba(74,85,89,0.08)] bg-[linear-gradient(135deg,rgba(247,242,233,0.98),rgba(241,245,241,0.94))] p-6 shadow-card md:p-8">
            <BrandMark />
            <span className="mt-6 inline-flex rounded-full border border-border bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
              Launch-safe fallback
            </span>
            <h1 className="mt-4 font-serif text-[clamp(2.6rem,5vw,4.1rem)] leading-[0.92] text-dark">
              We hit a page error, but the site is still recoverable.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
              Clarity caught this issue before the page could fully fail. You can retry this screen or return to a stable
              launch surface below.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={() => reset()} className="btn-primary">
                Retry this page
              </button>
              <a href="/quiz" className="btn-secondary">
                Open practice center
              </a>
              <a href="/" className="btn-secondary">
                Return home
              </a>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
