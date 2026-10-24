/**
 * Light in-memory per-IP rate limiter for the chatbot endpoints.
 * The chatbot is open to all visitors (no admin gate, per 2026-10-22 decision),
 * so this is the abuse control that bounds OpenAI spend: 20 requests per minute
 * per IP, with a Retry-After hint on 429. Kept dependency-free and deliberately
 * simple — a single Vercel serverless instance holds its own bucket.
 */
const RATE_LIMIT_MAX_REQUESTS = 20;
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const hitsByIp = new Map<string, number[]>();

export function checkChatbotRateLimit(clientIp: string | null): {
  ok: boolean;
  retryAfterMs?: number;
} {
  const key = clientIp && clientIp.length > 0 ? clientIp : 'unknown';
  const now = Date.now();
  const recent = (hitsByIp.get(key) ?? []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS
  );

  if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
    return { ok: false, retryAfterMs: RATE_LIMIT_WINDOW_MS - (now - recent[0]) };
  }

  recent.push(now);
  hitsByIp.set(key, recent);

  // Occasional pruning so the map cannot grow without bound.
  if (hitsByIp.size > 5000) {
    for (const [ip, timestamps] of hitsByIp) {
      if (timestamps.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) {
        hitsByIp.delete(ip);
      }
    }
  }

  return { ok: true };
}

export function resetChatbotRateLimit(): void {
  hitsByIp.clear();
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
