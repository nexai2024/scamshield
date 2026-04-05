import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

import { runFullAnalyze } from '@/lib/analysis/runAnalyze';
import { extractInboundEmailPayload, parseFromAddress } from '@/lib/inbound/parseInboundRequest';
import { saveEmailReport } from '@/lib/inbound/reportStorage';
import { sendReportReadyEmail } from '@/lib/inbound/sendReportReadyEmail';
import { verifyInboundWebhookSecret } from '@/lib/inbound/verifyWebhookSecret';
import {
  getOrCreateRequestId,
  jsonClientError,
  jsonOk,
} from '@/lib/server/api-response';
import { createLogger } from '@/lib/server/logger';
import { guardInboundEmailRateLimit } from '@/lib/rateLimit/guard';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const log = createLogger('webhook:inbound-email');

const MIN_BODY_CHARS = 24;

function appOrigin(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
}

/**
 * Inbound email webhook (SendGrid Inbound Parse, Resend inbound JSON, or dev JSON).
 * Configure your provider to POST here with ?secret=INBOUND_EMAIL_WEBHOOK_SECRET
 * or Authorization: Bearer <secret>.
 */
export async function POST(request: Request) {
  const requestId = getOrCreateRequestId(request);

  const secret = process.env.INBOUND_EMAIL_WEBHOOK_SECRET;
  if (!verifyInboundWebhookSecret(request, secret)) {
    log.warn('unauthorized', { requestId });
    return jsonClientError(requestId, 'Unauthorized', 401);
  }

  const inboundLimited = await guardInboundEmailRateLimit(request);
  if (inboundLimited) {
    inboundLimited.headers.set('X-Request-Id', requestId);
    return inboundLimited;
  }

  const payload = await extractInboundEmailPayload(request);
  if (!payload || !payload.text.trim()) {
    return jsonClientError(requestId, 'Could not extract email body.', 400);
  }

  const body = payload.text.trim();
  if (body.length < MIN_BODY_CHARS) {
    return jsonClientError(
      requestId,
      `Email body too short (min ${MIN_BODY_CHARS} characters after trim).`,
      400
    );
  }

  const outcome = await runFullAnalyze({ text: body });
  if (!outcome.ok) {
    const status =
      outcome.code === 'no_api_key'
        ? 503
        : outcome.code === 'parse_error'
          ? 502
          : outcome.httpStatus ?? 502;
    const code = outcome.code === 'no_api_key' ? 'service_unavailable' : outcome.code;
    log.error('analysis_failed', { requestId, code: outcome.code, status });
    return jsonClientError(
      requestId,
      'Analysis could not be completed. Please try again later.',
      status,
      code
    );
  }

  const token = randomBytes(18).toString('base64url');
  const stored = await saveEmailReport(token, {
    result: outcome.result,
    sourceText: body.slice(0, 8000),
    subject: payload.subject ?? undefined,
    replyTo: parseFromAddress(payload.from) ?? undefined,
    createdAt: new Date().toISOString(),
  });

  if (!stored) {
    log.error('report_storage_unavailable', { requestId });
    return jsonClientError(
      requestId,
      'Report storage is unavailable. Try again later.',
      503,
      'storage_unavailable'
    );
  }

  const reportUrl = `${appOrigin()}/report/${token}`;
  const replyTo = parseFromAddress(payload.from);

  if (replyTo) {
    const sent = await sendReportReadyEmail({
      to: replyTo,
      reportUrl,
      riskLevel: outcome.result.risk_level,
      riskScore: outcome.result.risk_score,
    });
    if (!sent.ok) {
      log.error('resend_reply_failed', { requestId, error: sent.error });
    }
  } else {
    log.warn('no_reply_address', { requestId });
  }

  return jsonOk(requestId, {
    ok: true,
    reportUrl,
    emailed: Boolean(replyTo && process.env.RESEND_API_KEY && process.env.INBOUND_REPLY_FROM),
  });
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
