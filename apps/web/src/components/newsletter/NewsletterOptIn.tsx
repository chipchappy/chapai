"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";
import styles from "./NewsletterOptIn.module.css";

export default function NewsletterOptIn({ nextPath = "/dashboard?welcome=1" }: { nextPath?: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);

    const form = new FormData(event.currentTarget);
    const newsletterOptIn = form.get("newsletterOptIn") === "on";
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
        newsletterOptIn,
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

    window.location.assign(payload.data?.redirectPath ?? nextPath);
  }

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <label className={styles.field}>
        <span>Email</span>
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label className={styles.field}>
        <span>Password</span>
        <input name="password" type="password" autoComplete="new-password" minLength={8} required />
      </label>
      <label className={styles.checkbox}>
        <input name="newsletterOptIn" type="checkbox" defaultChecked />
        <span>Send me the Daily Question and study insights. Unsubscribe any time.</span>
      </label>
      <button className={styles.button} type="submit" disabled={pending}>
        {pending ? "Creating account..." : "Create account"}
      </button>
      {message ? <p className={styles.message}>{message}</p> : null}
    </form>
  );
}
