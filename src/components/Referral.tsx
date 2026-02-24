import React, { useState } from 'react';
import { Copy, Gift, Check } from 'lucide-react';
import { getReferralLink, getReferralStats, addReferralInvite } from '../utils/referral';

interface ReferralProps {
  userEmail: string;
  isDark: boolean;
}

export function Referral({ userEmail, isDark }: ReferralProps) {
  const [email, setEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);
  const link = getReferralLink(userEmail);
  const stats = getReferralStats(userEmail);

  const copyLink = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      addReferralInvite(userEmail);
      setSent(true);
      setEmail('');
    }
  };

  const cardBg = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
  const inputBg = isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200';

  return (
    <div className={`${cardBg} border rounded-2xl p-6`}>
      <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
        <Gift className="w-5 h-5 text-emerald-500" /> Invite friends, earn free Pro
      </h3>
      <p className="text-slate-400 text-sm mb-4">
        For each friend who signs up with your link, you get <strong className="text-emerald-400">7 days of Pro</strong> free.
      </p>
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          readOnly
          value={link}
          className={`flex-1 min-w-[200px] px-4 py-2 rounded-xl border text-sm ${inputBg} ${isDark ? 'text-slate-300' : 'text-slate-700'}`}
        />
        <button
          onClick={copyLink}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-medium transition-colors"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy link'}
        </button>
      </div>
      <form onSubmit={sendInvite} className="flex flex-wrap gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Friend's email (optional)"
          className={`flex-1 min-w-[180px] px-4 py-2 rounded-xl border ${inputBg} ${isDark ? 'text-white placeholder:text-slate-500' : 'text-slate-900 placeholder:text-slate-400'} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
        >
          Send invite
        </button>
      </form>
      {sent && (
        <p className="text-emerald-400 text-sm mt-2">Invite recorded. You’ve earned 7 more days of Pro!</p>
      )}
      <div className="mt-4 pt-4 border-t border-slate-800 flex gap-6 text-sm text-slate-400">
        <span>Invites sent: <strong className="text-white">{stats.invitedCount}</strong></span>
        <span>Free days earned: <strong className="text-emerald-400">{stats.freeDaysEarned}</strong></span>
      </div>
    </div>
  );
}
