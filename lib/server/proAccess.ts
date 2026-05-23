import { clerkClient } from '@clerk/nextjs/server';
import {
  hasPaidClerkSubscription,
  hasProAccess,
  hasProPlanMetadata,
  type ClerkBillingSubscriptionLike,
} from '@/lib/utils/subscription';
import { createLogger } from '@/lib/server/logger';

const log = createLogger('server:proAccess');

type UserMetadataLike = { publicMetadata?: unknown } | null | undefined;

/**
 * Server-side Pro check aligned with dashboard `hasProAccess`:
 * Stripe webhook metadata (`plan: pro`) and Clerk Billing subscription when available.
 */
export async function resolveIsProForUser(clerkUserId: string | null): Promise<boolean> {
  if (!clerkUserId) return false;

  try {
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(clerkUserId);
    const metadata: UserMetadataLike = { publicMetadata: user.publicMetadata };

    if (hasProPlanMetadata(metadata)) return true;

    const billingSub = await fetchClerkBillingSubscription(clerkUserId);
    return hasProAccess(metadata, billingSub);
  } catch (e) {
    log.warn('pro_resolve_failed', { clerkUserId, err: e instanceof Error ? e.message : String(e) });
    return false;
  }
}

/** Best-effort Clerk Billing snapshot via Backend API (when enabled for the instance). */
async function fetchClerkBillingSubscription(
  userId: string
): Promise<ClerkBillingSubscriptionLike | null> {
  const secret = process.env.CLERK_SECRET_KEY;
  if (!secret) return null;

  try {
    const res = await fetch(
      `https://api.clerk.com/v1/users/${encodeURIComponent(userId)}/billing/subscription`,
      {
        headers: {
          Authorization: `Bearer ${secret}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    );
    if (res.status === 404 || res.status === 403) return null;
    if (!res.ok) return null;
    const data = (await res.json()) as ClerkBillingSubscriptionLike;
    return data;
  } catch {
    return null;
  }
}

export { hasProPlanMetadata };
