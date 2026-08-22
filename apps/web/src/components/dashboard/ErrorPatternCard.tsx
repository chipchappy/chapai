"use client";

import { useEffect, useState } from "react";
import type { ErrorPattern } from "@/lib/error-patterns";

// Shows a student HOW they are getting questions wrong, not which subject is
// weak. Renders nothing at all when the diagnosis has no support: silence is
// the honest empty state, and an encouraging message here would read as "no
// problems found" when it means "not enough evidence yet".

type Payload = {
  patterns: ErrorPattern[];
  summary: string | null;
  analyzed: number;
};

export default function ErrorPatternCard() {
  const [data, setData] = useState<Payload | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/study/error-patterns")
      .then((response) => (response.ok ? response.json() : null))
      .then((body) => {
        if (cancelled || !body) return;
        setData((body.data ?? body) as Payload);
      })
      .catch(() => {/* fails soft: the card simply does not appear */});
    return () => { cancelled = true; };
  }, []);

  if (!data?.patterns?.length) return null;

  return (
    <section className="rounded-[22px] border border-[rgba(90,127,136,0.22)] bg-[linear-gradient(180deg,rgba(247,239,221,0.92),rgba(255,252,247,0.96))] p-5 md:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-serif text-[1.35rem] leading-tight text-dark">How you are missing them</h2>
        <span className="text-xs text-muted">from your last {data.analyzed} answers</span>
      </div>
      <p className="mt-1 text-sm leading-6 text-muted">
        Not which subject is weak — the reasoning step that keeps costing you marks.
      </p>

      <ul className="mt-4 flex flex-col gap-3">
        {data.patterns.map((pattern) => (
          <li
            key={pattern.id}
            className="rounded-[16px] border border-[rgba(196,121,86,0.26)] bg-[rgba(196,121,86,0.07)] p-4"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <strong className="text-[0.95rem] text-dark">{pattern.label}</strong>
              {/* The denominator rides with the number. "28 times" alone invites
                  a student to read a rare habit as a constant one. */}
              <span className="text-xs tabular-nums text-[#9b5e42]">
                {pattern.count} of {pattern.opportunities} chances · {Math.round(pattern.share * 100)}%
              </span>
            </div>
            <p className="mt-1.5 text-sm leading-6 text-muted">{pattern.advice}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
