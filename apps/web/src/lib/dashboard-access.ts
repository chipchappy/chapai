import "server-only";

import { cookies } from "next/headers";
import {
  ACCESS_KEY_COOKIE,
  type AccessKeyType,
  validateAccessKeyRuntime,
} from "@/lib/access-keys";
import {
  compareDashboardAccessKey,
  DASHBOARD_AUTH_COOKIE,
} from "@/lib/dashboard-auth";
import type { BoardroomAccessRole } from "@/lib/types";

type DashboardAccessContext = {
  role: BoardroomAccessRole;
  source: "preview-key" | "legacy-guild-key" | "none";
  accessType: string | null;
  displayLabel: string | null;
  previewKeyType: AccessKeyType | null;
  canSummon: boolean;
};

function roleFromPreviewType(type: AccessKeyType | null | undefined, allowDemoPreview = false): BoardroomAccessRole {
  switch (type) {
    case "founder-pass":
    case "creator-pass":
    case "tester-pass":
      return "operator";
    case "reviewer-pass":
      return "viewer";
    case "demo-pass":
      return allowDemoPreview ? "viewer" : "none";
    default:
      return "none";
  }
}

function displayLabelFromType(type: AccessKeyType) {
  switch (type) {
    case "founder-pass":
      return "founder board access";
    case "creator-pass":
      return "creator board access";
    case "tester-pass":
      return "tester board access";
    case "reviewer-pass":
      return "reviewer board access";
    case "demo-pass":
      return "demo board preview";
    default:
      return "private board access";
  }
}

export async function getDashboardAccessContext(options?: { allowDemoPreview?: boolean }) {
  const cookieStore = await cookies();
  const previewCookie = cookieStore.get(ACCESS_KEY_COOKIE)?.value;
  const previewKey = await validateAccessKeyRuntime(previewCookie);
  const previewRole = roleFromPreviewType(previewKey?.type, options?.allowDemoPreview ?? false);

  if (previewKey && previewRole !== "none") {
    return {
      role: previewRole,
      source: "preview-key",
      accessType: previewKey.type,
      displayLabel: displayLabelFromType(previewKey.type),
      previewKeyType: previewKey.type,
      canSummon: previewRole === "operator",
    } satisfies DashboardAccessContext;
  }

  const legacyCookie = cookieStore.get(DASHBOARD_AUTH_COOKIE)?.value;
  if (compareDashboardAccessKey(legacyCookie)) {
    return {
      role: "operator",
      source: "legacy-guild-key",
      accessType: "legacy-guild-key",
      displayLabel: "legacy guild access",
      previewKeyType: null,
      canSummon: true,
    } satisfies DashboardAccessContext;
  }

  return {
    role: "none",
    source: "none",
    accessType: null,
    displayLabel: null,
    previewKeyType: null,
    canSummon: false,
  } satisfies DashboardAccessContext;
}
