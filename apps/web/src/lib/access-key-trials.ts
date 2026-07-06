import { redeemAccessKeyRuntime } from "@/lib/access-keys";
import { upsertBillingState } from "@/lib/billing-store";
import { hasDatabase, resolveEnv, type Env } from "@/lib/db";
import type { DB } from "@/lib/db";
import type { PremiumEntitlement } from "@/lib/premium-access";

// ─────────────────────────────────────────────────────────────────────────────
// Institutional access-key trials.
//
// When a student/faculty member redeems a valid key at signup we grant their
// ACCOUNT a time-limited full-premium trial by writing a `trialing`
// userEntitlements row with expiresAt = now + trialDays. Access resolution
// (getActiveEntitlementForUser) already returns only active, non-expired
// entitlements — so premium auto-revokes at expiry while the account and all
// saved study data persist untouched. A grant ledger records which user
// redeemed which key for which institution/campaign.
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_TRIAL_DAYS = 30;
const FULL_ENTITLEMENTS: PremiumEntitlement[] = ["live-bank", "rich-modes", "practice-exams", "tutor", "icu-sim-beta"];
export const INSTITUTIONAL_TRIAL_PLAN = "institutional_trial";

export type TrialRedemption =
  | { granted: true; expiresAt: string; institution: string | null; keyType: string }
  | { granted: false; reason: string; message: string };

const REASON_MESSAGES: Record<string, string> = {
  missing: "No access key entered.",
  invalid: "That access key wasn't recognized — double-check for typos and try again.",
  revoked: "That access key has been disabled. Contact your program coordinator for a new one.",
  disabled: "That access key has been disabled. Contact your program coordinator for a new one.",
  expired: "That access key has expired. Ask your program coordinator for a current key.",
  exhausted: "That access key has reached its redemption limit — all trial seats are taken.",
};

function friendly(reason: string) {
  return REASON_MESSAGES[reason] ?? "That access key could not be redeemed right now.";
}

type LedgerBinding = {
  prepare: (sql: string) => {
    bind: (...values: Array<string | number | null>) => { run: () => Promise<unknown> };
    run: () => Promise<unknown>;
  };
};

function d1Binding(env: Partial<Env>): LedgerBinding | null {
  if (!hasDatabase(env) || !env.DB) {
    return null;
  }
  return env.DB as unknown as LedgerBinding;
}

async function recordGrant(input: {
  userId: string | null;
  email: string | null;
  keyId: string;
  keyCode: string;
  keyType: string;
  institution: string | null;
  grantedAt: number;
  expiresAt: number;
}) {
  // Best-effort ledger for the college/faculty tracking use case. Never blocks a
  // signup — a ledger write failure must not deny the student their trial.
  try {
    const binding = d1Binding(resolveEnv());
    if (!binding) return;
    await binding.prepare(`
      CREATE TABLE IF NOT EXISTS access_key_grants (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        email TEXT,
        key_id TEXT NOT NULL,
        key_code TEXT NOT NULL,
        key_type TEXT NOT NULL,
        institution TEXT,
        granted_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL
      )
    `).run();
    await binding.prepare(`
      INSERT INTO access_key_grants (id, user_id, email, key_id, key_code, key_type, institution, granted_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      input.userId,
      input.email,
      input.keyId,
      input.keyCode,
      input.keyType,
      input.institution,
      input.grantedAt,
      input.expiresAt,
    ).run();
  } catch {
    // swallow — trial entitlement is already written; the ledger is informational
  }
}

export async function redeemAccessKeyForUser(
  db: DB,
  input: { userId: string | null; email: string | null; code: string; trialDays?: number },
): Promise<TrialRedemption> {
  const redeem = await redeemAccessKeyRuntime(input.code);
  if (!redeem.ok) {
    return { granted: false, reason: redeem.reason, message: friendly(redeem.reason) };
  }

  const key = redeem.record;
  const nowSec = Math.floor(Date.now() / 1000);
  const trialDays = input.trialDays ?? DEFAULT_TRIAL_DAYS;
  const expiresAtSec = nowSec + trialDays * 24 * 60 * 60;
  const examTrack = key.scope === "all" ? "all" : key.scope;
  const institution = key.notes && key.notes.trim().length > 0 ? key.notes.trim() : null;

  // Write the trial entitlement through the tested billing writer so access
  // control + auto-expiry behave exactly like a paid subscription.
  await upsertBillingState(db, {
    userId: input.userId,
    email: input.email,
    tier: "pro",
    planCode: INSTITUTIONAL_TRIAL_PLAN,
    status: "trialing",
    examTrack,
    entitlements: FULL_ENTITLEMENTS,
    expiresAt: expiresAtSec,
  });

  await recordGrant({
    userId: input.userId,
    email: input.email,
    keyId: key.id,
    keyCode: key.code,
    keyType: key.type,
    institution,
    grantedAt: nowSec,
    expiresAt: expiresAtSec,
  });

  return {
    granted: true,
    expiresAt: new Date(expiresAtSec * 1000).toISOString(),
    institution,
    keyType: key.type,
  };
}
