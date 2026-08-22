"use client";

import Link from "next/link";
import { findWeakAreaPrompt, type AnsweredRow } from "@/lib/weak-area-prompt";

// ─────────────────────────────────────────────────────────────────────────────
// Weak-area conversion.
//
// Fires once, right after a free-tier student sees their own weakest category
// from this session — the moment their motivation to fix it is highest. Every
// number here comes from lib/weak-area-prompt.ts, which already decided the
// claim is honest and clears the sample-size floor; this component only lays
// it out. Paying students never see it. Terra (warm terracotta) is this app's
// existing "focus here" signal, kept distinct from the periwinkle used by the
// Pass Guarantee progress card so the two upsells never look interchangeable.
// ─────────────────────────────────────────────────────────────────────────────

interface WeakAreaConversionProps {
  rows: readonly AnsweredRow[];
  tier: "free" | "plus" | "pro";
}

export default function WeakAreaConversion({ rows, tier }: WeakAreaConversionProps) {
  // Paying students already have everything this prompt is selling.
  if (tier !== "free") return null;

  const prompt = findWeakAreaPrompt(rows);
  if (!prompt) return null;

  return (
    <section
      aria-labelledby="weak-area-conversion-heading"
      className="rounded-[24px] border border-terra-200 bg-[linear-gradient(180deg,rgba(217,119,87,0.08),rgba(253,245,241,0.65)_65%)] p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="inline-flex rounded-full bg-terra-500 px-2.5 py-1 text-[0.7rem] font-bold text-white">
            From this session
          </span>
          <h2 id="weak-area-conversion-heading" className="mt-2 font-serif text-[1.35rem] leading-tight text-dark">
            {prompt.category}
          </h2>
        </div>
        <span className="text-[2rem] font-semibold leading-none tabular-nums text-terra-700">{prompt.accuracy}%</span>
      </div>

      <p className="mt-3 max-w-[56ch] text-[0.86rem] leading-6 text-muted">{prompt.message}</p>

      <p className="mt-3 max-w-[56ch] text-[0.82rem] leading-6 text-muted">
        The Pass Guarantee bundle unlocks the full question bank in every category, an AI tutor on every question,
        and all 5 timed readiness exams — with your money back if you complete the work and still don&rsquo;t pass.
      </p>

      <div className="mt-4">
        <Link
          href="/pricing#pledge"
          className="inline-flex items-center gap-2 rounded-full bg-terra-500 px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-terra-600"
        >
          See the Pass Guarantee
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </section>
  );
}
