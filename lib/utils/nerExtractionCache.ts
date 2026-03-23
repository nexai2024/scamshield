import type { ExtractedEntities } from '@/lib/entities/types';

const MAX_ENTRIES = 48;

const cache = new Map<string, ExtractedEntities>();
const lruOrder: string[] = [];

function cloneEntities(e: ExtractedEntities): ExtractedEntities {
  return {
    emails: [...e.emails],
    phones: [...e.phones],
    places: [...e.places],
    properNames: [...e.properNames],
    urls: [...e.urls],
  };
}

function bumpKey(key: string) {
  const i = lruOrder.indexOf(key);
  if (i >= 0) lruOrder.splice(i, 1);
  lruOrder.push(key);
}

function evictIfNeeded() {
  while (lruOrder.length > MAX_ENTRIES) {
    const oldest = lruOrder.shift();
    if (oldest) cache.delete(oldest);
  }
}

async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export type NerCacheParams = {
  /** e.g. extraction mode so local vs accurate never share an entry */
  mode: string;
  text: string;
  defaultCountry: string;
  mergeWithLocal: boolean;
};

export async function nerExtractionCacheKey(params: NerCacheParams): Promise<string> {
  const payload = `${params.mode}\n${params.defaultCountry}\n${params.mergeWithLocal}\n${params.text}`;
  return sha256Hex(payload);
}

export function getNerCachedEntities(key: string): ExtractedEntities | undefined {
  const hit = cache.get(key);
  if (!hit) return undefined;
  bumpKey(key);
  return cloneEntities(hit);
}

export function setNerCachedEntities(key: string, entities: ExtractedEntities): void {
  cache.set(key, cloneEntities(entities));
  bumpKey(key);
  evictIfNeeded();
}
