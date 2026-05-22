import { headers } from "next/headers";
import { getServerEnv } from "@/lib/env";

export const DEFAULT_SITE_ORIGIN = "https://claritynclex.chapaisolutions.com";

const KNOWN_HOSTS = new Set([
  "clarityccrn.chapaisolutions.com",
  "clarityhome.chapaisolutions.com",
  "claritynclex.chapaisolutions.com",
]);

export function resolveSiteOriginFromHost(host?: string | null) {
  const normalizedHost = String(host ?? "").toLowerCase().split(":")[0].trim();
  if (normalizedHost && KNOWN_HOSTS.has(normalizedHost)) {
    return `https://${normalizedHost}`;
  }

  const envOrigin = getServerEnv().NEXT_PUBLIC_APP_URL;
  return envOrigin ?? DEFAULT_SITE_ORIGIN;
}

export async function getRequestSiteOrigin() {
  const requestHeaders = await headers();
  const forwardedHost = requestHeaders.get("x-forwarded-host");
  const host = forwardedHost ?? requestHeaders.get("host");
  return resolveSiteOriginFromHost(host);
}
