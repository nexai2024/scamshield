import { getUpstashRedis } from '@/lib/redis/upstash';
import { FREE_DAILY_SCAN_LIMIT } from '@/lib/plans';
import type { ScanQuotaSubject } from '@/lib/server/scanSubject';

const KEY_PREFIX = 'scanquota:daily:';
const TTL_SECONDS = 60 * 60 * 48;

export type ScanQuotaCheckResult =
  | {
      allowed: true;
      isPro: boolean;
      used: number;
      limit: number;
      remaining: number;
    }
  | {
      allowed: false;
      reason: 'daily_limit_exceeded';
      used: number;
      limit: number;
      remaining: 0;
    }
  | {
      allowed: false;
      reason: 'quota_storage_unavailable';
      used: number;
      limit: number;
      remaining: 0;
    };

function todayUtcDateString(now = new Date()): string {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
}

function quotaRedisKey(subjectKey: string, dateStr: string): string {
  return `${KEY_PREFIX}${subjectKey}:${dateStr}`;
}

type MemoryEntry = { date: string; count: number };
const memoryDaily = new Map<string, MemoryEntry>();

function memoryGetCount(subjectKey: string, dateStr: string): number {
  const entry = memoryDaily.get(subjectKey);
  if (!entry || entry.date !== dateStr) return 0;
  return entry.count;
}

function memoryIncrement(subjectKey: string, dateStr: string): number {
  const current = memoryGetCount(subjectKey, dateStr);
  const next = current + 1;
  memoryDaily.set(subjectKey, { date: dateStr, count: next });
  return next;
}

export async function getDailyScanCount(subject: ScanQuotaSubject): Promise<number | null> {
  const dateStr = todayUtcDateString();
  const redis = getUpstashRedis();

  if (redis) {
    try {
      const raw = await redis.get<number | string>(quotaRedisKey(subject.key, dateStr));
      if (raw == null) return 0;
      const n = typeof raw === 'number' ? raw : parseInt(String(raw), 10);
      return Number.isNaN(n) ? 0 : Math.max(0, n);
    } catch {
      return null;
    }
  }

  return memoryGetCount(subject.key, dateStr);
}

export async function checkScanQuota(
  subject: ScanQuotaSubject,
  isPro: boolean
): Promise<ScanQuotaCheckResult> {
  const limit = FREE_DAILY_SCAN_LIMIT;

  if (isPro) {
    return { allowed: true, isPro: true, used: 0, limit, remaining: 999 };
  }

  const used = await getDailyScanCount(subject);
  if (used === null) {
    return { allowed: false, reason: 'quota_storage_unavailable', used: 0, limit, remaining: 0 };
  }

  if (used >= limit) {
    return { allowed: false, reason: 'daily_limit_exceeded', used, limit, remaining: 0 };
  }

  return { allowed: true, isPro: false, used, limit, remaining: limit - used };
}

/** Call only after a successful analysis for non-Pro users. */
export async function recordSuccessfulScan(subject: ScanQuotaSubject): Promise<void> {
  const dateStr = todayUtcDateString();
  const redis = getUpstashRedis();
  const fullKey = quotaRedisKey(subject.key, dateStr);

  if (redis) {
    try {
      const next = await redis.incr(fullKey);
      if (next === 1) {
        await redis.expire(fullKey, TTL_SECONDS);
      }
      return;
    } catch {
      // fall through to memory
    }
  }

  memoryIncrement(subject.key, dateStr);
}

export function scanQuotaResponseHeaders(
  check: ScanQuotaCheckResult
): Record<string, string> {
  const headers: Record<string, string> = {
    'X-Scan-Quota-Limit': String(check.limit),
    'X-Scan-Quota-Used': String(check.used),
    'X-Scan-Quota-Remaining': String(check.remaining),
    'X-Scan-Plan': check.allowed && 'isPro' in check && check.isPro ? 'pro' : 'free',
  };
  return headers;
}

export { FREE_DAILY_SCAN_LIMIT };
