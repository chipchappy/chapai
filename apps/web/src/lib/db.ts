import { drizzle } from "drizzle-orm/d1";
import * as schema from "@chapai/db/schema";

type D1Database = unknown;
type KVNamespace = unknown;
type R2Bucket = unknown;
type Fetcher = unknown;

// Cloudflare D1 binding type
export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  R2: R2Bucket;
  ASSETS: Fetcher;
  // Secrets (set via wrangler secret put)
  AUTH_SECRET: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  ANTHROPIC_API_KEY: string;
  TELEGRAM_BOT_TOKEN: string;
  NEXTAUTH_URL: string;
  NEXT_PUBLIC_APP_URL: string;
}

// Usage in API routes (Cloudflare Workers context):
// import { getDB } from "@/lib/db";
// const db = getDB(context.env);

export function getDB(env: Env) {
  return drizzle(env.DB, { schema });
}

export function hasDatabase(env: Partial<Env>) {
  return Boolean(env.DB);
}

export function resolveEnv(): Env {
  const globalEnv = (globalThis as { __ENV__?: Partial<Env> }).__ENV__ ?? {};
  return {
    DB: globalEnv.DB as D1Database,
    KV: globalEnv.KV as KVNamespace,
    R2: globalEnv.R2 as R2Bucket,
    ASSETS: globalEnv.ASSETS as Fetcher,
    AUTH_SECRET: globalEnv.AUTH_SECRET ?? process.env.AUTH_SECRET ?? "",
    STRIPE_SECRET_KEY: globalEnv.STRIPE_SECRET_KEY ?? process.env.STRIPE_SECRET_KEY ?? "",
    STRIPE_WEBHOOK_SECRET: globalEnv.STRIPE_WEBHOOK_SECRET ?? process.env.STRIPE_WEBHOOK_SECRET ?? "",
    ANTHROPIC_API_KEY: globalEnv.ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_API_KEY ?? "",
    TELEGRAM_BOT_TOKEN: globalEnv.TELEGRAM_BOT_TOKEN ?? process.env.TELEGRAM_BOT_TOKEN ?? "",
    NEXTAUTH_URL: globalEnv.NEXTAUTH_URL ?? process.env.NEXTAUTH_URL ?? "",
    NEXT_PUBLIC_APP_URL: globalEnv.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "",
  };
}

// For type-safe query helpers
export type DB = ReturnType<typeof getDB>;
