"use client";

import { useEffect, useState } from "react";

export default function BookmarkButton({ id }: { id: string }) {
  const [bookmarked, setBookmarked] = useState<boolean | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [unauthed, setUnauthed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/drug-cards/${encodeURIComponent(id)}/bookmark`)
      .then((r) => r.json())
      .then((payload) => {
        if (cancelled) return;
        if (payload?.data?.signedIn === false) {
          setUnauthed(true);
          setBookmarked(false);
          return;
        }
        setBookmarked(Boolean(payload?.data?.bookmarked));
      })
      .catch(() => {
        if (!cancelled) setBookmarked(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function toggle() {
    if (unauthed) {
      window.location.href = `/auth/login?next=${encodeURIComponent(`/drug-cards/${id}`)}`;
      return;
    }
    setStatus("saving");
    try {
      const response = await fetch(`/api/drug-cards/${encodeURIComponent(id)}/bookmark`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: bookmarked ? "unbookmark" : "bookmark" }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Could not save");
      }
      setBookmarked(Boolean(payload?.data?.bookmarked));
      setStatus("idle");
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2200);
    }
  }

  const label = unauthed
    ? "Sign in to save"
    : bookmarked === null
      ? "Loading…"
      : bookmarked
        ? "★ Saved for review"
        : "☆ Save for spaced review";

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={status === "saving" || bookmarked === null}
      className={`drug-card__cta drug-card__cta--bookmark ${bookmarked ? "is-active" : ""}`}
      aria-pressed={Boolean(bookmarked)}
    >
      {status === "error" ? "Try again →" : label}
    </button>
  );
}
