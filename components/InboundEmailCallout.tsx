'use client';

import { Mail } from 'lucide-react';
import { PUBLIC_INBOUND_SCAN_EMAIL } from '@/lib/constants';

function inboundEmailDisplay(): string {
  return process.env.NEXT_PUBLIC_INBOUND_EMAIL?.trim() || PUBLIC_INBOUND_SCAN_EMAIL;
}

/** Forward-to-analyze instructions (env override or default production address). */
export function InboundEmailCallout({ isDark }: { isDark: boolean }) {
  const email = inboundEmailDisplay();

  const border = isDark ? 'border-slate-700 bg-slate-900/60' : 'border-sky-100 bg-white';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-600';
  const textPrimary = isDark ? 'text-slate-100' : 'text-slate-900';

  return (
    <div className={`rounded-2xl border p-4 flex gap-3 ${border}`}>
      <Mail className={`w-5 h-5 shrink-0 mt-0.5 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} aria-hidden />
      <div>
        <p className={`text-sm font-semibold ${textPrimary}`}>Forward suspicious email</p>
        <p className={`text-sm mt-1 ${textMuted}`}>
          BCC or forward the message to{' '}
          <a href={`mailto:${email}`} className="font-mono text-teal-600 dark:text-teal-400 font-medium break-all">
            {email}
          </a>{' '}
          — you’ll get a reply with a private link to the full report.
        </p>
      </div>
    </div>
  );
}
