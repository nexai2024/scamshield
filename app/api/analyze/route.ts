import { NextResponse } from 'next/server';
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
import { resolveIsProForUser } from '@/lib/server/proAccess';
import { resolveScanQuotaSubject } from '@/lib/server/scanSubject';
import {
  checkScanQuota,
  recordSuccessfulScan,
  scanQuotaResponseHeaders,
  type ScanQuotaCheckResult,
} from '@/lib/server/scanQuota';

const log = createLogger('api:analyze');

/** Link expansion + RDAP can take longer than the default function timeout on some hosts. */
export const maxDuration = 60;

function withScanQuotaHeaders(response: NextResponse, quota: ScanQuotaCheckResult): NextResponse {
  for (const [name, value] of Object.entries(scanQuotaResponseHeaders(quota))) {
    response.headers.set(name, value);
  }
  return response;
}

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

    const subject = await resolveScanQuotaSubject(request);
    const isPro = await resolveIsProForUser(subject.clerkUserId);
    const quotaCheck = await checkScanQuota(subject, isPro);

    if (!quotaCheck.allowed) {
      if (quotaCheck.reason === 'daily_limit_exceeded') {
        return withScanQuotaHeaders(
          jsonClientError(
            requestId,
            'You have used your free scan for today. Upgrade to Pro for unlimited scans, or try again tomorrow (UTC).',
            403,
            'daily_limit_exceeded'
          ),
          quotaCheck
        );
      }
      return withScanQuotaHeaders(
        jsonClientError(
          requestId,
          'Scan quota is temporarily unavailable. Please try again shortly.',
          503,
          'quota_storage_unavailable'
        ),
        quotaCheck
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

    if (!isPro) {
      await recordSuccessfulScan(subject);
    }

    const finalQuota: ScanQuotaCheckResult = isPro
      ? { allowed: true, isPro: true, used: 0, limit: quotaCheck.limit, remaining: 999 }
      : {
          allowed: true,
          isPro: false,
          used: quotaCheck.used + 1,
          limit: quotaCheck.limit,
          remaining: Math.max(0, quotaCheck.limit - quotaCheck.used - 1),
        };

    return withScanQuotaHeaders(jsonOk(requestId, outcome.result), finalQuota);
  } catch (cause) {
    return jsonInternalError(requestId, 'api:analyze', cause);
  }
}
