// In-memory fixed-window rate limiter.
//
// Lifecycle: the Map lives at module scope so it's shared across requests
// served by the same Node.js process. With Railway running a single replica
// today, that's effectively a global limiter. If Clipmer ever scales to
// multiple replicas, swap this module's implementation for an Upstash /
// Redis-backed one — the public surface (`take`) stays the same.

type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

// Periodic prune so the map doesn't grow unboundedly in long-running processes.
const prune = () => {
  const now = Date.now();
  for (const [key, bucket] of store) {
    if (bucket.resetAt <= now) store.delete(key);
  }
};
const interval = setInterval(prune, 60_000);
// Don't keep the process alive just for the prune timer.
if (typeof interval === "object" && interval !== null && "unref" in interval) {
  (interval as NodeJS.Timeout).unref();
}

export type RateLimitResult = { ok: boolean; retryAfterSec: number };

export function take(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket || bucket.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: 0 };
  }

  if (bucket.count >= limit) {
    return { ok: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { ok: true, retryAfterSec: 0 };
}
