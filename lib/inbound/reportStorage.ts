import type { AnalysisResult } from '@/lib/types';
import { getUpstashRedis } from '@/lib/redis/upstash';

const KEY_PREFIX = 'email_report:';
/** Default 7 days — links in email should remain valid long enough to open later. */
const TTL_SECONDS = 60 * 60 * 24 * 7;

export interface StoredEmailReport {
  result: AnalysisResult;
  /** Plain text that was analyzed (email body after cleanup). */
  sourceText: string;
  subject?: string;
  replyTo?: string;
  createdAt: string;
}

const devMemoryStore = new Map<string, string>();

export async function saveEmailReport(token: string, data: StoredEmailReport): Promise<boolean> {
  const key = KEY_PREFIX + token;
  const payload = JSON.stringify(data);
  const client = getUpstashRedis();
  if (client) {
    await client.set(key, data as unknown as Record<string, unknown>, { ex: TTL_SECONDS });
    return true;
  }
  if (process.env.NODE_ENV === 'development') {
    devMemoryStore.set(key, payload);
    console.warn('[email-report] Using in-memory store; set UPSTASH_REDIS_REST_URL + TOKEN for persistence.');
    return true;
  }
  return false;
}

export async function getEmailReport(token: string): Promise<StoredEmailReport | null> {
  const key = KEY_PREFIX + token;
  const client = getUpstashRedis();
  if (client) {
    const v = await client.get<StoredEmailReport | string>(key);
    if (v == null) return null;
    if (typeof v === 'object') return v as StoredEmailReport;
    if (typeof v === 'string') {
      try {
        return JSON.parse(v) as StoredEmailReport;
      } catch {
        return null;
      }
    }
    return null;
  }
  if (process.env.NODE_ENV === 'development') {
    const raw = devMemoryStore.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StoredEmailReport;
    } catch {
      return null;
    }
  }
  return null;
}
