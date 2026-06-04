"use client";

import { useState } from "react";

export default function StreakEmailToggle({ initialOptedOut }: { initialOptedOut: boolean }) {
  const [optedOut, setOptedOut] = useState(initialOptedOut);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function update(nextOptedOut: boolean) {
    setStatus("saving");
    setMessage(null);
    try {
      const response = await fetch("/api/account/streak-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optedOut: nextOptedOut }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Could not save");
      }
      setOptedOut(nextOptedOut);
      setStatus("saved");
      setMessage(nextOptedOut ? "Streak emails are off." : "Streak emails are on.");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Could not save");
    }
  }

  return (
    <div className="settings-row">
      <div className="settings-row__copy">
        <h3 className="settings-row__title">Streak protection emails</h3>
        <p className="settings-row__body">
          When your daily streak is at risk (5+ days, no activity in 22+ hours), we&apos;ll send one short
          email. Nothing else.
        </p>
      </div>
      <label className="settings-toggle">
        <input
          type="checkbox"
          checked={!optedOut}
          onChange={(event) => update(!event.target.checked)}
          disabled={status === "saving"}
          aria-label="Receive streak protection emails"
        />
        <span className="settings-toggle__track" />
        <span className="settings-toggle__label">{optedOut ? "Off" : "On"}</span>
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
