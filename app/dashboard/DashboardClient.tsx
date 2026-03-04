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
} from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { Breadcrumbs, breadcrumbIcons } from '@/components/Breadcrumbs';
import { ReportActions } from '@/components/ReportActions';
import { ScamAlerts } from '@/components/ScamAlerts';
import { AnalysisSkeleton } from '@/components/AnalysisSkeleton';
import { ContextualHelp } from '@/components/ContextualHelp';
import { useToast } from '@/context/ToastContext';
import { useTour } from '@/context/TourContext';
import { CONTENT_MAX_W } from '@/lib/constants';
import { GUEST_USER_ID } from '@/lib/constants';
import { canScanToday, getScansUsedToday, incrementScansToday, FREE_DAILY_LIMIT_CONST } from '@/lib/utils/freeTier';
import { addScan } from '@/lib/utils/scanHistory';
import { getStoredTheme, getEffectiveTheme } from '@/lib/utils/theme';
import { sampleScans } from '@/lib/data/sampleScans';
import type { AnalysisResult } from '@/lib/types';

const VIEW_ENTRY_KEY = 'scamshield_view_entry';

export default function DashboardClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const toast = useToast();
  const { hasCompletedTour, startTour } = useTour();

  const userId = user?.id ?? GUEST_USER_ID;
  const isPro = (user?.publicMetadata as { plan?: string } | undefined)?.plan === 'pro';

  const [inputText, setInputText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [historyEntry, setHistoryEntry] = useState<{ id: string; date: string; snippet: string; risk_score: number; risk_level: AnalysisResult['risk_level']; scam_type: string; fullResult: AnalysisResult } | null>(null);

  const theme = getStoredTheme();
  const isDark = getEffectiveTheme(theme) === 'dark';
  const cardBg = isDark ? 'bg-slate-900' : 'bg-white';
  const cardBorder = isDark ? 'border-slate-800' : 'border-slate-200';
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-600';
  const textDim = isDark ? 'text-slate-500' : 'text-slate-500';
  const inputBg = isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200';
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
    if (searchParams.get('subscription') === 'success') {
      toast.showToast('Welcome to Pro! You have unlimited scans.');
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [searchParams, toast]);

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
      incrementScansToday(userId);
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
        <AnalysisSkeleton isDark={isDark} />
      ) : result ? (
        <div className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => { setResult(null); setInputText(''); setHistoryEntry(null); }} className={`flex items-center gap-2 transition-colors ${dashboardMuted}`}>
                <RefreshCw className="w-4 h-4" /> Scan Another
              </button>
              <ReportActions entry={historyEntry || { id: '', date: new Date().toISOString(), snippet: inputText.slice(0, 200), risk_score: result.risk_score, risk_level: result.risk_level, scam_type: result.scam_type, fullResult: result }} isProOrLifetime={isPro} isDark={isDark} />
            </div>
            <button type="button" onClick={() => { navigator.clipboard.writeText('ScamShield Risk: ' + result.risk_level); toast.showToast('Copied!'); }} className="flex items-center gap-2 text-emerald-500 hover:text-emerald-600 font-medium">
              <Copy className="w-4 h-4" /> Share Verdict
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className={`md:col-span-5 border rounded-2xl p-8 flex flex-col items-center justify-center relative overflow-hidden ${cardBg} ${cardBorder}`}>
              <div className={`absolute inset-0 opacity-20 blur-3xl ${result.risk_score > 50 ? 'bg-red-500' : 'bg-emerald-500'}`} />
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
              <div className={`text-xl font-bold px-4 py-1 rounded-full border ${result.risk_score > 75 ? 'bg-red-500/10 text-red-500 border-red-500/20' : result.risk_score > 40 ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                {result.risk_level}
              </div>
            </div>

            <div className="md:col-span-7 space-y-6">
              <div className={`${cardBg} border rounded-2xl p-6 ${cardBorder}`}>
                <h3 className={`${textMuted} text-xs font-bold uppercase tracking-wider mb-3`}>Analysis Summary</h3>
                <p className={`${textPrimary} leading-relaxed text-lg`}>{result.verdict_summary}</p>
              </div>
              {result.why_risky && (
                <div className={`${cardBg} border rounded-2xl p-6 ${cardBorder}`}>
                  <h3 className={`${textMuted} text-xs font-bold uppercase tracking-wider mb-3`}>Why this is risky</h3>
                  <p className={`${textPrimary} leading-relaxed`}>{result.why_risky}</p>
                </div>
              )}
              {result.triggered_phrases && result.triggered_phrases.length > 0 && (
                <div className={`${cardBg} border rounded-2xl p-6 ${cardBorder}`}>
                  <h3 className={`${textMuted} text-xs font-bold uppercase tracking-wider mb-3`}>Phrases that triggered the score</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.triggered_phrases.map((p, i) => (
                      <span key={i} className={`px-3 py-1 rounded-lg text-sm font-mono ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>{p}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className={`${cardBg} border rounded-2xl p-6 ${cardBorder} ${isDark ? 'bg-gradient-to-r from-slate-900 to-slate-800 border-slate-700' : 'border-slate-200'}`}>
                <div className="flex items-center gap-2 mb-4">
                  <AlertOctagon className="w-5 h-5 text-red-500" />
                  <h3 className={`font-bold ${textPrimary}`}>Red Flags</h3>
                  <ContextualHelp title="What are red flags?" content="Specific reasons this message was flagged." isDark={isDark} />
                </div>
                <div className="space-y-2">
                  {result.red_flags.map((flag, i) => (
                    <div key={i} className={`p-3 rounded-lg border text-sm flex items-start gap-2 ${isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                      {flag}
                    </div>
                  ))}
                </div>
              </div>
              <div className={`p-6 rounded-2xl border ${isDark ? 'bg-gradient-to-r from-slate-900 to-slate-800 border-slate-700' : 'bg-emerald-50 border-emerald-200'}`}>
                <h3 className="text-emerald-600 dark:text-emerald-400 font-bold mb-2 uppercase text-xs tracking-wider">Recommended Action</h3>
                <p className={`font-medium ${textPrimary}`}>{result.advice}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className={`text-3xl font-bold mb-2 ${textPrimary}`}>Scanner Dashboard</h1>
            <p className={textMuted}>Paste text or upload a screenshot to begin analysis.</p>
            {!hasCompletedTour && (
              <button type="button" onClick={startTour} className="mt-2 text-sm text-emerald-500 hover:text-emerald-400 font-medium">Take the tour</button>
            )}
          </div>

          <div className={`${cardBg} border rounded-2xl p-2 shadow-2xl ${cardBorder}`} data-tour-id="tour-paste">
            <div className="relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste suspicious text, email content, or DM here..."
                className={`w-full h-48 p-6 rounded-xl border focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none resize-none transition-all ${inputBg} ${isDark ? 'text-slate-200 placeholder:text-slate-600' : 'text-slate-800 placeholder:text-slate-400'}`}
              />
              {dragActive && (
                <div className="absolute inset-0 bg-emerald-500/10 border-2 border-dashed border-emerald-500 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <div className="text-emerald-400 font-medium">Drop image to analyze</div>
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
                className={`w-full md:w-auto px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${analyzing || (!inputText && !fileName) || !canScan ? (isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-200 text-slate-400') + ' cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-400 text-slate-900 hover:shadow-lg hover:shadow-emerald-500/20 active:scale-95'}`}
              >
                {analyzing ? <><RefreshCw className="w-5 h-5 animate-spin" /> Analyzing...</> : <><Scan className="w-5 h-5" /> Analyze Now</>}
              </button>
            </div>
          </div>

          <div className="max-w-3xl mx-auto"><ScamAlerts isDark={isDark} /></div>

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
