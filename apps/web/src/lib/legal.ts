export const CURRENT_TERMS_VERSION = "2026-04-07";
export const CURRENT_PRIVACY_VERSION = "2026-04-07";

export type LegalPolicyType = "terms" | "privacy";
export type LegalAcceptanceSource = "auth_login" | "checkout";

export function getLegalVersions() {
  return {
    terms: CURRENT_TERMS_VERSION,
    privacy: CURRENT_PRIVACY_VERSION,
  };
}
