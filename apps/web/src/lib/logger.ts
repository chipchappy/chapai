import * as Sentry from "@sentry/nextjs";
import { getServerEnv } from "@/lib/env";

export type LogLevel = "info" | "warn" | "error";

type LogContext = Record<string, unknown>;

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return error;
}

export function createRequestContext(request: Request, extra: LogContext = {}) {
  const url = new URL(request.url);
  return {
    requestId: request.headers.get("x-request-id") ?? crypto.randomUUID(),
    method: request.method,
    path: url.pathname,
    ...extra,
  };
}

export function log(level: LogLevel, message: string, context: LogContext = {}) {
  const env = getServerEnv();
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    appEnv: env.APP_ENV,
    runtimeTarget: env.DB ? "cloudflare-worker" : env.VERCEL ? "vercel" : "node",
    ...context,
  };

  const writer =
    level === "error"
      ? console.error
      : level === "warn"
        ? console.warn
        : console.info;

  writer(JSON.stringify(payload));
}

export function logError(message: string, error: unknown, context: LogContext = {}) {
  if (error instanceof Error) {
    Sentry.captureException(error, {
      extra: context,
      tags: {
        appEnv: getServerEnv().APP_ENV,
      },
    });
  } else {
    Sentry.captureMessage(message, {
      level: "error",
      extra: {
        ...context,
        error: serializeError(error),
      },
    });
  }

  log("error", message, {
    ...context,
    error: serializeError(error),
  });
}
