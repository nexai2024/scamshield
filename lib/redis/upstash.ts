import { Redis } from '@upstash/redis';

let cached: Redis | null | undefined;

/** Shared Upstash Redis client (same credentials as email report storage). */
export function getUpstashRedis(): Redis | null {
  if (cached !== undefined) return cached;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  cached = url && token ? new Redis({ url, token }) : null;
  return cached;
}
