import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { clerkClient } from '@clerk/nextjs/server';

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

async function setClerkUserPlan(userId: string, plan: string | null) {
  try {
    const clerk = await clerkClient();
    await clerk.users.updateUserMetadata(userId, {
      publicMetadata: { plan: plan ?? undefined },
    });
  } catch (e) {
    console.error('Clerk metadata update failed:', e);
  }
}

export async function POST(request: Request) {
  if (!STRIPE_WEBHOOK_SECRET || !STRIPE_SECRET_KEY) {
    return new NextResponse('Webhook not configured', { status: 503 });
  }

  const sig = request.headers.get('stripe-signature');
  if (!sig) {
    return new NextResponse('Missing stripe-signature', { status: 400 });
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
    const err = e as Error;
    return new NextResponse(`Webhook signature verification failed: ${err.message}`, { status: 400 });
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
        // Do not clear Pro on `incomplete` / `past_due` — avoids racing checkout.session.completed.
      }
    }
  } catch (e) {
    console.error('Webhook handler error:', e);
  }

  return new NextResponse(null, { status: 200 });
}
