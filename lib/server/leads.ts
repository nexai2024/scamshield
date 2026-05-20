import { randomUUID } from 'crypto';
import { getUpstashRedis } from '@/lib/redis/upstash';

const LEADS_INDEX = 'leads:index';
const LEAD_ENTRY = (id: string) => `leads:entry:${id}`;
const LEAD_EMAIL = (email: string) => `leads:email:${email}`;

export type LeadRecord = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  note: string;
  createdAt: string;
};

export type CreateLeadInput = {
  firstName?: string;
  lastName?: string;
  email: string;
  note?: string;
};

export type CreateLeadResult =
  | { ok: true; id: string; duplicate?: boolean }
  | { ok: false; reason: 'storage_unavailable' | 'invalid_email' };

function normalizeLeadInput(input: CreateLeadInput): LeadRecord | null {
  const email = input.email?.trim().toLowerCase().slice(0, 255);
  if (!email || !email.includes('@') || email.length < 5) return null;
  return {
    id: randomUUID(),
    firstName: (input.firstName ?? '').toString().trim().slice(0, 100),
    lastName: (input.lastName ?? '').toString().trim().slice(0, 100),
    email,
    note: (input.note ?? '').toString().trim().slice(0, 1000),
    createdAt: new Date().toISOString(),
  };
}

/** Persist a marketing lead in Upstash Redis (same stack as scan audit). */
export async function createLead(input: CreateLeadInput): Promise<CreateLeadResult> {
  const record = normalizeLeadInput(input);
  if (!record) return { ok: false, reason: 'invalid_email' };

  const redis = getUpstashRedis();
  if (!redis) return { ok: false, reason: 'storage_unavailable' };

  const existingId = await redis.get<string>(LEAD_EMAIL(record.email));
  if (existingId) {
    return { ok: true, id: existingId, duplicate: true };
  }

  await redis.set(LEAD_ENTRY(record.id), JSON.stringify(record));
  await redis.set(LEAD_EMAIL(record.email), record.id);
  await redis.zadd(LEADS_INDEX, { score: Date.now(), member: record.id });

  return { ok: true, id: record.id };
}

export function isLeadsStorageConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}
