import { runAnalyze } from '@/lib/analysis/runAnalyze';
import { guardAnalyzeRateLimit } from '@/lib/rateLimit/guard';
import {
  getOrCreateRequestId,
  jsonClientError,
  jsonInternalError,
  jsonOk,
  jsonUpstreamError,
  USER_SAFE,
} from '@/lib/server/api-response';
import { createLogger } from '@/lib/server/logger';

const log = createLogger('api:analyze');

export async function POST(request: Request) {
  const requestId = getOrCreateRequestId(request);

  try {
    const limited = await guardAnalyzeRateLimit(request);
    if (limited) {
      limited.headers.set('X-Request-Id', requestId);
      return limited;
    }

    let body: { text?: string };
    try {
      body = await request.json();
    } catch {
      return jsonClientError(requestId, 'Invalid JSON body.', 400);
    }

    const text = body?.text;
    if (typeof text !== 'string' || !text.trim()) {
      return jsonClientError(requestId, 'Missing or invalid "text" in request body.', 400);
    }

    const outcome = await runAnalyze(text);
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

    return jsonOk(requestId, outcome.result);
  } catch (cause) {
    return jsonInternalError(requestId, 'api:analyze', cause);
  }
}
