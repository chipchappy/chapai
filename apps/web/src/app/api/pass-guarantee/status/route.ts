import { getDB, hasDatabase, resolveEnv } from "@/lib/db";
import { getHostedUserByAccount } from "@/lib/billing-store";
import { allowLocalFallbacks } from "@/lib/env";
import { createRequestContext } from "@/lib/logger";
import { handleRouteError, jsonError, jsonSuccess } from "@/lib/http";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { emptyPassGuaranteeProgress, getPassGuaranteeProgress } from "@/lib/pass-guarantee";

export const dynamic = "force-dynamic";

/**
 * Progress toward the Pass Guarantee completion criteria for the signed-in
 * account. Fails soft to an unenrolled result so the dashboard card can render
 * unconditionally and simply show nothing for accounts without the bundle.
 */
export async function GET(request: Request) {
  const requestContext = createRequestContext(request, { route: "/api/pass-guarantee/status" });
  const env = resolveEnv();

  try {
    const user = await getAuthenticatedUser();
    if (!user?.id) {
      return jsonSuccess({ ...emptyPassGuaranteeProgress(), requiresAuth: true }, 200, {
        requestId: requestContext.requestId,
      });
    }

    if (!hasDatabase(env)) {
      if (!allowLocalFallbacks(env)) {
        return jsonError(503, "PASS_GUARANTEE_UNAVAILABLE", "Entitlement storage is not configured.", requestContext, {
          requestId: requestContext.requestId,
        });
      }
      return jsonSuccess(emptyPassGuaranteeProgress(), 200, { requestId: requestContext.requestId });
    }

    const db = getDB(env);
    const hostedUser = await getHostedUserByAccount(db, { userId: user.id, email: user.email ?? null });
    if (!hostedUser) {
      return jsonSuccess(emptyPassGuaranteeProgress(), 200, { requestId: requestContext.requestId });
    }

    const progress = await getPassGuaranteeProgress(db, hostedUser.id);
    return jsonSuccess(progress, 200, { requestId: requestContext.requestId });
  } catch (error) {
    return handleRouteError(error, { route: "/api/pass-guarantee/status", requestId: requestContext.requestId });
  }
}
