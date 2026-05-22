import { jsonSuccess } from "@/lib/http";
import { getServerEnv, getRuntimeTarget } from "@/lib/env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const env = getServerEnv();

  return jsonSuccess({
    status: "ok",
    appEnv: env.APP_ENV,
    runtimeTarget: getRuntimeTarget(env),
    timestamp: new Date().toISOString(),
  });
}
