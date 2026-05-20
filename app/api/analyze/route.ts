import { auth, clerkClient } from '@clerk/nextjs/server';
import { runFullAnalyze } from '@/lib/analysis/runAnalyze';
import { guardAnalyzeRateLimit } from '@/lib/rateLimit/guard';
import {
  getOrCreateRequestId,
  jsonClientError,
  jsonInternalError,
  jsonOk,
  jsonUpstreamError,
  USER_SAFE,
} from '@/lib/server/api-response';
import { createLogger, serializeError } from '@/lib/server/logger';
import { appendScanAuditLogIfApplicable } from '@/lib/server/scanAuditLog';

const log = createLogger('api:analyze');

/** Link expansion + RDAP can take longer than the default function timeout on some hosts. */
export const maxDuration = 60;

export async function POST(request: Request) {
  const requestId = getOrCreateRequestId(request);

  try {
    const limited = await guardAnalyzeRateLimit(request);
    if (limited) {
      limited.headers.set('X-Request-Id', requestId);
      return limited;
    }

    let body: { text?: string; imageBase64?: string; imageMimeType?: string };
    try {
      body = await request.json();
    } catch {
      return jsonClientError(requestId, 'Invalid JSON body.', 400);
    }

    const text = typeof body?.text === 'string' ? body.text : '';
    const imageBase64 =
      typeof body?.imageBase64 === 'string' && body.imageBase64.length > 0 ? body.imageBase64 : undefined;
    const imageMimeType =
      typeof body?.imageMimeType === 'string' && body.imageMimeType.length > 0 ? body.imageMimeType : undefined;

    const MAX_IMAGE_B64_CHARS = 5_500_000;
    if (imageBase64 && imageBase64.length > MAX_IMAGE_B64_CHARS) {
      return jsonClientError(requestId, 'Image is too large. Try a smaller screenshot (under ~4 MB).', 413, 'payload_too_large');
    }

    if (!text.trim() && !imageBase64) {
      return jsonClientError(
        requestId,
        'Provide non-empty "text" and/or "imageBase64" (screenshot) in the request body.',
        400
      );
    }

    const outcome = await runFullAnalyze({ text, imageBase64, imageMimeType });
    if (!outcome.ok) {
      if (outcome.code === 'no_api_key') {
        log.error('misconfiguration', { requestId, code: 'no_api_key' });
        return jsonClientError(
          requestId,
          'Analysis service is not configured. Please try again later.',
          503,
          'service_unavailable'
        );
      }
      if (outcome.code === 'parse_error') {
        return jsonClientError(
          requestId,
          'Could not read the analysis response. Please try again.',
          502,
          'parse_error'
        );
      }
      const status = outcome.httpStatus ?? 502;
      if (status === 429) {
        return jsonUpstreamError(requestId, 'api:analyze', outcome, {
          status: 429,
          userMessage: 'Service is busy. Please wait a moment and try again.',
          code: outcome.openaiCode ?? 'rate_limited',
          provider: 'openai',
        });
      }
      if (status === 401) {
        return jsonUpstreamError(requestId, 'api:analyze', outcome, {
          status: 503,
          userMessage: USER_SAFE.ANALYSIS_UNAVAILABLE,
          code: 'upstream_auth',
          provider: 'openai',
        });
      }
      return jsonUpstreamError(requestId, 'api:analyze', outcome, {
        status: 502,
        userMessage: USER_SAFE.ANALYSIS_UNAVAILABLE,
        code: outcome.openaiCode,
        provider: 'openai',
      });
    }

    const { userId } = await auth();
    if (userId) {
      try {
        const clerk = await clerkClient();
        const user = await clerk.users.getUser(userId);
        await appendScanAuditLogIfApplicable({
          userId,
          userPublicMetadata: user.publicMetadata,
          text,
          imageBase64,
          imageMimeType,
          result: outcome.result,
          requestId,
        });
      } catch (e) {
        log.warn('scan_audit_append_skipped', { requestId, ...serializeError(e) });
      }
    }

    return jsonOk(requestId, outcome.result);
  } catch (cause) {
    return jsonInternalError(requestId, 'api:analyze', cause);
  }
}
