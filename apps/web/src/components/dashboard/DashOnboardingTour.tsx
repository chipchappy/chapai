"use client";

import { useEffect, useState } from "react";

// Bumped from v1 → v2 so existing students see the new tour once. v2 covers
// tutor follow-up, readiness comparison, and the share-streak button that
// shipped after v1.
const STORAGE_KEY = "clarity-dash-tour-completed-v2";
const LEGACY_STORAGE_KEYS = ["clarity-dash-tour-completed-v1"];

type Step = {
  selector: string;
  title: string;
  body: string;
};

const STEPS: Step[] = [
  {
    selector: ".dash-readiness",
    title: "Your readiness score",
    body: "Blends accuracy, volume, and category coverage into a single 0–100 number. Hit 70+ to be exam-ready.",
  },
  {
    selector: ".dash-share-streak",
    title: "Share your streak",
    body: "Once you're 3+ days in, share your milestone in one tap — opens TikTok / IG / iMessage on mobile, copies to clipboard on desktop.",
  },
  {
    selector: ".dash-card--next",
    title: "Your next best move",
    body: "Auto-tuned to your weakest category. One click to drill the exact area costing you the most points.",
  },
  {
    selector: ".dash-card--weak",
    title: "Weak areas",
    body: "Categories ranked by lowest accuracy. Each tile links straight to a focused drill — keep working these until the bars turn sage.",
  },
  {
    selector: ".dash-card--tutor",
    title: "AI tutor follow-up",
    body: "Last week's misses surface here with one-click tutor walk-through. Reinforce the why right when the question is still fresh.",
  },
  {
    selector: ".dash-card--comparison",
    title: "Readiness comparison",
    body: "Once you've taken 2+ readiness exams, this card shows your biggest category gains and losses across attempts.",
  },
  {
    selector: ".dash-card--mastery",
    title: "Mastery by category",
    body: "Track every NCLEX category. The faint vertical tick marks 70% — your readiness threshold. Cross it on each category and you're test-ready.",
  },
];

export default function DashOnboardingTour() {
  const [mounted, setMounted] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [active, setActive] = useState(false);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    setMounted(true);
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "1") return;
    } catch {
      // ignore
    }
    // Delay so the dashboard has finished laying out before we measure.
    const id = setTimeout(() => setActive(true), 600);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!active) return;
    const step = STEPS[stepIndex];
    if (!step) return;
    const target = document.querySelector(step.selector);
    if (!target) {
      // Skip steps whose target isn't present (e.g., empty dashboard)
      if (stepIndex < STEPS.length - 1) {
        setStepIndex((i) => i + 1);
      } else {
        finish();
      }
      return;
    }
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    const measure = () => setHighlightRect((target as HTMLElement).getBoundingClientRect());
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [active, stepIndex]);

  function finish() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
      // Clean up legacy keys so localStorage doesn't accumulate stale flags.
      for (const legacy of LEGACY_STORAGE_KEYS) {
        try { window.localStorage.removeItem(legacy); } catch { /* ignore */ }
      }
    } catch {
      // ignore
    }
    setActive(false);
  }

  function next() {
    if (stepIndex < STEPS.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      finish();
    }
  }

  function back() {
    if (stepIndex > 0) setStepIndex((i) => i - 1);
  }

  if (!mounted || !active) return null;

  const step = STEPS[stepIndex];
  const padding = 12;
  const rect = highlightRect;

  return (
    <div className="dash-tour" role="dialog" aria-modal="true" aria-labelledby="dash-tour-title">
      <div className="dash-tour__backdrop" onClick={finish} />
      {rect ? (
        <div
          className="dash-tour__spotlight"
          style={{
            top: rect.top - padding,
            left: rect.left - padding,
            width: rect.width + padding * 2,
            height: rect.height + padding * 2,
          }}
        />
      ) : null}
      <div className="dash-tour__card" role="document">
        <span className="dash-tour__progress">
          Step {stepIndex + 1} of {STEPS.length}
        </span>
        <h3 id="dash-tour-title" className="dash-tour__title">{step.title}</h3>
        <p className="dash-tour__body">{step.body}</p>
        <div className="dash-tour__actions">
          <button type="button" onClick={finish} className="dash-tour__skip">
            Skip tour
          </button>
          <div className="dash-tour__nav">
            {stepIndex > 0 ? (
              <button type="button" onClick={back} className="dash-tour__back">
                Back
              </button>
            ) : null}
            <button type="button" onClick={next} className="dash-tour__next">
              {stepIndex === STEPS.length - 1 ? "Got it" : "Next →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
