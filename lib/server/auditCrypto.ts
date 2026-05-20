import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGO = 'aes-256-gcm';
const IV_LEN = 16;
const AUTH_TAG_LEN = 16;
const SALT = 'scamshield-scan-audit-v1';

function deriveKey(secret: string): Buffer {
  if (/^[0-9a-fA-F]{64}$/.test(secret)) {
    return Buffer.from(secret, 'hex');
  }
  return scryptSync(secret, SALT, 32);
}

export function isAuditEncryptionConfigured(): boolean {
  const s = process.env.SCAN_AUDIT_ENCRYPTION_KEY;
  return typeof s === 'string' && s.trim().length >= 8;
}

export function encryptAuditPayload(plaintextJson: string): string | null {
  const raw = process.env.SCAN_AUDIT_ENCRYPTION_KEY;
  if (!raw || raw.trim().length < 8) return null;
  const key = deriveKey(raw.trim());
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv, { authTagLength: AUTH_TAG_LEN });
  const enc = Buffer.concat([cipher.update(plaintextJson, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, enc, tag]).toString('base64url');
}

export function decryptAuditPayload(blob: string): string | null {
  const raw = process.env.SCAN_AUDIT_ENCRYPTION_KEY;
  if (!raw || raw.trim().length < 8) return null;
  const buf = Buffer.from(blob, 'base64url');
  if (buf.length < IV_LEN + AUTH_TAG_LEN + 1) return null;
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(buf.length - AUTH_TAG_LEN);
  const data = buf.subarray(IV_LEN, buf.length - AUTH_TAG_LEN);
  try {
    const key = deriveKey(raw.trim());
    const decipher = createDecipheriv(ALGO, key, iv, { authTagLength: AUTH_TAG_LEN });
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}
