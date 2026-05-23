import { auth, clerkClient } from '@clerk/nextjs/server';
import { resolveIsProForUser } from '@/lib/server/proAccess';

/**
 * Signed-in user with Pro access (Stripe metadata and/or Clerk Billing).
 */
export async function getProUserContext(): Promise<{ userId: string; publicMetadata: unknown } | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const isPro = await resolveIsProForUser(userId);
  if (!isPro) return null;
  const clerk = await clerkClient();
  const user = await clerk.users.getUser(userId);
  return { userId, publicMetadata: user.publicMetadata };
}

export async function getSignedInUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId ?? null;
}
