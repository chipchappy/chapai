import { timingSafeEqual } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { hasDatabase, resolveEnv, type Env } from "@/lib/db";
import bundledAccessKeyStore from "../../../../config/access-keys.json";

export const ACCESS_KEY_COOKIE = "chapai_preview_access";

export type AccessKeyType = "founder-pass" | "creator-pass" | "tester-pass" | "demo-pass" | "reviewer-pass";
export type AccessKeyScope = "all" | "ccrn" | "nclex";
export type AccessKeyStatus = "active" | "revoked" | "expired";

export type AccessKeyRecord = {
  id: string;
  code: string;
  type: AccessKeyType;
  scope: AccessKeyScope;
  status: AccessKeyStatus;
  createdAt: string;
  expiresAt: string | null;
  maxRedeems: number;
  redeemCount: number;
  lastRedeemedAt: string | null;
  notes?: string;
};

type AccessKeyStore = {
  generatedAt: string;
  keys: AccessKeyRecord[];
};

type AccessKeyStatement = {
  bind: (...values: Array<string | number | null>) => AccessKeyStatement;
  first: <T = Record<string, unknown>>() => Promise<T | null>;
  all: <T = Record<string, unknown>>() => Promise<{ results?: T[] }>;
  run: () => Promise<{ success?: boolean; meta?: { changes?: number } }>;
};

type AccessKeyBinding = {
  prepare: (sql: string) => AccessKeyStatement;
};

type AccessKeyRow = {
  id: string;
  code: string;
  type: AccessKeyType;
  scope: AccessKeyScope;
  status: AccessKeyStatus;
  created_at: number | null;
  expires_at: number | null;
  max_redeems: number;
  redeem_count: number;
  last_redeemed_at: number | null;
  notes: string | null;
};

function workspaceRoot() {
  let current = process.cwd();
  for (let i = 0; i < 6; i += 1) {
    if (fs.existsSync(path.join(current, "packages", "content"))) {
      return current;
    }
    const next = path.dirname(current);
    if (next === current) {
      break;
    }
    current = next;
  }
  return process.cwd();
}

function storePath() {
  return path.join(workspaceRoot(), "config", "access-keys.json");
}

function loadStore(): AccessKeyStore {
  try {
    const filePath = storePath();
    if (!fs.existsSync(filePath)) {
      return bundledAccessKeyStore as AccessKeyStore;
    }
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as AccessKeyStore;
  } catch {
    // fs not available (Cloudflare Workers runtime) — return empty store
    return bundledAccessKeyStore as AccessKeyStore;
  }
}

function saveStore(store: AccessKeyStore) {
  const filePath = storePath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2) + "\n", "utf8");
}

function normalizeCode(code: string) {
  return code.trim().toUpperCase();
}

function equalsCode(left: string, right: string) {
  const normalizedLeft = Buffer.from(normalizeCode(left));
  const normalizedRight = Buffer.from(normalizeCode(right));
  if (normalizedLeft.length !== normalizedRight.length) {
    return false;
  }
  return timingSafeEqual(normalizedLeft, normalizedRight);
}

function isExpired(record: AccessKeyRecord) {
  if (!record.expiresAt) {
    return false;
  }

  const expiryTime = Date.parse(record.expiresAt);
  if (Number.isNaN(expiryTime)) {
    return false;
  }

  return expiryTime <= Date.now();
}

function sanitizeRecord(record: AccessKeyRecord) {
  return {
    id: record.id,
    code: record.code,
    type: record.type,
    scope: record.scope,
    status: record.status,
    expiresAt: record.expiresAt,
    maxRedeems: record.maxRedeems,
    redeemCount: record.redeemCount,
    lastRedeemedAt: record.lastRedeemedAt,
    notes: record.notes ?? "",
  };
}

function getEnvDemoRecord(demoKey: string | undefined | null) {
  if (!demoKey) {
    return null;
  }

  const record: AccessKeyRecord = {
    id: "env-demo-key",
    code: normalizeCode(demoKey),
    type: "demo-pass",
    scope: "all",
    status: "active",
    createdAt: new Date().toISOString(),
    expiresAt: null,
    maxRedeems: 9999,
    redeemCount: 0,
    lastRedeemedAt: null,
    notes: "Environment demo key",
  };

  return sanitizeRecord(record);
}

function toUnixTimestamp(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return null;
  }

  return Math.floor(parsed / 1000);
}

function toIsoTimestamp(value: number | null | undefined) {
  if (!value || Number.isNaN(value)) {
    return null;
  }

  return new Date(value * 1000).toISOString();
}

function asAccessKeyBinding(env: Partial<Env>): AccessKeyBinding | null {
  if (!hasDatabase(env) || !env.DB) {
    return null;
  }

  return env.DB as AccessKeyBinding;
}

async function ensureRuntimeAccessKeyStore(binding: AccessKeyBinding) {
  await binding.prepare(`
    CREATE TABLE IF NOT EXISTS access_keys (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      normalized_code TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      scope TEXT NOT NULL DEFAULT 'all',
      status TEXT NOT NULL DEFAULT 'active',
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      expires_at INTEGER,
      max_redeems INTEGER NOT NULL DEFAULT 1,
      redeem_count INTEGER NOT NULL DEFAULT 0,
      last_redeemed_at INTEGER,
      notes TEXT
    )
  `).run();

  const localStore = loadStore();
  for (const record of localStore.keys) {
    await binding.prepare(`
      INSERT INTO access_keys (
        id, code, normalized_code, type, scope, status, created_at, expires_at, max_redeems, redeem_count, last_redeemed_at, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        code = excluded.code,
        normalized_code = excluded.normalized_code,
        type = excluded.type,
        scope = excluded.scope,
        status = excluded.status,
        expires_at = excluded.expires_at,
        max_redeems = excluded.max_redeems,
        notes = excluded.notes
    `).bind(
      record.id,
      record.code,
      normalizeCode(record.code),
      record.type,
      record.scope,
      record.status,
      toUnixTimestamp(record.createdAt) ?? Math.floor(Date.now() / 1000),
      toUnixTimestamp(record.expiresAt),
      record.maxRedeems,
      record.redeemCount,
      toUnixTimestamp(record.lastRedeemedAt),
      record.notes ?? null,
    ).run();
  }
}

function sanitizeRuntimeRow(row: AccessKeyRow | null) {
  if (!row) {
    return null;
  }

  const record: AccessKeyRecord = {
    id: row.id,
    code: row.code,
    type: row.type,
    scope: row.scope,
    status: row.status,
    createdAt: toIsoTimestamp(row.created_at) ?? new Date().toISOString(),
    expiresAt: toIsoTimestamp(row.expires_at),
    maxRedeems: row.max_redeems,
    redeemCount: row.redeem_count,
    lastRedeemedAt: toIsoTimestamp(row.last_redeemed_at),
    notes: row.notes ?? undefined,
  };

  if (record.status !== "active" || isExpired(record)) {
    return null;
  }

  return sanitizeRecord(record);
}

export function listAccessKeys() {
  return loadStore().keys.map(sanitizeRecord);
}

export function validateAccessKey(code: string | undefined | null) {
  if (!code) {
    return null;
  }

  const store = loadStore();
  const record = store.keys.find((candidate) => equalsCode(candidate.code, code));
  if (record) {
    if (record.status !== "active") {
      return null;
    }
    if (isExpired(record)) {
      return null;
    }
    return sanitizeRecord(record);
  }

  // Env-var fallback: works on Cloudflare Workers where fs is unavailable.
  // DEMO_KEY is set in Cloudflare Worker vars for low-friction demos.
  const demoKey = process.env.DEMO_KEY;
  if (demoKey && equalsCode(demoKey, code)) {
    return getEnvDemoRecord(demoKey);
  }

  return null;
}

export async function validateAccessKeyRuntime(code: string | undefined | null) {
  if (!code) {
    return null;
  }

  const env = resolveEnv();
  const binding = asAccessKeyBinding(env);

  if (binding) {
    await ensureRuntimeAccessKeyStore(binding);
    const row = await binding.prepare(`
      SELECT id, code, type, scope, status, created_at, expires_at, max_redeems, redeem_count, last_redeemed_at, notes
      FROM access_keys
      WHERE normalized_code = ?
      LIMIT 1
    `).bind(normalizeCode(code)).first<AccessKeyRow>();

    const record = sanitizeRuntimeRow(row);
    if (record) {
      return record;
    }

    if (!row && env.DEMO_KEY && equalsCode(env.DEMO_KEY, code)) {
      return getEnvDemoRecord(env.DEMO_KEY);
    }
  }

  return validateAccessKey(code);
}

export function getAccessTier(record: ReturnType<typeof validateAccessKey> | null | undefined) {
  if (!record) {
    return "free" as const;
  }

  return "pro" as const;
}

export function hasFounderAccess(record: ReturnType<typeof validateAccessKey> | null | undefined) {
  return record?.type === "founder-pass";
}

export function redeemAccessKey(code: string | undefined | null) {
  if (!code) {
    return { ok: false as const, reason: "missing" };
  }

  const store = loadStore();
  const record = store.keys.find((candidate) => equalsCode(candidate.code, code));
  if (!record) {
    return { ok: false as const, reason: "invalid" };
  }

  if (record.status !== "active") {
    return { ok: false as const, reason: record.status };
  }

  if (isExpired(record)) {
    record.status = "expired";
    saveStore(store);
    return { ok: false as const, reason: "expired" };
  }

  if (record.redeemCount >= record.maxRedeems) {
    return { ok: false as const, reason: "exhausted" };
  }

  record.redeemCount += 1;
  record.lastRedeemedAt = new Date().toISOString();
  store.generatedAt = record.lastRedeemedAt;
  saveStore(store);

  return {
    ok: true as const,
    record: sanitizeRecord(record),
  };
}

export async function redeemAccessKeyRuntime(code: string | undefined | null) {
  if (!code) {
    return { ok: false as const, reason: "missing" };
  }

  const env = resolveEnv();
  const binding = asAccessKeyBinding(env);

  if (binding) {
    await ensureRuntimeAccessKeyStore(binding);
    const normalizedCode = normalizeCode(code);
    const row = await binding.prepare(`
      SELECT id, code, type, scope, status, created_at, expires_at, max_redeems, redeem_count, last_redeemed_at, notes
      FROM access_keys
      WHERE normalized_code = ?
      LIMIT 1
    `).bind(normalizedCode).first<AccessKeyRow>();

    if (!row) {
      if (env.DEMO_KEY && equalsCode(env.DEMO_KEY, code)) {
        const record = getEnvDemoRecord(env.DEMO_KEY);
        if (record) {
          return {
            ok: true as const,
            record,
          };
        }
      }
      return { ok: false as const, reason: "invalid" };
    }

    const currentRecord: AccessKeyRecord = {
      id: row.id,
      code: row.code,
      type: row.type,
      scope: row.scope,
      status: row.status,
      createdAt: toIsoTimestamp(row.created_at) ?? new Date().toISOString(),
      expiresAt: toIsoTimestamp(row.expires_at),
      maxRedeems: row.max_redeems,
      redeemCount: row.redeem_count,
      lastRedeemedAt: toIsoTimestamp(row.last_redeemed_at),
      notes: row.notes ?? undefined,
    };

    if (currentRecord.status !== "active") {
      return { ok: false as const, reason: currentRecord.status };
    }

    if (isExpired(currentRecord)) {
      await binding.prepare("UPDATE access_keys SET status = 'expired' WHERE id = ?").bind(currentRecord.id).run();
      return { ok: false as const, reason: "expired" };
    }

    if (currentRecord.redeemCount >= currentRecord.maxRedeems) {
      return { ok: false as const, reason: "exhausted" };
    }

    await binding.prepare(`
      UPDATE access_keys
      SET redeem_count = redeem_count + 1,
          last_redeemed_at = unixepoch()
      WHERE id = ?
        AND status = 'active'
        AND (expires_at IS NULL OR expires_at > unixepoch())
        AND redeem_count < max_redeems
    `).bind(currentRecord.id).run();

    const updatedRow = await binding.prepare(`
      SELECT id, code, type, scope, status, created_at, expires_at, max_redeems, redeem_count, last_redeemed_at, notes
      FROM access_keys
      WHERE id = ?
      LIMIT 1
    `).bind(currentRecord.id).first<AccessKeyRow>();

    const record = sanitizeRuntimeRow(updatedRow);
    if (!record) {
      return { ok: false as const, reason: "invalid" };
    }

    return {
      ok: true as const,
      record,
    };
  }

  return redeemAccessKey(code);
}
