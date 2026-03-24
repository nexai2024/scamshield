/** In-process fixed-window limiter when Upstash Redis is not configured (dev / single instance). */

export type WindowLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  /** Unix ms when the current window resets. */
  reset: number;
};

const stores = new Map<string, Map<string, { count: number; windowStart: number }>>();
const MAX_KEYS_PER_NAMESPACE = 50_000;

function getStore(namespace: string): Map<string, { count: number; windowStart: number }> {
  let s = stores.get(namespace);
  if (!s) {
    s = new Map();
    stores.set(namespace, s);
  }
  return s;
}

export function touchFixedWindow(
  namespace: string,
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now()
): WindowLimitResult {
  if (process.env.RATE_LIMIT_DISABLED === 'true') {
    return { success: true, limit, remaining: limit, reset: now + windowMs };
  }

  const store = getStore(namespace);
  if (store.size > MAX_KEYS_PER_NAMESPACE && !store.has(key)) {
    return { success: false, limit, remaining: 0, reset: now + windowMs };
  }

  let b = store.get(key);
  if (!b || now - b.windowStart >= windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return { success: true, limit, remaining: limit - 1, reset: now + windowMs };
  }
  if (b.count >= limit) {
    return { success: false, limit, remaining: 0, reset: b.windowStart + windowMs };
  }
  b = { count: b.count + 1, windowStart: b.windowStart };
  store.set(key, b);
  return { success: true, limit, remaining: limit - b.count, reset: b.windowStart + windowMs };
}
