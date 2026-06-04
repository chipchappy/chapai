"use client";

import { useState } from "react";

export default function QotdToggle({ initialSubscribed }: { initialSubscribed: boolean }) {
  const [subscribed, setSubscribed] = useState(initialSubscribed);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function update(next: boolean) {
    setStatus("saving");
    setMessage(null);
    try {
      const response = await fetch("/api/account/qotd-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscribed: next }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Could not save");
      }
      setSubscribed(next);
      setStatus("saved");
      setMessage(next ? "Subscribed to daily questions." : "Unsubscribed from daily questions.");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Could not save");
    }
  }

  return (
    <div className="settings-row">
      <div className="settings-row__copy">
        <h3 className="settings-row__title">Daily NCLEX question by email</h3>
        <p className="settings-row__body">
          One question + rationale every morning at 7am ET. Tap to answer in the practice center — perfect
          for keeping your streak alive in 5 minutes.
        </p>
      </div>
      <label className="settings-toggle">
        <input
          type="checkbox"
          checked={subscribed}
          onChange={(event) => update(event.target.checked)}
          disabled={status === "saving"}
          aria-label="Subscribe to the daily question email"
        />
        <span className="settings-toggle__track" />
        <span className="settings-toggle__label">{subscribed ? "On" : "Off"}</span>
      </label>
      {message ? (
        <p
          className={`settings-row__message ${status === "error" ? "settings-row__message--error" : ""}`}
          role="status"
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
