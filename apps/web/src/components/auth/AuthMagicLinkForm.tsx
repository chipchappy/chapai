"use client";

import { useState } from "react";

export default function AuthMagicLinkForm({ nextPath = "/account/billing" }: { nextPath?: string }) {
  const [email, setEmail] = useState("");
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

          const legalResponse = await fetch("/api/legal/accept", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email,
              source: "auth_login",
              acceptedTerms: true,
              acceptedPrivacy: true,
            }),
          });

          if (!legalResponse.ok) {
            const payload = await legalResponse.json().catch(() => null);
            throw new Error(payload?.error || "Could not record your policy acceptance.");
          }

          const response = await fetch("/api/auth/magic-link", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email,
              nextPath,
            }),
          });

          if (!response.ok) {
            const payload = await response.json().catch(() => null);
            const code = payload?.code;
            if (code === "AUTH_RATE_LIMITED") {
              throw new Error("A sign-in link was sent recently. Wait a minute, then try again.");
            }
            if (code === "AUTH_UNAVAILABLE") {
              throw new Error("Sign-in is temporarily unavailable. Try again in a moment.");
            }
            throw new Error(payload?.error || "Could not send sign-in link.");
          }

          const payload = await response.json().catch(() => null);
          if (payload?.data?.redirectPath) {
            window.location.href = payload.data.redirectPath;
            return;
          }
          if (payload?.data?.linkUrl) {
            window.location.href = payload.data.linkUrl;
            return;
          }

          setStatus("sent");
          setMessage(payload?.data?.message || "Check your email for the sign-in link.");
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
        {status === "sending" ? "Preparing secure sign-in..." : "Continue with secure sign-in"}
      </button>

      {message ? (
        <p className={`text-sm ${status === "error" ? "text-[rgba(144,72,52,0.92)]" : "text-muted"}`}>
          {message}
        </p>
      ) : null}
    </form>
  );
}
