"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";
import styles from "./NewsletterOptIn.module.css";

export default function NewsletterOptIn({ nextPath = "/dashboard?welcome=1" }: { nextPath?: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [acceptedLegal, setAcceptedLegal] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);

    const form = new FormData(event.currentTarget);
    const newsletterOptIn = form.get("newsletterOptIn") === "on";
    const email = String(form.get("email") ?? "");

    if (!acceptedLegal) {
      setMessage("Agree to the Terms and Privacy Policy to create your account.");
      setPending(false);
      return;
    }

    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password: form.get("password"),
        newsletterOptIn,
        acceptedTerms: true,
        acceptedPrivacy: true,
        nextPath,
      }),
    });

    const payload = await response.json().catch(() => null) as null | {
      success?: boolean;
      data?: { redirectPath?: string; message?: string };
      error?: { message?: string };
    };

    if (!response.ok || !payload?.success) {
      setMessage(payload?.error?.message ?? "Signup is temporarily unavailable.");
      setPending(false);
      return;
    }

    trackEvent("signup_completed", { newsletter_optin: newsletterOptIn });
    if (newsletterOptIn) {
      trackEvent("newsletter_optin", { list: "qotd-daily" });
    }

    window.location.replace(payload.data?.redirectPath ?? nextPath);
  }

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <label className={styles.field}>
        <span>Email</span>
        <input name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
      </label>
      <label className={styles.field}>
        <span>Password</span>
        <input name="password" type="password" autoComplete="new-password" minLength={8} required />
      </label>
      <label className={styles.checkbox}>
        <input name="newsletterOptIn" type="checkbox" />
        <span>Optional: send me the Daily Question and study insights. Unsubscribe any time.</span>
      </label>
      <label className={styles.checkbox}>
        <input
          type="checkbox"
          checked={acceptedLegal}
          onChange={(event) => setAcceptedLegal(event.target.checked)}
          required
        />
        <span>
          I agree to the <a href="/terms" target="_blank" rel="noreferrer">Terms and Conditions</a> and{" "}
          <a href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>.
        </span>
      </label>
      <button className={styles.button} type="submit" disabled={pending}>
        {pending ? "Creating account..." : "Create account"}
      </button>
      {message ? <p className={styles.message}>{message}</p> : null}
    </form>
  );
}
