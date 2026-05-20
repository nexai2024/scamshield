import { createHash, randomBytes } from 'crypto';
import type { AnalysisResult } from '@/lib/types';
import { getUpstashRedis } from '@/lib/redis/upstash';
import { createLogger, serializeError } from '@/lib/server/logger';
import { encryptAuditPayload, decryptAuditPayload, isAuditEncryptionConfigured } from '@/lib/server/auditCrypto';
import { SCAN_AUDIT_RETENTION_OPTIONS, type ScanAuditRetentionDays } from '@/lib/data/scanAuditRetention';
import { hasProPlanMetadata } from '@/lib/utils/subscription';

const log = createLogger('scan-audit');

const CONSENT_KEY = (userId: string) => `scan_audit:consent:v1:${userId}`;
const INDEX_KEY = (userId: string) => `scan_audit:index:v1:${userId}`;
const ENTRY_KEY = (userId: string, entryId: string) => `scan_audit:entry:v1:${userId}:${entryId}`;

const MAX_INDEXED_ENTRIES = 200;

export interface ScanAuditConsent {
  enabled: boolean;
  retentionDays: ScanAuditRetentionDays;
  consentGrantedAt: string;
}

export interface ScanAuditEntryPublic {
  id: string;
  createdAt: string;
  /** SHA-256 hex of UTF-8 trimmed text (message body is never stored). */
  contentSha256: string;
  /** Hash of raw screenshot bytes when an image was analyzed. */
  imageBytesSha256?: string;
  hadImage: boolean;
  imageMimeType?: string;
  textCharLength: number;
  risk_score: number;
  risk_level: AnalysisResult['risk_level'];
  scam_type: string;
  red_flag_count: number;
  link_inspection_count: number;
  requestId?: string;
}

function defaultConsent(): ScanAuditConsent {
  return {
    enabled: false,
    retentionDays: 30,
    consentGrantedAt: new Date(0).toISOString(),
  };
}

function clampRetention(n: number): ScanAuditRetentionDays {
  if (SCAN_AUDIT_RETENTION_OPTIONS.includes(n as ScanAuditRetentionDays)) {
    return n as ScanAuditRetentionDays;
  }
  return 30;
}

export async function getScanAuditConsent(userId: string): Promise<ScanAuditConsent> {
  const redis = getUpstashRedis();
  if (!redis) return defaultConsent();
  try {
    const raw = await redis.get<string>(CONSENT_KEY(userId));
    if (!raw || typeof raw !== 'string') return defaultConsent();
    const parsed = JSON.parse(raw) as Partial<ScanAuditConsent>;
    if (typeof parsed.enabled !== 'boolean') return defaultConsent();
    return {
      enabled: parsed.enabled,
      retentionDays: clampRetention(Number(parsed.retentionDays) || 30),
      consentGrantedAt: typeof parsed.consentGrantedAt === 'string' ? parsed.consentGrantedAt : new Date().toISOString(),
    };
  } catch {
    return defaultConsent();
  }
}

export async function setScanAuditConsent(
  userId: string,
  next: Pick<ScanAuditConsent, 'enabled' | 'retentionDays'>
): Promise<ScanAuditConsent> {
  const redis = getUpstashRedis();
  if (!redis) throw new Error('redis_unavailable');
  const consent: ScanAuditConsent = {
    enabled: next.enabled,
    retentionDays: clampRetention(next.retentionDays),
    consentGrantedAt: new Date().toISOString(),
  };
  await redis.set(CONSENT_KEY(userId), JSON.stringify(consent));
  return consent;
}

export async function countScanAuditEntries(userId: string): Promise<number> {
  const redis = getUpstashRedis();
  if (!redis) return 0;
  try {
    const n = await redis.zcard(INDEX_KEY(userId));
    return typeof n === 'number' ? n : 0;
  } catch {
    return 0;
  }
}

function sha256Hex(input: Buffer | string): string {
  return createHash('sha256').update(input).digest('hex');
}

function buildEntryPayload(params: {
  text: string;
  imageBase64?: string;
  imageMimeType?: string;
  result: AnalysisResult;
  requestId?: string;
}): ScanAuditEntryPublic {
  const textNorm = params.text.trim();
  const textBuf = Buffer.from(textNorm, 'utf8');
  const contentSha256 = sha256Hex(textBuf);
  let imageBytesSha256: string | undefined;
  if (params.imageBase64) {
    try {
      imageBytesSha256 = sha256Hex(Buffer.from(params.imageBase64, 'base64'));
    } catch {
      imageBytesSha256 = undefined;
    }
  }
  const id = `${Date.now()}_${randomBytes(6).toString('hex')}`;
  return {
    id,
    createdAt: new Date().toISOString(),
    contentSha256,
    imageBytesSha256,
    hadImage: Boolean(params.imageBase64),
    imageMimeType: params.imageMimeType?.slice(0, 64),
    textCharLength: textNorm.length,
    risk_score: params.result.risk_score,
    risk_level: params.result.risk_level,
    scam_type: params.result.scam_type,
    red_flag_count: params.result.red_flags?.length ?? 0,
    link_inspection_count: params.result.link_inspections?.length ?? 0,
    requestId: params.requestId,
  };
}

async function trimOldestEntries(userId: string): Promise<void> {
  const redis = getUpstashRedis();
  if (!redis) return;
  const indexKey = INDEX_KEY(userId);
  const n = await redis.zcard(indexKey);
  const count = typeof n === 'number' ? n : 0;
  if (count <= MAX_INDEXED_ENTRIES) return;
  const overflow = count - MAX_INDEXED_ENTRIES;
  const oldest = await redis.zrange(indexKey, 0, overflow - 1);
  if (!Array.isArray(oldest)) return;
  for (const member of oldest) {
    const id = String(member);
    await redis.del(ENTRY_KEY(userId, id));
    await redis.zrem(indexKey, id);
  }
}

/**
 * After a successful analyze: Pro (metadata), consent on, Redis + encryption — stores hashes and scores only.
 */
export async function appendScanAuditLogIfApplicable(params: {
  userId: string;
  userPublicMetadata: unknown;
  text: string;
  imageBase64?: string;
  imageMimeType?: string;
  result: AnalysisResult;
  requestId?: string;
}): Promise<void> {
  if (!hasProPlanMetadata({ publicMetadata: params.userPublicMetadata })) return;
  if (!isAuditEncryptionConfigured()) return;
  const redis = getUpstashRedis();
  if (!redis) return;

  const consent = await getScanAuditConsent(params.userId);
  if (!consent.enabled) return;

  const entry = buildEntryPayload({
    text: params.text,
    imageBase64: params.imageBase64,
    imageMimeType: params.imageMimeType,
    result: params.result,
    requestId: params.requestId,
  });

  const encrypted = encryptAuditPayload(JSON.stringify(entry));
  if (!encrypted) return;

  const ttl = consent.retentionDays * 86_400;
  const indexKey = INDEX_KEY(params.userId);
  const entryKey = ENTRY_KEY(params.userId, entry.id);

  try {
    await redis.set(entryKey, encrypted, { ex: ttl });
    await redis.zadd(indexKey, { score: Date.now(), member: entry.id });
    await trimOldestEntries(params.userId);
  } catch (e) {
    log.error('append_failed', { ...serializeError(e), userId: params.userId });
  }
}

export async function listScanAuditEntries(userId: string, limit: number): Promise<ScanAuditEntryPublic[]> {
  const redis = getUpstashRedis();
  if (!redis || !isAuditEncryptionConfigured()) return [];
  const cap = Math.min(Math.max(1, limit), 100);
  const indexKey = INDEX_KEY(userId);
  const ids = await redis.zrange(indexKey, -cap, -1);
  if (!Array.isArray(ids) || ids.length === 0) return [];
  const ordered = [...ids].reverse() as string[];
  const out: ScanAuditEntryPublic[] = [];
  for (const id of ordered) {
    const blob = await redis.get<string>(ENTRY_KEY(userId, String(id)));
    if (!blob || typeof blob !== 'string') continue;
    const json = decryptAuditPayload(blob);
    if (!json) continue;
    try {
      out.push(JSON.parse(json) as ScanAuditEntryPublic);
    } catch {
      continue;
    }
  }
  return out;
}

export async function clearAllScanAuditEntries(userId: string): Promise<void> {
  const redis = getUpstashRedis();
  if (!redis) return;
  const indexKey = INDEX_KEY(userId);
  const ids = await redis.zrange(indexKey, 0, -1);
  if (Array.isArray(ids) && ids.length > 0) {
    for (const id of ids) {
      await redis.del(ENTRY_KEY(userId, String(id)));
    }
  }
  await redis.del(indexKey);
}
