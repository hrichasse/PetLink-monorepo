import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { HTTP_STATUS } from "../constants/http-status";
import { ERROR_CODES } from "../errors/error-codes";
import { fail } from "../responses/api-response";

export type RateLimitOptions = {
  /** Static name that namespaces this limiter, e.g. "auth:signup". */
  bucket: string;
  /** Max requests allowed per identifier within the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
};

type Hit = { count: number; resetAt: number };

/**
 * In-memory fixed-window store.
 *
 * NOTE: On serverless (Vercel) this lives per warm instance and is NOT shared
 * across cold-started instances, so it throttles bursts against a single warm
 * container rather than providing globally-consistent limits. It is zero-infra
 * and a meaningful first line of defense. To make it distributed, replace the
 * `store` read/write in `consumeRateLimit` with a Redis/Upstash-backed store —
 * no call sites need to change.
 */
const store = new Map<string, Hit>();

const MAX_STORE_ENTRIES_BEFORE_SWEEP = 5000;

const pruneExpired = (now: number): void => {
  if (store.size < MAX_STORE_ENTRIES_BEFORE_SWEEP) return;
  for (const [key, hit] of store) {
    if (hit.resetAt <= now) store.delete(key);
  }
};

/**
 * Extracts the best-effort client IP from proxy headers (Vercel sets
 * `x-forwarded-for`). Falls back to `"unknown"` so requests without a
 * resolvable IP share a single bucket instead of bypassing the limiter.
 */
export const getClientIp = (request: NextRequest): string => {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
};

export type RateLimitResult = {
  allowed: boolean;
  /** Milliseconds until the window resets (0 when allowed). */
  retryAfterMs: number;
  /** Remaining requests in the current window. */
  remaining: number;
};

/**
 * Records a request against `identifier` and reports whether it is allowed.
 * Fixed-window: the first request opens a window of `windowMs`; the window
 * resets once it elapses.
 */
export const consumeRateLimit = (identifier: string, options: RateLimitOptions): RateLimitResult => {
  const now = Date.now();
  pruneExpired(now);

  const key = `${options.bucket}:${identifier}`;
  const hit = store.get(key);

  if (!hit || hit.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true, retryAfterMs: 0, remaining: options.limit - 1 };
  }

  if (hit.count >= options.limit) {
    return { allowed: false, retryAfterMs: hit.resetAt - now, remaining: 0 };
  }

  hit.count += 1;
  return { allowed: true, retryAfterMs: 0, remaining: options.limit - hit.count };
};

/**
 * Wraps a route handler with per-IP rate limiting. Returns a standardized 429
 * response (with a `Retry-After` header) when the limit is exceeded, otherwise
 * delegates to `handler`. Compose it inside `withErrorHandler`:
 *
 *   export async function POST(request: NextRequest) {
 *     return withErrorHandler(() =>
 *       withRateLimit(request, { bucket: "auth:signup", limit: 5, windowMs: 60_000 }, () =>
 *         signupController(request)
 *       )
 *     );
 *   }
 */
export const withRateLimit = async <T>(
  request: NextRequest,
  options: RateLimitOptions,
  handler: () => Promise<NextResponse<T>>
): Promise<NextResponse> => {
  const result = consumeRateLimit(getClientIp(request), options);

  if (!result.allowed) {
    const retryAfterSeconds = Math.ceil(result.retryAfterMs / 1000);
    const response = fail(
      "Demasiadas solicitudes. Intenta nuevamente en unos momentos.",
      ERROR_CODES.RATE_LIMITED,
      { retryAfterSeconds },
      HTTP_STATUS.TOO_MANY_REQUESTS
    );
    response.headers.set("Retry-After", String(retryAfterSeconds));
    return response;
  }

  return handler();
};
