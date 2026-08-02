"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { PassGuaranteeProgress } from "@/lib/pass-guarantee";

// ─────────────────────────────────────────────────────────────────────────────
// Pass Guarantee progress.
//
// Renders only for accounts holding the bundle. It exists so a student never has
// to guess whether they still qualify — the refund conditions are the same
// numbers shown here, read from the same source support reads when a claim
// arrives. Periwinkle matches the offer's treatment on the pricing pages.
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(unixSeconds: number | null) {
  if (!unixSeconds) return null;
  return new Date(unixSeconds * 1000).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

function Meter({ label, value, target, unit }: { label: string; value: number; target: number; unit: string }) {
  const pct = Math.min(100, Math.round((value / target) * 100));
  const done = value >= target;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[0.78rem] font-semibold text-[var(--c-text)]">{label}</span>
        <span className="text-[0.78rem] font-semibold tabular-nums text-[var(--c-text-muted)]">
          {value.toLocaleString()} / {target.toLocaleString()} {unit}
          {done ? <span className="ml-1.5 text-[#55578f]" aria-label="complete">&#10003;</span> : null}
        </span>
      </div>
      <div
        className="mt-1.5 h-2 overflow-hidden rounded-full bg-[rgba(109,111,181,0.16)]"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${pct}% complete`}
      >
        <div className="h-full rounded-full bg-[#6d6fb5] transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function PassGuaranteeCard() {
  const [progress, setProgress] = useState<PassGuaranteeProgress | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/pass-guarantee/status", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((body) => {
        if (!active) return;
        const data = body?.data ?? body;
        if (data && typeof data === "object" && data.enrolled) setProgress(data as PassGuaranteeProgress);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  // Accounts without the bundle render nothing at all.
  if (!progress?.enrolled) return null;

  const expires = formatDate(progress.accessExpiresAt);

  return (
    <section
      className="mb-6 rounded-[16px] border-2 border-[#6d6fb5] bg-[linear-gradient(180deg,rgba(109,111,181,0.09),var(--c-bg-elevated)_65%)] p-5"
      aria-labelledby="pass-guarantee-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="inline-flex rounded-full bg-[#6d6fb5] px-2.5 py-1 text-[0.7rem] font-bold text-white">
            Pass guarantee
          </span>
          <h2 id="pass-guarantee-heading" className="mt-2 font-serif text-[1.5rem] leading-tight text-[var(--c-text)]">
            {progress.completionMet ? "You've met the guarantee conditions." : "Your guarantee progress"}
          </h2>
        </div>
        <span className="text-[2rem] font-semibold tabular-nums text-[#55578f]">{progress.percentComplete}%</span>
      </div>

      <p className="mt-2 max-w-[52ch] text-[0.86rem] leading-6 text-[var(--c-text-muted)]">
        {progress.completionMet
          ? "You've completed everything the money-back guarantee requires. Finish strong — and if you don't pass, email us your official result letter within 30 days."
          : "Complete both of these before your test date to stay eligible for the money-back guarantee."}
      </p>

      <div className="mt-4 grid gap-3.5">
        <Meter
          label="Readiness exams completed"
          value={progress.readinessExamsCompleted}
          target={progress.readinessExamsRequired}
          unit="exams"
        />
        <Meter
          label="Unique practice questions answered"
          value={progress.uniqueQuestionsAnswered}
          target={progress.uniqueQuestionsRequired}
          unit="questions"
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        {!progress.completionMet ? (
          <Link
            href="/quiz"
            className="inline-flex rounded-[8px] bg-[#6d6fb5] px-4 py-2.5 text-[0.86rem] font-semibold text-white transition hover:bg-[#55578f]"
          >
            Keep practising
          </Link>
        ) : null}
        {expires ? (
          <p className="text-[0.76rem] text-[var(--c-text-muted)]">
            {progress.accessExpired ? "Access ended " : "Access runs through "}
            <strong className="font-semibold text-[var(--c-text)]">{expires}</strong>
          </p>
        ) : null}
        <Link href="/pricing#pledge" className="text-[0.76rem] underline decoration-dotted underline-offset-2 text-[var(--c-text-muted)] hover:text-[var(--c-text)]">
          Full guarantee terms
        </Link>
      </div>
    </section>
  );
}
