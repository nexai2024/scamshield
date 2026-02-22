import React, { useState } from 'react';
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
  LogOut,
  User
} from 'lucide-react';
import './App.css';
// --- TYPES ---
interface AnalysisResult {
  risk_score: number;
  risk_level: "Safe" | "Low Risk" | "Medium Risk" | "High Risk" | "Critical";
  scam_type: string;
  red_flags: string[];
  verdict_summary: string;
  advice: string;
}

type ViewState = 'landing' | 'auth' | 'pricing' | 'dashboard';
type UserState = { email: string; isSubscribed: boolean } | null;

// --- CONFIGURATION ---
const SIMULATION_MODE = true; 

export default function ScamShieldApp() {
  // --- GLOBAL STATE ---
  const [currentView, setCurrentView] = useState<ViewState>('landing');
  const [user, setUser] = useState<UserState>(null);
  
  // --- DASHBOARD STATE ---
  const [inputText, setInputText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  // --- MOCK API LOGIC ---
  const simulateAnalysis = (text: string): AnalysisResult => {
    const lowerText = text.toLowerCase();
    let score = 10;
    const flags: string[] = [];

    if (lowerText.includes('kindly')) { score += 20; flags.push('Unnatural phrasing ("Kindly")'); }
    if (lowerText.includes('gift card') || lowerText.includes('steam card')) { score += 40; flags.push("Payment requested via Gift Card"); }
    if (lowerText.includes('urgent') || lowerText.includes('immediately')) { score += 15; flags.push("Artificial urgency created"); }
    if (lowerText.includes('zelle') || lowerText.includes('cashapp')) { score += 15; flags.push("Unprotected payment method requested"); }
    if (lowerText.includes('irs') || lowerText.includes('police')) { score += 20; flags.push("Impersonation of authority"); }
    if (lowerText.includes('verify') && lowerText.includes('code')) { score += 30; flags.push("2FA/Verification Code phishing"); }
    
    score = Math.min(score, 99);
    score = Math.max(score, 5);

    let level: AnalysisResult['risk_level'] = "Safe";
    if (score > 20) level = "Low Risk";
    if (score > 50) level = "Medium Risk";
    if (score > 75) level = "High Risk";
    if (score > 90) level = "Critical";

    return {
      risk_score: score,
      risk_level: level,
      scam_type: score > 50 ? "Financial Fraud / Phishing" : "N/A",
      red_flags: flags.length > 0 ? flags : ["No obvious red flags detected."],
      verdict_summary: score > 50 
        ? "This message exhibits classic patterns of financial fraud. The sender is attempting to bypass standard safety protocols." 
        : "The message appears standard, though you should always verify the sender's identity independently.",
      advice: score > 50 
        ? "Do not reply. Block the number/email immediately. Do not click any links." 
        : "Proceed with caution. If they ask for money later, re-scan the message."
    };
  };

  const handleAnalyze = async () => {
    if (!inputText && !fileName) return;
    setAnalyzing(true);
    setResult(null);

    // Guard: Require subscription
    if (!user?.isSubscribed) {
       setCurrentView('pricing');
       return;
    }

    if (SIMULATION_MODE) {
      setTimeout(() => {
        const mockResult = simulateAnalysis(inputText || "image_analysis_placeholder");
        setResult(mockResult);
        setAnalyzing(false);
      }, 2000);
    } else {
      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: inputText }),
        });
        const data = await response.json();
        setResult(data);
      } catch (error) {
        console.error("API Error", error);
        alert("Failed to connect to ScamShield API");
      } finally {
        setAnalyzing(false);
      }
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulating Auth
    setUser({ email: 'demo@user.com', isSubscribed: false });
    setCurrentView('dashboard'); // Redirect to dashboard, which will prompt for pricing if used
  };

  const handleSubscribe = () => {
    if (user) {
      setUser({ ...user, isSubscribed: true });
      setCurrentView('dashboard');
    } else {
      setCurrentView('auth');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('landing');
    setResult(null);
    setInputText('');
  };

  // --- SUB-COMPONENTS ---

  const Navigation: React.FC = () => (
    <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => setCurrentView('landing')}/>
        
          <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
            <ShieldCheck className="w-6 h-6 text-emerald-500" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Scam<span className="text-emerald-500">Shield</span></span>
        </div>
        
        <nav className="flex items-center gap-6">
          {user ? (
            <>
              <button 
                onClick={() => setCurrentView('dashboard')}
                className={`text-sm font-medium transition-colors ${currentView === 'dashboard' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Scanner
              </button>
              <div className="h-6 w-px bg-slate-800 mx-2"></div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-400 hidden sm:block">{user.email}</span>
                <button 
                  onClick={handleLogout}
                  className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <>
              <button 
                onClick={() => setCurrentView('pricing')}
                className="text-sm font-medium text-slate-400 hover:text-white transition-colors hidden sm:block"
              >
                Pricing
              </button>
              <button 
                onClick={() => setCurrentView('auth')}
                className="text-sm font-medium text-white px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
              >
                Log In
              </button>
              <button 
                onClick={() => setCurrentView('auth')}
                className="text-sm font-medium text-slate-900 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 rounded-lg transition-colors shadow-lg shadow-emerald-500/20"
              >
                Get Started
              </button>
            </>
          )}
        </nav>
    </header>
  );

  const LandingView = () => (
    <div className="animate-in fade-in duration-500">
      {/* Hero */}
      <section className="pt-24 pb-32 px-4 text-center max-w-4xl mx-auto relative">
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-500/10 blur-[100px] rounded-full -z-10" />
         
         <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-sm font-medium mb-8">
            <Lock className="w-3 h-3" /> AI-Powered Fraud Detection
         </div>
         <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-6 leading-tight">
            Stop the Scam <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">Before It Starts</span>
         </h1>
         <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Instantly analyze suspicious texts, emails, and dating profiles. 
            Our AI acts as your personal cybersecurity expert, 24/7.
         </p>
         <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => setCurrentView('auth')}
              className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-xl font-bold text-lg shadow-xl shadow-emerald-500/20 transition-all hover:scale-105"
            >
              Scan a Message Free
            </button>
            <button 
              onClick={() => {
                const el = document.getElementById('how-it-works');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-lg border border-slate-700 transition-all"
            >
              How it Works
            </button>
         </div>
         
         {/* Social Proof */}
         <div className="mt-12 flex items-center justify-center gap-8 text-slate-500 grayscale opacity-70">
            <div className="flex items-center gap-2 text-sm font-medium"><CheckCircle className="w-4 h-4" /> 10,000+ Scans</div>
            <div className="flex items-center gap-2 text-sm font-medium"><Lock className="w-4 h-4" /> 256-bit Encryption</div>
         </div>
      </section>

      {/* Features Grid */}
      <section id="how-it-works" className="py-24 bg-slate-900/30 border-y border-slate-800/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Why Trust ScamShield?</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Scammers use AI to write convincing scripts. We use AI to detect them.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-slate-950 border border-slate-800 rounded-3xl hover:border-slate-700 transition-colors">
              <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 text-blue-400">
                <Search className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Deep Text Forensics</h3>
              <p className="text-slate-400 leading-relaxed">
                Our NLP engine detects linguistic triggers, coercive grammar, and script patterns used by international fraud rings that humans often miss.
              </p>
            </div>
            <div className="p-8 bg-slate-950 border border-slate-800 rounded-3xl hover:border-slate-700 transition-colors">
              <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 text-emerald-400">
                <Eye className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Visual Analysis</h3>
              <p className="text-slate-400 leading-relaxed">
                Upload screenshots of emails or texts. We analyze pixel inconsistencies, metadata, and fake logos to spot forged documents.
              </p>
            </div>
            <div className="p-8 bg-slate-950 border border-slate-800 rounded-3xl hover:border-slate-700 transition-colors">
              <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 text-purple-400">
                <Zap className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Instant Verdicts</h3>
              <p className="text-slate-400 leading-relaxed">
                Don't wait for Reddit to reply. Get a 0-100% Risk Score and actionable "Next Steps" (Block/Report/Ignore) in under 5 seconds.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );

  const AuthView = () => (
    <div className="min-h-[80vh] flex items-center justify-center px-4 animate-in zoom-in-95 duration-300">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl">
        <div className="text-center mb-8">
           <div className="w-12 h-12 bg-emerald-500/20 text-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4">
             <User className="w-6 h-6" />
           </div>
           <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
           <p className="text-slate-400">Sign in to access your scanner dashboard.</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email Address</label>
            <input 
              type="email" 
              defaultValue="demo@user.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
            <input 
              type="password" 
              defaultValue="password"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-emerald-500/20"
          >
            Sign In
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-slate-500">
          Don't have an account? <span className="text-emerald-400 cursor-pointer hover:underline">Create one</span>
        </div>
      </div>
    </div>
  );

  const PricingView = () => (
    <div className="py-20 px-4 animate-in slide-in-from-bottom-8 duration-500">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Simple, Transparent Pricing</h2>
        <p className="text-slate-400 text-lg">Protect yourself from fraud for less than the cost of a coffee.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {/* Free Tier */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col">
          <h3 className="text-xl font-bold text-white mb-2">Basic</h3>
          <div className="text-4xl font-bold text-white mb-6">$0<span className="text-lg text-slate-500 font-normal">/mo</span></div>
          <p className="text-slate-400 mb-8">Good for testing the waters.</p>
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-center gap-3 text-slate-300"><Check className="w-5 h-5 text-emerald-500" /> 1 Scan per day</li>
            <li className="flex items-center gap-3 text-slate-300"><Check className="w-5 h-5 text-emerald-500" /> Basic Text Analysis</li>
            <li className="flex items-center gap-3 text-slate-500"><X className="w-5 h-5" /> Image Analysis</li>
            <li className="flex items-center gap-3 text-slate-500"><X className="w-5 h-5" /> Priority Support</li>
          </ul>
          <button 
            onClick={() => {
              setUser({ email: 'free@user.com', isSubscribed: false });
              setCurrentView('dashboard');
            }}
            className="w-full py-3 rounded-xl border border-slate-700 text-white font-medium hover:bg-slate-800 transition-colors"
          >
            Continue Free
          </button>
        </div>

        {/* Pro Tier (Highlighted) */}
        <div className="bg-slate-900 border-2 border-emerald-500 rounded-3xl p-8 flex flex-col relative transform md:-translate-y-4 shadow-2xl shadow-emerald-500/10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-500 text-slate-900 px-4 py-1 rounded-full text-sm font-bold">
            Most Popular
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Pro Shield</h3>
          <div className="text-4xl font-bold text-white mb-6">$9<span className="text-lg text-slate-500 font-normal">/mo</span></div>
          <p className="text-slate-400 mb-8">Complete protection for you and your family.</p>
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-center gap-3 text-white"><Check className="w-5 h-5 text-emerald-400" /> Unlimited Scans</li>
            <li className="flex items-center gap-3 text-white"><Check className="w-5 h-5 text-emerald-400" /> Advanced Image Analysis</li>
            <li className="flex items-center gap-3 text-white"><Check className="w-5 h-5 text-emerald-400" /> Save Scan History</li>
            <li className="flex items-center gap-3 text-white"><Check className="w-5 h-5 text-emerald-400" /> 24/7 Priority API Access</li>
          </ul>
          <button 
            onClick={handleSubscribe}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold transition-colors shadow-lg shadow-emerald-500/25"
          >
            Start 7-Day Free Trial
          </button>
        </div>

        {/* Lifetime Tier */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col">
          <h3 className="text-xl font-bold text-white mb-2">Lifetime</h3>
          <div className="text-4xl font-bold text-white mb-6">$99<span className="text-lg text-slate-500 font-normal">/once</span></div>
          <p className="text-slate-400 mb-8">Pay once, own it forever.</p>
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-center gap-3 text-slate-300"><Check className="w-5 h-5 text-emerald-500" /> Everything in Pro</li>
            <li className="flex items-center gap-3 text-slate-300"><Check className="w-5 h-5 text-emerald-500" /> Early Access to New Features</li>
            <li className="flex items-center gap-3 text-slate-300"><Check className="w-5 h-5 text-emerald-500" /> No Monthly Fees</li>
          </ul>
          <button 
             onClick={handleSubscribe}
             className="w-full py-3 rounded-xl border border-slate-700 text-white font-medium hover:bg-slate-800 transition-colors"
          >
            Get Lifetime Access
          </button>
        </div>
      </div>
    </div>
  );

  const DashboardView = () => (
    <div className="max-w-5xl mx-auto px-4 py-12 animate-in fade-in duration-500">
      {!user?.isSubscribed && (
        <div className="mb-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between">
           <div className="flex items-center gap-3">
             <AlertTriangle className="w-5 h-5 text-amber-500" />
             <span className="text-amber-200 text-sm">You are on the free plan. Upgrade for unlimited image scans.</span>
           </div>
           <button 
            onClick={() => setCurrentView('pricing')}
            className="text-xs font-bold bg-amber-500 text-slate-900 px-3 py-1.5 rounded-lg hover:bg-amber-400 transition-colors"
           >
             Upgrade
           </button>
        </div>
      )}

      {/* --- RESULTS DISPLAY --- */}
      {result ? (
        <div className="space-y-8">
           <div className="flex items-center justify-between">
              <button 
                onClick={() => { setResult(null); setInputText(''); }}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> Scan Another
              </button>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`🚨 ScamShield Risk: ${result.risk_level}`);
                  alert("Copied!");
                }}
                className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-medium"
              >
                <Copy className="w-4 h-4" /> Share Verdict
              </button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Gauge */}
              <div className="md:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center relative overflow-hidden">
                <div className={`absolute inset-0 opacity-20 blur-3xl ${result.risk_score > 50 ? 'bg-red-500' : 'bg-emerald-500'}`} />
                <div className="relative w-48 h-48 mb-4">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" strokeWidth="8" />
                    <circle 
                      cx="50" cy="50" r="45" fill="none" 
                      stroke={result.risk_score > 75 ? '#ef4444' : result.risk_score > 40 ? '#f59e0b' : '#10b981'} 
                      strokeWidth="8"
                      strokeDasharray={`${result.risk_score * 2.83} 283`} 
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-4xl font-bold text-white">{result.risk_score}</span>
                    <span className="text-xs uppercase tracking-wider text-slate-400">Risk Score</span>
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

              {/* Analysis Text */}
              <div className="md:col-span-7 space-y-6">
                 <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                   <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3">Analysis Summary</h3>
                   <p className="text-white leading-relaxed text-lg">{result.verdict_summary}</p>
                 </div>
                 
                 <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                   <div className="flex items-center gap-2 mb-4">
                      <AlertOctagon className="w-5 h-5 text-red-500" />
                      <h3 className="text-white font-bold">Red Flags</h3>
                   </div>
                   <div className="space-y-2">
                      {result.red_flags.map((flag, i) => (
                        <div key={i} className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-slate-300 text-sm flex items-start gap-2">
                           <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
                           {flag}
                        </div>
                      ))}
                   </div>
                 </div>

                 <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 p-6 rounded-2xl">
                    <h3 className="text-emerald-400 font-bold mb-2 uppercase text-xs tracking-wider">Recommended Action</h3>
                    <p className="text-white font-medium">{result.advice}</p>
                 </div>
              </div>
           </div>
        </div>
      ) : (
        /* --- INPUT FORM --- */
        <div className="max-w-3xl mx-auto space-y-8">
           <div className="text-center">
              <h1 className="text-3xl font-bold text-white mb-2">Scanner Dashboard</h1>
              <p className="text-slate-400">Paste text or upload a screenshot to begin analysis.</p>
           </div>

           <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-2xl">
              <div className="relative">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste suspicious text, email content, or DM here..."
                  className="w-full h-48 bg-slate-950/50 text-slate-200 placeholder:text-slate-600 p-6 rounded-xl border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none resize-none transition-all"
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
                      className="flex items-center gap-2 text-sm text-slate-400 hover:text-white cursor-pointer transition-colors"
                      onDragEnter={() => setDragActive(true)}
                      onDragLeave={() => setDragActive(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragActive(false);
                        if (e.dataTransfer.files?.[0]) setFileName(e.dataTransfer.files[0].name);
                      }}
                    >
                      <div className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700">
                        <Upload className="w-4 h-4" />
                      </div>
                      <span className="truncate max-w-[150px]">{fileName || "Upload Screenshot"}</span>
                      <input type="file" className="hidden" onChange={(e) => setFileName(e.target.files?.[0]?.name || null)} />
                    </label>
                    {fileName && <button onClick={() => setFileName(null)} className="text-slate-500 hover:text-red-400"><X className="w-4 h-4"/></button>}
                 </div>

                 <button
                  onClick={handleAnalyze}
                  disabled={analyzing || (!inputText && !fileName)}
                  className={`
                    w-full md:w-auto px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all
                    ${analyzing || (!inputText && !fileName) 
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-900 hover:shadow-lg hover:shadow-emerald-500/20 active:scale-95'}
                  `}
                 >
                   {analyzing ? <><RefreshCw className="w-5 h-5 animate-spin" /> Analyzing...</> : <><Scan className="w-5 h-5" /> Analyze Now</>}
                 </button>
              </div>
           </div>
           
           {/* Quick Templates */}
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 opacity-70 hover:opacity-100 transition-opacity">
              <div onClick={() => setInputText("Kindly send the $200 refundable insurance fee via Zelle immediately.")} className="p-4 bg-slate-900 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-600">
                 <div className="text-xs font-bold text-slate-500 mb-1">TEMPLATE</div>
                 <div className="text-sm text-slate-300">Fake Zelle Payment</div>
              </div>
              <div onClick={() => setInputText("IRS Alert: Warrant issued. Call immediately to resolve this matter.")} className="p-4 bg-slate-900 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-600">
                 <div className="text-xs font-bold text-slate-500 mb-1">TEMPLATE</div>
                 <div className="text-sm text-slate-300">IRS Threat</div>
              </div>
              <div onClick={() => setInputText("I am currently deployed overseas but I will send a mover to pick up the item.")} className="p-4 bg-slate-900 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-600">
                 <div className="text-xs font-bold text-slate-500 mb-1">TEMPLATE</div>
                 <div className="text-sm text-slate-300">Marketplace Mover</div>
              </div>
           </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-emerald-500/30">
      <Navigation />
      
      <main>
        {currentView === 'landing' && <LandingView />}
        {currentView === 'auth' && <AuthView />}
        {currentView === 'pricing' && <PricingView />}
        {currentView === 'dashboard' && <DashboardView />}
      </main>

      <footer className="border-t border-slate-800 py-8 mt-12 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
          <p>© {new Date().getFullYear()} ScamShield AI. Not legal advice. For informational purposes only.</p>
        </div>
      </footer>
    </div>
  );
}