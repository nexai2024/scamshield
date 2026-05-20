'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ClipboardList, Loader2, Trash2 } from 'lucide-react';
import { SCAN_AUDIT_RETENTION_OPTIONS } from '@/lib/data/scanAuditRetention';
import { useToast } from '@/context/ToastContext';

type SettingsResponse =
  | {
      proRequired: true;
      redisConfigured: boolean;
      encryptionConfigured: boolean;
    }
  | {
      proRequired: false;
      enabled: boolean;
      retentionDays: number;
      consentGrantedAt: string;
      entryCount: number;
      redisConfigured: boolean;
      encryptionConfigured: boolean;
    };

type EntryRow = {
  id: string;
  createdAt: string;
  contentSha256: string;
  hadImage: boolean;
  textCharLength: number;
  risk_score: number;
  risk_level: string;
  scam_type: string;
  red_flag_count: number;
  link_inspection_count: number;
};

interface ScanAuditConsentPanelProps {
  isPro: boolean;
  isSignedIn: boolean;
  isDark: boolean;
}

export function ScanAuditConsentPanel({ isPro, isSignedIn, isDark }: ScanAuditConsentPanelProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SettingsResponse | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [retentionDays, setRetentionDays] = useState<number>(30);
  const [showLog, setShowLog] = useState(false);
  const [entries, setEntries] = useState<EntryRow[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);

  const loadSettings = useCallback(async () => {
    if (!isSignedIn) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/scan-audit/settings');
      const data = (await res.json()) as SettingsResponse & { error?: string };
      if (!res.ok) {
        setSettings(null);
        toast.showToast(data?.error || 'Could not load audit settings.', 'error');
        return;
      }
      setSettings(data);
      if (!data.proRequired && 'enabled' in data) {
        setEnabled(data.enabled);
        setRetentionDays(data.retentionDays);
      }
    } catch {
      toast.showToast('Could not load audit settings.', 'error');
    } finally {
      setLoading(false);
    }
  }, [isSignedIn]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const loadEntries = async () => {
    setEntriesLoading(true);
    try {
      const res = await fetch('/api/scan-audit/entries?limit=50');
      const data = await res.json();
      if (!res.ok) {
        toast.showToast(data?.error || 'Could not load entries.', 'error');
        return;
      }
      setEntries(Array.isArray(data.entries) ? data.entries : []);
    } catch {
      toast.showToast('Could not load entries.', 'error');
    } finally {
      setEntriesLoading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/scan-audit/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled, retentionDays }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.showToast(data?.error || 'Could not save.', 'error');
        return;
      }
      toast.showToast('Server audit preferences saved.', 'info');
      await loadSettings();
    } catch {
      toast.showToast('Could not save.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const clearLog = async () => {
    if (!confirm('Delete all server-side audit entries for your account? This cannot be undone.')) return;
    try {
      const res = await fetch('/api/scan-audit/entries', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        toast.showToast(data?.error || 'Could not clear log.', 'error');
        return;
      }
      toast.showToast('Server audit log cleared.', 'info');
      setEntries([]);
      await loadSettings();
    } catch {
      toast.showToast('Could not clear log.', 'error');
    }
  };

  if (!isSignedIn) return null;

  const cardBg = isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200';
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-600';
  const textDim = isDark ? 'text-slate-500' : 'text-slate-500';

  return (
    <section className={`rounded-2xl border p-6 shadow-sm ${cardBg}`} aria-labelledby="scan-audit-heading">
      <div className="flex flex-wrap items-start gap-3 mb-4">
        <ClipboardList className={`w-6 h-6 shrink-0 mt-0.5 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} aria-hidden />
        <div className="min-w-0 flex-1">
          <h2 id="scan-audit-heading" className={`text-lg font-bold ${textPrimary}`}>
            Server audit log (Pro)
          </h2>
          <p className={`text-sm mt-1 ${textMuted}`}>
            Optional compliance trail: we store <strong>hashes and metadata</strong> only (risk score, scam type, counts)—never your message text or images. Entries are{' '}
            <strong>AES-256-GCM</strong> encrypted at rest and expire after your chosen retention window.
          </p>
        </div>
      </div>

      {!isPro && (
        <p className={`text-sm ${textMuted}`}>
          Upgrade to Pro to enable a tamper-resistant server log for oversight and disputes.{' '}
          <Link href="/pricing" className="font-semibold text-teal-600 dark:text-teal-400 hover:underline">
            View pricing
          </Link>
          .
        </p>
      )}

      {isPro && loading && (
        <div className={`flex items-center gap-2 text-sm ${textMuted}`}>
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      )}

      {isPro && !loading && settings && 'proRequired' in settings && settings.proRequired && (
        <p className={`text-sm ${textMuted}`}>
          Your Pro subscription is active in the app, but the server needs <code className="text-xs">publicMetadata.plan === &quot;pro&quot;</code> (e.g. Stripe webhook) to write audit entries. Billing-only Pro may not sync this field yet.
        </p>
      )}

      {isPro && !loading && settings && !settings.proRequired && (
        <div className="space-y-4">
          {(!settings.redisConfigured || !settings.encryptionConfigured) && (
            <div
              className={`text-sm rounded-xl border p-3 ${isDark ? 'border-amber-500/30 bg-amber-500/10 text-amber-100' : 'border-amber-200 bg-amber-50 text-amber-900'}`}
            >
              {!settings.redisConfigured && <p>Set Upstash Redis (<code className="text-xs">UPSTASH_REDIS_*</code>) for this feature.</p>}
              {!settings.encryptionConfigured && (
                <p className="mt-1">
                  Set <code className="text-xs">SCAN_AUDIT_ENCRYPTION_KEY</code> (64-char hex or a strong passphrase) so entries can be encrypted.
                </p>
              )}
            </div>
          )}

          <label className={`flex items-center gap-3 cursor-pointer select-none ${textPrimary}`}>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              disabled={!settings.redisConfigured || !settings.encryptionConfigured}
              className="rounded border-slate-400 w-4 h-4"
            />
            <span className="text-sm font-medium">Enable server-side audit log for new scans</span>
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <label className={`text-sm ${textMuted}`}>
              Retention:{' '}
              <select
                value={retentionDays}
                onChange={(e) => setRetentionDays(Number(e.target.value))}
                className={`ml-1 rounded-lg border px-2 py-1.5 text-sm ${isDark ? 'bg-slate-900 border-slate-600 text-slate-200' : 'bg-white border-slate-300'}`}
              >
                {SCAN_AUDIT_RETENTION_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d} days
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving || !settings.redisConfigured || !settings.encryptionConfigured}
              className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving…' : 'Save preferences'}
            </button>
          </div>

          <p className={`text-xs ${textDim}`}>
            Stored today: <strong className={textPrimary}>{'entryCount' in settings ? settings.entryCount : 0}</strong> indexed entries (max 200 rolling). Each entry TTL matches retention.
          </p>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200/20 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => {
                setShowLog((v) => !v);
                if (!showLog) void loadEntries();
              }}
              className={`text-sm font-medium ${isDark ? 'text-teal-400 hover:text-teal-300' : 'text-teal-700 hover:text-teal-800'}`}
            >
              {showLog ? 'Hide audit log' : 'View audit log'}
            </button>
            <button
              type="button"
              onClick={() => void clearLog()}
              className={`inline-flex items-center gap-1.5 text-sm font-medium ${isDark ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}`}
            >
              <Trash2 className="w-4 h-4" /> Clear all entries
            </button>
          </div>

          {showLog && (
            <div className="overflow-x-auto rounded-xl border border-slate-200/30 dark:border-slate-700">
              {entriesLoading ? (
                <p className={`p-4 text-sm ${textMuted}`}>Loading entries…</p>
              ) : entries.length === 0 ? (
                <p className={`p-4 text-sm ${textMuted}`}>No entries yet. Run a scan with audit enabled.</p>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className={isDark ? 'bg-slate-800/80' : 'bg-slate-50'}>
                    <tr>
                      <th className={`p-2 font-semibold ${textMuted}`}>Time</th>
                      <th className={`p-2 font-semibold ${textMuted}`}>Score</th>
                      <th className={`p-2 font-semibold ${textMuted}`}>Type</th>
                      <th className={`p-2 font-semibold ${textMuted}`}>Text hash (prefix)</th>
                      <th className={`p-2 font-semibold ${textMuted}`}>Img</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((row) => (
                      <tr key={row.id} className={`border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                        <td className={`p-2 whitespace-nowrap ${textPrimary}`}>{new Date(row.createdAt).toLocaleString()}</td>
                        <td className={`p-2 ${textPrimary}`}>
                          {row.risk_score} · {row.risk_level}
                        </td>
                        <td className={`p-2 max-w-[140px] truncate ${textMuted}`}>{row.scam_type}</td>
                        <td className={`p-2 font-mono ${textDim}`}>{row.contentSha256.slice(0, 12)}…</td>
                        <td className={`p-2 ${textMuted}`}>{row.hadImage ? 'Yes' : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
