import "server-only";

import { createHmac, randomBytes, timingSafeEqual, pbkdf2Sync } from "node:crypto";
import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { authAccounts } from "@chapai/db/schema";
import { eq } from "drizzle-orm";
import type { DB } from "@/lib/db";
import { getDB, hasDatabase, resolveEnv } from "@/lib/db";
import { getServerEnv } from "@/lib/env";
import { ensureHostedUser } from "@/lib/billing-store";

export const LOCAL_AUTH_COOKIE = "chapai_session";

const SESSION_TTL_SECONDS = 400 * 24 * 60 * 60;
const HASH_ITERATIONS = 100_000;
const HASH_KEYLEN = 32;
const HASH_DIGEST = "sha256";
const SHARED_AUTH_COOKIE_DOMAIN = ".chapaisolutions.com";

function base64Url(input: string | Buffer) {
  return Buffer.from(input).toString("base64url");
}

function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function getAuthSecret() {
  const env = getServerEnv();
  return env.AUTH_SECRET || null;
}

export function getSharedAuthCookieDomain(hostname?: string | null) {
  const normalized = hostname?.split(":")[0]?.toLowerCase();
  if (!normalized) {
    return null;
  }
  return normalized === "chapaisolutions.com" || normalized.endsWith(".chapaisolutions.com")
    ? SHARED_AUTH_COOKIE_DOMAIN
    : null;
}

export function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const passwordHash = pbkdf2Sync(password, salt, HASH_ITERATIONS, HASH_KEYLEN, HASH_DIGEST).toString("base64url");
  return { passwordHash, passwordSalt: salt };
}

export function verifyPassword(password: string, passwordHash: string, passwordSalt: string) {
  const candidate = hashPassword(password, passwordSalt).passwordHash;
  const left = Buffer.from(candidate);
  const right = Buffer.from(passwordHash);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function createLocalSessionToken(input: { userId: string; email: string }) {
  const secret = getAuthSecret();
  if (!secret) {
    return null;
  }

  const payload = base64Url(JSON.stringify({
    userId: input.userId,
    email: input.email,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  }));
  return `${payload}.${sign(payload, secret)}`;
}

export function parseLocalSessionToken(token: string | undefined | null) {
  const secret = getAuthSecret();
  if (!secret || !token) {
    return null;
  }

  const [payload, signature] = token.split(".");
  if (!payload || !signature || sign(payload, secret) !== signature) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      userId?: string;
      email?: string;
      exp?: number;
    };
    if (!parsed.userId || !parsed.email || !parsed.exp || parsed.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function setLocalAuthCookie(
  response: { cookies: { set: (name: string, value: string, options: Record<string, unknown>) => void } },
  token: string,
  requestHost?: string | null,
) {
  const sharedDomain = getSharedAuthCookieDomain(requestHost);
  response.cookies.set(LOCAL_AUTH_COOKIE, token, {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: true,
    maxAge: SESSION_TTL_SECONDS,
    ...(sharedDomain ? { domain: sharedDomain } : {}),
  });
}

export function clearLocalAuthCookie(
  response: { cookies: { set: (name: string, value: string, options: Record<string, unknown>) => void } },
  requestHost?: string | null,
) {
  const options = {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: true,
    maxAge: 0,
  } as const;
  response.cookies.set(LOCAL_AUTH_COOKIE, "", options);
  const sharedDomain = getSharedAuthCookieDomain(requestHost);
  if (sharedDomain) {
    response.cookies.set(LOCAL_AUTH_COOKIE, "", {
      ...options,
      domain: sharedDomain,
    });
  }
}

export async function createLocalAuthAccount(db: DB, input: { email: string; password: string; name?: string | null }) {
  const email = input.email.toLowerCase().trim();
  const existing = await db.select().from(authAccounts).where(eq(authAccounts.email, email)).get();
  if (existing) {
    return { account: existing, created: false };
  }

  const hostedUser = await ensureHostedUser(db, {
    email,
    name: input.name ?? null,
  });
  if (!hostedUser) {
    throw new Error("Could not create hosted user.");
  }

  const now = Math.floor(Date.now() / 1000);
  const passwordRecord = hashPassword(input.password);
  await db.insert(authAccounts).values({
    id: crypto.randomUUID(),
    userId: hostedUser.id,
    email,
    passwordHash: passwordRecord.passwordHash,
    passwordSalt: passwordRecord.passwordSalt,
    createdAt: now,
    updatedAt: now,
  });

  const account = await db.select().from(authAccounts).where(eq(authAccounts.email, email)).get();
  if (!account) {
    throw new Error("Could not read created auth account.");
  }
  return { account, created: true };
}

export async function verifyLocalAuthAccount(db: DB, input: { email: string; password: string }) {
  const email = input.email.toLowerCase().trim();
  const account = await db.select().from(authAccounts).where(eq(authAccounts.email, email)).get();
  if (!account || !verifyPassword(input.password, account.passwordHash, account.passwordSalt)) {
    return null;
  }
  await ensureHostedUser(db, { userId: account.userId, email: account.email });
  return account;
}

export async function getLocalAuthenticatedUser(): Promise<User | null> {
  const env = resolveEnv();
  if (!hasDatabase(env)) {
    return null;
  }

  const cookieStore = await cookies();
  const parsed = parseLocalSessionToken(cookieStore.get(LOCAL_AUTH_COOKIE)?.value);
  if (!parsed) {
    return null;
  }
  const userId = parsed.userId;
  const email = parsed.email;
  if (!userId || !email) {
    return null;
  }

  const db = getDB(env);
  const account = await db.select().from(authAccounts).where(eq(authAccounts.userId, userId)).get();
  if (!account || account.email !== email) {
    return null;
  }

  return {
    id: account.userId,
    email: account.email,
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: new Date().toISOString(),
  } as User;
}
