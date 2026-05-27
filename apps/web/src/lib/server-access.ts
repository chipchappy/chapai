import "server-only";

import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { ACCESS_KEY_COOKIE, validateAccessKeyRuntime } from "@/lib/access-keys";
import { getDB, hasDatabase, resolveEnv } from "@/lib/db";
import { getActiveEntitlementForUser } from "@/lib/billing-store";
import { getLaunchOffer, getLaunchOfferDisplayLabel, planCodeFromLegacySignals } from "@/lib/launch-offers";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { logError } from "@/lib/logger";
import type { PremiumEntitlement, ResolvedPremiumAccess } from "@/lib/premium-access";
import { sanitizePremiumEntitlements } from "@/lib/premium-access";
import type { Tier } from "@/lib/types";

type EntitlementRecord = Awaited<ReturnType<typeof getActiveEntitlementForUser>>;

function hasEntitlement(entitlements: PremiumEntitlement[], entitlement: PremiumEntitlement) {
  return entitlements.includes(entitlement);
}

async function accessFromAccessKey(code?: string | null): Promise<ResolvedPremiumAccess | null> {
  const accessKey = await validateAccessKeyRuntime(code);
  if (!accessKey) {
    return null;
  }

  const founderAccess = accessKey.type === "founder-pass";
  const entitlements: PremiumEntitlement[] = ["live-bank", "rich-modes", "practice-exams", "tutor", "icu-sim-beta"];

  return {
    tier: founderAccess ? "pro" : "plus",
    source: founderAccess ? "founder-key" : "preview-key",
    accessType: accessKey.type,
    planCode: founderAccess ? "all_access_monthly" : "core_monthly",
    planType: founderAccess ? "all-access-monthly" : "core-monthly",
    displayLabel: founderAccess ? "Founder full access" : "Preview premium active",
    examTrack: accessKey.scope === "all" ? "all" : accessKey.scope,
    entitlements,
    questionBankAccessPercent: 100,
    practiceExamLimit: founderAccess ? 5 : 3,
    canUseTutor: true,
    canUseRichModes: true,
    canUsePracticeExams: true,
    canUseIcuSimBeta: founderAccess,
    canUseAdvancedAnalytics: true,
    expiresAt: accessKey.expiresAt,
  };
}

function accessFromEntitlement(entitlement: NonNullable<EntitlementRecord>): ResolvedPremiumAccess {
  const planCode = planCodeFromLegacySignals({
    planCode: entitlement.planCode,
    tier: entitlement.tier,
    examTrack: entitlement.examTrack,
    checkoutMode: entitlement.expiresAt && !entitlement.currentPeriodEnd ? "payment" : "subscription",
  });
  const offer = getLaunchOffer(planCode);
  const entitlements: PremiumEntitlement[] = sanitizePremiumEntitlements(
    Array.isArray(entitlement.entitlements) ? entitlement.entitlements : offer?.entitlements,
  );

  return {
    tier: entitlement.tier as Tier,
    source: "server-entitlement",
    accessType: planCode ?? entitlement.planCode,
    planCode,
    planType: offer?.planType ?? null,
    displayLabel: getLaunchOfferDisplayLabel(planCode),
    examTrack: offer?.examTrackScope ?? entitlement.examTrack,
    entitlements,
    questionBankAccessPercent: offer?.questionBankAccessPercent ?? 100,
    practiceExamLimit: offer?.practiceExamLimit ?? (hasEntitlement(entitlements, "practice-exams") ? 5 : 0),
    canUseTutor: hasEntitlement(entitlements, "tutor"),
    canUseRichModes: offer?.canUseRichModes ?? hasEntitlement(entitlements, "rich-modes"),
    canUsePracticeExams: hasEntitlement(entitlements, "practice-exams"),
    canUseIcuSimBeta: offer?.canUseIcuSimBeta ?? hasEntitlement(entitlements, "icu-sim-beta"),
    canUseAdvancedAnalytics: offer?.canUseAdvancedAnalytics ?? entitlement.tier === "pro",
    expiresAt: entitlement.expiresAt,
  };
}

export async function getServerAccessContext(): Promise<{
  user: User | null;
  entitlement: EntitlementRecord;
  access: ResolvedPremiumAccess;
}> {
  const cookieStore = await cookies();
  const keyAccess = await accessFromAccessKey(cookieStore.get(ACCESS_KEY_COOKIE)?.value);
  const user = await getAuthenticatedUser();
  let entitlement: EntitlementRecord = null;

  const env = resolveEnv();
  if (user && hasDatabase(env)) {
    try {
      const db = getDB(env);
      entitlement = await getActiveEntitlementForUser(db, {
        userId: user.id,
        email: user.email ?? null,
      });
    } catch (error) {
      logError("Server access entitlement lookup failed", error, {
        route: "server-access",
        userId: user.id,
      });
    }
  }

  if (keyAccess) {
    return {
      user,
      entitlement,
      access: keyAccess,
    };
  }

  if (entitlement) {
    return {
      user,
      entitlement,
      access: accessFromEntitlement(entitlement),
    };
  }

  return {
    user,
    entitlement: null,
      access: {
        tier: "free",
        source: "none",
        accessType: null,
        planCode: null,
        planType: null,
        displayLabel: null,
        examTrack: "all",
        entitlements: [],
        questionBankAccessPercent: 100,
        practiceExamLimit: 0,
        canUseTutor: false,
        canUseRichModes: false,
        canUsePracticeExams: false,
        canUseIcuSimBeta: false,
        canUseAdvancedAnalytics: false,
        expiresAt: null,
      },
    };
  }
