"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { LaunchPlanCode } from "@/lib/launch-offers";

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
  planCode,
  packageLabel,
  accessHours,
  practiceExamLimit,
  canUseTutor,
  canUseIcuSimBeta,
  userEmail,
  initialDisplayLabel,
  initiallyUnlocked,
}: {
  sessionId?: string;
  examSlug: "ccrn" | "nclex";
  examLabel: string;
  planCode: LaunchPlanCode | string | null;
  packageLabel: string;
  accessHours: number;
  practiceExamLimit: number;
  canUseTutor: boolean;
  canUseIcuSimBeta: boolean;
  userEmail: string | null;
  initialDisplayLabel: string | null;
  initiallyUnlocked: boolean;
}) {
  const [state, setState] = useState<ActivationState>(initiallyUnlocked ? "ready" : sessionId ? "activating" : "error");
  const [message, setMessage] = useState<string | null>(
    initiallyUnlocked ? initialDisplayLabel ?? "Premium access is already active on this account." : null,
  );
  const pollAttemptsRef = useRef(0);

  useEffect(() => {
    if (initiallyUnlocked || !sessionId) {
      return;
    }

    let cancelled = false;
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

    const checkActivation = async () => {
      try {
        const response = await fetch("/api/checkout/activate", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const payload = await response.json();

        if (response.status === 401 && payload?.details?.loginUrl) {
          window.location.href = payload.details.loginUrl;
          return;
        }

        if (!response.ok || !payload?.success) {
          throw new Error(payload?.error || "Could not activate your product access.");
        }

        if (payload?.data?.status === "pending") {
          if (!cancelled) {
            setState("activating");
            setMessage("Payment is confirmed. We are waiting for the hosted entitlement to finish syncing to your account.");
          }

          pollAttemptsRef.current += 1;
          if (!cancelled && pollAttemptsRef.current < 20) {
            timeoutHandle = setTimeout(() => {
              void checkActivation();
            }, 1500);
            return;
          }

          if (!cancelled) {
            setState("error");
            setMessage("Payment succeeded, but account activation is still pending. Please refresh or check the billing page in a moment.");
          }
          return;
        }

        if (!cancelled) {
          setState("ready");
          setMessage(payload.data?.displayLabel ?? "Premium access is active on this account.");
        }
      } catch (error) {
        if (!cancelled) {
          setState("error");
          setMessage(error instanceof Error ? error.message : "Could not activate your product access.");
        }
      }
    };

    void checkActivation();

    return () => {
      cancelled = true;
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    };
  }, [initiallyUnlocked, sessionId]);

  const summary = useMemo(() => {
    if (planCode === "all_access_monthly") {
      return "Your Dual Premium plan unlocks both question banks, all 5 practice exams, AI tutor support in the study flow, and advanced analytics.";
    }

    if (planCode === "nclex_base_monthly" || planCode === "ccrn_base_monthly") {
      return `Your ${packageLabel} unlocks the full ${examLabel} question bank, richer study modes, and ${practiceExamLimit} included practice exams.`;
    }

    if (planCode === "core_monthly") {
      return `Your ${packageLabel} keeps both tracks active, includes the full live qbank, richer study modes, and ${practiceExamLimit} total practice exams.`;
    }

    if (
      planCode === "nclex_24h_pass"
      || planCode === "ccrn_24h_pass"
      || planCode === "nclex_4day_pass"
      || planCode === "ccrn_4day_pass"
    ) {
      return `Your ${packageLabel} is active for the next ${accessHours} hours. It includes focused ${examLabel} access plus ${practiceExamLimit} practice exam for a fast sprint.`;
    }

    return `Your ${packageLabel} is now active on this account. Practice exam allowance: ${practiceExamLimit}. Tutor ${canUseTutor ? "included" : "not included"}. ICU beta ${canUseIcuSimBeta ? "included" : "not included"}.`;
  }, [accessHours, canUseIcuSimBeta, canUseTutor, examLabel, packageLabel, planCode, practiceExamLimit]);

  return (
    <div className="rounded-[30px] border border-[rgba(74,85,89,0.08)] bg-[rgba(255,252,247,0.94)] p-6 shadow-card md:p-7">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">Launch status</p>
      <h2 className="mt-3 font-serif text-[2.1rem] leading-[0.96] text-dark">
        {state === "activating" ? "Activating your access..." : state === "ready" ? "You're in." : "Activation needs attention."}
      </h2>
      <p className="mt-4 text-sm leading-7 text-muted">{summary}</p>
      {userEmail ? (
        <p className="mt-2 text-sm leading-7 text-muted">
          Signed in as <span className="font-semibold text-dark">{userEmail}</span>. Access will follow this hosted account.
        </p>
      ) : null}

      <div className="mt-6 rounded-[22px] border border-[rgba(74,85,89,0.08)] bg-white/80 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">Account access</p>
        <p className="mt-3 text-sm leading-7 text-dark">
          {state === "activating"
            ? "We are verifying your checkout with Stripe and finalizing your hosted entitlement."
            : message ?? "Premium access is ready on your account."}
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <a href="/quiz" className="btn-primary">
          Open the practice center
        </a>
        <a href={getSimulationHref(examSlug)} className="btn-secondary">
          Launch {examLabel} Simulation 1
        </a>
        <a href="/account/billing" className="btn-secondary">
          View billing status
        </a>
      </div>

      {state === "error" ? (
        <div className="mt-5 rounded-[22px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          If this keeps happening, use the billing page or founder access flow to confirm the hosted entitlement is present.
        </div>
      ) : null}
    </div>
  );
}
