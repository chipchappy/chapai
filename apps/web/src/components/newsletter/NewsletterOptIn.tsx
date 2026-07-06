"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";
import styles from "./NewsletterOptIn.module.css";

export default function NewsletterOptIn({ nextPath = "/study?welcome=1" }: { nextPath?: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [showKeyField, setShowKeyField] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);

    const form = new FormData(event.currentTarget);
    const newsletterOptIn = form.get("newsletterOptIn") === "on";
    const email = String(form.get("email") ?? "");
    const accessKey = String(form.get("accessKey") ?? "").trim();

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
        ...(accessKey ? { accessKey } : {}),
      }),
    });

    const payload = await response.json().catch(() => null) as null | {
      success?: boolean;
      data?: {
        redirectPath?: string;
        message?: string;
        trial?: { granted: boolean; message?: string; expiresAt?: string } | null;
      };
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

    const trial = payload.data?.trial;
    if (accessKey && trial) {
      if (trial.granted) {
        trackEvent("access_key_redeemed", { granted: true });
      } else {
        // Account was still created — surface the key issue and stop before redirect
        // so the student can retry the key from their account rather than lose the message.
        trackEvent("access_key_redeemed", { granted: false });
        setMessage(`Account created. ${trial.message ?? "That access key could not be applied."}`);
        setPending(false);
        window.setTimeout(() => window.location.replace(payload.data?.redirectPath ?? nextPath), 2600);
        return;
      }
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
      {showKeyField ? (
        <label className={styles.field}>
          <span>Access key <small style={{ opacity: 0.6 }}>(from your nursing program)</small></span>
          <input
            name="accessKey"
            type="text"
            autoComplete="off"
            autoCapitalize="characters"
            placeholder="CLARITY-SCHOOL-XXXX"
            data-testid="access-key-input"
          />
        </label>
      ) : (
        <button
          type="button"
          onClick={() => setShowKeyField(true)}
          data-testid="access-key-toggle"
          style={{ alignSelf: "flex-start", background: "none", border: 0, padding: 0, cursor: "pointer", textDecoration: "underline", color: "var(--c-sage-deep, #55715e)", fontSize: "0.85rem" }}
        >
          Have a school or trial access key?
        </button>
      )}
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
