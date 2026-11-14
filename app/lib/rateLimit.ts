/**
 * Light in-memory per-IP rate limiter, dependency-free.
 *
 * This is deliberately the ONLY abuse control on the chatbot's whiteboard
 * flow: it throttles without excluding anyone. There is intentionally NO
 * admin-token check here — non-admin visitors must be able to use the bot
 * (per Keith's correction 2026-10-22; the admin-only guard was not a good
 * solution). If PR #198's guard file ever lands, its rate limiter and this
 * one should be consolidated into a single shared helper.
 *
 * Note: a single serverless instance holds its own bucket, so this bounds
 * per-instance burst rather than global abuse. The confirmation-before-log
 * step is the other half of the abuse story for match logging.
 */

export interface RateLimitOptions {
  /** Max requests per window. Defaults to 20. */
  maxRequests?: number;
  /** Window length in ms. Defaults to 60_000 (1 minute). */
  windowMs?: number;
  /** Bucket namespace so different endpoints don't share a budget. Defaults to 'default'. */
  key?: string;
}

const hitsByKey = new Map<string, number[]>();

export function checkRateLimit(
  clientIp: string | null,
  opts: RateLimitOptions = {}
): { ok: boolean; retryAfterMs?: number } {
  const maxRequests = opts.maxRequests ?? 20;
  const windowMs = opts.windowMs ?? 60_000;
  const namespace = opts.key ?? 'default';
  const ip = clientIp && clientIp.length > 0 ? clientIp : 'unknown';
  const bucketKey = `${namespace}:${ip}`;
  const now = Date.now();
  const recent = (hitsByKey.get(bucketKey) ?? []).filter(
    (timestamp) => now - timestamp < windowMs
  );

  if (recent.length >= maxRequests) {
    return { ok: false, retryAfterMs: windowMs - (now - recent[0]) };
  }

  recent.push(now);
  hitsByKey.set(bucketKey, recent);

  // Occasional pruning so the map cannot grow without bound.
  if (hitsByKey.size > 5000) {
    for (const [key, timestamps] of hitsByKey) {
      if (timestamps.every((t) => now - t >= windowMs)) {
        hitsByKey.delete(key);
      }
    }
  }

  return { ok: true };
}

export function resetRateLimit(): void {
  hitsByKey.clear();
}

/**
 * Best-effort client IP from the request headers.
 */
export function getClientIp(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return request.headers.get('x-real-ip');
}
