'use client';

import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle, Lock, Mail } from 'lucide-react';
import { HighlightedSourceText } from '@/components/analysis/HighlightedSourceText';
import { VerificationRunway } from '@/components/analysis/VerificationRunway';
import {
  CANONICAL_DEMO_RESULT,
  CANONICAL_DEMO_SOURCE_TEXT,
  CANONICAL_DEMO_REPORT_PATH,
} from '@/lib/marketing/canonicalScreenshotData';
import { CONTENT_MAX_W } from '@/lib/constants';

const FRAME =
  'rounded-xl border border-slate-200 bg-white shadow-[0_24px_80px_-20px_rgba(15,23,42,0.12)] overflow-hidden';

/**
 * Four fixed-size frames for canonical captures. Use light theme only.
 * Playwright: screenshot each `[data-marketing-shot]` node.
 */
export function MarketingScreenshotPanels() {
  const isDark = false;
  const demoBase =
    typeof window !== 'undefined'
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_APP_URL || 'https://scamshield.app').replace(/\/$/, '');
  const demoReportUrl = `${demoBase}${CANONICAL_DEMO_REPORT_PATH}`;

  return (
    <div className="mx-auto flex flex-col items-center gap-16 pb-24 px-4">
      <p className={`max-w-2xl text-center text-sm ${CONTENT_MAX_W}`}>
        Canonical frames for decks, social, and press. Capture each panel with{' '}
        <code className="text-xs bg-slate-100 px-1 rounded">npm run marketing:screenshots</code> (dev server running)
        or crop manually. Dimensions are fixed for consistency.
      </p>

      {/* 1 — Landing (OG-friendly 1200×630) */}
      <figure className="flex flex-col items-center gap-2">
        <figcaption className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          01 · Landing hero
        </figcaption>
        <div
          data-marketing-shot="landing"
          id="shot-landing"
          className={`${FRAME} w-[1200px] max-w-[calc(100vw-2rem)] h-[630px] relative bg-[#f4f7fb]`}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[320px] bg-sky-400/15 blur-[80px] rounded-full pointer-events-none" />
          <div className="relative h-full flex flex-col items-center justify-center text-center px-10 pt-8">
            <div className="flex items-center gap-2 mb-6">
              <div className="bg-teal-600/10 p-2 rounded-lg border border-teal-600/15">
                <Image src="/favicon.svg" alt="" width={40} height={40} unoptimized />
              </div>
              <span className="text-2xl font-bold text-slate-900">
                Scam<span className="text-teal-600">Shield</span>
              </span>
            </div>
            <div className="glass-panel inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-sky-800 mb-4">
              <Lock className="w-3.5 h-3.5" /> AI-Powered Fraud Detection
            </div>
            <h2 className="hero-trust-title text-5xl md:text-6xl font-bold mb-4 leading-[1.05]">SCAM SHIELD</h2>
            <p className="text-slate-600 text-lg max-w-xl mb-8 leading-relaxed">
              Stop the scam before it starts. Instantly analyze suspicious texts, emails, and dating profiles.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <span className="px-8 py-3 bg-teal-600 text-white rounded-xl font-bold text-base shadow-lg shadow-teal-600/25">
                Scan a Message Free
              </span>
              <span className="px-8 py-3 rounded-xl font-bold text-base border border-slate-200 bg-white text-slate-800 shadow-sm">
                How it Works
              </span>
            </div>
            <div className="flex items-center justify-center gap-8 mt-8 text-slate-500 text-sm">
              <span className="flex items-center gap-2 font-medium">
                <CheckCircle className="w-4 h-4" /> 10,000+ Scans
              </span>
              <span className="flex items-center gap-2 font-medium">
                <Lock className="w-4 h-4" /> Encrypted analysis
              </span>
            </div>
          </div>
        </div>
      </figure>

      {/* 2 — Result + highlights (1200 × 900) */}
      <figure className="flex flex-col items-center gap-2">
        <figcaption className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          02 · Result with highlighted phrases
        </figcaption>
        <div
          data-marketing-shot="result"
          id="shot-result"
          className={`${FRAME} w-[1200px] max-w-[calc(100vw-2rem)] min-h-[900px] p-8 bg-[#f4f7fb]`}
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-4 border rounded-2xl p-6 flex flex-col items-center bg-white border-slate-200 relative overflow-hidden">
              <div className="absolute inset-0 opacity-15 blur-3xl bg-red-500 pointer-events-none" />
              <div className="relative w-40 h-40 mb-3">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="8"
                    strokeDasharray={`${CANONICAL_DEMO_RESULT.risk_score * 2.83} 283`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-slate-900">{CANONICAL_DEMO_RESULT.risk_score}</span>
                  <span className="text-xs uppercase tracking-wider text-slate-500">Risk score</span>
                </div>
              </div>
              <div className="text-sm font-bold px-3 py-1 rounded-full border bg-red-500/10 text-red-600 border-red-500/20">
                {CANONICAL_DEMO_RESULT.risk_level}
              </div>
              <p className="text-xs text-slate-500 mt-2 text-center">{CANONICAL_DEMO_RESULT.scam_type}</p>
            </div>
            <div className="md:col-span-8 space-y-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Summary</h3>
                <p className="text-slate-900 leading-relaxed">{CANONICAL_DEMO_RESULT.verdict_summary}</p>
              </div>
              <HighlightedSourceText
                sourceText={CANONICAL_DEMO_SOURCE_TEXT}
                result={CANONICAL_DEMO_RESULT}
                isDark={isDark}
              />
            </div>
          </div>
        </div>
      </figure>

      {/* 3 — Verification checklist */}
      <figure className="flex flex-col items-center gap-2">
        <figcaption className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          03 · Verify-it-yourself checklist
        </figcaption>
        <div
          data-marketing-shot="checklist"
          id="shot-checklist"
          className={`${FRAME} w-[1200px] max-w-[calc(100vw-2rem)] p-6 bg-[#f4f7fb]`}
        >
          <VerificationRunway
            entities={CANONICAL_DEMO_RESULT.entities}
            riskScore={CANONICAL_DEMO_RESULT.risk_score}
            isDark={isDark}
            scanId="canonical-marketing-demo"
          />
        </div>
      </figure>

      {/* 4 — Email → report link */}
      <figure className="flex flex-col items-center gap-2">
        <figcaption className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          04 · Email report link (inbox-style)
        </figcaption>
        <div
          data-marketing-shot="email"
          id="shot-email"
          className={`${FRAME} w-[1200px] max-w-[calc(100vw-2rem)] h-[640px] bg-slate-100 p-6 flex items-center justify-center`}
        >
          <div className="w-full max-w-[640px] bg-white rounded-lg border border-slate-200 shadow-lg overflow-hidden text-left">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center gap-2 text-slate-600 text-sm">
              <Mail className="w-4 h-4 text-teal-600" aria-hidden />
              <span>Your ScamShield scan is ready</span>
            </div>
            <div className="p-6 space-y-4 text-sm text-slate-700">
              <p className="text-slate-500 text-xs">
                From: <strong className="text-slate-700">ScamShield</strong>
              </p>
              <p>We finished analyzing the message you forwarded. Tap the link below to view the full report (risk score, red flags, and verification steps).</p>
              <div className="rounded-xl border border-teal-100 bg-teal-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-teal-800 mb-2">Private report link</p>
                <Link
                  href={CANONICAL_DEMO_REPORT_PATH}
                  className="text-teal-700 font-mono text-xs break-all underline font-medium"
                >
                  {demoReportUrl}
                </Link>
              </div>
              <p className="text-xs text-slate-500">
                Do not forward this link to untrusted people. For informational use only — not legal advice.
              </p>
            </div>
          </div>
        </div>
      </figure>
    </div>
  );
}
