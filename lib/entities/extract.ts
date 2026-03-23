import type { CountryCode } from 'libphonenumber-js';
import { findPhoneNumbersInText } from 'libphonenumber-js/max';

import type { ExtractedEntities } from './types';

/** Lowercase words that are not likely to be standalone proper names */
const NAME_STOPWORDS = new Set(
  [
    'the', 'and', 'or', 'but', 'if', 'then', 'else', 'when', 'where', 'what', 'who', 'how', 'why',
    'this', 'that', 'these', 'those', 'with', 'from', 'into', 'onto', 'over', 'under', 'after',
    'before', 'between', 'through', 'during', 'about', 'against', 'within', 'without', 'please',
    'thank', 'thanks', 'hello', 'dear', 'regards', 'best', 'kind', 'sir', 'madam', 'mr', 'mrs',
    'ms', 'dr', 'inc', 'llc', 'ltd', 'corp', 'account', 'verify', 'click', 'here', 'urgent',
    'immediately', 'today', 'tomorrow', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday',
    'saturday', 'sunday', 'january', 'february', 'march', 'april', 'may', 'june', 'july',
    'august', 'september', 'october', 'november', 'december',
  ].map((w) => w.toLowerCase())
);

const EMAIL_RE =
  /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*/g;

/** "in Paris", "from New York" — captures candidate place phrases */
const PLACE_AFTER_PREP_RE =
  /\b(?:in|at|from|near|to|visit(?:ing)?|located\s+in|based\s+in)\s+([A-Z][\w'-]*(?:\s+[A-Z][\w'-]*)*)\b/gi;

/** Multi-word title-case sequences (possible people or organizations) */
const TITLE_RUN_RE = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g;

/** http(s) and www. candidates; trailing punctuation trimmed */
const URL_RE = /\bhttps?:\/\/[^\s<>"'[\]()]+|\bwww\.[^\s<>"'[\]()]+/gi;

function trimTrailingUrlPunctuation(s: string): string {
  return s.replace(/[),.;:!?'"\]]+$/g, '');
}

function dedupe(candidates: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of candidates) {
    const v = raw.trim();
    if (!v) continue;
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}

function tokensAreMostlyStopwords(phrase: string): boolean {
  const parts = phrase.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return true;
  const stop = parts.filter((p) => NAME_STOPWORDS.has(p.replace(/['.-]/g, '').toLowerCase()));
  return stop.length === parts.length;
}

function extractUrlsFromText(text: string): string[] {
  const raw = text.match(URL_RE) ?? [];
  const normalized: string[] = [];
  for (let u of raw) {
    u = trimTrailingUrlPunctuation(u.trim());
    if (!u) continue;
    if (/^www\./i.test(u)) u = `https://${u}`;
    normalized.push(u);
  }
  return dedupe(normalized);
}

/**
 * Pulls emails, URLs, phone numbers (libphonenumber scan), heuristic proper names, and place-like phrases from free text.
 * Names and places are best-effort heuristics, not full NER.
 */
export function extractEntities(text: string, defaultCountry: CountryCode = 'US'): ExtractedEntities {
  const emails = dedupe(text.match(EMAIL_RE) ?? []);
  const urls = extractUrlsFromText(text);

  const phones: string[] = [];
  try {
    for (const match of findPhoneNumbersInText(text, defaultCountry)) {
      const n = match.number?.number;
      if (n) phones.push(n);
    }
  } catch {
    // ignore malformed input
  }
  const phonesDeduped = dedupe(phones);

  const properNames: string[] = [];
  let m: RegExpExecArray | null;
  const titleRun = new RegExp(TITLE_RUN_RE.source, 'g');
  while ((m = titleRun.exec(text)) !== null) {
    const phrase = m[1]?.trim();
    if (!phrase || phrase.length < 3) continue;
    if (tokensAreMostlyStopwords(phrase)) continue;
    properNames.push(phrase);
  }

  const places: string[] = [];
  const placeRe = new RegExp(PLACE_AFTER_PREP_RE.source, 'gi');
  while ((m = placeRe.exec(text)) !== null) {
    const phrase = m[1]?.trim();
    if (!phrase || phrase.length < 2) continue;
    places.push(phrase);
  }

  return {
    emails,
    phones: phonesDeduped,
    places: dedupe(places),
    properNames: dedupe(properNames),
    urls,
  };
}
