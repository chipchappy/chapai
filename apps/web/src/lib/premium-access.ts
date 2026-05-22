import { createHmac, timingSafeEqual } from "node:crypto";
import { resolveEnv } from "@/lib/db";
import { validateAccessKey } from "@/lib/access-keys";
import { getLaunchOffer, getLaunchOfferDisplayLabel, type LaunchPlanType } from "@/lib/launch-offers";
import type { Tier } from "@/lib/types";

export const PAID_ACCESS_COOKIE = "clarity_paid_access";

export type PremiumEntitlement = "live-bank" | "rich-modes" | "practice-exams" | "tutor" | "icu-sim-beta";
export type PremiumAccessSource = "none" | "founder-key" | "preview-key" | "paid-cookie" | "server-entitlement";

type PaidAccessPayload = {
  v: 1;
  tier: Exclude<Tier, "free">;
  planCode: string;
  packageLabel: string;
  examTrack: "all" | "ccrn" | "nclex";
  entitlements: PremiumEntitlement[];
  sessionId: string;
  issuedAt: number;
  expiresAt: number;
};

export type ResolvedPremiumAccess = {
  tier: Tier;
  source: PremiumAccessSource;
  accessType: string | null;
  planCode: string | null;
  planType: LaunchPlanType | null;
  displayLabel: string | null;
  examTrack: "all" | "ccrn" | "nclex";
  entitlements: PremiumEntitlement[];
  questionBankAccessPercent: number;
  practiceExamLimit: number;
  canUseTutor: boolean;
  canUseRichModes: boolean;
  canUsePracticeExams: boolean;
  canUseIcuSimBeta: boolean;
  canUseAdvancedAnalytics: boolean;
  expiresAt: string | null;
};

const DEFAULT_ENTITLEMENTS: PremiumEntitlement[] = ["live-bank", "rich-modes", "practice-exams", "tutor", "icu-sim-beta"];

function getAccessSecret() {
  const env = resolveEnv();
  return env.AUTH_SECRET || env.STRIPE_WEBHOOK_SECRET || process.env.AUTH_SECRET || process.env.STRIPE_WEBHOOK_SECRET || "";
}

function signPayload(encodedPayload: string, secret: string) {
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

function sanitizeExamTrack(value: string | undefined) {
  if (value === "ccrn" || value === "nclex") {
    return value;
  }
  return "all" as const;
}

export function sanitizePremiumEntitlements(input: string[] | PremiumEntitlement[] | undefined): PremiumEntitlement[] {
  const values = Array.isArray(input) ? input : [];
  const next = values.filter((value): value is PremiumEntitlement => (
    value === "live-bank"
    || value === "rich-modes"
    || value === "practice-exams"
    || value === "tutor"
    || value === "icu-sim-beta"
  ));

  return next.length > 0 ? next : [...DEFAULT_ENTITLEMENTS];
}

function compareSignatures(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function hasEntitlement(entitlements: PremiumEntitlement[], entitlement: PremiumEntitlement) {
  return entitlements.includes(entitlement);
}

export function createPaidAccessToken(input: {
  tier: Exclude<Tier, "free">;
  planCode: string;
  packageLabel: string;
  examTrack?: "all" | "ccrn" | "nclex";
  entitlements?: PremiumEntitlement[];
  sessionId: string;
  expiresAt: number;
}) {
  const secret = getAccessSecret();
  if (!secret) {
    throw new Error("Missing AUTH_SECRET for paid access signing.");
  }

  const payload: PaidAccessPayload = {
    v: 1,
    tier: input.tier,
    planCode: input.planCode,
    packageLabel: input.packageLabel,
    examTrack: input.examTrack ?? "all",
    entitlements: sanitizePremiumEntitlements(input.entitlements),
    sessionId: input.sessionId,
    issuedAt: Date.now(),
    expiresAt: input.expiresAt,
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = signPayload(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
}

export function validatePaidAccessToken(token: string | undefined | null) {
  if (!token) {
    return null;
  }

  const secret = getAccessSecret();
  if (!secret) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signPayload(encodedPayload, secret);
  if (!compareSignatures(signature, expectedSignature)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as PaidAccessPayload;
    if (payload.v !== 1 || payload.expiresAt <= Date.now()) {
      return null;
    }

    return {
      ...payload,
      examTrack: sanitizeExamTrack(payload.examTrack),
      entitlements: sanitizePremiumEntitlements(payload.entitlements),
    } satisfies PaidAccessPayload;
  } catch {
    return null;
  }
}

export function resolvePremiumAccess(input: {
  accessKeyCode?: string | null;
  paidAccessToken?: string | null;
}): ResolvedPremiumAccess {
  const accessKey = validateAccessKey(input.accessKeyCode);
  if (accessKey) {
    const founderAccess = accessKey.type === "founder-pass";
    return {
      tier: founderAccess ? "pro" : "plus",
      source: founderAccess ? "founder-key" : "preview-key",
      accessType: accessKey.type,
      planCode: null,
      planType: null,
      displayLabel: founderAccess ? "Founder full access" : "Preview premium active",
      examTrack: accessKey.scope === "all" ? "all" : accessKey.scope,
      entitlements: [...DEFAULT_ENTITLEMENTS],
      questionBankAccessPercent: 100,
      practiceExamLimit: 5,
      canUseTutor: true,
      canUseRichModes: true,
      canUsePracticeExams: true,
      canUseIcuSimBeta: true,
      canUseAdvancedAnalytics: true,
      expiresAt: accessKey.expiresAt,
    };
  }

  const paidAccess = validatePaidAccessToken(input.paidAccessToken);
  if (paidAccess) {
    const entitlements = sanitizePremiumEntitlements(paidAccess.entitlements);
    const offer = getLaunchOffer(paidAccess.planCode);
    return {
      tier: paidAccess.tier,
      source: "paid-cookie",
      accessType: paidAccess.planCode,
      planCode: paidAccess.planCode,
      planType: offer?.planType ?? null,
      displayLabel: getLaunchOfferDisplayLabel(paidAccess.planCode),
      examTrack: paidAccess.examTrack,
      entitlements,
      questionBankAccessPercent: offer?.questionBankAccessPercent ?? 100,
      practiceExamLimit: offer?.practiceExamLimit ?? (hasEntitlement(entitlements, "practice-exams") ? 5 : 0),
      canUseTutor: hasEntitlement(entitlements, "tutor"),
      canUseRichModes: offer?.canUseRichModes ?? hasEntitlement(entitlements, "rich-modes"),
      canUsePracticeExams: hasEntitlement(entitlements, "practice-exams"),
      canUseIcuSimBeta: offer?.canUseIcuSimBeta ?? hasEntitlement(entitlements, "icu-sim-beta"),
      canUseAdvancedAnalytics: offer?.canUseAdvancedAnalytics ?? paidAccess.tier === "pro",
      expiresAt: new Date(paidAccess.expiresAt).toISOString(),
    };
  }

  return {
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
  };
}
