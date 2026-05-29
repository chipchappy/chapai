"use client";

import { useEffect, useState } from "react";

type Toast = {
  id: string;
  kicker: string;
  title: string;
  body?: string;
  action?: { label: string; onClick: () => void };
  dismissLabel?: string;
};

type Props = {
  streakDays: number;
  totalAnswered: number;
  readinessExamCount: number;
  topCategoryAccuracy: { category: string; accuracy: number } | null;
};

const SEEN_PREFIX = "clarity-achievement-seen:";
const STREAK_OPT_IN_KEY = "clarity-streak-opt-prompt-seen";

function hasSeen(key: string): boolean {
  try {
    return window.localStorage.getItem(SEEN_PREFIX + key) === "1";
  } catch {
    return false;
  }
}

function markSeen(key: string) {
  try {
    window.localStorage.setItem(SEEN_PREFIX + key, "1");
  } catch {
    // ignore
  }
  // Mirror to D1 so the dashboard can later surface a milestone history that
  // survives a localStorage clear or a device switch. Fire-and-forget; the
  // client-side flag is the source of truth for "should I show this toast?".
  if (typeof fetch !== "undefined") {
    fetch("/api/account/achievement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ achievementKey: key }),
      keepalive: true,
    }).catch(() => undefined);
  }
}

export default function DashAchievementToasts({
  streakDays,
  totalAnswered,
  readinessExamCount,
  topCategoryAccuracy,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    setMounted(true);
    const queue: Toast[] = [];

    // Achievement 1: first time crossing 100 questions
    if (totalAnswered >= 100 && !hasSeen("100-questions")) {
      queue.push({
        id: "100-questions",
        kicker: "Milestone",
        title: "100 questions in the bank. 🎯",
        body: "Your dashboard recommendations are getting sharper with every answer.",
      });
      markSeen("100-questions");
    }

    // Achievement 2: first category over 70%
    if (
      topCategoryAccuracy &&
      topCategoryAccuracy.accuracy >= 70 &&
      !hasSeen(`category-70:${topCategoryAccuracy.category}`)
    ) {
      const label = topCategoryAccuracy.category
        .split(/[-_]/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      queue.push({
        id: `category-70:${topCategoryAccuracy.category}`,
        kicker: "Readiness threshold cleared",
        title: `${label} just crossed 70%. ✓`,
        body: "That's the line where the NCLEX blueprint considers you exam-ready on this category.",
      });
      markSeen(`category-70:${topCategoryAccuracy.category}`);
    }

    // Streak milestones at 7 / 14 / 30 days
    const streakMilestones: Array<{ days: number; key: string; title: string; body: string }> = [
      {
        days: 7,
        key: "streak-7",
        title: "🔥 7-day streak — one full week.",
        body: "Habit forming. Next checkpoint: 14.",
      },
      {
        days: 14,
        key: "streak-14",
        title: "🔥 14-day streak — two weeks in.",
        body: "The hard part's done. Most students who hit 14 days pass first attempt.",
      },
      {
        days: 30,
        key: "streak-30",
        title: "🔥 30-day streak — locked in.",
        body: "You're studying like a test-day pro. Share the milestone if you want — it motivates other students.",
      },
    ];
    for (const m of streakMilestones) {
      if (streakDays >= m.days && !hasSeen(m.key)) {
        queue.push({ id: m.key, kicker: "Streak milestone", title: m.title, body: m.body });
        markSeen(m.key);
      }
    }

    // Achievement 3: 5th readiness exam complete
    if (readinessExamCount >= 5 && !hasSeen("5-readiness-exams")) {
      queue.push({
        id: "5-readiness-exams",
        kicker: "All readiness exams done",
        title: "5 readiness exams complete. 🏆",
        body: "You've sampled the full blueprint multiple times. The Readiness comparison card shows where you've moved most.",
      });
      markSeen("5-readiness-exams");
    }

    // One-time streak-email opt-in prompt at 5 days
    if (streakDays >= 5) {
      try {
        if (window.localStorage.getItem(STREAK_OPT_IN_KEY) !== "1") {
          queue.push({
            id: "streak-opt-in",
            kicker: "Streak protection",
            title: `🔥 ${streakDays}-day streak — protect it?`,
            body: "We'll only email if your streak is about to break (5+ day streak, no activity in 22+ hours). One email max per risk window.",
            action: {
              label: "Keep streak emails on",
              onClick: () => {
                window.localStorage.setItem(STREAK_OPT_IN_KEY, "1");
              },
            },
            dismissLabel: "Not now",
          });
        }
      } catch {
        // ignore
      }
    }

    setToasts(queue);
  }, [streakDays, totalAnswered, readinessExamCount, topCategoryAccuracy]);

  if (!mounted || toasts.length === 0) return null;

  async function dismissToast(id: string) {
    const toast = toasts.find((t) => t.id === id);
    setToasts((prev) => prev.filter((t) => t.id !== id));

    if (id === "streak-opt-in") {
      try {
        window.localStorage.setItem(STREAK_OPT_IN_KEY, "1");
      } catch {
        // ignore
      }
      // Always record an explicit opt-out to the server when the user dismisses
      // the streak prompt without clicking the affirmative button.
      if (!toast?.action || (toast?.action && toast?.dismissLabel)) {
        try {
          await fetch("/api/account/streak-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ optedOut: true }),
          });
        } catch {
          // ignore — toast still dismisses
        }
      }
    }
  }

  return (
    <div className="dash-toasts" aria-live="polite" role="region">
      {toasts.map((toast, i) => (
        <div
          key={toast.id}
          className="dash-toast"
          style={{ animationDelay: `${i * 0.18}s` }}
          role="status"
        >
          <div className="dash-toast__copy">
            <span className="dash-toast__kicker">{toast.kicker}</span>
            <strong className="dash-toast__title">{toast.title}</strong>
            {toast.body ? <p className="dash-toast__body">{toast.body}</p> : null}
          </div>
          <div className="dash-toast__actions">
            {toast.action ? (
              <button
                type="button"
                className="dash-toast__btn dash-toast__btn--primary"
                onClick={() => {
                  toast.action?.onClick();
                  void dismissToast(toast.id);
                }}
              >
                {toast.action.label}
              </button>
            ) : null}
            <button
              type="button"
              className="dash-toast__btn"
              onClick={() => {
                void dismissToast(toast.id);
              }}
            >
              {toast.dismissLabel ?? "Got it"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
