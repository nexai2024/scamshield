import { auth } from '@clerk/nextjs/server';
import { getUpstashRedis } from '@/lib/redis/upstash';
import { guardScanAuditRateLimit } from '@/lib/rateLimit/guard';
import { isAuditEncryptionConfigured } from '@/lib/server/auditCrypto';
import {
  getOrCreateRequestId,
  jsonClientError,
  jsonInternalError,
  jsonOk,
} from '@/lib/server/api-response';
import { getProUserContext } from '@/lib/server/requirePro';
import { SCAN_AUDIT_RETENTION_OPTIONS } from '@/lib/data/scanAuditRetention';
import { countScanAuditEntries, getScanAuditConsent, setScanAuditConsent } from '@/lib/server/scanAuditLog';

function infraFlags() {
  return {
    redisConfigured: getUpstashRedis() != null,
    encryptionConfigured: isAuditEncryptionConfigured(),
  };
}

export async function GET(request: Request) {
  const requestId = getOrCreateRequestId(request);
  try {
    const { userId } = await auth();
    if (!userId) {
      return jsonClientError(requestId, 'Sign in required.', 401);
    }
    const limited = await guardScanAuditRateLimit(userId);
    if (limited) {
      limited.headers.set('X-Request-Id', requestId);
      return limited;
    }

    const pro = await getProUserContext();
    if (!pro) {
      return jsonOk(requestId, { proRequired: true, ...infraFlags() });
    }

    const consent = await getScanAuditConsent(pro.userId);
    const entryCount = await countScanAuditEntries(pro.userId);
    return jsonOk(requestId, {
      proRequired: false,
      ...consent,
      entryCount,
      ...infraFlags(),
    });
  } catch (cause) {
    return jsonInternalError(requestId, 'api:scan-audit:settings:get', cause);
  }
}

export async function POST(request: Request) {
  const requestId = getOrCreateRequestId(request);
  try {
    const pro = await getProUserContext();
    if (!pro) {
      return jsonClientError(requestId, 'Pro plan required for server audit log.', 403, 'pro_required');
    }
    const limited = await guardScanAuditRateLimit(pro.userId);
    if (limited) {
      limited.headers.set('X-Request-Id', requestId);
      return limited;
    }

    let body: { enabled?: unknown; retentionDays?: unknown };
    try {
      body = await request.json();
    } catch {
      return jsonClientError(requestId, 'Invalid JSON body.', 400);
    }
    if (typeof body.enabled !== 'boolean') {
      return jsonClientError(requestId, 'Body must include boolean "enabled".', 400);
    }
    const rd = Number(body.retentionDays);
    if (!SCAN_AUDIT_RETENTION_OPTIONS.includes(rd as (typeof SCAN_AUDIT_RETENTION_OPTIONS)[number])) {
      return jsonClientError(
        requestId,
        `retentionDays must be one of: ${SCAN_AUDIT_RETENTION_OPTIONS.join(', ')}.`,
        400
      );
    }

    if (!isAuditEncryptionConfigured()) {
      return jsonClientError(
        requestId,
        'Server encryption key is not configured. Set SCAN_AUDIT_ENCRYPTION_KEY (32-byte hex or strong passphrase).',
        503,
        'encryption_unconfigured'
      );
    }

    try {
      const consent = await setScanAuditConsent(pro.userId, {
        enabled: body.enabled,
        retentionDays: rd as (typeof SCAN_AUDIT_RETENTION_OPTIONS)[number],
      });
      return jsonOk(requestId, { consent, ...infraFlags() });
    } catch (e) {
      if (e instanceof Error && e.message === 'redis_unavailable') {
        return jsonClientError(
          requestId,
          'Redis is not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.',
          503,
          'redis_unavailable'
        );
      }
      throw e;
    }
  } catch (cause) {
    return jsonInternalError(requestId, 'api:scan-audit:settings:post', cause);
  }
}
