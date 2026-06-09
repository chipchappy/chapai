"use client";

import { useState } from "react";

type DailyQuestionSignupProps = {
  exam?: "ccrn" | "nclex" | "both";
  source: string;
  title?: string;
  body?: string;
};

export default function DailyQuestionSignup({
  exam = "both",
  source,
  title = "Get one sharp daily question by email.",
  body = "A fast daily question, cleaner rationale, and a soft route into the right package when you are ready.",
}: DailyQuestionSignupProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"student" | "icu-nurse" | "educator" | "other">(exam === "ccrn" ? "icu-nurse" : "student");
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setMessage("");

    try {
      const response = await fetch("/api/daily-question-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, exam, role, source }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !data.ok) {
        setStatus("error");
        setMessage(data.error || "Could not save your signup.");
        return;
      }

      setStatus("done");
      setMessage("You are in. Your first daily question will arrive in the next send wave.");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Could not save your signup.");
    }
  }

  return (
    <section className="daily-question-signup mx-auto max-w-[1180px] rounded-[36px] border border-[var(--c-border-soft)] bg-[var(--c-surface-glass)] px-6 py-8 backdrop-blur-md md:px-10 md:py-10">
      <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
        <div className="max-w-[30rem]">
          <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--c-text-muted)]">
            Daily question list
          </span>
          <h3 className="mt-4 text-[clamp(2rem,3.6vw,3.2rem)] leading-[0.98] tracking-[-0.05em] text-[var(--c-text-strong)]">
            {title}
          </h3>
          <p className="mt-5 font-sans text-[1rem] leading-8 text-[var(--c-text-body)]">{body}</p>
        </div>

        <form className="grid gap-4 md:grid-cols-[minmax(0,1.25fr)_minmax(12rem,0.85fr)_auto] md:items-end" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2">
            <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--c-text-muted)]">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@hospital.org"
              required
              className="h-12 rounded-[12px] border border-[var(--c-border-strong)] bg-[var(--c-bg-elevated)] px-4 font-sans text-sm text-[var(--c-text-strong)] outline-none transition duration-200 focus:border-[var(--c-sage-deep)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--c-sage)_22%,transparent)]"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--c-text-muted)]">Role</span>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as typeof role)}
              className="h-12 rounded-[12px] border border-[var(--c-border-strong)] bg-[var(--c-bg-elevated)] px-4 font-sans text-sm text-[var(--c-text-strong)] outline-none transition duration-200 focus:border-[var(--c-sage-deep)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--c-sage)_22%,transparent)]"
            >
              <option value="student">Student</option>
              <option value="icu-nurse">ICU nurse</option>
              <option value="educator">Educator</option>
              <option value="other">Other</option>
            </select>
          </label>

          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center rounded-[14px] bg-[var(--c-sage-deep)] px-6 font-sans text-sm font-semibold text-white transition duration-200 hover:bg-[var(--c-sage-deep-hover)] disabled:opacity-50"
            disabled={status === "saving"}
          >
            {status === "saving" ? "Saving..." : "Get the daily question"}
          </button>
        </form>
      </div>

      <small className="mt-4 block font-sans text-xs leading-6 text-[var(--c-text-muted)]">
        {message || "Simple, free, and designed to keep your study streak alive."}
      </small>
    </section>
  );
}
