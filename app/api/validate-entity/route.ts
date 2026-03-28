import type { EntityKind } from '@/lib/entities/types';
import { validateEntity } from '@/lib/entities/validate';
import {
  getOrCreateRequestId,
  jsonClientError,
  jsonInternalError,
  jsonOk,
  USER_SAFE,
} from '@/lib/server/api-response';
import { guardValidateEntityRateLimit } from '@/lib/rateLimit/guard';

const KINDS: EntityKind[] = ['email', 'phone', 'place', 'properName', 'url'];

function isEntityKind(s: string): s is EntityKind {
  return (KINDS as string[]).includes(s);
}

export async function POST(request: Request) {
  const requestId = getOrCreateRequestId(request);

  try {
    const limited = await guardValidateEntityRateLimit(request);
    if (limited) {
      limited.headers.set('X-Request-Id', requestId);
      return limited;
    }

    let body: { kind?: string; value?: string; defaultCountry?: string };
    try {
      body = await request.json();
    } catch {
      return jsonClientError(requestId, 'Invalid JSON body.', 400);
    }

    const kind = body?.kind;
    const value = body?.value;
    if (typeof kind !== 'string' || !isEntityKind(kind)) {
      return jsonClientError(
        requestId,
        'kind must be one of: email, phone, place, properName, url.',
        400
      );
    }
    if (typeof value !== 'string') {
      return jsonClientError(requestId, 'value must be a string.', 400);
    }

    const defaultCountry =
      typeof body.defaultCountry === 'string' && body.defaultCountry.length === 2
        ? (body.defaultCountry.toUpperCase() as import('libphonenumber-js').CountryCode)
        : undefined;

    const result = await validateEntity(kind, value, { defaultCountry });
    return jsonOk(requestId, result as object);
  } catch (cause) {
    return jsonInternalError(requestId, 'api:validate-entity', cause, {
      publicMessage: USER_SAFE.VALIDATION_FAILED,
      code: 'validation_error',
    });
  }
}
