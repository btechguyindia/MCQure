// In-memory rate limiter for authentication endpoints.
// Suitable for a single-instance deployment; swap for a shared store
// (e.g. Redis) when scaling horizontally.

const WINDOW_MS = 60_000;

const hits = new Map<string, { count: number; resetAt: number }>();

function prune(now: number) {
  for (const [key, entry] of hits) {
    if (entry.resetAt <= now) hits.delete(key);
  }
}

/**
 * Returns true when the request is allowed. When false, the caller should
 * return a 429 response.
 */
export function rateLimit(key: string, max: number): boolean {
  const now = Date.now();
  prune(now);

  const entry = hits.get(key);
  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count += 1;
  return true;
}

/** Clears any recorded attempts for a key (e.g. after a successful login). */
export function resetKey(key: string) {
  hits.delete(key);
}

/** Key derived from a request's IP address. */
export function ipKey(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  const ip = fwd ? fwd.split(",")[0].trim() : "local";
  return `ip:${ip}`;
}
