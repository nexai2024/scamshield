const KEY_STATS = 'scamshield_referral_stats';
const KEY_CODE = 'scamshield_referral_code';

export function getReferralCode(email: string): string {
  try {
    let code = localStorage.getItem(KEY_CODE);
    if (!code) {
      code = `SS-${email.slice(0, 4).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      localStorage.setItem(KEY_CODE, code);
    }
    return code;
  } catch {
    return `SS-REF-${Date.now().toString(36).toUpperCase()}`;
  }
}

export interface ReferralStats {
  invitedCount: number;
  freeDaysEarned: number;
}

export function getReferralStats(email: string): ReferralStats {
  try {
    const raw = localStorage.getItem(`${KEY_STATS}_${email}`);
    if (!raw) return { invitedCount: 0, freeDaysEarned: 0 };
    const parsed = JSON.parse(raw) as ReferralStats;
    return {
      invitedCount: Number(parsed.invitedCount) || 0,
      freeDaysEarned: Number(parsed.freeDaysEarned) || 0,
    };
  } catch {
    return { invitedCount: 0, freeDaysEarned: 0 };
  }
}

export function addReferralInvite(email: string): void {
  const stats = getReferralStats(email);
  stats.invitedCount += 1;
  stats.freeDaysEarned += 7; // 1 week per invite (mock)
  try {
    localStorage.setItem(`${KEY_STATS}_${email}`, JSON.stringify(stats));
  } catch {
    // ignore
  }
}

export function getReferralLink(email: string): string {
  const code = getReferralCode(email);
  const base = typeof window !== 'undefined' ? window.location.origin : 'https://scamshield.app';
  return `${base}/?ref=${encodeURIComponent(code)}`;
}
