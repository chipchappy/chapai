"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "clarity-test-date";
const TARGET_QUESTIONS = 2500;

function readStoredDate(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function saveStoredDate(date: string) {
  try {
    window.localStorage.setItem(STORAGE_KEY, date);
  } catch {
    // ignore
  }
}

function defaultDate() {
  const d = new Date();
  d.setDate(d.getDate() + 42);
  return d.toISOString().slice(0, 10);
}

export default function DashCountdownWidget({ totalAnswered }: { totalAnswered: number }) {
  const [mounted, setMounted] = useState(false);
  const [date, setDate] = useState<string>(defaultDate());
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    setMounted(true);
    const stored = readStoredDate();
    if (stored) setDate(stored);
    const id = setInterval(() => setNow(Date.now()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  function handleChange(next: string) {
    setDate(next);
    saveStoredDate(next);
  }

  const target = useMemo(() => new Date(`${date}T08:00:00`).getTime(), [date]);
  const remainingMs = Math.max(0, target - now);
  const days = Math.max(0, Math.floor(remainingMs / (1000 * 60 * 60 * 24)));
  const remaining = Math.max(0, TARGET_QUESTIONS - totalAnswered);
  const dailyTarget = days > 0 ? Math.ceil(remaining / days) : remaining > 0 ? remaining : 0;
  const intensity =
    days <= 0
      ? "Test day"
      : days <= 7
        ? "Critical — last-week mode"
        : days <= 21
          ? "High intensity"
          : days <= 42
            ? "On track"
            : days <= 70
              ? "Comfortable"
              : "Plan ahead";

  if (!mounted) {
    return (
      <div className="dash-countdown" aria-hidden="true">
        <div className="dash-countdown__skeleton" />
      </div>
    );
  }

  return (
    <div className="dash-countdown">
      <div className="dash-countdown__head">
        <span className="dash-eyebrow">Test-day countdown</span>
        <Link href="/tools/nclex-countdown" className="dash-countdown__link">
          Full tool →
        </Link>
      </div>
      <label className="dash-countdown__date-row">
        <span className="dash-countdown__date-label">Test date</span>
        <input
          type="date"
          value={date}
          min={new Date().toISOString().slice(0, 10)}
          onChange={(event) => handleChange(event.target.value)}
          className="dash-countdown__date-input"
        />
      </label>
      <div className="dash-countdown__numbers">
        <div className="dash-countdown__number">
          <strong>{days}</strong>
          <span>days</span>
        </div>
        <div className="dash-countdown__number">
          <strong>{dailyTarget || "—"}</strong>
          <span>q/day target</span>
        </div>
        <div className="dash-countdown__number dash-countdown__number--wide">
          <strong>{intensity}</strong>
          <span>intensity</span>
        </div>
      </div>
      <p className="dash-countdown__footnote">
        {totalAnswered.toLocaleString()} of {TARGET_QUESTIONS.toLocaleString()} questions answered. Target curve flattens past
        2,500 — that&apos;s the readiness sweet spot.
      </p>
    </div>
  );
}
