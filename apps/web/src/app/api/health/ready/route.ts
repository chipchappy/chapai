import { getProductionReadiness, getServerEnv, hasSupabasePublicConfig } from "@/lib/env";
import { hasDatabase } from "@/lib/db";
import { jsonError, jsonSuccess } from "@/lib/http";
import { logError } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const env = getServerEnv();
  const readiness = getProductionReadiness(env);
  let databaseReachable = false;
  let d1SchemaReady = false;
  let supabaseReachable = false;
  const requiredD1Tables = [
    "users",
    "billing_subscriptions",
    "billing_events",
    "user_entitlements",
    "legal_acceptances",
    "practice_exam_unlocks",
    "questions",
    "quiz_sessions",
    "quiz_answers",
    "daily_usage",
  ];

  if (hasDatabase(env)) {
    try {
      const dbBinding = env.DB as {
        prepare: (sql: string) => {
          first: <T = unknown>() => Promise<T>;
          all: <T = unknown>() => Promise<{ results?: T[] }>;
        };
      };
      await dbBinding.prepare("select 1 as ok").first();
      databaseReachable = true;

      const tableQuery = requiredD1Tables.map((table) => `'${table}'`).join(", ");
      const schemaResult = await dbBinding
        .prepare(`select name from sqlite_master where type = 'table' and name in (${tableQuery})`)
        .all<{ name: string }>();
      const presentTables = new Set((schemaResult.results ?? []).map((row) => row.name));
      d1SchemaReady = requiredD1Tables.every((table) => presentTables.has(table));
    } catch (error) {
      logError("Readiness database check failed", error, { route: "/api/health/ready" });
    }
  }

  if (hasSupabasePublicConfig(env)) {
    try {
      const response = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
        method: "GET",
        headers: {
          apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        },
      });

      if (!response.ok) {
        throw new Error(`Supabase auth probe failed with ${response.status}`);
      }
      supabaseReachable = true;
    } catch (error) {
      logError("Readiness Supabase check failed", error, { route: "/api/health/ready" });
    }
  }

  const productionWarnings = [
    ...(env.APP_ENV === "production" && hasSupabasePublicConfig(env) && !supabaseReachable ? ["SUPABASE_UNREACHABLE"] : []),
  ];

  const productionBlocks = [
    ...readiness.requiredMissing,
    ...(env.APP_ENV === "production" && !hasDatabase(env) ? ["DB_BINDING"] : []),
    ...(env.APP_ENV === "production" && hasDatabase(env) && !databaseReachable ? ["DB_UNREACHABLE"] : []),
    ...(env.APP_ENV === "production" && hasDatabase(env) && databaseReachable && !d1SchemaReady ? ["D1_SCHEMA_MISSING"] : []),
  ];

  if (env.APP_ENV === "production" && productionBlocks.length > 0) {
    return jsonError(503, "NOT_READY", "Production configuration is incomplete.", {
      ...readiness,
      databaseReachable,
      d1SchemaReady,
        requiredD1Tables,
        supabaseReachable,
        productionBlocks,
        productionWarnings,
      });
  }

  return jsonSuccess({
    status: "ready",
    appEnv: env.APP_ENV,
    ...readiness,
    databaseReachable,
    d1SchemaReady,
    requiredD1Tables,
    supabaseReachable,
    productionWarnings,
    timestamp: new Date().toISOString(),
  });
}
