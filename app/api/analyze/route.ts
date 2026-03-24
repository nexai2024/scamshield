import { NextResponse } from 'next/server';
import { runAnalyze } from '@/lib/analysis/runAnalyze';
import { guardAnalyzeRateLimit } from '@/lib/rateLimit/guard';

export async function POST(request: Request) {
  const limited = await guardAnalyzeRateLimit(request);
  if (limited) return limited;

  let body: { text?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const text = body?.text;
  if (typeof text !== 'string' || !text.trim()) {
    return NextResponse.json(
      { error: 'Missing or invalid "text" in request body.' },
      { status: 400 }
    );
  }

  const outcome = await runAnalyze(text);
  if (!outcome.ok) {
    const status =
      outcome.code === 'no_api_key'
        ? 503
        : outcome.code === 'parse_error'
          ? 502
          : outcome.httpStatus ?? 502;
    const extra = outcome.openaiCode ? { code: outcome.openaiCode } : {};
    return NextResponse.json({ error: outcome.message, ...extra }, { status });
  }

  return NextResponse.json(outcome.result);
}
