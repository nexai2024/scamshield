import { NextResponse } from 'next/server';

import { createLogger, serializeError } from '@/lib/server/logger';

const log = createLogger('api-response');

export function getOrCreateRequestId(request: Request): string {
  const fromHeader = request.headers.get('x-request-id')?.trim();
  if (fromHeader && fromHeader.length > 8) return fromHeader;
  return crypto.randomUUID();
}

function withRequestId(response: NextResponse, requestId: string): NextResponse {
  response.headers.set('X-Request-Id', requestId);
  return response;
}

export function jsonOk(requestId: string, body: object, status = 200): NextResponse {
  return withRequestId(NextResponse.json(body, { status }), requestId);
}

/** Validation / client errors — message is safe to show as-is. */
export function jsonClientError(
  requestId: string,
  message: string,
  status: number,
  code?: string
): NextResponse {
  const body: Record<string, unknown> = { error: message };
  if (code) body.code = code;
  return withRequestId(NextResponse.json(body, { status }), requestId);
}

/**
 * Unexpected server failure: generic user message, full detail in logs only.
 */
export function jsonInternalError(
  requestId: string,
  scope: string,
  cause: unknown,
  options?: { publicMessage?: string; status?: number; code?: string }
): NextResponse {
  const publicMessage =
    options?.publicMessage ?? 'Something went wrong on our side. Please try again in a moment.';
  const status = options?.status ?? 500;
  const code = options?.code ?? 'internal_error';

  log.error(`${scope}: internal_error`, {
    requestId,
    ...serializeError(cause),
  });

  return withRequestId(
    NextResponse.json({ error: publicMessage, code }, { status }),
    requestId
  );
}

/**
 * Upstream (e.g. OpenAI) failure: log full detail; user sees a safe, short message unless overridden.
 */
export function jsonUpstreamError(
  requestId: string,
  scope: string,
  cause: unknown,
  options: { status: number; userMessage: string; code?: string; provider?: string }
): NextResponse {
  log.error(`${scope}: upstream_error`, {
    requestId,
    provider: options.provider,
    ...serializeError(cause),
  });

  const body: Record<string, unknown> = {
    error: options.userMessage,
    ...(options.code ? { code: options.code } : {}),
  };
  return withRequestId(NextResponse.json(body, { status: options.status }), requestId);
}

export const USER_SAFE = {
  GENERIC: 'Something went wrong on our side. Please try again in a moment.',
  ANALYSIS_UNAVAILABLE: 'Analysis is temporarily unavailable. Please try again shortly.',
  ENTITY_UNAVAIL: 'Entity extraction is temporarily unavailable. Please try again shortly.',
  CHECKOUT_FAILED: 'We could not start checkout. Please try again or contact support.',
  VALIDATION_FAILED: 'Validation failed. Please try again.',
} as const;
