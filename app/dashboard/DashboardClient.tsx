'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Scan,
  Upload,
  AlertTriangle,
  RefreshCw,
  X,
  Copy,
  AlertOctagon,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { useSubscription } from '@clerk/nextjs/experimental';
import { Breadcrumbs, breadcrumbIcons } from '@/components/Breadcrumbs';
import { ReportActions } from '@/components/ReportActions';
import { ScamAlerts } from '@/components/ScamAlerts';
import { AnalysisLoadingState } from '@/components/AnalysisLoadingState';
import { HighlightedSourceText } from '@/components/analysis/HighlightedSourceText';
import { VerificationRunway } from '@/components/analysis/VerificationRunway';
import { InboundEmailCallout } from '@/components/InboundEmailCallout';
import { ContextualHelp } from '@/components/ContextualHelp';
import { Tooltip } from '@/components/ui/Tooltip';
import { useToast } from '@/context/ToastContext';
import { useTour } from '@/context/TourContext';
import { CONTENT_MAX_W } from '@/lib/constants';
import { GUEST_USER_ID } from '@/lib/constants';
import { canScanToday, getScansUsedToday, incrementScansToday, FREE_DAILY_LIMIT_CONST } from '@/lib/utils/freeTier';
import { hasProAccess } from '@/lib/utils/subscription';
import { addScan } from '@/lib/utils/scanHistory';
import { addCommunityPost } from '@/lib/utils/communityPosts';
import { getStoredTheme, getEffectiveTheme } from '@/lib/utils/theme';
import { sampleScans } from '@/lib/data/sampleScans';
import type { AnalysisResult } from '@/lib/types';

const VIEW_ENTRY_KEY = 'scamshield_view_entry';

type ResultSectionId = 'summary' | 'whyRisky' | 'source' | 'runway' | 'entities' | 'redFlags' | 'advice';

const DEFAULT_SCANNER_SECTIONS_OPEN: Record<ResultSectionId, boolean> = {
  summary: true,
  whyRisky: false,
  source: false,
  runway: false,
  entities: false,
  redFlags: false,
  advice: false,
};

function ScannerCollapsibleSection({
  sectionId,
  title,
  summary,
  isOpen,
  onToggle,
  textPrimary,
  textMuted,
  cardBg,
  cardBorder,
  children,
  headerStart,
  headerEnd,
  panelClassName,
  surfaceClassName,
  titleClassName,
  headingClassName,
}: {
  sectionId: ResultSectionId;
  title: string;
  summary: string;
  isOpen: boolean;
  onToggle: () => void;
  textPrimary: string;
  textMuted: string;
  cardBg: string;
  cardBorder: string;
  children: React.ReactNode;
  headerStart?: React.ReactNode;
  headerEnd?: React.ReactNode;
  panelClassName?: string;
  /** If set, replaces default card surface (e.g. gradient panels). */
  surfaceClassName?: string;
  titleClassName?: string;
  /** When set, replaces default small-caps heading styles (e.g. Red flags panel). */
  headingClassName?: string;
}) {
  const surface = surfaceClassName ?? `${cardBg} border ${cardBorder}`;
  const headerHover = 'hover:bg-slate-500/5 dark:hover:bg-slate-400/5';
  const headingCls =
    headingClassName ?? `${titleClassName ?? textMuted} text-xs font-bold uppercase tracking-wider shrink-0`;
  return (
    <div className={`${surface} rounded-2xl overflow-hidden ${panelClassName ?? ''}`}>
      <div className={`flex items-center rounded-t-2xl ${headerHover}`}>
        <div className="min-w-0 flex-1">
          <Tooltip label={summary} multiline fullWidth side="top">
            <button
              type="button"
              id={`scanner-section-${sectionId}`}
              aria-expanded={isOpen}
              aria-controls={`scanner-section-${sectionId}-panel`}
              onClick={onToggle}
              className={`w-full flex items-center justify-between gap-3 text-left py-4 transition-colors ${headerEnd != null ? 'rounded-tl-2xl pl-6 pr-3' : 'rounded-t-2xl px-6'}`}
            >
              <span className="flex items-center gap-2 min-w-0">
                {headerStart}
                <h3 className={headingCls}>{title}</h3>
              </span>
              <ChevronDown className={`w-5 h-5 shrink-0 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden />
            </button>
          </Tooltip>
        </div>
        {headerEnd != null ? (
          <div className="flex shrink-0 items-center rounded-tr-2xl pr-5 py-4 pl-1">{headerEnd}</div>
        ) : null}
      </div>
      {isOpen && (
        <div id={`scanner-section-${sectionId}-panel`} role="region" aria-labelledby={`scanner-section-${sectionId}`} className="px-6 pb-6 pt-0">
          {children}
        </div>
      )}
    </div>
  );
}

export default function DashboardClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const { data: clerkSubscription, revalidate: revalidateClerkSubscription } = useSubscription({ for: 'user' });
  const toast = useToast();
  const { hasCompletedTour, startTour } = useTour();

  const userId = user?.id ?? GUEST_USER_ID;
  const isPro = hasProAccess(user, clerkSubscription ?? null);

  const [inputText, setInputText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [historyEntry, setHistoryEntry] = useState<{ id: string; date: string; snippet: string; risk_score: number; risk_level: AnalysisResult['risk_level']; scam_type: string; fullResult: AnalysisResult } | null>(null);

  const [openScannerSections, setOpenScannerSections] = useState(DEFAULT_SCANNER_SECTIONS_OPEN);

  const theme = getStoredTheme();
  const isDark = getEffectiveTheme(theme) === 'dark';
  const cardBg = isDark ? 'bg-slate-900' : 'bg-white';
  const cardBorder = isDark ? 'border-slate-800' : 'border-slate-200';
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-600';
  const textDim = isDark ? 'text-slate-500' : 'text-slate-500';
  const inputBg = isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200';
  const hoverBorder = isDark ? 'hover:border-slate-700' : 'hover:border-slate-300';
  const dashboardMuted = isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900';
  const amberText = isDark ? 'text-amber-200' : 'text-amber-800';

  const canScan = canScanToday(userId, isPro);
  const scansUsed = getScansUsedToday(userId);

  useEffect(() => {
    const prefill = searchParams.get('text');
    if (prefill) setInputText(decodeURIComponent(prefill));
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get('subscription') !== 'success' || !user) return;
    void (async () => {
      try {
        await user.reload();
      } catch {
        // still try to refresh billing snapshot
      }
      await revalidateClerkSubscription();
      toast.showToast('Welcome to Pro! You have unlimited scans.');
      window.history.replaceState({}, '', '/dashboard');
    })();
  }, [searchParams, toast, user, revalidateClerkSubscription]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(VIEW_ENTRY_KEY);
      if (raw) {
        sessionStorage.removeItem(VIEW_ENTRY_KEY);
        const entry = JSON.parse(raw);
        if (entry?.fullResult) {
          setResult(entry.fullResult);
          setInputText(entry.snippet || '');
          setHistoryEntry(entry);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (result) setOpenScannerSections({ ...DEFAULT_SCANNER_SECTIONS_OPEN });
  }, [result]);

  const handleAnalyze = async () => {
    const textToAnalyze = inputText?.trim() || (fileName ? 'image_analysis_placeholder' : '');
    if (!textToAnalyze) return;
    if (!canScan) {
      window.location.href = '/pricing';
      return;
    }
    setAnalyzing(true);
    setResult(null);
    try {
      const response = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: textToAnalyze }) });
      const data = await response.json();
      if (!response.ok) {
        toast.showToast(data?.error || 'Request failed', 'error');
        setAnalyzing(false);
        return;
      }
      setResult(data as AnalysisResult);
      const entry = addScan(userId, textToAnalyze.slice(0, 200), data as AnalysisResult);
      setHistoryEntry(entry);
      if (!isPro) incrementScansToday(userId);
    } catch {
      toast.showToast('Failed to connect to the analysis service.', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  const breadcrumbItems = result ? [
    { label: 'Home', href: () => router.push('/'), icon: <breadcrumbIcons.Home className="w-4 h-4" /> },
    { label: 'Scanner', href: () => { setResult(null); setInputText(''); setHistoryEntry(null); }, icon: <breadcrumbIcons.Scan className="w-4 h-4" /> },
    { label: 'Result', icon: <breadcrumbIcons.Result className="w-4 h-4" /> },
  ] : [
    { label: 'Home', href: () => router.push('/'), icon: <breadcrumbIcons.Home className="w-4 h-4" /> },
    { label: 'Scanner', icon: <breadcrumbIcons.Scan className="w-4 h-4" /> },
  ];

  return (
    <div className={`${CONTENT_MAX_W} mx-auto px-4 py-12 animate-in fade-in duration-500`}>
      <div className="mb-6">
        <Breadcrumbs items={breadcrumbItems} isDark={isDark} />
      </div>
      {!canScan && (
        <div className="mb-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <span className={`text-sm ${amberText}`}>Free limit: <strong>{scansUsed}/{FREE_DAILY_LIMIT_CONST}</strong> scan(s) used today. View pricing for more.</span>
          </div>
          <Link href="/pricing" className="text-xs font-bold bg-amber-500 text-slate-900 px-3 py-1.5 rounded-lg hover:bg-amber-400 transition-colors">Pricing</Link>
        </div>
      )}

      {analyzing ? (
        <AnalysisLoadingState isDark={isDark} />
      ) : result ? (
        <div className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => { setResult(null); setInputText(''); setHistoryEntry(null); }} className={`flex items-center gap-2 transition-colors ${dashboardMuted}`}>
                <RefreshCw className="w-4 h-4" /> Scan Another
              </button>
              <ReportActions entry={historyEntry || { id: '', date: new Date().toISOString(), snippet: inputText.slice(0, 200), risk_score: result.risk_score, risk_level: result.risk_level, scam_type: result.scam_type, fullResult: result }} isProOrLifetime={isPro} isDark={isDark} />
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => { addCommunityPost({ id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, date: new Date().toISOString(), text: `${inputText.trim() || '[Scanned snippet]'}\n\nRisk: ${result.risk_level} (${result.risk_score})\nType: ${result.scam_type}`, risk_score: result.risk_score, risk_level: result.risk_level, scam_type: result.scam_type }); toast.showToast('Posted to community reports.'); }} className="flex items-center gap-2 text-blue-500 hover:text-blue-600 font-medium">
                <ShieldCheck className="w-4 h-4" /> Post to Community
              </button>
              <button type="button" onClick={() => { navigator.clipboard.writeText('ScamShield Risk: ' + result.risk_level); toast.showToast('Copied!'); }} className="flex items-center gap-2 text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 font-medium">
                <Copy className="w-4 h-4" /> Share Verdict
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className={`md:col-span-5 border rounded-2xl p-8 flex flex-col items-center justify-center relative overflow-hidden ${cardBg} ${cardBorder}`}>
              <div className={`absolute inset-0 opacity-20 blur-3xl ${result.risk_score > 50 ? 'bg-red-500' : 'bg-teal-500'}`} />
              <div className="relative w-48 h-48 mb-4">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke={isDark ? '#1e293b' : '#e2e8f0'} strokeWidth="8" />
                  <circle cx="50" cy="50" r="45" fill="none" stroke={result.risk_score > 75 ? '#ef4444' : result.risk_score > 40 ? '#f59e0b' : '#10b981'} strokeWidth="8" strokeDasharray={result.risk_score * 2.83 + ' 283'} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className={`text-4xl font-bold ${textPrimary}`}>{result.risk_score}</span>
                  <span className={`text-xs uppercase tracking-wider flex items-center gap-1.5 ${textMuted}`}>
                    Risk Score
                    <ContextualHelp title="What is risk score?" content="A number from 0 to 100 showing how likely this message is to be a scam. Higher = more risk." isDark={isDark} />
                  </span>
                </div>
              </div>
              <div className={`text-xl font-bold px-4 py-1 rounded-full border ${result.risk_score > 75 ? 'bg-red-500/10 text-red-500 border-red-500/20' : result.risk_score > 40 ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/25'}`}>
                {result.risk_level}
              </div>
            </div>

            <div className="md:col-span-7 space-y-6">
              <ScannerCollapsibleSection
                sectionId="summary"
                title="Analysis Summary"
                summary="Plain-language verdict: what the model concluded about this message and how serious it looks overall."
                isOpen={openScannerSections.summary}
                onToggle={() => setOpenScannerSections((s) => ({ ...s, summary: !s.summary }))}
                textPrimary={textPrimary}
                textMuted={textMuted}
                cardBg={cardBg}
                cardBorder={cardBorder}
              >
                <p className={`${textPrimary} leading-relaxed text-lg`}>{result.verdict_summary}</p>
              </ScannerCollapsibleSection>
              {result.why_risky && (
                <ScannerCollapsibleSection
                  sectionId="whyRisky"
                  title="Why this is risky"
                  summary="How typical scam patterns, pressure tactics, or suspicious claims show up in this specific text."
                  isOpen={openScannerSections.whyRisky}
                  onToggle={() => setOpenScannerSections((s) => ({ ...s, whyRisky: !s.whyRisky }))}
                  textPrimary={textPrimary}
                  textMuted={textMuted}
                  cardBg={cardBg}
                  cardBorder={cardBorder}
                >
                  <p className={`${textPrimary} leading-relaxed`}>{result.why_risky}</p>
                </ScannerCollapsibleSection>
              )}
              {inputText.trim() && (
                <ScannerCollapsibleSection
                  sectionId="source"
                  title="Source text"
                  summary="Your pasted message with risky phrases highlighted so you can see exactly what triggered the analysis."
                  isOpen={openScannerSections.source}
                  onToggle={() => setOpenScannerSections((s) => ({ ...s, source: !s.source }))}
                  textPrimary={textPrimary}
                  textMuted={textMuted}
                  cardBg={cardBg}
                  cardBorder={cardBorder}
                >
                  <HighlightedSourceText sourceText={inputText} result={result} isDark={isDark} />
                </ScannerCollapsibleSection>
              )}
              <ScannerCollapsibleSection
                sectionId="runway"
                title="Verification checklist"
                summary="Practical steps: web searches and checks you can run on links, orgs, and claims before you trust or reply."
                isOpen={openScannerSections.runway}
                onToggle={() => setOpenScannerSections((s) => ({ ...s, runway: !s.runway }))}
                textPrimary={textPrimary}
                textMuted={textMuted}
                cardBg={cardBg}
                cardBorder={cardBorder}
              >
                <VerificationRunway
                  entities={result.entities}
                  riskScore={result.risk_score}
                  isDark={isDark}
                  scanId={historyEntry?.id}
                />
              </ScannerCollapsibleSection>
              {result.entities && (
                <ScannerCollapsibleSection
                  sectionId="entities"
                  title="Extracted details"
                  summary="Names, emails, phones, addresses, and businesses detected in the message—use these with the checklist to verify."
                  isOpen={openScannerSections.entities}
                  onToggle={() => setOpenScannerSections((s) => ({ ...s, entities: !s.entities }))}
                  textPrimary={textPrimary}
                  textMuted={textMuted}
                  cardBg={cardBg}
                  cardBorder={cardBorder}
                >
                  <p className={`text-sm mb-4 ${textDim}`}>
                    Raw fields from your message. Use the verification checklist above for step-by-step checks.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {(['names', 'emails', 'phones', 'addresses', 'businesses', 'nonprofits'] as const).map((field) => {
                      const values = result.entities?.[field] ?? [];
                      return (
                        <div key={field}>
                          <div className="font-semibold capitalize mb-1">{field} ({values.length})</div>
                          {values.length > 0 ? (
                            <ul className="list-disc ml-5 space-y-1">
                              {values.map((item, idx) => <li key={idx} className="break-words">{item}</li>)}
                            </ul>
                          ) : (
                            <div className="text-slate-500">None found.</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4">
                    <div className="font-semibold">Validation search hints</div>
                    {result.entities.validation_hints && result.entities.validation_hints.length > 0 ? (
                      <ul className="list-disc ml-5 mt-1 space-y-1">
                        {result.entities.validation_hints.map((hint, idx) => <li key={idx} className="break-words">{hint}</li>)}
                      </ul>
                    ) : (
                      <div className="text-slate-500">No validation hints provided.</div>
                    )}
                  </div>
                </ScannerCollapsibleSection>
              )}
              <ScannerCollapsibleSection
                sectionId="redFlags"
                title="Red Flags"
                summary="Specific warning signs that increased the score—each is a reason to slow down and verify before acting."
                isOpen={openScannerSections.redFlags}
                onToggle={() => setOpenScannerSections((s) => ({ ...s, redFlags: !s.redFlags }))}
                textPrimary={textPrimary}
                textMuted={textMuted}
                cardBg={cardBg}
                cardBorder={cardBorder}
                surfaceClassName={`${cardBg} border ${cardBorder} ${isDark ? 'bg-gradient-to-r from-slate-900 to-slate-800 border-slate-700' : 'border-slate-200'}`}
                headingClassName={`font-bold ${textPrimary} shrink-0`}
                headerStart={<AlertOctagon className="w-5 h-5 text-red-500 shrink-0" aria-hidden />}
                headerEnd={<ContextualHelp title="What are red flags?" content="Specific reasons this message was flagged." isDark={isDark} />}
              >
                <div className="space-y-2">
                  {result.red_flags.map((flag, i) => (
                    <div key={i} className={`p-3 rounded-lg border text-sm flex items-start gap-2 ${isDark ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                      {flag}
                    </div>
                  ))}
                </div>
              </ScannerCollapsibleSection>
              <ScannerCollapsibleSection
                sectionId="advice"
                title="Recommended Action"
                summary="Practical next steps: what we suggest you do or avoid based on the risk level and flags above."
                isOpen={openScannerSections.advice}
                onToggle={() => setOpenScannerSections((s) => ({ ...s, advice: !s.advice }))}
                textPrimary={textPrimary}
                textMuted={textMuted}
                cardBg={cardBg}
                cardBorder={cardBorder}
                surfaceClassName={isDark ? 'border border-slate-600 bg-gradient-to-r from-slate-900 to-slate-800' : 'border border-teal-100 bg-teal-50/80'}
                headingClassName="text-teal-800 dark:text-teal-300 font-bold uppercase text-xs tracking-wider shrink-0"
              >
                <p className={`font-medium ${textPrimary}`}>{result.advice}</p>
              </ScannerCollapsibleSection>
            </div>
          </div>
          <InboundEmailCallout isDark={isDark} />
        </div>
      ) : (
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className={`text-3xl font-bold mb-2 ${textPrimary}`}>Scanner Dashboard</h1>
            <p className={textMuted}>Paste text or upload a screenshot to begin analysis—or forward a suspicious email using the address below.</p>
            {!hasCompletedTour && (
              <button type="button" onClick={startTour} className="mt-2 text-sm text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 font-medium">Take the tour</button>
            )}
          </div>

          <InboundEmailCallout isDark={isDark} />

          <div className={`${cardBg} border rounded-2xl p-2 shadow-2xl ${cardBorder}`} data-tour-id="tour-paste">
            <div className="relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste suspicious text, email content, or DM here..."
                className={`w-full h-48 p-6 rounded-xl border focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none resize-none transition-all ${inputBg} ${isDark ? 'text-slate-200 placeholder:text-slate-500' : 'text-slate-800 placeholder:text-slate-400'}`}
              />
              {dragActive && (
                <div className="absolute inset-0 bg-teal-500/10 border-2 border-dashed border-teal-500/70 dark:border-teal-400/50 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <div className="text-teal-700 dark:text-teal-300 font-medium">Drop image to analyze</div>
                </div>
              )}
            </div>
            <div className="flex flex-col md:flex-row items-center justify-between p-4 gap-4">
              <div className="flex items-center gap-4 w-full md:w-auto">
                <label className={`flex items-center gap-2 text-sm cursor-pointer transition-colors ${dashboardMuted}`} onDragEnter={() => setDragActive(true)} onDragLeave={() => setDragActive(false)} onDrop={(e) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files?.[0]) setFileName(e.dataTransfer.files[0].name); }}>
                  <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-200 hover:bg-slate-300'}`}><Upload className="w-4 h-4" /></div>
                  <span className="truncate max-w-[150px]">{fileName || 'Upload Screenshot'}</span>
                  <input type="file" className="hidden" onChange={(e) => setFileName(e.target.files?.[0]?.name || null)} />
                </label>
                {fileName && <button type="button" onClick={() => setFileName(null)} className={`${textDim} hover:text-red-500`}><X className="w-4 h-4" /></button>}
              </div>
              <button
                data-tour-id="tour-analyze"
                onClick={handleAnalyze}
                disabled={analyzing || (!inputText && !fileName) || !canScan}
                className={`w-full md:w-auto px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${analyzing || (!inputText && !fileName) || !canScan ? (isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-200 text-slate-400') + ' cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700 text-white hover:shadow-lg hover:shadow-teal-600/25 active:scale-95'}`}
              >
                {analyzing ? <><RefreshCw className="w-5 h-5 animate-spin" /> Analyzing...</> : <><Scan className="w-5 h-5" /> Analyze Now</>}
              </button>
            </div>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            <ScamAlerts isDark={isDark} />
          </div>

          <div>
            <p className={`text-sm font-medium mb-3 ${textMuted}`}>Try a sample</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {sampleScans.map((s) => (
                <button key={s.id} type="button" onClick={() => setInputText(s.text)} className={`p-4 border rounded-xl text-left transition-colors ${cardBg} ${cardBorder} ${hoverBorder}`}>
                  <span className={`text-xs font-bold ${textDim}`}>SAMPLE</span>
                  <p className={`text-sm mt-1 ${textMuted}`}>{s.label}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
