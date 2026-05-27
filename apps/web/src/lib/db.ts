import { drizzle } from "drizzle-orm/d1";
import * as schema from "@chapai/db/schema";
import { getServerEnv, hasWorkerBindings, isDemoMode as resolveDemoMode, type ServerEnv } from "@/lib/env";

type D1Database = unknown;
export type Env = ServerEnv & { DB?: D1Database };

export function getDB(env: Env) {
  if (!env.DB) {
    throw new Error("Database binding is not configured for this runtime.");
  }
  return drizzle(env.DB, { schema });
}

export function hasDatabase(env: Partial<Env>) {
  return hasWorkerBindings(env as Env);
}

export function isDemoMode(env: Partial<Env>) {
  return resolveDemoMode(env as Env);
}

export function resolveEnv(): Env {
  return getServerEnv() as Env;
}

export type DB = ReturnType<typeof getDB>;
