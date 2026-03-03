import { AlertTriangle, Lightbulb } from 'lucide-react';
import { scamAlerts, scamTips } from '@/lib/data/scamAlerts';

const severityClassDark: Record<string, string> = {
  critical: 'bg-red-500/10 border-red-500/20 text-red-400',
  warning: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  info: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
};
const severityClassLight: Record<string, string> = {
  critical: 'bg-red-500/10 border-red-500/30 text-red-600',
  warning: 'bg-amber-500/10 border-amber-500/30 text-amber-600',
  info: 'bg-blue-500/10 border-blue-500/30 text-blue-600',
};

interface ScamAlertsProps {
  isDark?: boolean;
}

export function ScamAlerts({ isDark = true }: ScamAlertsProps) {
  const severityClass = isDark ? severityClassDark : severityClassLight;
  const cardBg = isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white/80 border-slate-200';
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-600';
  const textDim = isDark ? 'text-slate-500' : 'text-slate-500';
  const tipCard = isDark ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300';

  return (
    <div className="space-y-8">
      <section>
        <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${textPrimary}`}>
          <AlertTriangle className="w-5 h-5 text-amber-500" /> Recent scam alerts
        </h2>
        <div className="space-y-3">
          {scamAlerts.map((a) => (
            <div key={a.id} className={`p-4 rounded-xl border ${severityClass[a.severity]} ${cardBg}`}>
              <p className={`font-medium ${textPrimary}`}>{a.title}</p>
              <p className={`text-sm mt-1 ${textMuted}`}>{a.summary}</p>
              <p className={`text-xs mt-2 ${textDim}`}>{a.date}{a.region ? ' · ' + a.region : ''}</p>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${textPrimary}`}>
          <Lightbulb className="w-5 h-5 text-emerald-500" /> Safety tips
        </h2>
        <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-3">
          {scamTips.map((t) => (
            <div key={t.id} className={`p-4 border rounded-xl transition-colors ${tipCard}`}>
              <h3 className={`font-semibold mb-1 ${textPrimary}`}>{t.title}</h3>
              <p className={`text-sm ${textMuted}`}>{t.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
