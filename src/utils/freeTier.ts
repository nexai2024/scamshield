const KEY_PREFIX = 'scamshield_scans_';
const FREE_DAILY_LIMIT = 1;

function todayKey(email: string): string {
  const d = new Date();
  const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return `${KEY_PREFIX}${email}_${dateStr}`;
}

export function getScansUsedToday(email: string): number {
  try {
    const raw = localStorage.getItem(todayKey(email));
    if (raw == null) return 0;
    const n = parseInt(raw, 10);
    return Number.isNaN(n) ? 0 : Math.max(0, n);
  } catch {
    return 0;
  }
}

export function canScanToday(email: string, isSubscribed: boolean): boolean {
  if (isSubscribed) return true;
  return getScansUsedToday(email) < FREE_DAILY_LIMIT;
}

export function incrementScansToday(email: string): void {
  const key = todayKey(email);
  const current = getScansUsedToday(email);
  try {
    localStorage.setItem(key, String(current + 1));
  } catch {
    // ignore
  }
}

export const FREE_DAILY_LIMIT_CONST = FREE_DAILY_LIMIT;
