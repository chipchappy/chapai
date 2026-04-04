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
}: {
  priceId?: string;
  className: string;
  children: ReactNode;
  examTrack?: "ccrn" | "nclex";
  packageLabel?: string;
  checkoutMode?: "subscription" | "payment";
  unitAmount?: number;
  accessHours?: number;
  tier?: "free" | "trial" | "base" | "vip" | "unlimited";
  planCode?: string;
  entitlements?: string[];
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
                successUrl: `${window.location.origin}/success`,
                cancelUrl: `${window.location.origin}/upgrade`,
              }),
            });

            const payload = await response.json();
            if (!response.ok || !payload?.url) {
              throw new Error(payload?.error || "Checkout failed");
            }

            window.location.href = payload.url;
          } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Checkout failed");
          } finally {
            setIsLoading(false);
          }
        }}
      >
        {isLoading ? "Loading..." : children}
      </button>
      {errorMessage ? <p className="text-sm text-[rgba(144,72,52,0.9)]">{errorMessage}</p> : null}
    </div>
  );
}
