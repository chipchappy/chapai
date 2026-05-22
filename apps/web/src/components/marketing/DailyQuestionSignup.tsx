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
    <section className="mx-auto max-w-[1180px] rounded-[20px] border border-[rgba(95,99,101,0.12)] bg-[rgba(255,255,255,0.5)] px-6 py-7 md:px-8 md:py-8">
      <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
        <div className="max-w-[30rem]">
          <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.28em] text-[#6F6A63]">
            Daily question list
          </span>
          <h3 className="mt-4 text-[clamp(2rem,3.6vw,3.2rem)] leading-[0.98] tracking-[-0.05em] text-[#1E2328]">
            {title}
          </h3>
          <p className="mt-5 font-sans text-[1rem] leading-8 text-[#5E5C58]">{body}</p>
        </div>

        <form className="grid gap-4 md:grid-cols-[minmax(0,1.25fr)_minmax(12rem,0.85fr)_auto] md:items-end" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2">
            <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-[#767069]">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@hospital.org"
              required
              className="h-12 rounded-[12px] border border-[rgba(95,99,101,0.14)] bg-[rgba(255,255,255,0.86)] px-4 font-sans text-sm text-[#1E2328] outline-none transition duration-200 focus:border-[rgba(126,157,134,0.36)] focus:ring-2 focus:ring-[rgba(126,157,134,0.12)]"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-[#767069]">Role</span>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as typeof role)}
              className="h-12 rounded-[12px] border border-[rgba(95,99,101,0.14)] bg-[rgba(255,255,255,0.86)] px-4 font-sans text-sm text-[#1E2328] outline-none transition duration-200 focus:border-[rgba(126,157,134,0.36)] focus:ring-2 focus:ring-[rgba(126,157,134,0.12)]"
            >
              <option value="student">Student</option>
              <option value="icu-nurse">ICU nurse</option>
              <option value="educator">Educator</option>
              <option value="other">Other</option>
            </select>
          </label>

          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center rounded-[14px] bg-[#7E9D86] px-6 font-sans text-sm font-semibold text-white transition duration-200 hover:bg-[#6F8D76] disabled:opacity-50"
            disabled={status === "saving"}
          >
            {status === "saving" ? "Saving..." : "Get the daily question"}
          </button>
        </form>
      </div>

      <small className="mt-4 block font-sans text-xs leading-6 text-[#6D6A66]">
        {message || "Simple, free, and designed to keep your study streak alive."}
      </small>
    </section>
  );
}
