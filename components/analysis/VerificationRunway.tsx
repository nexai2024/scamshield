'use client';

import { useMemo, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, ExternalLink, Search, ListChecks } from 'lucide-react';
import {
  buildVerificationRunwayItems,
  googleSearchUrl,
} from '@/lib/utils/verificationRunwayItems';
import type { EntityRecognitionResult } from '@/lib/types';

const VR_DONE_PREFIX = 'scamshield_vr_done:';

function parseStoredDone(raw: string | null, validIds: Set<string>): Set<string> {
  if (!raw) return new Set();
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === 'string' && validIds.has(id)));
  } catch {
    return new Set();
  }
}

interface VerificationRunwayProps {
  entities: EntityRecognitionResult | undefined;
  riskScore: number;
  isDark: boolean;
  /** When set, checklist completion is restored from `sessionStorage` for this scan. */
  scanId?: string | null;
}

export function VerificationRunway({ entities, riskScore, isDark, scanId }: VerificationRunwayProps) {
  const items = useMemo(() => buildVerificationRunwayItems(entities, riskScore), [entities, riskScore]);
  const storageKey = scanId ? `${VR_DONE_PREFIX}${scanId}` : null;
  const itemIdsFingerprint = useMemo(() => [...items.map((i) => i.id)].sort().join('|'), [items]);

  const [done, setDone] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (!storageKey) {
      setDone(new Set());
      return;
    }
    const validIds = new Set(items.map((i) => i.id));
    setDone(parseStoredDone(sessionStorage.getItem(storageKey), validIds));
  }, [storageKey, itemIdsFingerprint, items]);

  const toggle = useCallback(
    (id: string) => {
      setDone((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        if (storageKey) {
          try {
            sessionStorage.setItem(storageKey, JSON.stringify([...next]));
          } catch {
            // ignore quota / private mode
          }
        }
        return next;
      });
    },
    [storageKey]
  );

  if (items.length === 0) return null;

  const cardBg = isDark ? 'bg-slate-900' : 'bg-white';
  const cardBorder = isDark ? 'border-slate-700' : 'border-slate-200';
  const textPrimary = isDark ? 'text-slate-100' : 'text-slate-900';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-600';
  const rowBg = isDark ? 'bg-slate-950/60' : 'bg-sky-50/50';
  const linkClass = isDark ? 'text-teal-400 hover:text-teal-300' : 'text-teal-700 hover:text-teal-800';

  const progress = Math.round((done.size / items.length) * 100);

  return (
    <div className={`${cardBg} border rounded-2xl p-6 ${cardBorder}`}>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-2">
          <ListChecks className={`w-5 h-5 shrink-0 mt-0.5 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} aria-hidden />
          <div>
            <h3 className={`${textMuted} text-xs font-bold uppercase tracking-wider`}>Verify it yourself</h3>
            <p className={`text-sm mt-1 ${textMuted} max-w-2xl`}>
              Work through these checks using sources you trust — not links or numbers from the suspicious message. Check
              off steps as you complete them.
            </p>
          </div>
        </div>
        <div
          className={`text-xs font-semibold tabular-nums px-2 py-1 rounded-lg ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}
          aria-live="polite"
        >
          {done.size}/{items.length} ({progress}%)
        </div>
      </div>

      <ul className="space-y-3 list-none m-0 p-0">
        {items.map((item, idx) => {
          const checked = done.has(item.id);
          const fieldId = `vr-step-${idx}`;
          const detailId = `vr-detail-${idx}`;
          return (
            <li
              key={item.id}
              className={`rounded-xl border p-4 flex gap-3 ${isDark ? 'border-slate-700' : 'border-slate-200'} ${rowBg}`}
            >
              <input
                id={fieldId}
                type="checkbox"
                checked={checked}
                onChange={() => toggle(item.id)}
                className="mt-1 h-4 w-4 rounded border-slate-400 text-teal-600 focus:ring-teal-500 shrink-0"
                aria-describedby={item.detail ? detailId : undefined}
              />
              <div className="min-w-0 flex-1">
                <label htmlFor={fieldId} className={`font-semibold text-sm cursor-pointer ${textPrimary}`}>
                  {item.title}
                </label>
                {item.detail && (
                  <p id={detailId} className={`text-sm mt-1 ${textMuted}`}>
                    {item.detail}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 mt-3">
                  {item.googleQuery && (
                    <a
                      href={googleSearchUrl(item.googleQuery)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${isDark ? 'border-slate-600 hover:bg-slate-800' : 'border-slate-200 bg-white hover:bg-slate-50'} ${linkClass}`}
                    >
                      <Search className="w-3.5 h-3.5" aria-hidden />
                      Google search
                    </a>
                  )}
                  {item.href && item.externalLabel && (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${isDark ? 'border-slate-600 hover:bg-slate-800' : 'border-slate-200 bg-white hover:bg-slate-50'} ${linkClass}`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" aria-hidden />
                      {item.externalLabel}
                    </a>
                  )}
                </div>
              </div>
              {checked && <CheckCircle2 className={`w-5 h-5 shrink-0 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} aria-hidden />}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
