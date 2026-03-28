import { auth } from '@clerk/nextjs/server';
import Stripe from 'stripe';

import {
  getOrCreateRequestId,
  jsonClientError,
  jsonInternalError,
  jsonOk,
  USER_SAFE,
} from '@/lib/server/api-response';
import { createLogger } from '@/lib/server/logger';
import { guardCheckoutRateLimit } from '@/lib/rateLimit/guard';

const log = createLogger('api:checkout');

export async function POST(request: Request) {
  const requestId = getOrCreateRequestId(request);

  try {
    const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
    const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
    const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID;

    if (!CLERK_SECRET_KEY) {
      log.error('misconfiguration', { requestId, missing: 'CLERK_SECRET_KEY' });
      return jsonClientError(requestId, 'Sign-in is not available right now. Please try again later.', 503);
    }
    if (!STRIPE_SECRET_KEY || !STRIPE_PRICE_ID) {
      log.error('misconfiguration', { requestId, missing: 'STRIPE_*' });
      return jsonClientError(requestId, 'Billing is not available right now. Please try again later.', 503);
    }

    const { userId } = await auth();
    if (!userId) {
      return jsonClientError(requestId, 'Sign in required to subscribe.', 401);
    }

    const checkoutLimited = await guardCheckoutRateLimit(userId);
    if (checkoutLimited) {
      checkoutLimited.headers.set('X-Request-Id', requestId);
      return checkoutLimited;
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY);
    const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const base = origin.replace(/\/$/, '');

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
      success_url: base + '/dashboard?subscription=success',
      cancel_url: base + '/pricing',
      client_reference_id: userId,
      subscription_data: { metadata: { clerk_user_id: userId } },
    });
    if (!session.url) {
      log.error('stripe_no_url', { requestId });
      return jsonInternalError(requestId, 'api:checkout', new Error('Stripe session missing url'), {
        publicMessage: USER_SAFE.CHECKOUT_FAILED,
      });
    }
    return jsonOk(requestId, { url: session.url });
  } catch (cause) {
    return jsonInternalError(requestId, 'api:checkout', cause, {
      publicMessage: USER_SAFE.CHECKOUT_FAILED,
    });
  }
}
