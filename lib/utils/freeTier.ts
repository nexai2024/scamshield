import { FREE_DAILY_SCAN_LIMIT } from '@/lib/plans';

const KEY_PREFIX = 'scamshield_scans_';

/** UTC calendar date — must match server `lib/server/scanQuota.ts`. */
function todayKey(userId: string): string {
  const d = new Date();
  const dateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
  return `${KEY_PREFIX}${userId}_${dateStr}`;
}

export function getScansUsedToday(userId: string): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(todayKey(userId));
    if (raw == null) return 0;
    const n = parseInt(raw, 10);
    return Number.isNaN(n) ? 0 : Math.max(0, n);
  } catch {
    return 0;
  }
}

export function canScanToday(userId: string, isSubscribed: boolean): boolean {
  if (isSubscribed) return true;
  return getScansUsedToday(userId) < FREE_DAILY_SCAN_LIMIT;
}

export function incrementScansToday(userId: string): void {
  const key = todayKey(userId);
  const current = getScansUsedToday(userId);
  try {
    localStorage.setItem(key, String(current + 1));
  } catch {
    // ignore
  }
}

/** Sync local counter from analyze API response headers (server source of truth). */
export function syncScansFromQuotaHeaders(headers: Headers, userId: string): void {
  if (typeof window === 'undefined') return;
  const used = headers.get('X-Scan-Quota-Used');
  if (used == null) return;
  const n = parseInt(used, 10);
  if (Number.isNaN(n)) return;
  try {
    localStorage.setItem(todayKey(userId), String(Math.max(0, n)));
  } catch {
    // ignore
  }
}

export const FREE_DAILY_LIMIT_CONST = FREE_DAILY_SCAN_LIMIT;
