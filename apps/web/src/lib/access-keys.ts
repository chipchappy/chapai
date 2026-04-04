import { timingSafeEqual } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

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
  const filePath = storePath();
  if (!fs.existsSync(filePath)) {
    return { generatedAt: new Date().toISOString(), keys: [] };
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as AccessKeyStore;
  } catch {
    return { generatedAt: new Date().toISOString(), keys: [] };
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

export function listAccessKeys() {
  return loadStore().keys.map(sanitizeRecord);
}

export function validateAccessKey(code: string | undefined | null) {
  if (!code) {
    return null;
  }

  const store = loadStore();
  const record = store.keys.find((candidate) => equalsCode(candidate.code, code));
  if (!record) {
    return null;
  }

  if (record.status !== "active") {
    return null;
  }

  if (isExpired(record)) {
    return null;
  }

  return sanitizeRecord(record);
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
