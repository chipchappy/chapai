"use client";

import { useState } from "react";

export default function AuthMagicLinkForm({ nextPath = "/dashboard" }: { nextPath?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedLegal, setAcceptedLegal] = useState(false);
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
          if (!acceptedLegal) {
            throw new Error("You must agree to the Terms and Privacy Policy to continue.");
          }

          const response = await fetch("/api/auth/password-login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email,
              password,
              acceptedTerms: true,
              acceptedPrivacy: true,
              nextPath,
            }),
          });

          if (!response.ok) {
            const payload = await response.json().catch(() => null);
            const code = payload?.code || payload?.error?.code;
            if (code === "AUTH_UNAVAILABLE") {
              throw new Error("Sign-in is temporarily unavailable. Try again in a moment.");
            }
            throw new Error(payload?.error?.message || payload?.error || "Could not sign in.");
          }

          const payload = await response.json().catch(() => null);
          if (payload?.data?.redirectPath) {
            window.location.replace(payload.data.redirectPath);
            return;
          }
          setStatus("sent");
          setMessage(payload?.data?.message || "Signed in.");
        } catch (error) {
          setStatus("error");
          const message = error instanceof Error ? error.message : "Could not send sign-in link.";
          setMessage(message);
        }
      }}
    >
      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">Email address</span>
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 w-full rounded-[16px] border border-[rgba(74,85,89,0.12)] bg-white/92 px-4 py-3 text-base text-dark outline-none transition duration-200 focus:border-[#7E9D86] focus:ring-2 focus:ring-[rgba(126,157,134,0.16)]"
          placeholder="you@example.com"
        />
      </label>

      <label className="block">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">Password</span>
          <a
            href="/auth/forgot"
            className="text-[12px] font-semibold text-[var(--c-text-strong)] underline decoration-[var(--c-border-strong)] underline-offset-4 hover:text-[var(--c-gold-deep)]"
          >
            Forgot password?
          </a>
        </div>
        <input
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2 w-full rounded-[16px] border border-[rgba(74,85,89,0.12)] bg-white/92 px-4 py-3 text-base text-dark outline-none transition duration-200 focus:border-[#7E9D86] focus:ring-2 focus:ring-[rgba(126,157,134,0.16)]"
          placeholder="Your password"
        />
      </label>

      <label className="flex items-start gap-3 rounded-[16px] border border-[rgba(74,85,89,0.08)] bg-white/72 px-4 py-3 text-sm leading-6 text-muted">
        <input
          type="checkbox"
          checked={acceptedLegal}
          onChange={(event) => setAcceptedLegal(event.target.checked)}
          className="mt-1 h-4 w-4 rounded border-[rgba(74,85,89,0.28)] text-[#7E9D86] focus:ring-[#7E9D86]"
        />
        <span>
          By continuing, I agree to the{" "}
          <a className="font-semibold text-dark underline decoration-[rgba(32,30,34,0.22)] underline-offset-4" href="/terms" target="_blank" rel="noreferrer">
            Terms and Conditions
          </a>{" "}
          and{" "}
          <a className="font-semibold text-dark underline decoration-[rgba(32,30,34,0.22)] underline-offset-4" href="/privacy" target="_blank" rel="noreferrer">
            Privacy Policy
          </a>
          .
        </span>
      </label>

      <button
        type="submit"
        disabled={status === "sending"}
        className="inline-flex items-center justify-center rounded-[14px] bg-[#7E9D86] px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-[#6F8D76] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {status === "sending" ? "Signing in..." : "Sign in"}
      </button>

      {message ? (
        <p className={`text-sm ${status === "error" ? "text-[rgba(144,72,52,0.92)]" : "text-muted"}`}>
          {message}
        </p>
      ) : null}
    </form>
  );
}
