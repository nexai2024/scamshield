import { guardScanAuditRateLimit } from '@/lib/rateLimit/guard';
import {
  getOrCreateRequestId,
  jsonClientError,
  jsonInternalError,
  jsonOk,
} from '@/lib/server/api-response';
import { getProUserContext } from '@/lib/server/requirePro';
import { clearAllScanAuditEntries, listScanAuditEntries } from '@/lib/server/scanAuditLog';

export async function GET(request: Request) {
  const requestId = getOrCreateRequestId(request);
  try {
    const pro = await getProUserContext();
    if (!pro) {
      return jsonClientError(requestId, 'Pro plan required.', 403, 'pro_required');
    }
    const limited = await guardScanAuditRateLimit(pro.userId);
    if (limited) {
      limited.headers.set('X-Request-Id', requestId);
      return limited;
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10) || 50));
    const entries = await listScanAuditEntries(pro.userId, limit);
    return jsonOk(requestId, { entries });
  } catch (cause) {
    return jsonInternalError(requestId, 'api:scan-audit:entries:get', cause);
  }
}

export async function DELETE(request: Request) {
  const requestId = getOrCreateRequestId(request);
  try {
    const pro = await getProUserContext();
    if (!pro) {
      return jsonClientError(requestId, 'Pro plan required.', 403, 'pro_required');
    }
    const limited = await guardScanAuditRateLimit(pro.userId);
    if (limited) {
      limited.headers.set('X-Request-Id', requestId);
      return limited;
    }

    await clearAllScanAuditEntries(pro.userId);
    return jsonOk(requestId, { cleared: true });
  } catch (cause) {
    return jsonInternalError(requestId, 'api:scan-audit:entries:delete', cause);
  }
}
