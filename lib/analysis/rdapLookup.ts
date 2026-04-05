/**
 * Best-effort domain metadata via RDAP bootstrap (rdap.org).
 */

import { createLogger } from '@/lib/server/logger';

const log = createLogger('rdap');

export type RdapMeta = {
  registration_date?: string;
  registrar?: string;
  error?: string;
};

function pickOptionalString(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

function parseRdapEvents(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const root = data as Record<string, unknown>;
  const events = root.events;
  if (!Array.isArray(events)) return undefined;
  for (const ev of events) {
    if (!ev || typeof ev !== 'object') continue;
    const e = ev as Record<string, unknown>;
    const action = pickOptionalString(e.eventAction)?.toLowerCase();
    if (action === 'registration' || action === 'registered') {
      const d = pickOptionalString(e.eventDate);
      if (d) return d;
    }
  }
  return undefined;
}

function parseRdapRegistrar(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const root = data as Record<string, unknown>;
  const entities = root.entities;
  if (!Array.isArray(entities)) return undefined;
  for (const ent of entities) {
    if (!ent || typeof ent !== 'object') continue;
    const e = ent as Record<string, unknown>;
    const roles = e.roles;
    if (!Array.isArray(roles)) continue;
    if (!roles.map((r) => String(r).toLowerCase()).includes('registrar')) continue;
    const vcard = e.vcardArray;
    if (Array.isArray(vcard)) {
      for (const part of vcard) {
        if (Array.isArray(part) && typeof part[3] === 'string' && part[3]) {
          return part[3];
        }
      }
    }
    const h = pickOptionalString(e.handle);
    if (h) return h;
  }
  return undefined;
}

export async function fetchRdapDomainMeta(hostname: string): Promise<RdapMeta> {
  const host = hostname.trim().toLowerCase().replace(/^www\./, '');
  if (!host || host.includes('/') || !host.includes('.')) {
    return { error: 'invalid_host' };
  }
  const rdapUrl = `https://rdap.org/domain/${encodeURIComponent(host)}`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12_000);
  try {
    const res = await fetch(rdapUrl, {
      headers: { Accept: 'application/rdap+json, application/json', 'User-Agent': 'ScamShield-RDAP/1.0' },
      signal: ctrl.signal,
      cache: 'no-store',
    });
    if (!res.ok) {
      return { error: `http_${res.status}` };
    }
    const data: unknown = await res.json().catch(() => null);
    if (!data) return { error: 'invalid_json' };
    return {
      registration_date: parseRdapEvents(data),
      registrar: parseRdapRegistrar(data),
    };
  } catch (e) {
    log.warn('rdap_failed', { host, message: e instanceof Error ? e.message : String(e) });
    return { error: e instanceof Error ? e.message : 'rdap_failed' };
  } finally {
    clearTimeout(t);
  }
}
