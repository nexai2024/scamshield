'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CountryCode } from 'libphonenumber-js';
import { MapPin, Mail, Phone, User, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

import { extractEntities } from '@/lib/entities/extract';
import type { EntityKind, EntityValidationResult, ExtractedEntities } from '@/lib/entities/types';

type Row = { kind: EntityKind; value: string };

function flattenEntities(e: ExtractedEntities): Row[] {
  return [
    ...e.emails.map((value) => ({ kind: 'email' as const, value })),
    ...e.phones.map((value) => ({ kind: 'phone' as const, value })),
    ...e.places.map((value) => ({ kind: 'place' as const, value })),
    ...e.properNames.map((value) => ({ kind: 'properName' as const, value })),
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
  /** Optional callback when the extracted set changes. */
  onExtracted?: (entities: ExtractedEntities) => void;
  /** Match dashboard light/dark surfaces. */
  isDark?: boolean;
  className?: string;
}

/**
 * Shows emails, phones, places, and proper-name-like phrases extracted from text, with per-row validation.
 * Place checks use the server `/api/validate-entity` route (OpenStreetMap Nominatim). Phone checks use libphonenumber
 * (valid number / format — not whether the line is assigned to a specific person; that needs a carrier API).
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

  const entities = useMemo(
    () => extractEntities(source, defaultCountry.toUpperCase() as CountryCode),
    [source, defaultCountry]
  );

  useEffect(() => {
    onExtracted?.(entities);
  }, [entities, onExtracted]);

  const rows = useMemo(() => flattenEntities(entities), [entities]);

  const [results, setResults] = useState<Record<string, EntityValidationResult>>({});
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

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
  const inputBg = isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200';
  const pillMuted = isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700';

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
    }
  };

  return (
    <div className={`rounded-2xl border ${cardBorder} ${cardBg} p-5 ${className}`}>
      <h3 className={`text-lg font-semibold ${textPrimary} mb-1`}>Entity extraction</h3>
      <p className={`text-sm ${textMuted} mb-4`}>
        Heuristic scan for emails, phone numbers, place-like phrases, and title-case names. Names and places from
        pattern matching are not guaranteed complete or correct.
      </p>

      {controlledText === undefined && (
        <label className="block mb-4">
          <span className={`sr-only`}>Text to analyze</span>
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
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 max-w-full">
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
