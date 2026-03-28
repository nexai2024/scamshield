'use client';

import { useEffect, useState } from 'react';
import { Lightbulb, Loader2, Sparkles } from 'lucide-react';

import { ANALYSIS_LOADING_TIPS } from '@/lib/data/analysisLoadingTips';

const TIP_ROTATE_MS = 7500;

interface AnalysisLoadingStateProps {
  isDark?: boolean;
}

function pickRandomStart(length: number): number {
  if (length <= 0) return 0;
  return Math.floor(Math.random() * length);
}

export function AnalysisLoadingState({ isDark = false }: AnalysisLoadingStateProps) {
  const tips = ANALYSIS_LOADING_TIPS;
  const [tipIndex, setTipIndex] = useState(() => pickRandomStart(tips.length));

  useEffect(() => {
    if (tips.length <= 1) return;
    const id = window.setInterval(() => {
      setTipIndex((i) => (i + 1) % tips.length);
    }, TIP_ROTATE_MS);
    return () => window.clearInterval(id);
  }, [tips.length]);

  const cardBg = isDark ? 'bg-slate-900' : 'bg-white';
  const cardBorder = isDark ? 'border-slate-800' : 'border-slate-200';
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-600';
  const tipSurface = isDark ? 'bg-slate-800/60 border-slate-700/80' : 'bg-amber-50/80 border-amber-200/80';
  const accent = 'text-teal-500 dark:text-teal-400';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div
        className={`rounded-2xl border ${cardBorder} ${cardBg} px-6 py-12 md:py-14 text-center max-w-2xl mx-auto shadow-lg shadow-slate-900/5 dark:shadow-none`}
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label="Analysis in progress"
      >
        <div className="flex justify-center mb-6">
          <div className={`relative flex items-center justify-center w-20 h-20 rounded-full ${isDark ? 'bg-teal-500/15' : 'bg-teal-500/10'}`}>
            <Loader2 className={`w-10 h-10 ${accent} animate-spin`} aria-hidden />
            <Sparkles className={`absolute -right-1 -top-1 w-5 h-5 ${accent} opacity-90`} aria-hidden />
          </div>
        </div>
        <h2 className={`text-xl md:text-2xl font-bold mb-2 ${textPrimary}`}>Analyzing your message</h2>
        <p className={`text-sm md:text-base ${textMuted} max-w-md mx-auto leading-relaxed`}>
          Our AI is reviewing wording, pressure tactics, and common scam patterns. This usually takes a few seconds—hang tight.
        </p>
      </div>

      <div
        className={`rounded-2xl border px-5 py-5 md:px-6 md:py-6 max-w-2xl mx-auto ${tipSurface}`}
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="flex gap-4 text-left">
          <div
            className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-800'}`}
            aria-hidden
          >
            <Lightbulb className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className={`text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-amber-200/90' : 'text-amber-900/80'}`}>
              Did you know?
            </p>
            <p className={`text-sm md:text-base leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-800'}`} key={tipIndex}>
              {tips[tipIndex]}
            </p>
          </div>
        </div>
        {tips.length > 1 ? (
          <div className="flex justify-center gap-1.5 mt-5" role="presentation" aria-hidden>
            {tips.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === tipIndex
                    ? `w-6 ${isDark ? 'bg-teal-400' : 'bg-teal-600'}`
                    : `w-1.5 ${isDark ? 'bg-slate-600' : 'bg-slate-300'}`
                }`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
