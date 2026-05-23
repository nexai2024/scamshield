import { auth } from '@clerk/nextjs/server';
import { getClientIp } from '@/lib/rateLimit/clientIp';

export type ScanQuotaSubject = {
  /** Redis / memory quota key, e.g. `user:usr_abc` or `ip:203.0.113.1` */
  key: string;
  clerkUserId: string | null;
};

export async function resolveScanQuotaSubject(request: Request): Promise<ScanQuotaSubject> {
  try {
    const { userId } = await auth();
    if (userId) {
      return { key: `user:${userId}`, clerkUserId: userId };
    }
  } catch {
    // Clerk not configured
  }
  const ip = getClientIp(request);
  return { key: `ip:${ip}`, clerkUserId: null };
}
