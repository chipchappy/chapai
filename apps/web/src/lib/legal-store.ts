import { createHash } from "node:crypto";
import { legalAcceptances } from "@chapai/db/schema";
import type { DB } from "@/lib/db";
import { ensureHostedUser } from "@/lib/billing-store";
import { CURRENT_PRIVACY_VERSION, CURRENT_TERMS_VERSION, type LegalAcceptanceSource } from "@/lib/legal";

function hashRequestValue(value: string | null) {
  if (!value) {
    return null;
  }

  return createHash("sha256").update(value).digest("hex");
}

export function getRequestFingerprint(request: Request) {
  const ip =
    request.headers.get("cf-connecting-ip")
    || request.headers.get("x-forwarded-for")
    || request.headers.get("x-real-ip");

  return {
    ipHash: hashRequestValue(ip),
    userAgent: request.headers.get("user-agent"),
  };
}

export async function recordCurrentPolicyAcceptances(db: DB, input: {
  email: string;
  userId?: string | null;
  source: LegalAcceptanceSource;
  request: Request;
}) {
  const fingerprint = getRequestFingerprint(input.request);
  const hostedUser = await ensureHostedUser(db, {
    userId: input.userId ?? null,
    email: input.email,
  });

  await db.insert(legalAcceptances).values([
    {
      userId: hostedUser?.id ?? null,
      email: input.email,
      policyType: "terms",
      policyVersion: CURRENT_TERMS_VERSION,
      source: input.source,
      ipHash: fingerprint.ipHash,
      userAgent: fingerprint.userAgent,
    },
    {
      userId: hostedUser?.id ?? null,
      email: input.email,
      policyType: "privacy",
      policyVersion: CURRENT_PRIVACY_VERSION,
      source: input.source,
      ipHash: fingerprint.ipHash,
      userAgent: fingerprint.userAgent,
    },
  ]);
}
