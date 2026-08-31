import { getServerEnv } from "@/lib/env";

/**
 * KV-backed fixed-window rate limiting for the public API surface.
 *
 * Two properties are deliberate:
 *
 * 1. **It fails open.** If KV is slow, missing, or throws, the request is
 *    allowed. A limiter that takes the site down when its own storage hiccups
 *    is worse than the abuse it prevents — and this sits in front of the study
 *    flow paying customers use.
 *
 * 2. **It is a fixed window, not a sliding one.** KV allows roughly one write
 *    per second per key and is eventually consistent, so a determined attacker
 *    can exceed a burst at a window boundary. That is an accepted trade: the
 *    goal is to stop runaway clients and casual scraping of a bank that costs
 *    money to serve, not to survive a targeted attack. Cloudflare's own WAF
 *    rate-limiting rules are the right tool for that.
 */

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: number;
};

type KvLike = {
  get?: (key: string) => Promise<string | null>;
  put?: (key: string, value: string, options?: { expirationTtl?: number }) => Promise<void>;
};

function getKv(): KvLike | null {
  try {
    const kv = getServerEnv().KV as KvLike | undefined;
    if (kv && typeof kv.get === "function" && typeof kv.put === "function") return kv;
  } catch {
    // No env at build time, and local dev has no KV binding — both fail open.
  }
  return null;
}

/**
 * Identify the caller. A signed-in user is limited as themselves so that a
 * shared campus or hospital NAT does not throttle a whole cohort on one IP;
 * anonymous callers fall back to the Cloudflare-provided client IP.
 */
export function rateLimitIdentity(request: Request, userId?: string | null) {
  if (userId) return `u:${userId}`;
  const ip = request.headers.get("cf-connecting-ip")
    ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? "unknown";
  return `ip:${ip}`;
}

export async function checkRateLimit(input: {
  route: string;
  identity: string;
  limit: number;
  windowSeconds: number;
}): Promise<RateLimitResult> {
  const { route, identity, limit, windowSeconds } = input;
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - (now % windowSeconds);
  const resetAt = windowStart + windowSeconds;
  const key = `rl:${route}:${identity}:${windowStart}`;

  const kv = getKv();
  if (!kv) return { allowed: true, remaining: limit, limit, resetAt };

  try {
    const raw = await kv.get!(key);
    const used = raw ? Number(raw) || 0 : 0;
    if (used >= limit) {
      return { allowed: false, remaining: 0, limit, resetAt };
    }
    // Expire a little past the window so a clock skew cannot strand a counter.
    await kv.put!(key, String(used + 1), { expirationTtl: windowSeconds + 60 });
    return { allowed: true, remaining: Math.max(0, limit - used - 1), limit, resetAt };
  } catch {
    return { allowed: true, remaining: limit, limit, resetAt };
  }
}

/** Standard headers so clients can back off rather than retry blindly. */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    "RateLimit-Limit": String(result.limit),
    "RateLimit-Remaining": String(result.remaining),
    "RateLimit-Reset": String(Math.max(0, result.resetAt - Math.floor(Date.now() / 1000))),
  };
  if (!result.allowed) {
    headers["Retry-After"] = String(Math.max(1, result.resetAt - Math.floor(Date.now() / 1000)));
  }
  return headers;
}
