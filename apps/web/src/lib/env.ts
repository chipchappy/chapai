import { z } from "zod";

type D1Database = unknown;
type KVNamespace = unknown;
type R2Bucket = unknown;
type Fetcher = unknown;

const rawBoolean = z.preprocess((value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return value;
}, z.boolean());

const workerBindingSchema = z.object({
  DB: z.unknown().optional(),
  KV: z.unknown().optional(),
  R2: z.unknown().optional(),
  ASSETS: z.unknown().optional(),
  AI: z.unknown().optional(),
});

const serverEnvSchema = workerBindingSchema.extend({
  APP_ENV: z.enum(["development", "staging", "production"]).default("development"),
  NEXTAUTH_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20).optional(),
  AUTH_SECRET: z.string().min(24).optional(),
  STRIPE_SECRET_KEY: z.string().startsWith("sk_").optional(),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_").optional(),
  STRIPE_PRICE_NCLEX_24H: z.string().startsWith("price_").optional(),
  STRIPE_PRICE_CCRN_24H: z.string().startsWith("price_").optional(),
  STRIPE_PRICE_NCLEX_BASE_MONTHLY: z.string().startsWith("price_").optional(),
  STRIPE_PRICE_CCRN_BASE_MONTHLY: z.string().startsWith("price_").optional(),
  STRIPE_PRICE_NCLEX_4DAY: z.string().startsWith("price_").optional(),
  STRIPE_PRICE_CCRN_4DAY: z.string().startsWith("price_").optional(),
  STRIPE_PRICE_CORE_MONTHLY: z.string().startsWith("price_").optional(),
  STRIPE_PRICE_ALL_ACCESS_MONTHLY: z.string().startsWith("price_").optional(),
  STRIPE_PRICE_TRIAL_7DAY: z.string().startsWith("price_").optional(),
  STRIPE_PRICE_PLUS_MONTHLY: z.string().startsWith("price_").optional(),
  STRIPE_PRICE_PRO_MONTHLY: z.string().startsWith("price_").optional(),
  OPENROUTER_API_KEY: z.string().min(8).optional(),
  OPENROUTER_MODEL: z.string().default("openrouter/auto"),
  WORKERS_AI_MODEL: z.string().default("@cf/meta/llama-3.3-70b-instruct-fp8-fast"),
  ADMIN_AUTHOR_SECRET: z.string().optional(),
  DEMO_MODE: rawBoolean.default(false),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  DEMO_KEY: z.string().optional(),
  SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().regex(/^G-[A-Z0-9]{10,}$/).optional(),
  GUILD_TELEMETRY_SECRET: z.string().min(16).optional(),
  VERCEL: z.string().optional(),
  VERCEL_ENV: z.enum(["production", "preview", "development"]).optional(),
}).passthrough();

type WorkersAI = { run: (model: string, options: Record<string, unknown>) => Promise<unknown> };

export type ServerEnv = z.infer<typeof serverEnvSchema> & {
  DB?: D1Database;
  KV?: KVNamespace;
  R2?: R2Bucket;
  ASSETS?: Fetcher;
  AI?: WorkersAI;
};

function getRawEnv() {
  const cloudflareContext =
    (globalThis as { [key: symbol]: { env?: Record<string, unknown> } | undefined })[
      Symbol.for("__cloudflare-context__")
    ]?.env ?? {};
  const globalEnv = (globalThis as { __ENV__?: Record<string, unknown> }).__ENV__ ?? {};
  return {
    ...process.env,
    ...cloudflareContext,
    ...globalEnv,
  };
}

export function getServerEnv(): ServerEnv {
  return serverEnvSchema.parse(getRawEnv()) as ServerEnv;
}

export function resetEnvCache() {
  // Intentionally a no-op. Runtime bindings such as Cloudflare D1/KV are
  // request-scoped and must be re-read each time instead of cached globally.
}

export function hasWorkerBindings(env = getServerEnv()) {
  return Boolean(env.DB);
}

export function isDemoMode(env = getServerEnv()) {
  return env.DEMO_MODE;
}

export function allowLocalFallbacks(env = getServerEnv()) {
  return env.APP_ENV !== "production" || env.DEMO_MODE;
}

export function getRuntimeTarget(env = getServerEnv()) {
  if (env.DB) {
    return "cloudflare-worker";
  }
  if (env.VERCEL) {
    return "vercel";
  }
  return "node";
}

export function getProductionReadiness(env = getServerEnv()) {
  const hasDynamicStripeCatalog = Boolean(env.STRIPE_SECRET_KEY);
  const requiredConfig = [
    ["NEXT_PUBLIC_APP_URL", Boolean(env.NEXT_PUBLIC_APP_URL)],
    ["NEXT_PUBLIC_SUPABASE_URL", Boolean(env.NEXT_PUBLIC_SUPABASE_URL)],
    ["NEXT_PUBLIC_SUPABASE_ANON_KEY", Boolean(env.NEXT_PUBLIC_SUPABASE_ANON_KEY)],
    ["AUTH_SECRET", Boolean(env.AUTH_SECRET)],
    ["STRIPE_SECRET_KEY", Boolean(env.STRIPE_SECRET_KEY)],
    ["STRIPE_WEBHOOK_SECRET", Boolean(env.STRIPE_WEBHOOK_SECRET)],
  ] as const;

  const recommendedConfig = [
    ["STRIPE_PRICE_NCLEX_24H", hasDynamicStripeCatalog || Boolean(env.STRIPE_PRICE_NCLEX_24H)],
    ["STRIPE_PRICE_CCRN_24H", hasDynamicStripeCatalog || Boolean(env.STRIPE_PRICE_CCRN_24H)],
    ["STRIPE_PRICE_NCLEX_BASE_MONTHLY", hasDynamicStripeCatalog || Boolean(env.STRIPE_PRICE_NCLEX_BASE_MONTHLY)],
    ["STRIPE_PRICE_CCRN_BASE_MONTHLY", hasDynamicStripeCatalog || Boolean(env.STRIPE_PRICE_CCRN_BASE_MONTHLY)],
    ["STRIPE_PRICE_ALL_ACCESS_MONTHLY", hasDynamicStripeCatalog || Boolean(env.STRIPE_PRICE_ALL_ACCESS_MONTHLY)],
    ["SUPABASE_SERVICE_ROLE_KEY", Boolean(env.SUPABASE_SERVICE_ROLE_KEY)],
    ["OPENROUTER_API_KEY", Boolean(env.OPENROUTER_API_KEY)],
    ["SENTRY_DSN", Boolean(env.SENTRY_DSN || env.NEXT_PUBLIC_SENTRY_DSN)],
    ["POSTHOG", Boolean(env.POSTHOG_KEY || env.NEXT_PUBLIC_POSTHOG_KEY)],
    ["NEXT_PUBLIC_GA_MEASUREMENT_ID", Boolean(env.NEXT_PUBLIC_GA_MEASUREMENT_ID)],
  ] as const;

  return {
    requiredMissing: requiredConfig.filter(([, present]) => !present).map(([key]) => key),
    recommendedMissing: recommendedConfig.filter(([, present]) => !present).map(([key]) => key),
    runtimeTarget: getRuntimeTarget(env),
    allowLocalFallbacks: allowLocalFallbacks(env),
    databaseConfigured: hasWorkerBindings(env),
  };
}

export function hasSupabasePublicConfig(env = getServerEnv()) {
  return Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function hasSupabaseServiceRole(env = getServerEnv()) {
  return Boolean(hasSupabasePublicConfig(env) && env.SUPABASE_SERVICE_ROLE_KEY);
}

export function assertProductionEnv() {
  const env = getServerEnv();
  if (env.APP_ENV !== "production") {
    return env;
  }

  const readiness = getProductionReadiness(env);
  if (readiness.requiredMissing.length > 0) {
    throw new Error(`Missing required production env vars: ${readiness.requiredMissing.join(", ")}`);
  }

  return env;
}
