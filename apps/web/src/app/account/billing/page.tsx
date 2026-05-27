import { redirect } from "next/navigation";
import BrandMark from "@/components/brand/BrandMark";
import { getDB, hasDatabase, resolveEnv } from "@/lib/db";
import { getLatestBillingSnapshotForUser } from "@/lib/billing-store";
import { getServerAccessContext } from "@/lib/server-access";
import { logError } from "@/lib/logger";

export const dynamic = "force-dynamic";

function getPortalMessage(portal?: string) {
  switch (portal) {
    case "missing":
      return "We could not find a customer portal record for this subscription yet.";
    case "unavailable":
      return "The billing portal is not available for this access type yet.";
    case "error":
      return "We could not open the billing portal right now.";
    default:
      return null;
  }
}

function formatValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "n/a";
  }

  return String(value);
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams?: Promise<{ portal?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const { access, user } = await getServerAccessContext();
  const previewAccess = access.source === "founder-key" || access.source === "preview-key";

  if (!user && !previewAccess) {
    redirect("/auth/login?next=%2Faccount%2Fbilling");
  }

  let billing: Awaited<ReturnType<typeof getLatestBillingSnapshotForUser>> = null;
  const env = resolveEnv();
  if (hasDatabase(env)) {
    try {
      const db = getDB(env);
      if (user?.id) {
        billing = await getLatestBillingSnapshotForUser(db, {
          userId: user.id,
          email: user.email ?? null,
        });
      }
    } catch (error) {
      logError("Billing page snapshot lookup failed", error, {
        route: "/account/billing",
        userId: user?.id ?? "preview-access",
      });
    }
  }

  const portalMessage = getPortalMessage(params.portal);
  const portalUnavailable = access.source === "founder-key" || access.source === "preview-key";
  const accessRows = [
    ["Plan", access.displayLabel ?? billing?.plan_code ?? "Free access"],
    ["Plan code", access.planCode ?? billing?.plan_code ?? "n/a"],
    ["Track scope", access.examTrack ?? billing?.exam_track ?? "all"],
    ["Practice exams", access.practiceExamLimit > 0 ? `${access.practiceExamLimit} included` : "None"],
    ["Tutor", access.canUseTutor ? "Included" : "Not included"],
    ["ICU beta", access.canUseIcuSimBeta ? "Included" : "Not included"],
    ["Renews / expires", billing?.expires_at ? new Date(billing.expires_at).toLocaleString() : access.expiresAt ?? "n/a"],
    ["Status", billing?.status ?? access.source ?? "free"],
  ] as const;

  return (
    <main className="min-h-screen bg-bg px-4 py-10 md:px-6 md:py-14">
      <div className="mx-auto max-w-[960px]">
        <div className="rounded-[30px] border border-[rgba(74,85,89,0.08)] bg-[rgba(255,255,255,0.64)] p-6 shadow-[0_18px_44px_rgba(30,35,40,0.04)] md:p-8">
          <BrandMark />
          <div className="mt-6 max-w-[42rem]">
            <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">Billing</span>
            <h1 className="mt-4 font-serif text-[clamp(2.7rem,5vw,4.4rem)] leading-[0.94] tracking-[-0.05em] text-dark">
              Account access and subscription status.
            </h1>
            <p className="mt-4 text-base leading-7 text-muted">
              Billing is tied to your hosted account. Verified Stripe events update the access you carry across
              sessions and devices.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-[22px] border border-[rgba(74,85,89,0.08)] bg-white/72 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">Current plan</p>
              <p className="mt-3 text-2xl font-semibold text-dark">{access.displayLabel ?? "Free access"}</p>
              <p className="mt-2 text-sm leading-7 text-muted">
                {access.tier === "free"
                  ? `No active premium entitlement was found for ${user?.email ?? "this account"}.`
                  : `Plan code: ${formatValue(access.planCode)}. Entitlements: ${access.entitlements.join(", ")}`}
              </p>
            </div>

            <div className="rounded-[22px] border border-[rgba(74,85,89,0.08)] bg-white/72 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">Subscription snapshot</p>
              <p className="mt-3 text-sm leading-7 text-dark">
                Email: {formatValue(user?.email)}
                <br />
                Status: {formatValue(billing?.status ?? access.source)}
                <br />
                Plan: {formatValue(billing?.plan_code ?? access.planCode)}
                <br />
                Track scope: {formatValue(access.examTrack ?? billing?.exam_track)}
                <br />
                Renews / expires: {formatValue(billing?.expires_at ? new Date(billing.expires_at).toLocaleString() : access.expiresAt)}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {accessRows.map(([label, value]) => (
              <div key={label} className="rounded-[22px] border border-[rgba(74,85,89,0.08)] bg-white/72 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">{label}</p>
                <p className="mt-3 text-lg font-semibold text-dark">{value}</p>
              </div>
            ))}
          </div>

          {portalMessage ? (
            <div className="mt-5 rounded-[18px] border border-[rgba(199,75,63,0.16)] bg-[rgba(255,247,244,0.88)] px-4 py-3 text-sm text-[rgba(144,72,52,0.92)]">
              {portalMessage}
            </div>
          ) : null}

          {portalUnavailable ? (
            <div className="mt-5 rounded-[18px] border border-[rgba(194,154,86,0.2)] bg-[rgba(255,249,237,0.88)] px-4 py-3 text-sm text-[rgba(109,86,36,0.92)]">
              Founder and preview keys unlock the product for QA, but they do not create a Stripe-managed subscription.
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={portalUnavailable ? "/account/billing?portal=unavailable" : "/api/stripe/portal"}
              className="inline-flex items-center justify-center rounded-[14px] bg-[#7E9D86] px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-[#6F8D76]"
            >
              Manage billing in Stripe
            </a>
            <a
              href="/upgrade"
              className="inline-flex items-center justify-center rounded-[14px] border border-[rgba(74,85,89,0.12)] bg-white/80 px-5 py-3 text-sm font-semibold text-dark transition duration-200 hover:bg-white"
            >
              View launch plans
            </a>
            <a
              href="/quiz"
              className="inline-flex items-center justify-center rounded-[14px] border border-[rgba(74,85,89,0.12)] bg-white/80 px-5 py-3 text-sm font-semibold text-dark transition duration-200 hover:bg-white"
            >
              Return to practice
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
