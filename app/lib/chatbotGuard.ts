import { cookies } from 'next/headers';

/**
 * Returns true when the request carries the admin_token cookie set by /api/auth
 * (admin sign-in). Same convention as the other admin-protected API routes
 * (e.g. the signups DELETE handler).
 *
 * Accepts an optional request object to inspect incoming cookies/headers directly,
 * with fallback to Next.js `cookies()` within request contexts.
 */
export async function isAdminRequest(request?: Request): Promise<boolean> {
  if (request) {
    const nextReq = request as Request & { cookies?: { get?: (name: string) => { value?: string } | undefined } };
    if (nextReq.cookies && typeof nextReq.cookies.get === 'function') {
      const cookieVal = nextReq.cookies.get('admin_token')?.value;
      if (cookieVal === 'true') return true;
    }
    const cookieHeader = request.headers?.get?.('cookie');
    if (cookieHeader) {
      const matches = cookieHeader.match(/(?:^|;\s*)admin_token=([^;]+)/);
      if (matches && matches[1] === 'true') return true;
    }
  }

  try {
    const cookieStore = await cookies();
    return cookieStore.get('admin_token')?.value === 'true';
  } catch {
    return false;
  }
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
