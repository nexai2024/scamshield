import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { clerkClient } from '@clerk/nextjs/server';

import { createLogger } from '@/lib/server/logger';

const log = createLogger('webhook:stripe');

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

async function setClerkUserPlan(userId: string, plan: string | null) {
  try {
    const clerk = await clerkClient();
    await clerk.users.updateUserMetadata(userId, {
      publicMetadata: { plan: plan ?? undefined },
    });
  } catch (e) {
    log.error('clerk_metadata_update_failed', { userId, ...serializeClerkErr(e) });
  }
}

function serializeClerkErr(e: unknown): Record<string, unknown> {
  if (e instanceof Error) return { errMessage: e.message, errName: e.name };
  return { err: String(e) };
}

export async function POST(request: Request) {
  if (!STRIPE_WEBHOOK_SECRET || !STRIPE_SECRET_KEY) {
    log.warn('webhook_not_configured');
    return new NextResponse('Webhook not configured', { status: 503 });
  }

  const sig = request.headers.get('stripe-signature');
  if (!sig) {
    return new NextResponse('Missing signature', { status: 400 });
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return new NextResponse('Invalid body', { status: 400 });
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY);
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    log.error('signature_verification_failed', { errMessage: e instanceof Error ? e.message : String(e) });
    return new NextResponse('Invalid signature', { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      if (userId) await setClerkUserPlan(userId, 'pro');
    } else if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.clerk_user_id as string | undefined;
      if (userId) await setClerkUserPlan(userId, null);
    } else if (event.type === 'customer.subscription.updated') {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.clerk_user_id as string | undefined;
      if (userId) {
        if (sub.status === 'active' || sub.status === 'trialing') {
          await setClerkUserPlan(userId, 'pro');
        } else if (
          sub.status === 'canceled' ||
          sub.status === 'unpaid' ||
          sub.status === 'incomplete_expired'
        ) {
          await setClerkUserPlan(userId, null);
        }
      }
    }
  } catch (e) {
    log.error('handler_error', {
      eventType: event.type,
      errMessage: e instanceof Error ? e.message : String(e),
    });
  }

  return new NextResponse(null, { status: 200 });
}
