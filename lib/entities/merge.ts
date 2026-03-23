import type { ExtractedEntities } from './types';

function mergeLists(...lists: string[][]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const list of lists) {
    for (const item of list) {
      const t = item.trim();
      if (!t) continue;
      const k = t.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(t);
    }
  }
  return out;
}

/** Union of two extraction results with case-insensitive deduplication per field. */
export function mergeExtractedEntities(a: ExtractedEntities, b: ExtractedEntities): ExtractedEntities {
  return {
    emails: mergeLists(a.emails, b.emails),
    phones: mergeLists(a.phones, b.phones),
    places: mergeLists(a.places, b.places),
    properNames: mergeLists(a.properNames, b.properNames),
    urls: mergeLists(a.urls, b.urls),
  };
}
