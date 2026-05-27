import type { Metadata } from "next";
import BrandMark from "@/components/brand/BrandMark";
import { getLaunchOffer } from "@/lib/launch-offers";
import { getServerAccessContext } from "@/lib/server-access";
import SuccessActivationClient from "./SuccessActivationClient";

export const metadata: Metadata = {
  title: "Your package is active",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams?: Promise<{ exam?: string; package?: string; plan?: string; access_hours?: string; session_id?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const { access: resolvedAccess, user } = await getServerAccessContext();
  const launchOffer = getLaunchOffer(params.plan ?? resolvedAccess.planCode);
  const examSlug = launchOffer?.examTrackScope === "ccrn"
    ? "ccrn"
    : launchOffer?.examTrackScope === "nclex"
      ? "nclex"
      : params.exam === "ccrn"
        ? "ccrn"
        : params.exam === "nclex"
          ? "nclex"
          : "nclex";
  const examLabel = examSlug.toUpperCase();
  const accessHours = launchOffer?.accessHours ?? Number(params.access_hours ?? 24);
  const packageLabel = params.package ?? launchOffer?.label ?? resolvedAccess.displayLabel ?? `${examLabel} access`;

  return (
    <main className="min-h-screen bg-bg px-4 py-10 md:py-14">
      <div className="mx-auto max-w-5xl">
        <section className="overflow-hidden rounded-[34px] border border-[rgba(74,85,89,0.08)] bg-[linear-gradient(135deg,rgba(247,242,233,0.98),rgba(241,245,241,0.94))] shadow-card">
          <div className="grid gap-8 px-6 py-6 md:px-8 md:py-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
            <div className="max-w-xl">
              <BrandMark />
              <div className="mt-6 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
                <span className="rounded-full border border-border bg-white/70 px-3 py-1">Checkout complete</span>
                <span className="rounded-full border border-border bg-white/70 px-3 py-1">{packageLabel}</span>
                {resolvedAccess.displayLabel ? (
                  <span className="rounded-full border border-border bg-white/70 px-3 py-1">{resolvedAccess.displayLabel}</span>
                ) : null}
              </div>
              <h1 className="mt-4 font-serif text-[clamp(2.9rem,6vw,4.6rem)] leading-[0.92] text-dark">
                Your product access is being prepared.
              </h1>
              <p className="mt-4 max-w-lg text-base leading-7 text-muted">
                This page now confirms the hosted entitlement attached to your account so paid access, demo access, and
                founder access all lead into the same working product surface.
              </p>
            </div>

            <SuccessActivationClient
              sessionId={params.session_id}
              examSlug={examSlug}
              examLabel={examLabel}
              planCode={launchOffer?.planCode ?? resolvedAccess.planCode}
              packageLabel={packageLabel}
              accessHours={accessHours}
              practiceExamLimit={launchOffer?.practiceExamLimit ?? resolvedAccess.practiceExamLimit}
              canUseTutor={launchOffer?.canUseTutor ?? resolvedAccess.canUseTutor}
              canUseIcuSimBeta={launchOffer?.canUseIcuSimBeta ?? resolvedAccess.canUseIcuSimBeta}
              userEmail={user?.email ?? null}
              initialDisplayLabel={resolvedAccess.displayLabel}
              initiallyUnlocked={resolvedAccess.tier !== "free"}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
