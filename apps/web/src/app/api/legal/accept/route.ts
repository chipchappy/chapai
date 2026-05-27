import { z } from "zod";
import { getDB, hasDatabase, resolveEnv } from "@/lib/db";
import { jsonError, jsonSuccess } from "@/lib/http";
import { createRequestContext, logError } from "@/lib/logger";
import { recordCurrentPolicyAcceptances } from "@/lib/legal-store";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email(),
  source: z.enum(["auth_login", "checkout"]).default("auth_login"),
  acceptedTerms: z.literal(true),
  acceptedPrivacy: z.literal(true),
});

export async function POST(request: Request) {
  const requestContext = createRequestContext(request, { route: "/api/legal/accept" });

  try {
    const env = resolveEnv();
    if (!hasDatabase(env)) {
      return jsonError(503, "LEGAL_STORAGE_UNAVAILABLE", "Legal acceptance storage is not configured.", requestContext, {
        requestId: requestContext.requestId,
      });
    }

    const body = await request.json();
    const { email, source } = schema.parse(body);
    const user = await getAuthenticatedUser();
    const db = getDB(env);

    await recordCurrentPolicyAcceptances(db, {
      email,
      userId: user?.id ?? null,
      source,
      request,
    });

    return jsonSuccess({ recorded: true }, 200, { requestId: requestContext.requestId });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(400, "LEGAL_ACCEPTANCE_INVALID", "Terms and privacy acceptance is required.", requestContext, {
        requestId: requestContext.requestId,
      });
    }

    logError("legal/accept error", error, requestContext);
    return jsonError(500, "LEGAL_ACCEPTANCE_FAILED", "Could not record policy acceptance.", requestContext, {
      requestId: requestContext.requestId,
    });
  }
}
