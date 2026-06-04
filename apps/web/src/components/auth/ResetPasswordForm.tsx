"use client";

import { useState } from "react";

export default function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="mt-8 space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();

        if (password !== confirmPassword) {
          setStatus("error");
          setMessage("Passwords do not match.");
          return;
        }

        if (password.length < 8) {
          setStatus("error");
          setMessage("Password must be at least 8 characters.");
          return;
        }

        try {
          setStatus("saving");
          setMessage(null);

          const response = await fetch("/api/auth/reset", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password, confirmPassword }),
          });
          const payload = await response.json().catch(() => null);

          if (!response.ok) {
            const code = payload?.error?.code;
            if (code === "RESET_SESSION_MISSING") {
              throw new Error("Your reset session has expired. Request a fresh reset link.");
            }
            throw new Error(payload?.error?.message || "Could not update password.");
          }

          setStatus("done");
          setMessage(payload?.data?.message || "Password updated. Redirecting to sign in...");

          if (payload?.data?.redirectPath) {
            setTimeout(() => {
              window.location.replace(payload.data.redirectPath);
            }, 800);
          }
        } catch (error) {
          setStatus("error");
          setMessage(error instanceof Error ? error.message : "Could not update password.");
        }
      }}
    >
      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--c-text-muted)]">
          New password
        </span>
        <input
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2 w-full rounded-[16px] border border-[var(--c-border-strong)] bg-[var(--c-bg-elevated)] px-4 py-3 text-base text-[var(--c-text-strong)] outline-none transition duration-200 focus:border-[var(--c-sage-deep)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--c-sage)_22%,transparent)]"
          placeholder="At least 8 characters"
          disabled={status === "done"}
        />
      </label>

      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--c-text-muted)]">
          Confirm new password
        </span>
        <input
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="mt-2 w-full rounded-[16px] border border-[var(--c-border-strong)] bg-[var(--c-bg-elevated)] px-4 py-3 text-base text-[var(--c-text-strong)] outline-none transition duration-200 focus:border-[var(--c-sage-deep)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--c-sage)_22%,transparent)]"
          placeholder="Re-enter the new password"
          disabled={status === "done"}
        />
      </label>

      <button
        type="submit"
        disabled={status === "saving" || status === "done"}
        className="inline-flex items-center justify-center rounded-[14px] bg-[var(--c-sage-deep)] px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-[var(--c-sage-deep-hover)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {status === "saving" ? "Updating..." : status === "done" ? "Updated" : "Update password"}
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
    </form>
  );
}
