import { auth, clerkClient } from '@clerk/nextjs/server';
import { hasProPlanMetadata } from '@/lib/utils/subscription';

/**
 * Clerk user with Pro plan in `publicMetadata.plan` (e.g. Stripe webhook).
 * Clerk Billing-only Pro without synced metadata will not pass here for server-side features.
 */
export async function getProUserContext(): Promise<{ userId: string; publicMetadata: unknown } | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const clerk = await clerkClient();
  const user = await clerk.users.getUser(userId);
  if (!hasProPlanMetadata({ publicMetadata: user.publicMetadata })) return null;
  return { userId, publicMetadata: user.publicMetadata };
}

export async function getSignedInUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId ?? null;
}
