"use client";

import { useEffect, useMemo, useState } from "react";

type ActivationState = "activating" | "ready" | "error";

function getSimulationHref(examSlug: "ccrn" | "nclex") {
  return examSlug === "ccrn"
    ? "/quiz?mode=practice-exam&practiceExam=ccrn-sim-1"
    : "/quiz?mode=practice-exam&practiceExam=nclex-sim-1";
}

export default function SuccessActivationClient({
  sessionId,
  examSlug,
  examLabel,
  packageLabel,
  isCramPass,
  accessHours,
  initialDisplayLabel,
  initiallyUnlocked,
}: {
  sessionId?: string;
  examSlug: "ccrn" | "nclex";
  examLabel: string;
  packageLabel: string;
  isCramPass: boolean;
  accessHours: number;
  initialDisplayLabel: string | null;
  initiallyUnlocked: boolean;
}) {
  const [state, setState] = useState<ActivationState>(initiallyUnlocked ? "ready" : sessionId ? "activating" : "error");
  const [message, setMessage] = useState<string | null>(
    initiallyUnlocked ? initialDisplayLabel ?? "Premium access is already active in this browser." : null,
  );

  useEffect(() => {
    if (initiallyUnlocked || !sessionId) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch("/api/checkout/activate", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const payload = await response.json();

        if (!response.ok || !payload?.success) {
          throw new Error(payload?.error || "Could not activate your product access.");
        }

        if (!cancelled) {
          setState("ready");
          setMessage(payload.data?.displayLabel ?? "Premium access is active in this browser.");
        }
      } catch (error) {
        if (!cancelled) {
          setState("error");
          setMessage(error instanceof Error ? error.message : "Could not activate your product access.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initiallyUnlocked, sessionId]);

  const summary = useMemo(() => {
    if (isCramPass) {
      return `Your ${packageLabel} is active for the next ${accessHours} hours. Open the practice center while the premium study modes and tutor access are unlocked.`;
    }

    return `Your ${packageLabel} now unlocks the full Clarity practice center, including all 5 simulations, rich modes, and tutor access.`;
  }, [accessHours, isCramPass, packageLabel]);

  return (
    <div className="rounded-[30px] border border-[rgba(74,85,89,0.08)] bg-[rgba(255,252,247,0.94)] p-6 shadow-card md:p-7">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">Launch status</p>
      <h2 className="mt-3 font-serif text-[2.1rem] leading-[0.96] text-dark">
        {state === "activating" ? "Activating your access..." : state === "ready" ? "You're in." : "Activation needs attention."}
      </h2>
      <p className="mt-4 text-sm leading-7 text-muted">{summary}</p>

      <div className="mt-6 rounded-[22px] border border-[rgba(74,85,89,0.08)] bg-white/80 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">Browser unlock</p>
        <p className="mt-3 text-sm leading-7 text-dark">
          {state === "activating"
            ? "We are verifying your checkout with Stripe and setting your premium access in this browser."
            : message ?? "Premium access is ready."}
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <a href="/quiz" className="btn-primary">
          Open the practice center
        </a>
        <a href={getSimulationHref(examSlug)} className="btn-secondary">
          Launch {examLabel} Simulation 1
        </a>
      </div>

      {state === "error" ? (
        <div className="mt-5 rounded-[22px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          If this keeps happening, redeem your founder key on `/demo-access` and continue QA from the live product surface.
        </div>
      ) : null}
    </div>
  );
}
