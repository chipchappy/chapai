"use client";

import { useState } from "react";

type Props = {
  streakDays: number;
  readinessScore: number;
  questionsAnswered: number;
  firstName: string | null;
};

function buildToken(payload: { d: number; s?: number; q?: number; n?: string }) {
  const json = JSON.stringify(payload);
  const b64 =
    typeof btoa === "function" ? btoa(json) : Buffer.from(json, "utf8").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export default function DashShareStreak({ streakDays, readinessScore, questionsAnswered, firstName }: Props) {
  const [status, setStatus] = useState<"idle" | "copied" | "shared">("idle");
  if (streakDays < 3) return null; // Only surface once the milestone feels real

  const token = buildToken({
    d: streakDays,
    s: readinessScore || undefined,
    q: questionsAnswered || undefined,
    n: firstName ? firstName.slice(0, 32) : undefined,
  });
  const url = `${typeof window !== "undefined" ? window.location.origin : "https://claritynclex.com"}/share/streak/${token}`;
  const shareText = `🔥 ${streakDays}-day NCLEX streak with Clarity Clinical Prep`;

  async function handleShare() {
    // Prefer Web Share API on mobile (TikTok, IG, iMessage one-tap). Fall back
    // to clipboard on desktop / unsupported browsers.
    type NavigatorWithShare = Navigator & {
      share?: (data: { title?: string; text?: string; url?: string }) => Promise<void>;
      canShare?: (data: { url?: string }) => boolean;
    };
    const nav = (typeof navigator !== "undefined" ? (navigator as NavigatorWithShare) : null);
    const payload = {
      title: "My NCLEX streak",
      text: shareText,
      url,
    };
    if (nav?.share && (!nav.canShare || nav.canShare({ url }))) {
      try {
        await nav.share(payload);
        setStatus("shared");
        setTimeout(() => setStatus("idle"), 2200);
        return;
      } catch (err) {
        // AbortError = user cancelled the picker; treat as no-op
        const name = (err as { name?: string } | null)?.name;
        if (name === "AbortError") return;
        // Otherwise fall through to clipboard fallback
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 2200);
    } catch {
      // last-resort: leave status idle
    }
  }

  const label =
    status === "shared"
      ? "Shared!"
      : status === "copied"
        ? "Link copied!"
        : `Share ${streakDays}-day streak`;

  function handleDownload() {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/api/share/streak/${token}/og`;
    const a = document.createElement("a");
    a.href = url;
    a.download = `clarity-${streakDays}-day-streak.svg`;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <div className="dash-share-streak">
      <button type="button" onClick={handleShare} className="dash-share-streak__btn" aria-live="polite">
        <span aria-hidden="true">🔥</span>
        {label}
      </button>
      <button
        type="button"
        onClick={handleDownload}
        className="dash-share-streak__download"
        aria-label="Download share card image"
        title="Download share card (SVG) — drop into IG Stories or TikTok"
      >
        ↓ Card
      </button>
    </div>
  );
}
