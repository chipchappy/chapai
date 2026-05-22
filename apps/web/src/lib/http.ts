import { ZodError } from "zod";
import { logError } from "@/lib/logger";

type JsonOptions = {
  requestId?: string;
  headers?: HeadersInit;
};

function buildJsonHeaders(options?: JsonOptions) {
  return {
    "Cache-Control": "no-store, max-age=0",
    Pragma: "no-cache",
    ...(options?.requestId ? { "X-Request-Id": options.requestId } : {}),
    ...(options?.headers ?? {}),
  };
}

export function jsonError(
  status: number,
  code: string,
  message: string,
  details?: Record<string, unknown>,
  options?: JsonOptions,
) {
  return Response.json(
    {
      success: false,
      error: message,
      code,
      ...(details ? { details } : {}),
    },
    {
      status,
      headers: buildJsonHeaders(options),
    },
  );
}

export function jsonSuccess<T>(data: T, status = 200, options?: JsonOptions) {
  return Response.json(
    { success: true, data },
    {
      status,
      headers: buildJsonHeaders(options),
    },
  );
}

export function handleRouteError(error: unknown, options: { requestId?: string; route: string; fallbackMessage?: string }) {
  if (error instanceof ZodError) {
    return jsonError(
      400,
      "VALIDATION_ERROR",
      "Invalid request.",
      {
        requestId: options.requestId,
        issues: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { requestId: options.requestId },
    );
  }

  logError(`${options.route} route failed`, error, { requestId: options.requestId, route: options.route });
  return jsonError(
    500,
    "INTERNAL_ERROR",
    options.fallbackMessage ?? "Internal server error.",
    {
      requestId: options.requestId,
    },
    { requestId: options.requestId },
  );
}
