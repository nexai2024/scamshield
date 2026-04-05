'use client';

import Link from 'next/link';
import { AlertOctagon, ExternalLink } from 'lucide-react';
import { HighlightedSourceText } from '@/components/analysis/HighlightedSourceText';
import { ScanResultEnhancements } from '@/components/analysis/ScanResultEnhancements';
import { VerificationRunway } from '@/components/analysis/VerificationRunway';
import { useToast } from '@/context/ToastContext';
import { SecurityBadges } from '@/components/SecurityBadges';
import type { StoredEmailReport } from '@/lib/inbound/reportStorage';
import { CONTENT_MAX_W } from '@/lib/constants';

/** Public report view for email-inbound scans — light, readable layout. */
export function EmailReportShell({ data, reportToken }: { data: StoredEmailReport; reportToken: string }) {
  const { result, sourceText, subject, createdAt } = data;
  const toast = useToast();
  const isDark = false;
  const cardBg = 'bg-white';
  const cardBorder = 'border-slate-200';
  const textPrimary = 'text-slate-900';
  const textMuted = 'text-slate-600';
  const textDim = 'text-slate-500';

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-800">
      <header className="border-b border-sky-100 bg-white/90 backdrop-blur-sm">
        <div className={`${CONTENT_MAX_W} mx-auto px-4 h-14 flex items-center justify-between`}>
          <Link href="/" className="text-lg font-bold text-slate-900">
            Scam<span className="text-teal-600">Shield</span>
          </Link>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-teal-700 hover:text-teal-800 flex items-center gap-1"
          >
            Open scanner <ExternalLink className="w-3.5 h-3.5" aria-hidden />
          </Link>
        </div>
      </header>

      <main className={`${CONTENT_MAX_W} mx-auto px-4 py-10 space-y-8`}>
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wider ${textDim}`}>Email scan report</p>
          <h1 className={`text-2xl font-bold mt-1 ${textPrimary}`}>Analysis results</h1>
          {subject && <p className={`text-sm mt-1 ${textMuted}`}>Subject: {subject}</p>}
          <p className={`text-xs mt-1 ${textDim}`}>
            Generated {new Date(createdAt).toLocaleString()} · Link expires in about 7 days
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className={`md:col-span-5 border rounded-2xl p-8 flex flex-col items-center justify-center relative overflow-hidden ${cardBg} ${cardBorder}`}>
            <div
              className={`absolute inset-0 opacity-20 blur-3xl ${result.risk_score > 50 ? 'bg-red-500' : 'bg-teal-500'}`}
            />
            <div className="relative w-44 h-44 mb-4">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={result.risk_score > 75 ? '#ef4444' : result.risk_score > 40 ? '#f59e0b' : '#0d9488'}
                  strokeWidth="8"
                  strokeDasharray={`${result.risk_score * 2.83} 283`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className={`text-4xl font-bold ${textPrimary}`}>{result.risk_score}</span>
                <span className={`text-xs uppercase tracking-wider ${textMuted}`}>Risk score</span>
              </div>
            </div>
            <div
              className={`text-lg font-bold px-4 py-1 rounded-full border ${
                result.risk_score > 75
                  ? 'bg-red-500/10 text-red-600 border-red-500/20'
                  : result.risk_score > 40
                    ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                    : 'bg-teal-500/10 text-teal-700 border-teal-500/25'
              }`}
            >
              {result.risk_level}
            </div>
            <p className={`text-sm mt-2 ${textMuted}`}>{result.scam_type}</p>
          </div>

          <div className="md:col-span-7 space-y-6">
            <div className={`${cardBg} border rounded-2xl p-6 ${cardBorder}`}>
              <h2 className={`${textMuted} text-xs font-bold uppercase tracking-wider mb-3`}>Summary</h2>
              <p className={`${textPrimary} leading-relaxed text-lg`}>{result.verdict_summary}</p>
            </div>
            <ScanResultEnhancements result={result} isDark={isDark} onCopy={(m) => toast.showToast(m)} />
            {result.why_risky && (
              <div className={`${cardBg} border rounded-2xl p-6 ${cardBorder}`}>
                <h2 className={`${textMuted} text-xs font-bold uppercase tracking-wider mb-3`}>Why this is risky</h2>
                <p className={`${textPrimary} leading-relaxed`}>{result.why_risky}</p>
              </div>
            )}
          </div>
        </div>

        <HighlightedSourceText sourceText={sourceText} result={result} isDark={isDark} />

        <VerificationRunway
          entities={result.entities}
          riskScore={result.risk_score}
          isDark={isDark}
          scanId={reportToken}
        />

        <div className={`${cardBg} border rounded-2xl p-6 ${cardBorder}`}>
          <div className="flex items-center gap-2 mb-4">
            <AlertOctagon className="w-5 h-5 text-red-500" />
            <h2 className={`font-bold ${textPrimary}`}>Red flags</h2>
          </div>
          <ul className="space-y-2 list-none m-0 p-0">
            {result.red_flags.map((flag, i) => (
              <li
                key={i}
                className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-700 flex items-start gap-2"
              >
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                {flag}
              </li>
            ))}
          </ul>
        </div>

        <div className="p-6 rounded-2xl border border-teal-100 bg-teal-50/80">
          <h2 className="text-teal-800 font-bold mb-2 uppercase text-xs tracking-wider">Recommended action</h2>
          <p className={`font-medium ${textPrimary}`}>{result.advice}</p>
        </div>

        <p className="text-center text-xs text-slate-500">
          Not legal advice. For informational purposes only.{' '}
          <Link href="/dashboard" className="text-teal-700 underline font-medium">
            Run another scan
          </Link>
        </p>

        <SecurityBadges isDark={isDark} className="justify-center pb-8" />
      </main>
    </div>
  );
}
