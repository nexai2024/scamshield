'use client';

import { useState, useMemo } from 'react';
import { Highlighter } from 'lucide-react';
import { buildHighlightSegments } from '@/lib/utils/highlightAnalysisText';
import type { AnalysisResult } from '@/lib/types';

interface HighlightedSourceTextProps {
  sourceText: string;
  result: Pick<AnalysisResult, 'triggered_phrases' | 'phrase_attributions' | 'red_flags'>;
  isDark: boolean;
}

export function HighlightedSourceText({ sourceText, result, isDark }: HighlightedSourceTextProps) {
  const trimmed = sourceText.trim();
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number | null>(null);

  const segments = useMemo(
    () => buildHighlightSegments(trimmed, result.triggered_phrases, result.phrase_attributions, result.red_flags),
    [trimmed, result.triggered_phrases, result.phrase_attributions, result.red_flags]
  );

  const hasHighlights = segments.some((s) => s.type === 'highlight');
  const hasPhraseList = (result.triggered_phrases?.length ?? 0) > 0;

  const activeHighlight =
    activeSegmentIndex !== null &&
    segments[activeSegmentIndex]?.type === 'highlight'
      ? segments[activeSegmentIndex]
      : null;

  if (!trimmed) return null;

  const cardBg = isDark ? 'bg-slate-900' : 'bg-white';
  const cardBorder = isDark ? 'border-slate-700' : 'border-slate-200';
  const textPrimary = isDark ? 'text-slate-100' : 'text-slate-900';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-600';
  const hlClass = isDark
    ? 'bg-amber-500/20 text-amber-100 border-b-2 border-amber-400/80 hover:bg-amber-500/30'
    : 'bg-amber-100 text-slate-900 border-b-2 border-amber-500/70 hover:bg-amber-200/90';

  return (
    <div className={`${cardBg} border rounded-2xl p-6 ${cardBorder}`}>
      <div className="flex items-start gap-2 mb-3">
        <Highlighter className={`w-5 h-5 shrink-0 mt-0.5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} aria-hidden />
        <div>
          <h3 className={`${textMuted} text-xs font-bold uppercase tracking-wider`}>Your message — explained</h3>
          <p className={`text-sm mt-1 ${textMuted}`}>
            Highlighted wording appears in your original text. Click a highlight to see which red flags it connects to.
          </p>
        </div>
      </div>

      <div
        className={`rounded-xl border p-4 text-sm leading-relaxed whitespace-pre-wrap break-words font-sans ${isDark ? 'bg-slate-950/80 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
        role="region"
        aria-label="Original message with risk highlights"
      >
        {hasHighlights ? (
          segments.map((seg, i) => {
            if (seg.type === 'plain') {
              return <span key={i}>{seg.text}</span>;
            }
            const isOpen = activeSegmentIndex === i;
            return (
              <button
                key={i}
                type="button"
                className={`inline px-0.5 rounded-sm transition-colors text-left align-baseline ${hlClass} ${isOpen ? 'ring-2 ring-offset-1 ring-amber-500/50 ring-offset-transparent' : ''}`}
                onClick={() => setActiveSegmentIndex((prev) => (prev === i ? null : i))}
                aria-expanded={isOpen}
                aria-label={`Highlighted phrase: ${seg.text.slice(0, 80)}${seg.text.length > 80 ? '…' : ''}`}
              >
                {seg.text}
              </button>
            );
          })
        ) : (
          <>
            <span>{trimmed}</span>
            {hasPhraseList && (
              <p className={`mt-4 text-xs ${textMuted}`}>
                We could not match every flagged phrase exactly in the text (spacing or edits may differ). See the list
                below.
              </p>
            )}
          </>
        )}
      </div>

      {!hasHighlights && hasPhraseList && (
        <div className="mt-4 flex flex-wrap gap-2">
          {result.triggered_phrases!.map((p, i) => (
            <span
              key={i}
              className={`px-3 py-1 rounded-lg text-sm font-mono ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'}`}
            >
              {p}
            </span>
          ))}
        </div>
      )}

      {activeHighlight && (
        <div
          className={`mt-4 rounded-xl border p-4 ${isDark ? 'border-amber-500/30 bg-amber-500/5' : 'border-amber-200 bg-amber-50/80'}`}
          role="status"
        >
          <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${textMuted}`}>Linked red flags</p>
          {activeHighlight.linkedRedFlags.length > 0 ? (
            <ul className={`space-y-2 text-sm ${textPrimary}`}>
              {activeHighlight.linkedRedFlags.map((f, j) => (
                <li key={j} className="flex gap-2">
                  <span className="text-red-500 shrink-0" aria-hidden>
                    •
                  </span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className={`text-sm ${textPrimary}`}>
              This exact wording was used in the risk assessment. Review the full red flag list below for details.
            </p>
          )}
          <button
            type="button"
            className={`mt-3 text-xs font-medium underline ${isDark ? 'text-teal-400' : 'text-teal-700'}`}
            onClick={() => setActiveSegmentIndex(null)}
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
