const KEY_STATS = 'scamshield_referral_stats';
const KEY_CODE = 'scamshield_referral_code';

export function getReferralCode(userId: string): string {
  if (typeof window === 'undefined') return 'SS-REF-FALLBACK';
  try {
    let code = localStorage.getItem(KEY_CODE);
    if (!code) {
      code = 'SS-' + userId.slice(0, 8).toUpperCase() + '-' + Math.random().toString(36).slice(2, 8).toUpperCase();
      localStorage.setItem(KEY_CODE, code);
    }
    return code;
  } catch {
    return 'SS-REF-FALLBACK';
  }
}

export interface ReferralStats {
  invitedCount: number;
  freeDaysEarned: number;
}

export function getReferralStats(userId: string): ReferralStats {
  if (typeof window === 'undefined') return { invitedCount: 0, freeDaysEarned: 0 };
  try {
    const raw = localStorage.getItem(KEY_STATS + '_' + userId);
    if (!raw) return { invitedCount: 0, freeDaysEarned: 0 };
    const parsed = JSON.parse(raw) as ReferralStats;
    return { invitedCount: Number(parsed.invitedCount) || 0, freeDaysEarned: Number(parsed.freeDaysEarned) || 0 };
  } catch {
    return { invitedCount: 0, freeDaysEarned: 0 };
  }
}

export function addReferralInvite(userId: string): void {
  const stats = getReferralStats(userId);
  stats.invitedCount += 1;
  stats.freeDaysEarned += 7;
  try {
    localStorage.setItem(KEY_STATS + '_' + userId, JSON.stringify(stats));
  } catch {
    // ignore
  }
}

export function getReferralLink(userId: string): string {
  const code = getReferralCode(userId);
  const base = typeof window !== 'undefined' ? window.location.origin : 'https://scamshield.app';
  return base + '/?ref=' + encodeURIComponent(code);
}
