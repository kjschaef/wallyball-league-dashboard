import { cookies } from 'next/headers';

/**
 * Returns true when the request carries the admin_token cookie set by /api/auth
 * (admin sign-in). Same convention as the other admin-protected API routes
 * (e.g. the signups DELETE handler).
 */
export async function isAdminRequest(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get('admin_token')?.value === 'true';
}

/**
 * Light in-memory per-IP rate limiter (defense in depth).
 * Bounds OpenAI spend if an admin session ever leaks; not a replacement for
 * the admin check above. Kept dependency-free and deliberately simple — a
 * single Vercel serverless instance holds its own bucket.
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
