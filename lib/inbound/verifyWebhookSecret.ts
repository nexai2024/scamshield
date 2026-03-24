import { timingSafeEqual } from 'crypto';

export function verifyInboundWebhookSecret(request: Request, expected: string | undefined): boolean {
  if (!expected) return false;

  const url = new URL(request.url);
  const querySecret = url.searchParams.get('secret');
  const auth = request.headers.get('authorization');
  const bearer = auth?.startsWith('Bearer ') ? auth.slice(7).trim() : null;
  const headerSecret = request.headers.get('x-scamshield-webhook-secret');

  const provided = querySecret || bearer || headerSecret;
  if (!provided) return false;

  try {
    const a = Buffer.from(provided, 'utf8');
    const b = Buffer.from(expected, 'utf8');
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
