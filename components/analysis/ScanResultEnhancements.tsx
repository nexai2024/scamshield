'use client';

import { useMemo, useState } from 'react';
import {
  Link2,
  ShieldAlert,
  MessageSquareText,
  Building2,
  Copy,
  ChevronDown,
  Info,
} from 'lucide-react';
import type { AnalysisResult } from '@/lib/types';
import { OFFICIAL_CONTACTS, searchOfficialContacts } from '@/lib/data/officialContacts';
import { Tooltip } from '@/components/ui/Tooltip';

function scoreBar(label: string, value: number, isDark: boolean) {
  const v = Math.min(100, Math.max(0, value));
  const fill =
    v >= 70 ? 'bg-red-500' : v >= 40 ? 'bg-amber-500' : 'bg-teal-500';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-600';
  return (
    <div>
      <div className={`flex justify-between text-xs mb-1 ${textMuted}`}>
        <span>{label}</span>
        <span className="tabular-nums font-semibold">{v}</span>
      </div>
      <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
        <div className={`h-full rounded-full transition-all ${fill}`} style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

export function ScanResultEnhancements({
  result,
  isDark,
  onCopy,
}: {
  result: AnalysisResult;
  isDark: boolean;
  onCopy: (message: string) => void;
}) {
  const cardBg = isDark ? 'bg-slate-900' : 'bg-white';
  const cardBorder = isDark ? 'border-slate-800' : 'border-slate-200';
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-600';
  const textDim = isDark ? 'text-slate-500' : 'text-slate-500';

  const rb = result.risk_breakdown;
  const pattern = result.scam_pattern;
  const links = result.link_inspections ?? [];
  const pii = result.pii_payment_findings ?? [];
  const replies = result.safe_reply_suggestions ?? [];

  const [officialOpen, setOfficialOpen] = useState(false);
  const [officialQuery, setOfficialQuery] = useState('');
  const filteredOfficial = useMemo(() => searchOfficialContacts(officialQuery), [officialQuery]);

  return (
    <div className="space-y-6">
      {pattern && (
        <div className={`${cardBg} border rounded-2xl p-6 ${cardBorder}`}>
          <h3 className={`${textMuted} text-xs font-bold uppercase tracking-wider mb-2`}>Scam pattern</h3>
          <p className={`${textPrimary} text-lg font-semibold`}>
            {pattern.label}
            <span className={`text-base font-bold ml-2 ${isDark ? 'text-teal-400' : 'text-teal-600'}`}>
              ({pattern.confidence}%)
            </span>
          </p>
          <p className={`text-sm mt-2 leading-relaxed ${textMuted}`}>
            <span className={`font-medium ${textPrimary}`}>What often happens next: </span>
            {pattern.typical_next_steps}
          </p>
        </div>
      )}

      {rb && (
        <div className={`${cardBg} border rounded-2xl p-6 ${cardBorder}`}>
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} aria-hidden />
            <h3 className={`${textMuted} text-xs font-bold uppercase tracking-wider`}>Risk breakdown</h3>
            <Tooltip
              label="Higher scores mean more concern in that category. They are estimates from the model plus on-device checks, not a guarantee."
              side="top"
              multiline
            >
              <span className="inline-flex cursor-help" tabIndex={0}>
                <Info className={`w-4 h-4 ${textDim}`} aria-hidden />
              </span>
            </Tooltip>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {scoreBar('Sender authenticity', rb.sender_authenticity, isDark)}
            {scoreBar('Link safety', rb.link_safety, isDark)}
            {scoreBar('Payment risk', rb.payment_risk, isDark)}
            {scoreBar('Identity / credential risk', rb.identity_theft_risk, isDark)}
          </div>
        </div>
      )}

      {links.length > 0 && (
        <div className={`${cardBg} border rounded-2xl p-6 ${cardBorder}`}>
          <div className="flex items-center gap-2 mb-3">
            <Link2 className={`w-5 h-5 ${isDark ? 'text-sky-400' : 'text-sky-600'}`} aria-hidden />
            <h3 className={`${textMuted} text-xs font-bold uppercase tracking-wider`}>Link & domain inspector</h3>
          </div>
          <p className={`text-xs mb-4 ${textDim}`}>
            Short links are expanded when possible. Domain age and registrar come from public RDAP when available — not all TLDs
            respond. Always verify in your browser, not only here.
          </p>
          <ul className="space-y-4 list-none m-0 p-0">
            {links.map((row, i) => (
              <li
                key={`${row.original_url}-${i}`}
                className={`rounded-xl border p-4 text-sm ${isDark ? 'border-slate-700 bg-slate-950/40' : 'border-slate-200 bg-slate-50/80'}`}
              >
                <div className={`font-mono text-xs break-all ${textMuted}`}>{row.original_url}</div>
                {row.expanded_url && row.expanded_url !== row.original_url && (
                  <div className={`mt-2 text-xs ${textPrimary}`}>
                    <span className={`${textDim} mr-1`}>Resolves toward:</span>
                    <span className="break-all font-mono">{row.expanded_url}</span>
                  </div>
                )}
                {row.expand_error && (
                  <div className={`mt-1 text-xs ${isDark ? 'text-amber-200/90' : 'text-amber-800'}`}>
                    Expansion note: {row.expand_error}
                  </div>
                )}
                {(row.domain_registration_date || row.registrar) && (
                  <div className={`mt-2 text-xs ${textMuted}`}>
                    {row.domain_registration_date && (
                      <span>
                        Registration: {new Date(row.domain_registration_date).toLocaleDateString()}
                        {row.registrar ? ' · ' : ''}
                      </span>
                    )}
                    {row.registrar && <span>Registrar: {row.registrar}</span>}
                  </div>
                )}
                {row.rdap_error && !row.domain_registration_date && (
                  <div className={`mt-1 text-xs ${textDim}`}>Registrar lookup: {row.rdap_error}</div>
                )}
                {row.lookalike_warning && (
                  <div
                    className={`mt-3 text-xs font-medium rounded-lg px-3 py-2 border ${
                      isDark ? 'border-amber-500/40 bg-amber-500/10 text-amber-100' : 'border-amber-300 bg-amber-50 text-amber-900'
                    }`}
                  >
                    {row.lookalike_warning}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {pii.length > 0 && (
        <div
          className={`border rounded-2xl p-6 ${
            isDark ? 'border-red-500/30 bg-red-950/20' : 'border-red-200 bg-red-50/80'
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" aria-hidden />
            <h3 className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
              Sensitive info & payment requests
            </h3>
          </div>
          <ul className="space-y-3 list-none m-0 p-0">
            {pii.map((item, idx) => (
              <li key={`${item.kind}-${idx}`} className={`text-sm ${textPrimary}`}>
                <p className="font-semibold">{item.summary}</p>
                {item.excerpt && <p className={`text-xs mt-1 ${textMuted}`}>Match cue: {item.excerpt}</p>}
                <p className={`text-sm mt-2 font-medium ${isDark ? 'text-red-200' : 'text-red-800'}`}>{item.never_share}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {replies.length > 0 && (
        <div className={`${cardBg} border rounded-2xl p-6 ${cardBorder}`}>
          <div className="flex items-center gap-2 mb-3">
            <MessageSquareText className={`w-5 h-5 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} aria-hidden />
            <h3 className={`${textMuted} text-xs font-bold uppercase tracking-wider`}>Safe reply ideas</h3>
          </div>
          <p className={`text-xs mb-4 ${textDim}`}>Tap to copy — short responses that avoid confirming account details.</p>
          <div className="flex flex-col gap-2">
            {replies.map((line, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(line);
                  onCopy('Copied safe reply');
                }}
                className={`flex items-start gap-3 text-left text-sm rounded-xl border px-4 py-3 transition-colors ${
                  isDark
                    ? 'border-slate-700 bg-slate-950/50 hover:bg-slate-800 text-slate-200'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                }`}
              >
                <Copy className="w-4 h-4 shrink-0 mt-0.5 opacity-60" aria-hidden />
                <span>{line}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={`${cardBg} border rounded-2xl overflow-hidden ${cardBorder}`}>
        <button
          type="button"
          onClick={() => setOfficialOpen((o) => !o)}
          className={`w-full flex items-center justify-between gap-3 text-left py-4 px-6 transition-colors hover:bg-slate-500/5 dark:hover:bg-slate-400/5`}
        >
          <span className="flex items-center gap-2 min-w-0">
            <Building2 className={`w-5 h-5 shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} aria-hidden />
            <span className={`${textMuted} text-xs font-bold uppercase tracking-wider`}>Official contact lookup</span>
          </span>
          <ChevronDown className={`w-5 h-5 shrink-0 text-slate-500 transition-transform ${officialOpen ? 'rotate-180' : ''}`} />
        </button>
        {officialOpen && (
          <div className="px-6 pb-6 pt-0 space-y-4">
            <div
              className={`text-xs leading-relaxed rounded-lg p-3 border ${
                isDark ? 'border-amber-500/25 bg-amber-500/5 text-amber-100/90' : 'border-amber-200 bg-amber-50 text-amber-950'
              }`}
            >
              <strong>Disclaimer:</strong> Numbers and URLs change. Treat this as a starting point only — open the official site
              yourself (type the domain or use a bookmark) and confirm contact details there. ScamShield is not affiliated with
              these institutions.
            </div>
            <input
              type="search"
              value={officialQuery}
              onChange={(e) => setOfficialQuery(e.target.value)}
              placeholder="Filter (e.g. PayPal, USPS, Chase)..."
              className={`w-full rounded-xl border px-4 py-2 text-sm ${
                isDark ? 'bg-slate-950 border-slate-700 text-slate-200 placeholder:text-slate-500' : 'bg-white border-slate-200'
              }`}
              aria-label="Filter official organizations"
            />
            <ul className="space-y-3 list-none m-0 p-0 max-h-64 overflow-y-auto">
              {(officialQuery.trim() ? filteredOfficial : OFFICIAL_CONTACTS).map((org) => (
                <li
                  key={org.id}
                  className={`rounded-xl border p-4 text-sm ${isDark ? 'border-slate-700 bg-slate-950/50' : 'border-slate-200 bg-slate-50/80'}`}
                >
                  <div className={`font-semibold ${textPrimary}`}>{org.displayName}</div>
                  {org.primaryUrl && (
                    <a
                      href={org.primaryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-xs mt-1 inline-block underline ${isDark ? 'text-teal-400' : 'text-teal-700'}`}
                    >
                      Official site / help
                    </a>
                  )}
                  {org.supportPhone && (
                    <div className={`text-xs mt-1 ${textMuted}`}>
                      Phone (verify on official site): <span className="font-mono">{org.supportPhone}</span>
                    </div>
                  )}
                  {org.notes && <p className={`text-xs mt-2 ${textDim}`}>{org.notes}</p>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
