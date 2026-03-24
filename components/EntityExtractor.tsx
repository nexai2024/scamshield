'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CountryCode } from 'libphonenumber-js';
import {
  MapPin,
  Mail,
  Phone,
  User,
  Link2,
  CheckCircle2,
  XCircle,
  Loader2,
  Zap,
  Sparkles,
} from 'lucide-react';

import { extractEntities } from '@/lib/entities/extract';
import type { EntityKind, EntityValidationResult, ExtractedEntities } from '@/lib/entities/types';
import {
  getNerCachedEntities,
  nerExtractionCacheKey,
  setNerCachedEntities,
} from '@/lib/utils/nerExtractionCache';

type Row = { kind: EntityKind; value: string };

export type ExtractionMode = 'local' | 'accurate';

function flattenEntities(e: ExtractedEntities): Row[] {
  return [
    ...e.emails.map((value) => ({ kind: 'email' as const, value })),
    ...e.phones.map((value) => ({ kind: 'phone' as const, value })),
    ...e.places.map((value) => ({ kind: 'place' as const, value })),
    ...e.properNames.map((value) => ({ kind: 'properName' as const, value })),
    ...e.urls.map((value) => ({ kind: 'url' as const, value })),
  ];
}

function rowKey(kind: EntityKind, value: string) {
  return `${kind}:${value}`;
}

export interface EntityExtractorProps {
  /** When set, extraction runs on this string; otherwise an internal textarea is shown. */
  text?: string;
  /** ISO 3166-1 alpha-2 default region for parsing phone numbers (default US). */
  defaultCountry?: string;
  /** Optional callback when the displayed extracted set changes. */
  onExtracted?: (entities: ExtractedEntities) => void;
  /** Match dashboard light/dark surfaces. */
  isDark?: boolean;
  className?: string;
}

/**
 * Emails, URLs, phones, places, and names from local heuristics or merged with OpenAI NER (`/api/extract-entities`).
 * Accurate mode caches OpenAI+local results by SHA-256(text + country + merge flag). Validation uses
 * `/api/validate-entity` (Nominatim, libphonenumber, URL HEAD + optional Google Web Risk / PhishTank).
 */
export function EntityExtractor({
  text: controlledText,
  defaultCountry = 'US',
  onExtracted,
  isDark = false,
  className = '',
}: EntityExtractorProps) {
  const [localText, setLocalText] = useState('');
  const source = controlledText !== undefined ? controlledText : localText;

  const [extractionMode, setExtractionMode] = useState<ExtractionMode>('local');
  const [nerEntities, setNerEntities] = useState<ExtractedEntities | null>(null);
  const [nerLoading, setNerLoading] = useState(false);
  const [nerError, setNerError] = useState<string | null>(null);

  const country = defaultCountry.toUpperCase() as CountryCode;

  const localEntities = useMemo(() => extractEntities(source, country), [source, country]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (extractionMode !== 'accurate') {
      setNerLoading(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const id = ++requestIdRef.current;

      void (async () => {
        if (!source.trim()) {
          if (requestIdRef.current !== id) return;
          setNerEntities(null);
          setNerError(null);
          setNerLoading(false);
          return;
        }

        const mergeWithLocal = true;
        const cacheKey = await nerExtractionCacheKey({
          mode: 'accurate',
          text: source,
          defaultCountry,
          mergeWithLocal,
        });
        const cached = getNerCachedEntities(cacheKey);
        if (cached) {
          if (requestIdRef.current !== id) return;
          setNerEntities(cached);
          setNerError(null);
          setNerLoading(false);
          return;
        }

        setNerLoading(true);
        setNerError(null);

        try {
          const res = await fetch('/api/extract-entities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: source,
              mergeWithLocal,
              defaultCountry,
            }),
          });
          const data = (await res.json()) as { entities?: ExtractedEntities; error?: string };
          if (requestIdRef.current !== id) return;
          if (!res.ok) {
            setNerError(typeof data.error === 'string' ? data.error : 'NER request failed.');
            setNerEntities(null);
            return;
          }
          if (data.entities) {
            setNerCachedEntities(cacheKey, data.entities);
            setNerEntities(data.entities);
          } else {
            setNerError('Invalid response from server.');
            setNerEntities(null);
          }
        } catch {
          if (requestIdRef.current !== id) return;
          setNerError('Network error.');
          setNerEntities(null);
        } finally {
          if (requestIdRef.current === id) setNerLoading(false);
        }
      })();
    }, 450);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [extractionMode, source, defaultCountry]);

  const displayEntities = extractionMode === 'local' ? localEntities : (nerEntities ?? localEntities);

  useEffect(() => {
    onExtracted?.(displayEntities);
  }, [displayEntities, onExtracted]);

  const rows = useMemo(() => flattenEntities(displayEntities), [displayEntities]);

  const rowSignature = useMemo(
    () =>
      [...rows]
        .map(({ kind, value }) => rowKey(kind, value))
        .sort()
        .join('|'),
    [rows]
  );

  const [results, setResults] = useState<Record<string, EntityValidationResult>>({});
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  useEffect(() => {
    setResults({});
  }, [rowSignature, extractionMode]);

  const validateRow = useCallback(
    async (kind: EntityKind, value: string) => {
      const key = rowKey(kind, value);
      setLoadingKey(key);
      try {
        const res = await fetch('/api/validate-entity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kind, value, defaultCountry }),
        });
        const data = (await res.json()) as EntityValidationResult & { error?: string };
        if (!res.ok) {
          setResults((prev) => ({
            ...prev,
            [key]: {
              valid: false,
              kind,
              value,
              reason: typeof data.error === 'string' ? data.error : 'Validation failed.',
            },
          }));
          return;
        }
        setResults((prev) => ({ ...prev, [key]: data }));
      } catch {
        setResults((prev) => ({
          ...prev,
          [key]: { valid: false, kind, value, reason: 'Network error.' },
        }));
      } finally {
        setLoadingKey(null);
      }
    },
    [defaultCountry]
  );

  const cardBg = isDark ? 'bg-slate-900' : 'bg-white';
  const cardBorder = isDark ? 'border-slate-800' : 'border-slate-200';
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-600';
  const inputBg = isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200';
  const pillMuted = isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700';
  const toggleInactive = isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900';
  const toggleActive = isDark ? 'bg-amber-500/20 text-amber-200 border-amber-500/40' : 'bg-amber-100 text-amber-900 border-amber-300';

  const iconFor = (kind: EntityKind) => {
    switch (kind) {
      case 'email':
        return <Mail className="w-4 h-4 shrink-0" aria-hidden />;
      case 'phone':
        return <Phone className="w-4 h-4 shrink-0" aria-hidden />;
      case 'place':
        return <MapPin className="w-4 h-4 shrink-0" aria-hidden />;
      case 'properName':
        return <User className="w-4 h-4 shrink-0" aria-hidden />;
      case 'url':
        return <Link2 className="w-4 h-4 shrink-0" aria-hidden />;
    }
  };

  const labelFor = (kind: EntityKind) => {
    switch (kind) {
      case 'email':
        return 'Email';
      case 'phone':
        return 'Phone';
      case 'place':
        return 'Place';
      case 'properName':
        return 'Name';
      case 'url':
        return 'URL';
    }
  };

  return (
    <div className={`rounded-2xl border ${cardBorder} ${cardBg} p-5 ${className}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
        <div>
          <h3 className={`text-lg font-semibold ${textPrimary}`}>Entity extraction</h3>
          <p className={`text-sm ${textMuted} mt-1`}>
            Local regex and libphonenumber scan, plus optional OpenAI NER merged into the same lists (cached by
            content hash in this browser session). URL validation adds optional Google Web Risk and PhishTank
            checks when API keys are configured, plus a HEAD reachability probe.
          </p>
        </div>
        <div
          className={`flex shrink-0 rounded-xl border ${cardBorder} p-0.5 text-xs font-medium`}
          role="group"
          aria-label="Extraction mode"
        >
          <button
            type="button"
            onClick={() => setExtractionMode('local')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors border border-transparent ${
              extractionMode === 'local' ? toggleActive : toggleInactive
            }`}
          >
            <Zap className="w-3.5 h-3.5" aria-hidden />
            Fast local
          </button>
          <button
            type="button"
            onClick={() => setExtractionMode('accurate')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors border border-transparent ${
              extractionMode === 'accurate' ? toggleActive : toggleInactive
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" aria-hidden />
            Accurate API
          </button>
        </div>
      </div>

      {extractionMode === 'accurate' && nerError ? (
        <p className={`text-sm text-red-600 dark:text-red-400 mb-3`} role="alert">
          {nerError} Showing local extraction until the request succeeds.
        </p>
      ) : null}

      {extractionMode === 'accurate' && nerLoading ? (
        <p className={`text-sm ${textMuted} mb-3 inline-flex items-center gap-2`}>
          <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden />
          Merging OpenAI NER with local scan…
        </p>
      ) : extractionMode === 'accurate' && nerEntities ? (
        <p className={`text-sm ${textMuted} mb-3`}>
          Showing merged OpenAI + local entities (served from cache when this exact text was analyzed before).
        </p>
      ) : null}

      {controlledText === undefined && (
        <label className="block mb-4">
          <span className="sr-only">Text to analyze</span>
          <textarea
            value={localText}
            onChange={(e) => setLocalText(e.target.value)}
            rows={5}
            placeholder="Paste message text here…"
            className={`w-full rounded-xl border px-3 py-2 text-sm ${textPrimary} ${inputBg} resize-y min-h-[120px] focus:outline-none focus:ring-2 focus:ring-amber-500/40`}
          />
        </label>
      )}

      {rows.length === 0 ? (
        <p className={`text-sm ${textMuted}`}>No entities detected yet.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map(({ kind, value }) => {
            const key = rowKey(kind, value);
            const r = results[key];
            const busy = loadingKey === key;
            return (
              <li
                key={key}
                className={`flex flex-wrap items-center gap-2 rounded-xl border ${cardBorder} px-3 py-2`}
              >
                <span
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-xs font-medium ${pillMuted}`}
                >
                  {iconFor(kind)}
                  {labelFor(kind)}
                </span>
                <span className={`text-sm ${textPrimary} break-all flex-1 min-w-[12rem]`}>{value}</span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void validateRow(kind, value)}
                  className={`inline-flex items-center gap-1 rounded-lg border ${cardBorder} px-2.5 py-1 text-xs font-medium ${textPrimary} hover:bg-slate-800/10 dark:hover:bg-white/5 disabled:opacity-50`}
                >
                  {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden /> : null}
                  Validate
                </button>
                {r && !busy ? (
                  r.valid ? (
                    <span className="inline-flex items-center gap-1 text-xs text-teal-700 dark:text-teal-400 max-w-full">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden />
                      <span className="truncate">{r.detail ?? 'OK'}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400 max-w-full">
                      <XCircle className="w-3.5 h-3.5 shrink-0" aria-hidden />
                      <span className="truncate">{r.reason ?? 'Invalid'}</span>
                    </span>
                  )
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
