import { createRequestContext } from "@/lib/logger";
import { jsonSuccess } from "@/lib/http";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestContext = createRequestContext(request, { route: "/api/auth/status" });
  const user = await getAuthenticatedUser();

  return jsonSuccess(
    {
      authenticated: Boolean(user),
      email: user?.email ?? null,
    },
    200,
    { requestId: requestContext.requestId },
  );
}
