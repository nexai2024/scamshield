import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Stripe from 'stripe';

export async function POST() {
  const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID;

  if (!CLERK_SECRET_KEY) {
    return NextResponse.json({ error: 'Auth is not configured.' }, { status: 503 });
  }
  if (!STRIPE_SECRET_KEY || !STRIPE_PRICE_ID) {
    return NextResponse.json({ error: 'Billing is not configured.' }, { status: 503 });
  }

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Sign in required to subscribe.' }, { status: 401 });
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY);
  const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const base = origin.replace(/\/$/, '');

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
      success_url: base + '/dashboard?subscription=success',
      cancel_url: base + '/pricing',
      client_reference_id: userId,
      subscription_data: { metadata: { clerk_user_id: userId } },
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    const err = e as Error;
    console.error('Stripe checkout error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create checkout session.' },
      { status: 500 }
    );
  }
}
