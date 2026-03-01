import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Scan,
  Upload,
  AlertTriangle,
  CheckCircle,
  Lock,
  AlertOctagon,
  Copy,
  Eye,
  RefreshCw,
  X,
  Search,
  Zap,
  Check,
  History,
  Settings,
  Users,
} from 'lucide-react';
import './App.css';
import type { AnalysisResult, ThemeMode } from './types';
import { getStoredTheme, setStoredTheme, applyTheme, getEffectiveTheme } from './utils/theme';
import { canScanToday, getScansUsedToday, incrementScansToday, FREE_DAILY_LIMIT_CONST } from './utils/freeTier';
import { addScan } from './utils/scanHistory';
import { CONTENT_MAX_W } from './constants/layout';
import { ScamAlerts } from './components/ScamAlerts';
import { Testimonials } from './components/Testimonials';
import { Settings as SettingsModal } from './components/Settings';
import { ScanHistory } from './components/ScanHistory';
import { ReportActions } from './components/ReportActions';
import { Breadcrumbs, breadcrumbIcons } from './components/Breadcrumbs';
import { SubNav } from './components/SubNav';
import { Sidebar } from './components/Sidebar';
import { SecurityBadges } from './components/SecurityBadges';
import { DataPolicy } from './components/DataPolicy';
import { NotFound } from './components/NotFound';
import { useToast } from './context/ToastContext';
import { ToastContainer } from './components/ui/Toast';
import { useTour } from './context/TourContext';
import { AnalysisSkeleton } from './components/AnalysisSkeleton';
import { FAQ } from './components/FAQ';
import { faqItems } from './data/faq';
import { ContextualHelp } from './components/ContextualHelp';
import { TourOverlay } from './components/TourOverlay';
import { sampleScans } from './data/sampleScans';
import { Tooltip } from './components/ui/Tooltip';
import type { ScanHistoryEntry } from './types';

// --- CONFIGURATION ---
// Analysis is performed by the backend via OpenAI (see server/index.js). Run the API with: npm run server

/** Used for scan limits and history until you plug in external auth. */
const GUEST_USER_ID = 'guest';

const ROUTES = { landing: '/', pricing: '/pricing', dashboard: '/dashboard', history: '/history' } as const;
const PATH_SET = new Set(Object.values(ROUTES));

export default function ScamShieldApp() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const isNotFound = !PATH_SET.has(path as typeof ROUTES.landing);
  const currentView = path === ROUTES.dashboard ? 'dashboard' : path === ROUTES.history ? 'history' : path === ROUTES.pricing ? 'pricing' : 'landing';

  const setView = (view: keyof typeof ROUTES) => navigate(ROUTES[view]);

  const [theme, setTheme] = useState(getStoredTheme);
  const [showSettings, setShowSettings] = useState(false);
  const [historyEntry, setHistoryEntry] = useState<ScanHistoryEntry | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const toast = useToast();
  const { hasCompletedTour, startTour } = useTour();

  // --- DASHBOARD STATE ---
  const [inputText, setInputText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const isDark = getEffectiveTheme(theme) === 'dark';
  const cardBg = isDark ? 'bg-slate-900' : 'bg-white';
  const cardBorder = isDark ? 'border-slate-800' : 'border-slate-200';
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-600';
  const textDim = isDark ? 'text-slate-500' : 'text-slate-500';
  const inputBg = isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200';
  const hoverBorder = isDark ? 'hover:border-slate-700' : 'hover:border-slate-300';

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prefill = params.get('text');
    if (prefill) setInputText(decodeURIComponent(prefill));
  }, []);

  const handleAnalyze = async () => {
    const textToAnalyze = inputText?.trim() || (fileName ? 'image_analysis_placeholder' : '');
    if (!textToAnalyze) return;
    const userId = GUEST_USER_ID;
    const subscribed = false;
    if (!canScanToday(userId, subscribed)) {
      setView('pricing');
      return;
    }
    setAnalyzing(true);
    setResult(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToAnalyze }),
      });
      const data = await response.json();

      if (!response.ok) {
        const msg = data?.error || `Request failed (${response.status})`;
        toast.showToast(msg, 'error');
        setAnalyzing(false);
        return;
      }

      setResult(data as AnalysisResult);
      addScan(userId, textToAnalyze.slice(0, 200), data as AnalysisResult);
      incrementScansToday(userId);
    } catch (error) {
      console.error('API Error', error);
      toast.showToast('Failed to connect to the analysis service. Make sure the API server is running (npm run server).', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleThemeChange = (t: ThemeMode) => {
    setStoredTheme(t);
    setTheme(t);
  };

  // --- SUB-COMPONENTS ---

  const navBorder = isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-white/80';
  const navLinkActive = isDark ? 'text-white' : 'text-slate-900';
  const navLinkInactive = isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900';
  const navHoverBg = isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100';

  const Navigation: React.FC = () => (
    <header className={`border-b backdrop-blur-md sticky top-0 z-50 ${navBorder}`}>
      <div className="px-4 h-16 flex items-center justify-between">
        <button
          type="button"
          onClick={() => { setView('landing'); setHistoryEntry(null); }}
          className="flex items-center gap-2 cursor-pointer rounded-lg hover:opacity-90 transition-opacity"
          aria-label="Go to home"
        >
          <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
            <ShieldCheck className="w-6 h-6 text-emerald-500" />
          </div>
          <span className={`text-xl font-bold tracking-tight ${navLinkActive}`}>Scam<span className="text-emerald-500">Shield</span></span>
        </button>

        <nav className="flex items-center gap-6">
          <button 
            onClick={() => { setView('dashboard'); setHistoryEntry(null); }}
            className={`text-sm font-medium transition-colors ${currentView === 'dashboard' ? navLinkActive : navLinkInactive}`}
          >
            Scanner
          </button>
          <button 
            data-tour-id="tour-history"
            onClick={() => setView('history')}
            className={`text-sm font-medium transition-colors ${currentView === 'history' ? navLinkActive : navLinkInactive}`}
          >
            <span className="hidden sm:inline">History</span>
            <History className="w-4 h-4 sm:hidden" />
          </button>
          <button 
            onClick={() => setView('pricing')}
            className={`text-sm font-medium transition-colors hidden sm:block ${currentView === 'pricing' ? navLinkActive : navLinkInactive}`}
          >
            Pricing
          </button>
          <Tooltip label="Settings">
            <button 
              onClick={() => setShowSettings(true)}
              className={`p-2 rounded-full transition-colors ${navLinkInactive} ${navHoverBg}`}
              aria-label="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </Tooltip>
        </nav>
      </div>
    </header>
  );

  const featureCardBg = isDark ? 'bg-slate-950' : 'bg-slate-50';
  const sectionBorder = isDark ? 'border-slate-800/50' : 'border-slate-200';
  const sectionBg = isDark ? 'bg-slate-900/30' : 'bg-slate-200/50';
  const heroSecondaryBtn = isDark ? 'bg-slate-900 hover:bg-slate-800 text-white border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-900 border-slate-300';

  const landingNavLinks = [{ id: 'hero', label: 'Top' }, { id: 'testimonials', label: 'Testimonials' }, { id: 'how-it-works', label: 'How it works' }];

  const LandingView = () => (
    <div className="animate-in fade-in duration-500">
      <SubNav links={landingNavLinks} isDark={isDark} />
      {/* Full-width hero with centered band */}
      <section id="hero" className="w-full border-b border-slate-800/50">
        <div className={`${CONTENT_MAX_W} mx-auto pt-24 pb-32 px-4 text-center relative`}>
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-500/10 blur-[100px] rounded-full -z-10" />
         <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20 text-sm font-medium mb-8 dark:text-blue-400">
            <Lock className="w-3 h-3" /> AI-Powered Fraud Detection
         </div>
         <h1 className={`text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight ${textPrimary}`}>
            Stop the Scam <br/><span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-400 to-cyan-500">Before It Starts</span>
         </h1>
         <p className={`text-xl mb-10 max-w-2xl mx-auto leading-relaxed ${textMuted}`}>
            Instantly analyze suspicious texts, emails, and dating profiles. 
            Our AI acts as your personal cybersecurity expert, 24/7.
         </p>
         <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => setView('dashboard')}
              className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-xl font-bold text-lg shadow-xl shadow-emerald-500/20 transition-all hover:scale-105"
            >
              Scan a Message Free
            </button>
            <button 
              onClick={() => {
                const el = document.getElementById('how-it-works');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-lg border transition-all ${heroSecondaryBtn}`}
            >
              How it Works
            </button>
         </div>
         <div className={`mt-12 flex items-center justify-center gap-8 grayscale opacity-70 ${textDim}`}>
            <div className="flex items-center gap-2 text-sm font-medium"><CheckCircle className="w-4 h-4" /> 10,000+ Scans</div>
            <div className="flex items-center gap-2 text-sm font-medium"><Lock className="w-4 h-4" /> 256-bit Encryption</div>
         </div>
        </div>
      </section>

      <section id="testimonials" className={`py-24 border-t ${sectionBorder}`}>
        <div className={`${CONTENT_MAX_W} mx-auto px-4`}>
          <Testimonials isDark={isDark} />
        </div>
      </section>

      <section id="how-it-works" className={`py-24 border-y ${sectionBg} ${sectionBorder}`}>
        <div className={`${CONTENT_MAX_W} mx-auto px-4`}>
          <div className="text-center mb-16">
            <h2 className={`text-3xl font-bold mb-4 ${textPrimary}`}>Why Trust ScamShield?</h2>
            <p className={`${textMuted} max-w-2xl mx-auto`}>Scammers use AI to write convincing scripts. We use AI to detect them.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            <div className={`p-8 border rounded-3xl transition-colors flex flex-col ${featureCardBg} ${cardBorder} ${hoverBorder}`}>
              <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 text-blue-500 dark:text-blue-400">
                <Search className="w-7 h-7" />
              </div>
              <h3 className={`text-xl font-bold mb-3 ${textPrimary}`}>Deep Text Forensics</h3>
              <p className={`${textMuted} leading-relaxed`}>
                Our NLP engine detects linguistic triggers, coercive grammar, and script patterns used by international fraud rings that humans often miss.
              </p>
            </div>
            <div className={`p-8 border rounded-3xl transition-colors flex flex-col ${featureCardBg} ${cardBorder} ${hoverBorder}`}>
              <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 text-emerald-500 dark:text-emerald-400">
                <Eye className="w-7 h-7" />
              </div>
              <h3 className={`text-xl font-bold mb-3 ${textPrimary}`}>Visual Analysis</h3>
              <p className={`${textMuted} leading-relaxed`}>
                Upload screenshots of emails or texts. We analyze pixel inconsistencies, metadata, and fake logos to spot forged documents.
              </p>
            </div>
            <div className={`p-8 border rounded-3xl transition-colors flex flex-col ${featureCardBg} ${cardBorder} ${hoverBorder}`}>
              <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 text-purple-500 dark:text-purple-400">
                <Zap className="w-7 h-7" />
              </div>
              <h3 className={`text-xl font-bold mb-3 ${textPrimary}`}>Instant Verdicts</h3>
              <p className={`${textMuted} leading-relaxed`}>
                Don't wait for Reddit to reply. Get a 0-100% Risk Score and actionable "Next Steps" (Block/Report/Ignore) in under 5 seconds.
              </p>
            </div>
          </div>
          <div className="mt-16">
            <FAQ items={faqItems} isDark={isDark} />
          </div>
          <div className="mt-16 text-center">
            <h2 className={`text-2xl font-bold mb-4 ${textPrimary}`}>See it in action</h2>
            <p className={`max-w-xl mx-auto mb-6 ${textMuted}`}>
              Paste a message, click Analyze, and get a risk score and next steps in seconds. No account required for your first scan.
            </p>
            <div className={`inline-flex items-center justify-center gap-4 px-6 py-4 rounded-2xl border ${cardBorder} ${featureCardBg}`}>
              <span className="text-sm font-medium text-emerald-500">1. Paste</span>
              <span className="text-slate-500">→</span>
              <span className="text-sm font-medium text-emerald-500">2. Analyze</span>
              <span className="text-slate-500">→</span>
              <span className="text-sm font-medium text-emerald-500">3. Get verdict</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );

  const priceCardMuted = isDark ? 'text-slate-300' : 'text-slate-600';
  const priceCardDim = isDark ? 'text-slate-500' : 'text-slate-500';
  const priceBorderBtn = isDark ? 'border-slate-700 text-white hover:bg-slate-800' : 'border-slate-300 text-slate-900 hover:bg-slate-100';

  const pricingNavLinks = [{ id: 'plans', label: 'Plans' }];

  const PricingView = () => (
    <div className="animate-in slide-in-from-bottom-8 duration-500">
      <SubNav links={pricingNavLinks} isDark={isDark} />
      <div id="plans" className={`${CONTENT_MAX_W} mx-auto py-20 px-4`}>
        <div className="text-center mb-16">
          <h2 className={`text-3xl md:text-5xl font-bold mb-6 ${textPrimary}`}>Simple, Transparent Pricing</h2>
          <p className={`${textMuted} text-lg`}>Protect yourself from fraud for less than the cost of a coffee.</p>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-stretch">
        <div className={`${cardBg} border rounded-3xl p-8 flex flex-col ${cardBorder}`}>
          <h3 className={`text-xl font-bold mb-2 ${textPrimary}`}>Basic</h3>
          <div className={`text-4xl font-bold mb-6 ${textPrimary}`}>$0<span className={`text-lg font-normal ${priceCardDim}`}>/mo</span></div>
          <p className={`${textMuted} mb-8`}>Good for testing the waters.</p>
          <ul className="space-y-4 mb-8 flex-1">
            <li className={`flex items-center gap-3 ${priceCardMuted}`}><Check className="w-5 h-5 text-emerald-500" /> 1 Scan per day</li>
            <li className={`flex items-center gap-3 ${priceCardMuted}`}><Check className="w-5 h-5 text-emerald-500" /> Basic Text Analysis</li>
            <li className={`flex items-center gap-3 ${priceCardDim}`}><X className="w-5 h-5" /> Image Analysis</li>
            <li className={`flex items-center gap-3 ${priceCardDim}`}><X className="w-5 h-5" /> Priority Support</li>
          </ul>
          <button 
            onClick={() => setView('dashboard')}
            className={`w-full py-3 rounded-xl border font-medium transition-colors ${priceBorderBtn}`}
          >
            Go to Scanner
          </button>
        </div>

        <div className={`${cardBg} border-2 border-emerald-500 rounded-3xl p-8 flex flex-col relative transform md:-translate-y-4 shadow-2xl shadow-emerald-500/10 ${isDark ? '' : 'bg-emerald-50/50'}`}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-500 text-slate-900 px-4 py-1 rounded-full text-sm font-bold">
            Most Popular
          </div>
          <h3 className={`text-xl font-bold mb-2 flex items-center gap-2 ${textPrimary}`}>
            <Check className="w-5 h-5 text-emerald-500" aria-hidden /> Pro Shield
          </h3>
          <div className={`text-4xl font-bold mb-6 ${textPrimary}`}>$9<span className={`text-lg font-normal ${priceCardDim}`}>/mo</span></div>
          <p className={`${textMuted} mb-8`}>Complete protection for you and your family.</p>
          <ul className="space-y-4 mb-8 flex-1">
            <li className={`flex items-center gap-3 ${textPrimary}`}><Check className="w-5 h-5 text-emerald-500" /> Unlimited Scans</li>
            <li className={`flex items-center gap-3 ${textPrimary}`}><Check className="w-5 h-5 text-emerald-500" /> Advanced Image Analysis</li>
            <li className={`flex items-center gap-3 ${textPrimary}`}><Check className="w-5 h-5 text-emerald-500" /> Save Scan History</li>
            <li className={`flex items-center gap-3 ${textPrimary}`}><Check className="w-5 h-5 text-emerald-500" /> 24/7 Priority API Access</li>
          </ul>
          <button 
            onClick={() => setView('dashboard')}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold transition-colors shadow-lg shadow-emerald-500/25"
          >
            Go to Scanner
          </button>
        </div>

        <div className={`${cardBg} border rounded-3xl p-8 flex flex-col ${cardBorder}`}>
          <h3 className={`text-xl font-bold mb-2 ${textPrimary}`}>Lifetime</h3>
          <div className={`text-4xl font-bold mb-6 ${textPrimary}`}>$99<span className={`text-lg font-normal ${priceCardDim}`}>/once</span></div>
          <p className={`${textMuted} mb-8`}>Pay once, own it forever.</p>
          <ul className="space-y-4 mb-8 flex-1">
            <li className={`flex items-center gap-3 ${priceCardMuted}`}><Check className="w-5 h-5 text-emerald-500" /> Everything in Pro</li>
            <li className={`flex items-center gap-3 ${priceCardMuted}`}><Check className="w-5 h-5 text-emerald-500" /> Early Access to New Features</li>
            <li className={`flex items-center gap-3 ${priceCardMuted}`}><Check className="w-5 h-5 text-emerald-500" /> No Monthly Fees</li>
          </ul>
          <button 
             onClick={() => setView('dashboard')}
             className={`w-full py-3 rounded-xl border font-medium transition-colors ${priceBorderBtn}`}
          >
            Go to Scanner
          </button>
        </div>

        <div className={`${cardBg} border rounded-3xl p-8 flex flex-col ${cardBorder}`}>
          <h3 className={`text-xl font-bold mb-2 flex items-center gap-2 ${textPrimary}`}>
            <Users className="w-5 h-5 text-emerald-500" /> Family
          </h3>
          <div className={`text-4xl font-bold mb-6 ${textPrimary}`}>$14<span className={`text-lg font-normal ${priceCardDim}`}>/mo</span></div>
          <p className={`${textMuted} mb-8`}>Protect your whole household. Up to 6 members.</p>
          <ul className="space-y-4 mb-8 flex-1">
            <li className={`flex items-center gap-3 ${priceCardMuted}`}><Check className="w-5 h-5 text-emerald-500" /> Everything in Pro</li>
            <li className={`flex items-center gap-3 ${priceCardMuted}`}><Check className="w-5 h-5 text-emerald-500" /> Up to 6 family members</li>
            <li className={`flex items-center gap-3 ${priceCardMuted}`}><Check className="w-5 h-5 text-emerald-500" /> Shared scan history &amp; alerts</li>
          </ul>
          <button 
             onClick={() => setView('dashboard')}
             className={`w-full py-3 rounded-xl border font-medium transition-colors ${priceBorderBtn}`}
          >
            Go to Scanner
          </button>
        </div>
      </div>
      </div>
    </div>
  );

  const scansUsed = getScansUsedToday(GUEST_USER_ID);
  const canScan = canScanToday(GUEST_USER_ID, false);

  const dashboardMuted = isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900';
  const amberText = isDark ? 'text-amber-200' : 'text-amber-800';

  const DashboardView = () => (
    <div className={`${CONTENT_MAX_W} mx-auto px-4 py-12 animate-in fade-in duration-500`}>
      <div className="mb-6">
        <Breadcrumbs
          items={
            result
              ? [
                  { label: 'Home', href: () => setView('landing'), icon: <breadcrumbIcons.Home className="w-4 h-4" /> },
                  { label: 'Scanner', href: () => { setResult(null); setView('dashboard'); }, icon: <breadcrumbIcons.Scan className="w-4 h-4" /> },
                  { label: 'Result', icon: <breadcrumbIcons.Result className="w-4 h-4" /> },
                ]
              : [
                  { label: 'Home', href: () => setView('landing'), icon: <breadcrumbIcons.Home className="w-4 h-4" /> },
                  { label: 'Scanner', icon: <breadcrumbIcons.Scan className="w-4 h-4" /> },
                ]
          }
          isDark={isDark}
        />
      </div>
      {!canScan && (
        <div className="mb-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex flex-wrap items-center justify-between gap-3">
           <div className="flex items-center gap-3">
             <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
             <span className={`text-sm ${amberText}`}>
               Free limit: <strong>{scansUsed}/{FREE_DAILY_LIMIT_CONST}</strong> scan(s) used today. View pricing for more.
             </span>
           </div>
           <button 
            onClick={() => setView('pricing')}
            className="text-xs font-bold bg-amber-500 text-slate-900 px-3 py-1.5 rounded-lg hover:bg-amber-400 transition-colors"
           >
             Pricing
           </button>
        </div>
      )}

      {analyzing ? (
        <AnalysisSkeleton isDark={isDark} />
      ) : result ? (
        <div className="space-y-8">
           <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => { setResult(null); setInputText(''); setHistoryEntry(null); }}
                  className={`flex items-center gap-2 transition-colors ${dashboardMuted}`}
                >
                  <RefreshCw className="w-4 h-4" /> Scan Another
                </button>
                <ReportActions
                  entry={historyEntry || (result ? { id: '', date: new Date().toISOString(), snippet: inputText.slice(0, 200), risk_score: result.risk_score, risk_level: result.risk_level, scam_type: result.scam_type, fullResult: result } : null)}
                  isProOrLifetime={true}
                  isDark={isDark}
                />
              </div>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`🚨 ScamShield Risk: ${result.risk_level}`);
                  toast.showToast('Copied!');
                }}
                className="flex items-center gap-2 text-emerald-500 hover:text-emerald-600 font-medium"
              >
                <Copy className="w-4 h-4" /> Share Verdict
              </button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className={`md:col-span-5 border rounded-2xl p-8 flex flex-col items-center justify-center relative overflow-hidden ${cardBg} ${cardBorder}`}>
                <div className={`absolute inset-0 opacity-20 blur-3xl ${result.risk_score > 50 ? 'bg-red-500' : 'bg-emerald-500'}`} />
                <div className="relative w-48 h-48 mb-4">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke={isDark ? '#1e293b' : '#e2e8f0'} strokeWidth="8" />
                    <circle 
                      cx="50" cy="50" r="45" fill="none" 
                      stroke={result.risk_score > 75 ? '#ef4444' : result.risk_score > 40 ? '#f59e0b' : '#10b981'} 
                      strokeWidth="8"
                      strokeDasharray={`${result.risk_score * 2.83} 283`} 
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className={`text-4xl font-bold ${textPrimary}`}>{result.risk_score}</span>
                    <span className={`text-xs uppercase tracking-wider flex items-center gap-1.5 ${textMuted}`}>
                      Risk Score
                      <ContextualHelp
                        title="What is risk score?"
                        content="A number from 0 to 100 showing how likely this message is to be a scam. Higher = more risk. We use AI to analyze language, urgency, and known scam patterns."
                        isDark={isDark}
                      />
                    </span>
                  </div>
                </div>
                <div className={`text-xl font-bold px-4 py-1 rounded-full border ${
                  result.risk_score > 75 ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                  result.risk_score > 40 ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                  'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                }`}>
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
                         <span key={i} className={`px-3 py-1 rounded-lg text-sm font-mono ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>
                           {p}
                         </span>
                       ))}
                     </div>
                   </div>
                 )}

                 <div className={`${cardBg} border rounded-2xl p-6 ${cardBorder} ${isDark ? 'bg-linear-to-r from-slate-900 to-slate-800 border-slate-700' : 'border-slate-200'}`}>
                   <div className="flex items-center gap-2 mb-4">
                      <AlertOctagon className="w-5 h-5 text-red-500" />
                      <h3 className={`font-bold ${textPrimary}`}>Red Flags</h3>
                      <ContextualHelp
                        title="What are red flags?"
                        content="Specific reasons this message was flagged: e.g. urgent money requests, fake authority (IRS, bank), or classic scam phrases. We list them so you can see what triggered the warning."
                        isDark={isDark}
                      />
                   </div>
                   <div className="space-y-2">
                      {result.red_flags.map((flag, i) => (
                        <div key={i} className={`p-3 rounded-lg border text-sm flex items-start gap-2 ${isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                           <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
                           {flag}
                        </div>
                      ))}
                   </div>
                 </div>

                 <div className={`p-6 rounded-2xl border ${isDark ? 'bg-linear-to-r from-slate-900 to-slate-800 border-slate-700' : 'bg-emerald-50 border-emerald-200'}`}>
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
                <button type="button" onClick={startTour} className="mt-2 text-sm text-emerald-500 hover:text-emerald-400 font-medium">
                  Take the tour
                </button>
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
                    <label 
                      className={`flex items-center gap-2 text-sm cursor-pointer transition-colors ${dashboardMuted}`}
                      onDragEnter={() => setDragActive(true)}
                      onDragLeave={() => setDragActive(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragActive(false);
                        if (e.dataTransfer.files?.[0]) setFileName(e.dataTransfer.files[0].name);
                      }}
                    >
                      <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-200 hover:bg-slate-300'}`}>
                        <Upload className="w-4 h-4" />
                      </div>
                      <span className="truncate max-w-[150px]">{fileName || "Upload Screenshot"}</span>
                      <input type="file" className="hidden" onChange={(e) => setFileName(e.target.files?.[0]?.name || null)} />
                    </label>
                    {fileName && <button onClick={() => setFileName(null)} className={`${textDim} hover:text-red-500`}><X className="w-4 h-4"/></button>}
                 </div>

                 <button
                  data-tour-id="tour-analyze"
                  onClick={handleAnalyze}
                  disabled={analyzing || (!inputText && !fileName) || !canScan}
                  className={`
                    w-full md:w-auto px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all
                    ${analyzing || (!inputText && !fileName) || !canScan
                      ? (isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-200 text-slate-400') + ' cursor-not-allowed' 
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-900 hover:shadow-lg hover:shadow-emerald-500/20 active:scale-95'}
                  `}
                 >
                   {analyzing ? <><RefreshCw className="w-5 h-5 animate-spin" /> Analyzing...</> : <><Scan className="w-5 h-5" /> Analyze Now</>}
                 </button>
              </div>
           </div>
           
           <div className="max-w-3xl mx-auto">
             <ScamAlerts isDark={isDark} />
           </div>

           <div>
              <p className={`text-sm font-medium mb-3 ${textMuted}`}>Try a sample</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {sampleScans.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setInputText(s.text)}
                    className={`p-4 border rounded-xl text-left transition-colors ${cardBg} ${cardBorder} ${hoverBorder}`}
                  >
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

  return (
    <div className={`min-h-screen font-sans selection:bg-emerald-500/30 ${isDark ? 'bg-slate-950 text-slate-200' : 'bg-slate-100 text-slate-800'}`}>
      <div className={`w-full ${CONTENT_MAX_W} mx-auto min-h-screen flex flex-col`}>
        <Navigation />
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen((o) => !o)}
          currentView={currentView}
          onNavigate={(view) => { setView(view); setHistoryEntry(null); }}
          onSettings={() => setShowSettings(true)}
          isDark={isDark}
        />
        <main className="flex-1 lg:pl-56">
          {isNotFound ? (
            <NotFound onGoToScanner={() => setView('dashboard')} isDark={isDark} />
          ) : (
            <>
              {currentView === 'landing' && <LandingView />}
              {currentView === 'pricing' && <PricingView />}
              {currentView === 'dashboard' && <DashboardView />}
              {currentView === 'history' && (
                <ScanHistory
                  userEmail={GUEST_USER_ID}
                  onBack={() => setView('dashboard')}
                  onSelectEntry={(entry) => {
                    setHistoryEntry(entry);
                    setResult(entry.fullResult);
                    setView('dashboard');
                  }}
                  isDark={isDark}
                />
              )}
            </>
          )}
        </main>
        <footer className={`border-t py-8 mt-12 ${isDark ? 'border-slate-800 bg-slate-900/30' : 'border-slate-200 bg-slate-200/50'}`}>
          <div className="px-4 text-center space-y-2">
            <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
              © {new Date().getFullYear()} ScamShield AI. Not legal advice. For informational purposes only.
            </p>
            <DataPolicy isDark={isDark} compact />
            <SecurityBadges isDark={isDark} className="justify-center" />
          </div>
        </footer>
      </div>

      <ToastContainer />
      <TourOverlay />
      {showSettings && (
        <SettingsModal
          theme={theme}
          onThemeChange={handleThemeChange}
          onClose={() => setShowSettings(false)}
          isDark={isDark}
        />
      )}
    </div>
  );
}