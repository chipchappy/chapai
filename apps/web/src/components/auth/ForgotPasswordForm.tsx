"use client";

import { useState } from "react";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="mt-8 space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();

        try {
          setStatus("sending");
          setMessage(null);

          const response = await fetch("/api/auth/forgot", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });
          const payload = await response.json().catch(() => null);

          if (!response.ok) {
            const code = payload?.error?.code;
            if (code === "AUTH_UNAVAILABLE") {
              throw new Error("Password reset is temporarily unavailable. Try again in a moment.");
            }
            throw new Error(payload?.error?.message || "Could not send reset link.");
          }

          setStatus("sent");
          setMessage(
            payload?.data?.message ||
              "If an account exists for that email, we sent a password reset link. Check your inbox.",
          );
        } catch (error) {
          setStatus("error");
          setMessage(error instanceof Error ? error.message : "Could not send reset link.");
        }
      }}
    >
      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--c-text-muted)]">
          Email address
        </span>
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 w-full rounded-[16px] border border-[var(--c-border-strong)] bg-[var(--c-bg-elevated)] px-4 py-3 text-base text-[var(--c-text-strong)] outline-none transition duration-200 focus:border-[var(--c-sage-deep)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--c-sage)_22%,transparent)]"
          placeholder="you@example.com"
          disabled={status === "sent"}
        />
      </label>

      <button
        type="submit"
        disabled={status === "sending" || status === "sent"}
        className="inline-flex items-center justify-center rounded-[14px] bg-[var(--c-sage-deep)] px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-[var(--c-sage-deep-hover)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {status === "sending" ? "Sending..." : status === "sent" ? "Link sent" : "Send reset link"}
      </button>

      {message ? (
        <p
          className={`text-sm leading-6 ${
            status === "error" ? "text-[var(--c-adobe)]" : "text-[var(--c-text-body)]"
          }`}
        >
          {message}
        </p>
      ) : null}

      <p className="pt-2 text-sm leading-6 text-[var(--c-text-muted)]">
        Remembered your password?{" "}
        <a
          href="/auth/login"
          className="font-semibold text-[var(--c-text-strong)] underline decoration-[var(--c-border-strong)] underline-offset-4 hover:text-[var(--c-gold-deep)]"
        >
          Back to sign in
        </a>
      </p>
    </form>
  );
}
