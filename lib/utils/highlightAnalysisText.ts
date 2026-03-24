import type { PhraseAttribution } from '@/lib/types';

export type HighlightSegment =
  | { type: 'plain'; text: string }
  | { type: 'highlight'; text: string; linkedRedFlags: string[] };

type Match = { start: number; end: number; linkedRedFlags: string[] };

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findOccurrences(haystack: string, phrase: string): { start: number; end: number }[] {
  const t = haystack;
  const p = phrase.trim();
  if (!p) return [];
  const re = new RegExp(escapeRegExp(p), 'gi');
  const out: { start: number; end: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(t)) !== null) {
    out.push({ start: m.index, end: m.index + m[0].length });
    if (m[0].length === 0) re.lastIndex++;
  }
  return out;
}

function flagsForPhrase(
  phrase: string,
  attributions: PhraseAttribution[] | undefined,
  redFlags: string[]
): string[] {
  if (!attributions?.length) return [];
  const norm = (s: string) => s.trim().toLowerCase();
  const n = norm(phrase);
  for (const a of attributions) {
    if (norm(a.phrase) === n) {
      return a.linked_red_flag_indexes
        .map((i) => redFlags[i])
        .filter((f): f is string => typeof f === 'string' && f.length > 0);
    }
  }
  return [];
}

/**
 * Split source text into plain + highlighted spans for triggered phrases.
 * Resolves overlaps by preferring longer matches, then merges segments in order.
 */
export function buildHighlightSegments(
  source: string,
  phrases: string[] | undefined,
  attributions: PhraseAttribution[] | undefined,
  redFlags: string[]
): HighlightSegment[] {
  const uniquePhrases = [...new Set((phrases ?? []).map((p) => p.trim()).filter(Boolean))];
  if (!source || uniquePhrases.length === 0) {
    return [{ type: 'plain', text: source || '' }];
  }

  const candidates: Match[] = [];
  for (const phrase of uniquePhrases) {
    const linked = flagsForPhrase(phrase, attributions, redFlags);
    for (const { start, end } of findOccurrences(source, phrase)) {
      candidates.push({ start, end, linkedRedFlags: linked });
    }
  }

  if (candidates.length === 0) {
    return [{ type: 'plain', text: source }];
  }

  candidates.sort((a, b) => b.end - b.start - (a.end - a.start));
  const picked: Match[] = [];
  for (const c of candidates) {
    if (picked.some((p) => c.start < p.end && c.end > p.start)) continue;
    picked.push(c);
  }
  picked.sort((a, b) => a.start - b.start);

  const segments: HighlightSegment[] = [];
  let cursor = 0;
  for (const m of picked) {
    if (m.start > cursor) {
      segments.push({ type: 'plain', text: source.slice(cursor, m.start) });
    }
    segments.push({
      type: 'highlight',
      text: source.slice(m.start, m.end),
      linkedRedFlags: m.linkedRedFlags,
    });
    cursor = m.end;
  }
  if (cursor < source.length) {
    segments.push({ type: 'plain', text: source.slice(cursor) });
  }

  return segments.length > 0 ? segments : [{ type: 'plain', text: source }];
}
