'use client';

import Link from 'next/link';
import { Lock, CheckCircle, Search, Eye, Zap } from 'lucide-react';
import { SubNav } from '@/components/SubNav';
import { Testimonials } from '@/components/Testimonials';
import { FAQ } from '@/components/FAQ';
import { faqItems } from '@/lib/data/faq';
import { CONTENT_MAX_W } from '@/lib/constants';
import { getStoredTheme, getEffectiveTheme } from '@/lib/utils/theme';

const landingNavLinks = [{ id: 'hero', label: 'Top' }, { id: 'testimonials', label: 'Testimonials' }, { id: 'how-it-works', label: 'How it works' }];

export default function LandingPage() {
  const theme = getStoredTheme();
  const isDark = getEffectiveTheme(theme) === 'dark';
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-600';
  const textDim = isDark ? 'text-slate-500' : 'text-slate-500';
  const cardBg = isDark ? 'bg-slate-900' : 'bg-white';
  const cardBorder = isDark ? 'border-slate-800' : 'border-slate-200';
  const featureCardBg = isDark ? 'bg-slate-950' : 'bg-slate-50';
  const sectionBorder = isDark ? 'border-slate-800/50' : 'border-slate-200';
  const sectionBg = isDark ? 'bg-slate-900/30' : 'bg-slate-200/50';
  const hoverBorder = isDark ? 'hover:border-slate-700' : 'hover:border-slate-300';
  const heroSecondaryBtn = isDark ? 'bg-slate-900 hover:bg-slate-800 text-white border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-900 border-slate-300';

  return (
    <div className="animate-in fade-in duration-500">
      <SubNav links={landingNavLinks} isDark={isDark} />
      <section id="hero" className="w-full border-b border-slate-800/50">
        <div className={`${CONTENT_MAX_W} mx-auto pt-24 pb-32 px-4 text-center relative`}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-500/10 blur-[100px] rounded-full -z-10" />
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20 text-sm font-medium mb-8 dark:text-blue-400">
            <Lock className="w-3 h-3" /> AI-Powered Fraud Detection
          </div>
          <h1 className={`text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight ${textPrimary}`}>
            Stop the Scam <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">Before It Starts</span>
          </h1>
          <p className={`text-xl mb-10 max-w-2xl mx-auto leading-relaxed ${textMuted}`}>
            Instantly analyze suspicious texts, emails, and dating profiles. Our AI acts as your personal cybersecurity expert, 24/7.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard" className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-xl font-bold text-lg shadow-xl shadow-emerald-500/20 transition-all hover:scale-105 text-center">
              Scan a Message Free
            </Link>
            <a href="#how-it-works" className={`w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-lg border transition-all text-center ${heroSecondaryBtn}`}>
              How it Works
            </a>
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
              <p className={`${textMuted} leading-relaxed`}>Our NLP engine detects linguistic triggers and script patterns used by fraud rings that humans often miss.</p>
            </div>
            <div className={`p-8 border rounded-3xl transition-colors flex flex-col ${featureCardBg} ${cardBorder} ${hoverBorder}`}>
              <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 text-emerald-500 dark:text-emerald-400">
                <Eye className="w-7 h-7" />
              </div>
              <h3 className={`text-xl font-bold mb-3 ${textPrimary}`}>Visual Analysis</h3>
              <p className={`${textMuted} leading-relaxed`}>Upload screenshots of emails or texts. We analyze pixel inconsistencies and fake logos to spot forgeries.</p>
            </div>
            <div className={`p-8 border rounded-3xl transition-colors flex flex-col ${featureCardBg} ${cardBorder} ${hoverBorder}`}>
              <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 text-purple-500 dark:text-purple-400">
                <Zap className="w-7 h-7" />
              </div>
              <h3 className={`text-xl font-bold mb-3 ${textPrimary}`}>Instant Verdicts</h3>
              <p className={`${textMuted} leading-relaxed`}>Get a 0-100% Risk Score and actionable Next Steps in under 5 seconds.</p>
            </div>
          </div>
          <div className="mt-16">
            <FAQ items={faqItems} isDark={isDark} />
          </div>
        </div>
      </section>
    </div>
  );
}
