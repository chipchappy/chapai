import { drizzle } from "drizzle-orm/d1";
import * as schema from "@chapai/db/schema";

type D1Database = unknown;
type KVNamespace = unknown;
type R2Bucket = unknown;
type Fetcher = unknown;

export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  R2: R2Bucket;
  ASSETS: Fetcher;
  // Secrets (set via wrangler secret put)
  AUTH_SECRET: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  OPENROUTER_API_KEY: string;   // replaces ANTHROPIC_API_KEY
  OPENROUTER_MODEL: string;     // default: "openrouter/auto"
  DEMO_MODE: string;            // "true" = use local fallback, no AI cost
  TELEGRAM_BOT_TOKEN: string;
  NEXTAUTH_URL: string;
  NEXT_PUBLIC_APP_URL: string;
  APP_ENV: string;              // "production" | "staging"
}

export function getDB(env: Env) {
  return drizzle(env.DB, { schema });
}

export function hasDatabase(env: Partial<Env>) {
  return Boolean(env.DB);
}

export function isDemoMode(env: Partial<Env>) {
  return env.DEMO_MODE === "true";
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
    OPENROUTER_API_KEY: globalEnv.OPENROUTER_API_KEY ?? process.env.OPENROUTER_API_KEY ?? "",
    OPENROUTER_MODEL: globalEnv.OPENROUTER_MODEL ?? process.env.OPENROUTER_MODEL ?? "openrouter/auto",
    DEMO_MODE: globalEnv.DEMO_MODE ?? process.env.DEMO_MODE ?? "false",
    TELEGRAM_BOT_TOKEN: globalEnv.TELEGRAM_BOT_TOKEN ?? process.env.TELEGRAM_BOT_TOKEN ?? "",
    NEXTAUTH_URL: globalEnv.NEXTAUTH_URL ?? process.env.NEXTAUTH_URL ?? "",
    NEXT_PUBLIC_APP_URL: globalEnv.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "",
    APP_ENV: globalEnv.APP_ENV ?? process.env.APP_ENV ?? "production",
  };
}

export type DB = ReturnType<typeof getDB>;
