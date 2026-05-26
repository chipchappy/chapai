"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

function pad(n: number) {
  return String(Math.max(0, Math.floor(n))).padStart(2, "0");
}

export default function NclexCountdownClient() {
  const defaultDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 42);
    return d.toISOString().slice(0, 10);
  }, []);

  const [date, setDate] = useState<string>(defaultDate);
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const target = useMemo(() => new Date(`${date}T08:00:00`).getTime(), [date]);
  const remainingMs = Math.max(0, target - now);
  const days = remainingMs / (1000 * 60 * 60 * 24);
  const hours = (remainingMs / (1000 * 60 * 60)) % 24;
  const minutes = (remainingMs / (1000 * 60)) % 60;
  const seconds = (remainingMs / 1000) % 60;

  const dailyTarget = days > 0 ? Math.ceil(2500 / days) : 0;
  const weeksOut = days / 7;
  const intensity =
    days <= 0
      ? "Test day"
      : weeksOut <= 1
        ? "Critical — last-week mode"
        : weeksOut <= 3
          ? "High intensity — cram window"
          : weeksOut <= 6
            ? "On track — steady study"
            : weeksOut <= 10
              ? "Comfortable — build the habit"
              : "Plan ahead — light review";

  return (
    <div className="rounded-[16px] border border-[var(--c-border)] bg-[var(--c-bg-elevated)] p-6 md:p-8">
      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--c-text-muted)]">
          Your NCLEX-RN test date
        </span>
        <input
          type="date"
          value={date}
          min={new Date().toISOString().slice(0, 10)}
          onChange={(e) => setDate(e.target.value)}
          className="mt-2 w-full rounded-[12px] border border-[var(--c-border)] bg-white px-4 py-3 text-base outline-none focus:border-[var(--c-gold)]"
        />
      </label>

      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Days", value: pad(days) },
          { label: "Hours", value: pad(hours) },
          { label: "Minutes", value: pad(minutes) },
          { label: "Seconds", value: pad(seconds) },
        ].map((cell) => (
          <div
            key={cell.label}
            className="rounded-[12px] border border-[var(--c-border)] bg-white p-5 text-center"
          >
            <div className="font-serif text-[clamp(2.5rem,5vw,4rem)] leading-none text-[var(--c-text)]">
              {cell.value}
            </div>
            <div className="mt-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--c-text-muted)]">
              {cell.label}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-[12px] bg-[rgba(126,157,134,0.10)] p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--c-sage-deep)]">
            Daily question target
          </div>
          <div className="mt-2 font-serif text-3xl text-[var(--c-text)]">
            {dailyTarget > 0 ? `${dailyTarget} questions/day` : "—"}
          </div>
          <p className="mt-2 text-sm leading-6 text-[var(--c-text-muted)]">
            Based on a goal of 2,500 questions before test day.
          </p>
        </div>
        <div className="rounded-[12px] bg-[rgba(176,141,87,0.12)] p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--c-gold)]">
            Intensity level
          </div>
          <div className="mt-2 font-serif text-3xl text-[var(--c-text)]">{intensity}</div>
          <p className="mt-2 text-sm leading-6 text-[var(--c-text-muted)]">
            Your study plan should match this pace.
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/auth/signup"
          className="inline-flex rounded-[8px] bg-[var(--c-sage-deep)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--c-sage-deep-hover)]"
        >
          Start with 10 free questions today →
        </Link>
        <Link
          href="/free"
          className="inline-flex rounded-[8px] border border-[var(--c-border)] px-5 py-3 text-sm font-semibold text-[var(--c-text)]"
        >
          See all free practice
        </Link>
      </div>
    </div>
  );
}
