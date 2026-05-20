import { Ratelimit } from '@upstash/ratelimit';
import { getUpstashRedis } from '@/lib/redis/upstash';
import { touchFixedWindow } from '@/lib/rateLimit/memoryFixedWindow';
import type { RateLimitResult } from '@/lib/rateLimit/response';
import { getClientIp } from '@/lib/rateLimit/clientIp';

/** OpenAI-backed scan — keep tight. */
const ANALYZE_MAX = 12;
const ANALYZE_WINDOW = '1 m' as const;

/** NER merge endpoint. */
const EXTRACT_MAX = 30;
const EXTRACT_WINDOW = '1 m' as const;

/** Per-entity validation (UI may batch). */
const VALIDATE_MAX = 90;
const VALIDATE_WINDOW = '1 m' as const;

/** Authenticated checkout — abuse protection. */
const CHECKOUT_MAX = 8;
const CHECKOUT_WINDOW = '1 m' as const;

/** Inbound email webhook (by connecting IP). */
const INBOUND_MAX = 20;
const INBOUND_WINDOW = '1 m' as const;

/** Scan audit settings / list (authenticated). */
const SCAN_AUDIT_MAX = 24;
const SCAN_AUDIT_WINDOW = '1 m' as const;

/** Marketing lead capture (by IP). */
const LEADS_MAX = 6;
const LEADS_WINDOW = '1 m' as const;

const WINDOW_MS = 60_000;

function createLimiterGetter(prefix: string, max: number, window: typeof ANALYZE_WINDOW) {
  let cached: Ratelimit | null | undefined;
  return (): Ratelimit | null => {
    if (cached !== undefined) return cached;
    const redis = getUpstashRedis();
    if (!redis) {
      cached = null;
      return null;
    }
    cached = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(max, window),
      prefix: `rl:${prefix}`,
      analytics: false,
    });
    return cached;
  };
}

const getAnalyzeLimiter = createLimiterGetter('analyze', ANALYZE_MAX, ANALYZE_WINDOW);
const getExtractLimiter = createLimiterGetter('extract', EXTRACT_MAX, EXTRACT_WINDOW);
const getValidateLimiter = createLimiterGetter('validate', VALIDATE_MAX, VALIDATE_WINDOW);
const getCheckoutLimiter = createLimiterGetter('checkout', CHECKOUT_MAX, CHECKOUT_WINDOW);
const getInboundLimiter = createLimiterGetter('inbound', INBOUND_MAX, INBOUND_WINDOW);
const getScanAuditLimiter = createLimiterGetter('scan_audit', SCAN_AUDIT_MAX, SCAN_AUDIT_WINDOW);
const getLeadsLimiter = createLimiterGetter('leads', LEADS_MAX, LEADS_WINDOW);

async function limitWithFallback(
  getRedisLimiter: () => Ratelimit | null,
  memoryNs: string,
  key: string,
  max: number,
  windowMs: number
): Promise<RateLimitResult> {
  if (process.env.RATE_LIMIT_DISABLED === 'true') {
    const now = Date.now();
    return { success: true, limit: max, remaining: max, reset: now + windowMs };
  }

  const redisLimiter = getRedisLimiter();
  if (redisLimiter) {
    const out = await redisLimiter.limit(key);
    return {
      success: out.success,
      limit: out.limit,
      remaining: out.remaining,
      reset: out.reset,
    };
  }

  return touchFixedWindow(memoryNs, key, max, windowMs);
}

export async function limitAnalyze(key: string): Promise<RateLimitResult> {
  return limitWithFallback(getAnalyzeLimiter, 'mem:analyze', key, ANALYZE_MAX, WINDOW_MS);
}

export async function limitExtractEntities(key: string): Promise<RateLimitResult> {
  return limitWithFallback(getExtractLimiter, 'mem:extract', key, EXTRACT_MAX, WINDOW_MS);
}

export async function limitValidateEntity(key: string): Promise<RateLimitResult> {
  return limitWithFallback(getValidateLimiter, 'mem:validate', key, VALIDATE_MAX, WINDOW_MS);
}

export async function limitCheckoutSession(userId: string): Promise<RateLimitResult> {
  return limitWithFallback(getCheckoutLimiter, 'mem:checkout', userId, CHECKOUT_MAX, WINDOW_MS);
}

export async function limitInboundEmailWebhook(ip: string): Promise<RateLimitResult> {
  return limitWithFallback(getInboundLimiter, 'mem:inbound', ip, INBOUND_MAX, WINDOW_MS);
}

export async function limitScanAudit(userId: string): Promise<RateLimitResult> {
  return limitWithFallback(getScanAuditLimiter, 'mem:scan_audit', userId, SCAN_AUDIT_MAX, WINDOW_MS);
}

export async function limitLeads(ip: string): Promise<RateLimitResult> {
  return limitWithFallback(getLeadsLimiter, 'mem:leads', ip, LEADS_MAX, WINDOW_MS);
}

/**
 * Prefer Clerk user id when signed in; otherwise client IP (NAT-shared caveat for guests).
 */
export async function getApiRateLimitSubject(request: Request): Promise<string> {
  try {
    const { auth } = await import('@clerk/nextjs/server');
    const { userId } = await auth();
    if (userId) return `user:${userId}`;
  } catch {
    // Clerk not configured
  }
  return `ip:${getClientIp(request)}`;
}

export { getClientIp };
