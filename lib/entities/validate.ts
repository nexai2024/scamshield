import { parsePhoneNumberFromString } from 'libphonenumber-js';
import type { CountryCode } from 'libphonenumber-js';

import type { EntityKind, EntityValidationResult } from './types';
import { formatThreatSummary, runOptionalUrlThreatChecks } from './urlThreatChecks';

const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/** Structural checks only — cannot prove a real person exists. */
export function validateProperName(value: string): EntityValidationResult {
  const trimmed = value.trim();
  if (!trimmed) {
    return { valid: false, kind: 'properName', value, reason: 'Empty value.' };
  }
  if (trimmed.length < 2 || trimmed.length > 120) {
    return { valid: false, kind: 'properName', value, reason: 'Length should be between 2 and 120 characters.' };
  }
  if (!/^[\p{L}\s'.-]+$/u.test(trimmed)) {
    return {
      valid: false,
      kind: 'properName',
      value,
      reason: 'Contains characters not typical of a name.',
    };
  }
  const wordCount = trimmed.split(/\s+/).length;
  if (wordCount > 8) {
    return { valid: false, kind: 'properName', value, reason: 'Too many tokens for a typical name.' };
  }
  return {
    valid: true,
    kind: 'properName',
    value: trimmed,
    detail: 'Format looks reasonable; identity cannot be verified from text alone.',
  };
}

export function validateEmailAddress(value: string): EntityValidationResult {
  const trimmed = value.trim();
  if (!trimmed) {
    return { valid: false, kind: 'email', value, reason: 'Empty value.' };
  }
  if (!EMAIL_RE.test(trimmed)) {
    return { valid: false, kind: 'email', value, reason: 'Not a syntactically valid email address.' };
  }
  const [local, domain] = trimmed.split('@');
  if (!local || !domain || local.length > 64 || domain.length > 255) {
    return { valid: false, kind: 'email', value, reason: 'Local or domain part is invalid length.' };
  }
  return { valid: true, kind: 'email', value: trimmed, detail: 'Syntax is valid.' };
}

export function validatePhoneNumber(
  value: string,
  defaultCountry: CountryCode = 'US'
): EntityValidationResult {
  const trimmed = value.trim();
  if (!trimmed) {
    return { valid: false, kind: 'phone', value, reason: 'Empty value.' };
  }
  const parsed = parsePhoneNumberFromString(trimmed, defaultCountry);
  if (!parsed || !parsed.isValid()) {
    return {
      valid: false,
      kind: 'phone',
      value,
      reason: 'Not a valid phone number for the given region.',
    };
  }
  return {
    valid: true,
    kind: 'phone',
    value: trimmed,
    detail: parsed.formatInternational(),
  };
}

function normalizeUrlInput(value: string): string {
  const t = value.trim();
  if (!t) return t;
  if (/^https?:\/\//i.test(t)) return t;
  if (/^www\./i.test(t)) return `https://${t}`;
  if (/^[a-z0-9][\w.-]*\.[a-z]{2,}(\/|$)/i.test(t)) return `https://${t}`;
  return t;
}

/**
 * Syntax check, optional Google Web Risk + PhishTank lookups, then HTTP HEAD reachability.
 * Set `GOOGLE_WEB_RISK_API_KEY` and/or `PHISHTANK_APP_KEY` in the environment for threat feeds.
 */
export async function validateUrl(value: string): Promise<EntityValidationResult> {
  const trimmed = value.trim();
  if (!trimmed) {
    return { valid: false, kind: 'url', value, reason: 'Empty value.' };
  }

  const toParse = normalizeUrlInput(trimmed);
  let parsed: URL;
  try {
    parsed = new URL(toParse);
  } catch {
    return { valid: false, kind: 'url', value, reason: 'Not a valid URL.' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, kind: 'url', value, reason: 'Only http(s) URLs are supported.' };
  }

  const host = parsed.hostname;
  if (!host || (!host.includes('.') && host !== 'localhost')) {
    return { valid: false, kind: 'url', value, reason: 'Hostname looks invalid.' };
  }

  const href = parsed.href;

  const threatParts = await runOptionalUrlThreatChecks(href);
  const threatLine = formatThreatSummary(threatParts);
  const threatHit = threatParts.some((p) => p.flagged);
  if (threatHit) {
    const hit = threatParts.find((p) => p.flagged);
    const who = hit?.provider === 'google_web_risk' ? 'Google Web Risk' : 'PhishTank';
    return {
      valid: false,
      kind: 'url',
      value: trimmed,
      reason: `${who} reported a threat. ${threatLine}`,
    };
  }

  const controller = new AbortController();
  const timeoutMs = 8000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const tryHead = async (): Promise<Response | null> => {
    try {
      return await fetch(href, {
        method: 'HEAD',
        redirect: 'follow',
        signal: controller.signal,
        headers: { 'User-Agent': 'ScamShield/1.0 (url-validation)' },
        cache: 'no-store',
      });
    } catch {
      return null;
    }
  };

  try {
    const res = await tryHead();
    clearTimeout(timer);

    if (!res) {
      return {
        valid: false,
        kind: 'url',
        value: trimmed,
        reason: `Could not reach URL (network, timeout, or TLS error). ${threatLine}`,
      };
    }

    if (res.status === 405 || res.status === 501) {
      return {
        valid: true,
        kind: 'url',
        value: trimmed,
        detail: `Syntax valid; server declined HEAD (reachability not fully verified). ${threatLine}`,
      };
    }

    if (res.status >= 200 && res.status < 400) {
      return {
        valid: true,
        kind: 'url',
        value: trimmed,
        detail: `Reachable (HTTP ${res.status}). ${threatLine}`,
      };
    }

    return {
      valid: false,
      kind: 'url',
      value: trimmed,
      reason: `HTTP ${res.status} when checking URL. ${threatLine}`,
    };
  } catch {
    clearTimeout(timer);
    return {
      valid: false,
      kind: 'url',
      value: trimmed,
      reason: `Request failed or timed out. ${threatLine}`,
    };
  }
}

const NOMINATIM_SEARCH = 'https://nominatim.openstreetmap.org/search';

/**
 * Uses OpenStreetMap Nominatim to check whether a place string resolves to a real location.
 * Must only be called from the server (API route) to satisfy usage policy and avoid browser CORS issues.
 */
export async function validatePlaceExists(place: string): Promise<EntityValidationResult> {
  const q = place.trim();
  if (!q) {
    return { valid: false, kind: 'place', value: place, reason: 'Empty value.' };
  }

  const url = new URL(NOMINATIM_SEARCH);
  url.searchParams.set('q', q);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'ScamShield/1.0 (entity-validation)',
      },
      next: { revalidate: 0 },
    });
  } catch {
    return { valid: false, kind: 'place', value: place, reason: 'Geocoding request failed.' };
  }

  if (!res.ok) {
    return { valid: false, kind: 'place', value: place, reason: `Geocoder returned ${res.status}.` };
  }

  type NominatimHit = { display_name?: string; lat?: string; lon?: string };
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    return { valid: false, kind: 'place', value: place, reason: 'Invalid geocoder response.' };
  }

  if (!Array.isArray(data) || data.length === 0) {
    return { valid: false, kind: 'place', value: place, reason: 'No matching place found.' };
  }

  const hit = data[0] as NominatimHit;
  const label = typeof hit.display_name === 'string' ? hit.display_name : q;
  return {
    valid: true,
    kind: 'place',
    value: place,
    detail: label,
  };
}

/**
 * Validates a single entity. Place validation performs a network lookup and should run on the server
 * (e.g. via `POST /api/validate-entity`).
 */
export async function validateEntity(
  kind: EntityKind,
  value: string,
  options?: { defaultCountry?: CountryCode }
): Promise<EntityValidationResult> {
  switch (kind) {
    case 'email':
      return validateEmailAddress(value);
    case 'phone':
      return validatePhoneNumber(value, options?.defaultCountry ?? 'US');
    case 'properName':
      return validateProperName(value);
    case 'place':
      return validatePlaceExists(value);
    case 'url':
      return validateUrl(value);
  }
}
