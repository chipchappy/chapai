import type { PremiumEntitlement } from "@/lib/premium-access";

export type LaunchPlanCode =
  | "nclex_24h_pass"
  | "ccrn_24h_pass"
  | "nclex_base_monthly"
  | "ccrn_base_monthly"
  | "nclex_4day_pass"
  | "ccrn_4day_pass"
  | "core_monthly"
  | "all_access_monthly";

export type LaunchPlanType =
  | "track-pass"
  | "track-base-monthly"
  | "core-monthly"
  | "all-access-monthly";
export type LaunchBillingTier = "plus" | "pro";
export type LaunchExamTrackScope = "all" | "nclex" | "ccrn";

export type LaunchOfferPolicy = {
  planCode: LaunchPlanCode;
  planType: LaunchPlanType;
  billingTier: LaunchBillingTier;
  label: string;
  shortLabel: string;
  description: string;
  price: number;
  checkoutMode: "payment" | "subscription";
  examTrackScope: LaunchExamTrackScope;
  accessHours: number | null;
  questionBankAccessPercent: number;
  practiceExamLimit: number;
  entitlements: PremiumEntitlement[];
  canUseTutor: boolean;
  canUseRichModes: boolean;
  canUseIcuSimBeta: boolean;
  canUseAdvancedAnalytics: boolean;
  activeForSale: boolean;
  marketingBadge?: string;
};

const ALL_ACCESS_ENTITLEMENTS: PremiumEntitlement[] = [
  "live-bank",
  "rich-modes",
  "practice-exams",
  "tutor",
];

const LAUNCH_OFFER_MAP: Record<LaunchPlanCode, LaunchOfferPolicy> = {
  nclex_24h_pass: {
    planCode: "nclex_24h_pass",
    planType: "track-pass",
    billingTier: "plus",
    label: "NCLEX 7-Day Pass",
    shortLabel: "NCLEX 7-Day",
    description: "Seven days of full NCLEX access — the complete live bank, full rationales, diagrams, citations, sources, and 1 included practice exam.",
    price: 4.99,
    checkoutMode: "payment",
    examTrackScope: "nclex",
    accessHours: 168,
    questionBankAccessPercent: 100,
    practiceExamLimit: 1,
    entitlements: ["live-bank", "practice-exams"],
    canUseTutor: false,
    canUseRichModes: false,
    canUseIcuSimBeta: false,
    canUseAdvancedAnalytics: false,
    activeForSale: true,
    marketingBadge: "7-day pass",
  },
  ccrn_24h_pass: {
    planCode: "ccrn_24h_pass",
    planType: "track-pass",
    billingTier: "plus",
    label: "CCRN 7-Day Pass",
    shortLabel: "CCRN 7-Day",
    description: "Seven days of full CCRN access — the complete live bank, full rationales, diagrams, citations, sources, and 1 included practice exam.",
    price: 4.99,
    checkoutMode: "payment",
    examTrackScope: "ccrn",
    accessHours: 168,
    questionBankAccessPercent: 100,
    practiceExamLimit: 1,
    entitlements: ["live-bank", "practice-exams"],
    canUseTutor: false,
    canUseRichModes: false,
    canUseIcuSimBeta: false,
    canUseAdvancedAnalytics: false,
    activeForSale: true,
    marketingBadge: "7-day pass",
  },
  nclex_base_monthly: {
    planCode: "nclex_base_monthly",
    planType: "track-base-monthly",
    billingTier: "plus",
    label: "NCLEX Base Plan",
    shortLabel: "NCLEX Base",
    description: "Full NCLEX question bank access, 2 practice exams, rationales, diagrams, citations, and sources in the live study flow.",
    price: 9.99,
    checkoutMode: "subscription",
    examTrackScope: "nclex",
    accessHours: null,
    questionBankAccessPercent: 100,
    practiceExamLimit: 2,
    entitlements: ["live-bank", "rich-modes", "practice-exams"],
    canUseTutor: false,
    canUseRichModes: true,
    canUseIcuSimBeta: false,
    canUseAdvancedAnalytics: false,
    activeForSale: true,
    marketingBadge: "Base plan",
  },
  ccrn_base_monthly: {
    planCode: "ccrn_base_monthly",
    planType: "track-base-monthly",
    billingTier: "plus",
    label: "CCRN Base Plan",
    shortLabel: "CCRN Base",
    description: "Full CCRN question bank access, 2 practice exams, rationales, diagrams, citations, and sources in the live study flow.",
    price: 9.99,
    checkoutMode: "subscription",
    examTrackScope: "ccrn",
    accessHours: null,
    questionBankAccessPercent: 100,
    practiceExamLimit: 2,
    entitlements: ["live-bank", "rich-modes", "practice-exams"],
    canUseTutor: false,
    canUseRichModes: true,
    canUseIcuSimBeta: false,
    canUseAdvancedAnalytics: false,
    activeForSale: true,
    marketingBadge: "Base plan",
  },
  nclex_4day_pass: {
    planCode: "nclex_4day_pass",
    planType: "track-pass",
    billingTier: "plus",
    label: "NCLEX 4-Day Pass",
    shortLabel: "NCLEX 4-Day",
    description: "Four days of NCLEX-only access with one included simulation.",
    price: 9,
    checkoutMode: "payment",
    examTrackScope: "nclex",
    accessHours: 96,
    questionBankAccessPercent: 100,
    practiceExamLimit: 1,
    entitlements: ["live-bank", "practice-exams"],
    canUseTutor: false,
    canUseRichModes: false,
    canUseIcuSimBeta: false,
    canUseAdvancedAnalytics: false,
    activeForSale: false,
    marketingBadge: "Track pass",
  },
  ccrn_4day_pass: {
    planCode: "ccrn_4day_pass",
    planType: "track-pass",
    billingTier: "plus",
    label: "CCRN 4-Day Pass",
    shortLabel: "CCRN 4-Day",
    description: "Four days of CCRN-only access with one included simulation.",
    price: 9,
    checkoutMode: "payment",
    examTrackScope: "ccrn",
    accessHours: 96,
    questionBankAccessPercent: 100,
    practiceExamLimit: 1,
    entitlements: ["live-bank", "practice-exams"],
    canUseTutor: false,
    canUseRichModes: false,
    canUseIcuSimBeta: false,
    canUseAdvancedAnalytics: false,
    activeForSale: false,
    marketingBadge: "Track pass",
  },
  core_monthly: {
    planCode: "core_monthly",
    planType: "core-monthly",
    billingTier: "plus",
    label: "Core Monthly",
    shortLabel: "Core",
    description: "Both tracks, the full live Q-bank, rich modes, and any 3 of the 5 simulations.",
    price: 20,
    checkoutMode: "subscription",
    examTrackScope: "all",
    accessHours: null,
    questionBankAccessPercent: 100,
    practiceExamLimit: 3,
    entitlements: ["live-bank", "rich-modes", "practice-exams"],
    canUseTutor: false,
    canUseRichModes: true,
    canUseIcuSimBeta: false,
    canUseAdvancedAnalytics: false,
    activeForSale: false,
    marketingBadge: "Most practical",
  },
  all_access_monthly: {
    planCode: "all_access_monthly",
    planType: "all-access-monthly",
    billingTier: "pro",
    label: "Dual Premium Plan",
    shortLabel: "Dual Premium",
    description: "Full NCLEX and CCRN access, 5 practice exams, AI tutor in the study bank, and advanced analytics.",
    price: 15.99,
    checkoutMode: "subscription",
    examTrackScope: "all",
    accessHours: null,
    questionBankAccessPercent: 100,
    practiceExamLimit: 5,
    entitlements: ALL_ACCESS_ENTITLEMENTS,
    canUseTutor: true,
    canUseRichModes: true,
    canUseIcuSimBeta: false,
    canUseAdvancedAnalytics: true,
    activeForSale: true,
    marketingBadge: "Best overall value",
  },
};

const ACTIVE_LAUNCH_PLAN_CODES: LaunchPlanCode[] = [
  "nclex_24h_pass",
  "ccrn_24h_pass",
  "nclex_base_monthly",
  "ccrn_base_monthly",
  "all_access_monthly",
];

export const LAUNCH_OFFERS = ACTIVE_LAUNCH_PLAN_CODES.map((planCode) => LAUNCH_OFFER_MAP[planCode]);

export function isLaunchPlanCode(value: string | null | undefined): value is LaunchPlanCode {
  return value === "nclex_24h_pass"
    || value === "ccrn_24h_pass"
    || value === "nclex_base_monthly"
    || value === "ccrn_base_monthly"
    || value === "nclex_4day_pass"
    || value === "ccrn_4day_pass"
    || value === "core_monthly"
    || value === "all_access_monthly";
}

export function getLaunchOffer(planCode: string | null | undefined) {
  return isLaunchPlanCode(planCode) ? LAUNCH_OFFER_MAP[planCode] : null;
}

export function getLaunchOfferDisplayLabel(planCode: string | null | undefined) {
  return getLaunchOffer(planCode)?.label ?? "Premium access active";
}

export function planCodeFromLegacySignals(input: {
  planCode?: string | null;
  tier?: string | null;
  examTrack?: string | null;
  checkoutMode?: "payment" | "subscription" | null;
}) {
  if (isLaunchPlanCode(input.planCode)) {
    return input.planCode;
  }

  if (input.checkoutMode === "payment" && (input.examTrack === "nclex" || input.examTrack === "ccrn")) {
    return `${input.examTrack}_24h_pass` as LaunchPlanCode;
  }

  if (
    input.checkoutMode === "subscription"
    && input.tier !== "pro"
    && (input.examTrack === "nclex" || input.examTrack === "ccrn")
  ) {
    return `${input.examTrack}_base_monthly` as LaunchPlanCode;
  }

  if (input.tier === "pro") {
    return "all_access_monthly";
  }

  if (input.tier === "plus") {
    if (input.examTrack === "nclex" || input.examTrack === "ccrn") {
      return `${input.examTrack}_base_monthly` as LaunchPlanCode;
    }
    return "core_monthly";
  }

  return null;
}

export function getPracticeExamIdsForTrack(track: LaunchExamTrackScope) {
  if (track === "nclex") {
    return ["nclex-sim-1", "nclex-sim-2", "nclex-sim-3", "nclex-sim-4", "nclex-sim-5"];
  }
  if (track === "ccrn") {
    return ["ccrn-sim-1", "ccrn-sim-2"];
  }
  return ["nclex-sim-1", "nclex-sim-2", "nclex-sim-3", "nclex-sim-4", "nclex-sim-5", "ccrn-sim-1", "ccrn-sim-2"];
}

export function examIdMatchesTrack(examId: string, track: LaunchExamTrackScope) {
  if (track === "all") {
    return true;
  }
  return examId.startsWith(`${track}-`);
}

export function getAccessibleQuestionBankCount(totalQuestions: number, accessPercent: number) {
  if (totalQuestions <= 0) {
    return 0;
  }

  const clampedPercent = Math.max(1, Math.min(100, Math.round(accessPercent)));
  if (clampedPercent >= 100) {
    return totalQuestions;
  }

  return Math.max(1, Math.ceil(totalQuestions * (clampedPercent / 100)));
}
