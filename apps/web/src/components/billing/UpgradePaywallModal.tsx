"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { LAUNCH_OFFERS } from "@/lib/launch-offers";
import { FREE_LIMIT_CODES, FREE_QUESTION_LIMIT, type FreeLimitCode } from "@/lib/free-plan-limits";
import styles from "./UpgradePaywallModal.module.css";

export type PaywallReason = FreeLimitCode;

export type PaywallContext = {
  reason: PaywallReason;
  /** Server-supplied message; falls back to reason-specific copy. */
  message?: string | null;
  /** Practice-question meter, when the server sent one. */
  used?: number;
  limit?: number;
  /** Which track the student is studying, so we surface the relevant plans. */
  exam?: "nclex" | "ccrn";
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

function copyFor(context: PaywallContext) {
  const track = context.exam === "ccrn" ? "CCRN" : "NCLEX";

  if (context.reason === FREE_LIMIT_CODES.exam) {
    return {
      kicker: "Free exam complete",
      title: "You've finished your free readiness exam",
      subtitle:
        `That was a full-length, adaptive ${track} simulation — the same variable-length format as the real exam. ` +
        "Upgrade to sit the remaining simulations and keep your diagnostic breakdown across every attempt.",
    };
  }

  if (context.reason === FREE_LIMIT_CODES.premium) {
    return {
      kicker: "Premium simulation",
      title: "This simulation is part of the paid plans",
      subtitle:
        `Your first full-length ${track} readiness exam is free. The remaining simulations, the full reviewed ` +
        "question bank, and the AI tutor unlock with any plan below.",
    };
  }

  return {
    kicker: `${FREE_QUESTION_LIMIT} free questions complete`,
    title: "You've used your full free allowance",
    subtitle:
      `You worked through all ${FREE_QUESTION_LIMIT} free practice questions — real progress. ` +
      "Upgrade to keep going through the full reviewed bank, every readiness exam, and the AI tutor.",
  };
}

export default function UpgradePaywallModal({
  context,
  onClose,
}: {
  context: PaywallContext | null;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  const plans = useMemo(() => {
    if (!context) return [];
    const track = context.exam === "ccrn" ? "ccrn" : "nclex";
    // Show what this student can actually buy for their track, cheapest first,
    // so the entry price is the first thing they read.
    return LAUNCH_OFFERS.filter(
      (offer) =>
        offer.activeForSale &&
        (offer.examTrackScope === "all" || offer.examTrackScope === track),
    )
      .slice()
      .sort((a, b) => a.price - b.price);
  }, [context]);

  // The plan that unlocks every simulation for the lowest price is the one we
  // point at — it is the honest recommendation for someone who just ran out.
  const featuredPlanCode = useMemo(() => {
    const unlimited = plans.filter((offer) => offer.practiceExamLimit >= 5);
    if (unlimited.length > 0) {
      return unlimited.reduce((best, offer) => (offer.price < best.price ? offer : best)).planCode;
    }
    return plans.length > 0 ? plans[plans.length - 1].planCode : null;
  }, [plans]);

  const handleClose = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    if (!context) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    // Move focus into the dialog so keyboard and screen-reader users land here.
    const timer = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    }, 30);

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        handleClose();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;

      const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (node) => node.offsetParent !== null,
      );
      if (nodes.length === 0) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      window.clearTimeout(timer);
      restoreFocusRef.current?.focus?.();
    };
  }, [context, handleClose]);

  if (!context) return null;

  const { kicker, title, subtitle } = copyFor(context);
  const limit = context.limit ?? FREE_QUESTION_LIMIT;
  const used = Math.min(context.used ?? limit, limit);
  const showMeter = context.reason === FREE_LIMIT_CODES.questions;
  const pct = limit > 0 ? Math.round((used / limit) * 100) : 100;

  return (
    <div
      className={styles.overlay}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handleClose();
      }}
    >
      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="paywall-title"
        aria-describedby="paywall-subtitle"
      >
        <div className={styles.grabber} aria-hidden="true" />
        <button type="button" className={styles.close} onClick={handleClose} aria-label="Close">
          ×
        </button>

        <span className={styles.kicker}>{kicker}</span>
        <h2 id="paywall-title" className={styles.title}>
          {title}
        </h2>
        <p id="paywall-subtitle" className={styles.subtitle}>
          {context.message ?? subtitle}
        </p>

        {showMeter ? (
          <div className={styles.meter}>
            <div className={styles.meterRow}>
              <span className={styles.meterLabel}>Free practice questions</span>
              <span className={styles.meterValue}>
                {used.toLocaleString()} / {limit.toLocaleString()}
              </span>
            </div>
            <div
              className={styles.track}
              role="progressbar"
              aria-valuenow={used}
              aria-valuemin={0}
              aria-valuemax={limit}
              aria-label="Free practice questions used"
            >
              <div className={styles.fill} style={{ width: `${pct}%` }} />
            </div>
          </div>
        ) : null}

        <div className={styles.plans}>
          {plans.map((offer) => {
            const featured = offer.planCode === featuredPlanCode;
            const unit =
              offer.checkoutMode === "subscription"
                ? "per month"
                : offer.accessHours
                  ? `${Math.round(offer.accessHours / 24)}-day access`
                  : "one time";

            return (
              <a
                key={offer.planCode}
                className={`${styles.plan} ${featured ? styles.planFeatured : ""}`}
                href={`/upgrade?plan=${encodeURIComponent(offer.planCode)}`}
              >
                <span className={styles.planBody}>
                  <span className={styles.planHead}>
                    <span className={styles.planName}>{offer.label}</span>
                    {featured ? <span className={styles.badge}>Best value</span> : null}
                  </span>
                  <span className={styles.planDesc}>{offer.description}</span>
                </span>
                <span className={styles.planPrice}>
                  <span className={styles.priceAmount}>${offer.price}</span>
                  <span className={styles.priceUnit}>{unit}</span>
                </span>
              </a>
            );
          })}
        </div>

        <div className={styles.footer}>
          <a className={styles.compare} href="/upgrade">
            Compare every plan →
          </a>
          <p className={styles.reassure}>
            Secure Stripe checkout. Your answered questions, weak-area history, and progress stay on
            your account.
          </p>
          <button type="button" className={styles.dismiss} onClick={handleClose}>
            Not right now
          </button>
        </div>
      </div>
    </div>
  );
}
