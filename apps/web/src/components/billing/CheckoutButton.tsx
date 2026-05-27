"use client";

import { useState } from "react";
import type { ReactNode } from "react";

export default function CheckoutButton({
  priceId,
  className,
  children,
  examTrack,
  packageLabel,
  checkoutMode = "subscription",
  unitAmount,
  accessHours,
  tier,
  planCode,
  entitlements,
  requireAssent = true,
}: {
  priceId?: string;
  className: string;
  children: ReactNode;
  examTrack?: "ccrn" | "nclex";
  packageLabel?: string;
  checkoutMode?: "subscription" | "payment";
  unitAmount?: number;
  accessHours?: number;
  tier?: "plus" | "pro";
  planCode?: string;
  entitlements?: string[];
  requireAssent?: boolean;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const loadingLabel = checkoutMode === "payment" ? "Preparing secure checkout..." : "Opening secure checkout...";

  return (
    <div className="space-y-2">
      <button
        type="button"
        className={className}
        disabled={isLoading}
        onClick={async () => {
          try {
            setIsLoading(true);
            setErrorMessage(null);
            if (requireAssent && !acceptedLegal) {
              throw new Error("You must agree to the Terms and Privacy Policy to continue.");
            }
            const response = await fetch("/api/checkout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                priceId,
                examTrack,
                packageLabel,
                checkoutMode,
                unitAmount,
                accessHours,
                tier,
                planCode,
                entitlements,
                acceptedTerms: requireAssent ? acceptedLegal : true,
                acceptedPrivacy: requireAssent ? acceptedLegal : true,
                successUrl: `${window.location.origin}/success`,
                cancelUrl: `${window.location.origin}/upgrade`,
              }),
            });

            const payload = await response.json();
            if (response.status === 401 && payload?.code === "AUTH_REQUIRED" && payload?.details?.loginUrl) {
              window.location.href = payload.details.loginUrl;
              return;
            }

            if (!response.ok || !payload?.data?.url) {
              throw new Error(payload?.error || "Checkout failed");
            }

            window.location.href = payload.data.url;
          } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Checkout failed");
          } finally {
            setIsLoading(false);
          }
        }}
      >
        {isLoading ? loadingLabel : children}
      </button>
      {requireAssent ? (
        <label className="flex items-start gap-3 rounded-[14px] border border-[rgba(74,85,89,0.08)] bg-white/65 px-3 py-3 text-xs leading-6 text-[rgba(101,114,120,0.92)]">
          <input
            type="checkbox"
            checked={acceptedLegal}
            onChange={(event) => setAcceptedLegal(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-[rgba(74,85,89,0.28)] text-[#7E9D86] focus:ring-[#7E9D86]"
          />
          <span>
            I agree to the{" "}
            <a className="font-semibold text-dark underline decoration-[rgba(32,30,34,0.18)] underline-offset-4" href="/terms" target="_blank" rel="noreferrer">
              Terms
            </a>{" "}
            and{" "}
            <a className="font-semibold text-dark underline decoration-[rgba(32,30,34,0.18)] underline-offset-4" href="/privacy" target="_blank" rel="noreferrer">
              Privacy Policy
            </a>
            .
          </span>
        </label>
      ) : null}
      {errorMessage ? (
        <p className="text-sm text-[rgba(144,72,52,0.9)]">{errorMessage}</p>
      ) : (
        <p className="text-xs text-[rgba(101,114,120,0.88)]">Secure Stripe checkout. Access activates after payment confirms.</p>
      )}
    </div>
  );
}
