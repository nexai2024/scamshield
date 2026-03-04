/* 'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Check, X } from 'lucide-react';
import { useUser, useAuth } from '@clerk/nextjs';
import { SubNav } from '@/components/SubNav';
import { CONTENT_MAX_W } from '@/lib/constants';
import { getStoredTheme, getEffectiveTheme } from '@/lib/utils/theme';
import { useToast } from '@/context/ToastContext';

const pricingNavLinks = [{ id: 'plans', label: 'Plans' }];

export default function PricingPage() {
  const { user, isLoaded: userLoaded } = useUser();
  const { getToken } = useAuth();
  const toast = useToast();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const theme = getStoredTheme();
  const isDark = getEffectiveTheme(theme) === 'dark';

  const isPro = (user?.publicMetadata as { plan?: string } | undefined)?.plan === 'pro';
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-600';
  const cardBg = isDark ? 'bg-slate-900' : 'bg-white';
  const cardBorder = isDark ? 'border-slate-800' : 'border-slate-200';
  const priceCardDim = isDark ? 'text-slate-500' : 'text-slate-500';
  const priceCardMuted = isDark ? 'text-slate-300' : 'text-slate-600';
  const priceBorderBtn = isDark ? 'border-slate-700 text-white hover:bg-slate-800' : 'border-slate-300 text-slate-900 hover:bg-slate-100';

  const handleSubscribePro = async () => {
    if (!user) {
      toast.showToast('Sign in to subscribe.', 'info');
      return;
    }
    setCheckoutLoading(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Checkout failed');
      if (data?.url) window.location.href = data.url;
      else throw new Error('No checkout URL');
    } catch (e) {
      toast.showToast(e instanceof Error ? e.message : 'Could not start checkout', 'error');
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="animate-in slide-in-from-bottom-8 duration-500">
      <SubNav links={pricingNavLinks} isDark={isDark} />
      <div id="plans" className={`${CONTENT_MAX_W} mx-auto py-20 px-4`}>
        <div className="text-center mb-16">
          <h2 className={`text-3xl md:text-5xl font-bold mb-6 ${textPrimary}`}>Simple, Transparent Pricing</h2>
          <p className={`${textMuted} text-lg`}>Two tiers: Free (1 scan/day) or Pro (unlimited) for $8.99/mo.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-4xl mx-auto">
          <div className={`${cardBg} border rounded-3xl p-8 flex flex-col ${cardBorder}`}>
            <h3 className={`text-xl font-bold mb-2 ${textPrimary}`}>Free</h3>
            <div className={`text-4xl font-bold mb-6 ${textPrimary}`}>$0<span className={`text-lg font-normal ${priceCardDim}`}>/mo</span></div>
            <p className={`${textMuted} mb-8`}>1 scan per day. No credit card required.</p>
            <ul className="space-y-4 mb-8 flex-1">
              <li className={`flex items-center gap-3 ${priceCardMuted}`}><Check className="w-5 h-5 text-emerald-500" /> 1 scan per day</li>
              <li className={`flex items-center gap-3 ${priceCardMuted}`}><Check className="w-5 h-5 text-emerald-500" /> Full text analysis</li>
              <li className={`flex items-center gap-3 ${priceCardDim}`}><X className="w-5 h-5" /> Unlimited scans</li>
              <li className={`flex items-center gap-3 ${priceCardDim}`}><X className="w-5 h-5" /> PDF reports</li>
            </ul>
            <Link href="/dashboard" className={`w-full py-3 rounded-xl border font-medium transition-colors text-center ${priceBorderBtn}`}>
              Use Free
            </Link>
          </div>
          <div className={`${cardBg} border-2 border-emerald-500 rounded-3xl p-8 flex flex-col relative shadow-2xl shadow-emerald-500/10 ${isDark ? '' : 'bg-emerald-50/50'}`}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-500 text-slate-900 px-4 py-1 rounded-full text-sm font-bold">Pro</div>
            <h3 className={`text-xl font-bold mb-2 flex items-center gap-2 ${textPrimary}`}><Check className="w-5 h-5 text-emerald-500" aria-hidden /> Pro</h3>
            <div className={`text-4xl font-bold mb-6 ${textPrimary}`}>$8.99<span className={`text-lg font-normal ${priceCardDim}`}>/mo</span></div>
            <p className={`${textMuted} mb-8`}>Unlimited scans. Cancel anytime.</p>
            <ul className="space-y-4 mb-8 flex-1">
              <li className={`flex items-center gap-3 ${textPrimary}`}><Check className="w-5 h-5 text-emerald-500" /> Unlimited scans</li>
              <li className={`flex items-center gap-3 ${textPrimary}`}><Check className="w-5 h-5 text-emerald-500" /> Full analysis and history</li>
              <li className={`flex items-center gap-3 ${textPrimary}`}><Check className="w-5 h-5 text-emerald-500" /> PDF reports</li>
              <li className={`flex items-center gap-3 ${textPrimary}`}><Check className="w-5 h-5 text-emerald-500" /> Billed monthly</li>
            </ul>
            {isPro ? (
              <div className={`w-full py-3 rounded-xl text-center font-medium ${textMuted}`}>You are on Pro</div>
            ) : (
              <button onClick={handleSubscribePro} disabled={checkoutLoading} className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold transition-colors shadow-lg shadow-emerald-500/25 disabled:opacity-70">
                {checkoutLoading ? 'Loading…' : user ? 'Subscribe — $8.99/mo' : 'Sign in to subscribe'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
 */
import { PricingTable } from '@clerk/nextjs'

export default function PricingPage() {
  return <PricingTable />
}