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
    <section className="daily-question-band">
      <div className="daily-question-copy">
        <span className="section-label">Daily question list</span>
        <h3>{title}</h3>
        <p>{body}</p>
      </div>

      <form className="daily-question-form" onSubmit={handleSubmit}>
        <label className="daily-question-field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@hospital.org"
            required
          />
        </label>

        <label className="daily-question-field">
          <span>Role</span>
          <select value={role} onChange={(event) => setRole(event.target.value as typeof role)}>
            <option value="student">Student</option>
            <option value="icu-nurse">ICU nurse</option>
            <option value="educator">Educator</option>
            <option value="other">Other</option>
          </select>
        </label>

        <button type="submit" className="btn-primary" disabled={status === "saving"}>
          {status === "saving" ? "Saving..." : "Get the daily question"}
        </button>

        <small className={`daily-question-status daily-question-status-${status}`}>
          {message || "Simple, free, and designed to keep your study streak alive."}
        </small>
      </form>
    </section>
  );
}
