import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { runAnalyze } from '@/lib/analysis/runAnalyze';
import { extractInboundEmailPayload, parseFromAddress } from '@/lib/inbound/parseInboundRequest';
import { saveEmailReport } from '@/lib/inbound/reportStorage';
import { sendReportReadyEmail } from '@/lib/inbound/sendReportReadyEmail';
import { verifyInboundWebhookSecret } from '@/lib/inbound/verifyWebhookSecret';
import { guardInboundEmailRateLimit } from '@/lib/rateLimit/guard';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

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
  const secret = process.env.INBOUND_EMAIL_WEBHOOK_SECRET;
  if (!verifyInboundWebhookSecret(request, secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const inboundLimited = await guardInboundEmailRateLimit(request);
  if (inboundLimited) return inboundLimited;

  const payload = await extractInboundEmailPayload(request);
  if (!payload || !payload.text.trim()) {
    return NextResponse.json({ error: 'Could not extract email body.' }, { status: 400 });
  }

  const body = payload.text.trim();
  if (body.length < MIN_BODY_CHARS) {
    return NextResponse.json(
      { error: `Email body too short (min ${MIN_BODY_CHARS} characters after trim).` },
      { status: 400 }
    );
  }

  const outcome = await runAnalyze(body);
  if (!outcome.ok) {
    const status =
      outcome.code === 'no_api_key'
        ? 503
        : outcome.code === 'parse_error'
          ? 502
          : outcome.httpStatus ?? 502;
    return NextResponse.json({ error: outcome.message, code: outcome.code }, { status });
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
    return NextResponse.json(
      {
        error:
          'Report storage unavailable. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (production), or run in development for in-memory fallback.',
      },
      { status: 503 }
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
      console.error('[inbound-email] Resend reply failed:', sent.error);
    }
  } else {
    console.warn('[inbound-email] No reply address parsed from From; report saved but no email sent.');
  }

  return NextResponse.json({
    ok: true,
    reportUrl,
    emailed: Boolean(replyTo && process.env.RESEND_API_KEY && process.env.INBOUND_REPLY_FROM),
  });
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
