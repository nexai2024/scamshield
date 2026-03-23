/** Shape returned by Clerk `useSubscription` / `billing.getSubscription` (avoids tight coupling to SDK exports). */
export type ClerkBillingSubscriptionLike = {
  subscriptionItems?: Array<{
    status: string;
    plan?: {
      name?: string | null;
      isRecurring?: boolean;
      isDefault?: boolean;
      fee?: { amount: number };
    };
  }>;
};

type UserLike = { publicMetadata?: unknown } | null | undefined;

/** Stripe webhook / manual metadata: `publicMetadata.plan === 'pro'` */
export function hasProPlanMetadata(user: UserLike): boolean {
  if (!user?.publicMetadata || typeof user.publicMetadata !== 'object') return false;
  const plan = (user.publicMetadata as Record<string, unknown>).plan;
  return typeof plan === 'string' && plan.toLowerCase() === 'pro';
}

/**
 * Clerk Billing (e.g. `<PricingTable />`): true if any active subscription item is a paid recurring plan.
 */
export function hasPaidClerkSubscription(sub: ClerkBillingSubscriptionLike | null | undefined): boolean {
  if (!sub?.subscriptionItems?.length) return false;
  return sub.subscriptionItems.some((item) => {
    if (item.status !== 'active' && item.status !== 'past_due') return false;
    const plan = item.plan;
    if (!plan) return false;
    const fee = plan.fee?.amount;
    if (plan.isRecurring && typeof fee === 'number' && fee > 0) return true;
    if (plan.isRecurring && plan.isDefault === false) return true;
    const name = (plan.name || '').toLowerCase();
    return name.includes('pro');
  });
}

export function hasProAccess(
  user: UserLike,
  clerkSubscription: ClerkBillingSubscriptionLike | null | undefined
): boolean {
  return hasProPlanMetadata(user) || hasPaidClerkSubscription(clerkSubscription);
}
