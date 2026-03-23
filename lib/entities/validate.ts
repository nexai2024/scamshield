import { parsePhoneNumberFromString } from 'libphonenumber-js';
import type { CountryCode } from 'libphonenumber-js';

import type { EntityKind, EntityValidationResult } from './types';

const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/** Structural checks only — cannot prove a real person exists. */
export function validateProperName(value: string): EntityValidationResult {
  const trimmed = value.trim();
  if (!trimmed) {
    return {valid: false, kind: 'properName', value, reason: 'Empty value.' };
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
  }
}
