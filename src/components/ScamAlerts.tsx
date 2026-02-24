import { AlertTriangle, Lightbulb } from 'lucide-react';
import { scamAlerts, scamTips } from '../data/scamAlerts';

const severityClass = {
  critical: 'bg-red-500/10 border-red-500/20 text-red-400',
  warning: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  info: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
};

export function ScamAlerts() {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Recent scam alerts
        </h2>
        <div className="space-y-3">
          {scamAlerts.map((a) => (
            <div
              key={a.id}
              className={`p-4 rounded-xl border ${severityClass[a.severity]} bg-slate-900/50 border-slate-800`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-white">{a.title}</p>
                  <p className="text-sm text-slate-400 mt-1">{a.summary}</p>
                  <p className="text-xs text-slate-500 mt-2">
                    {a.date}
                    {a.region ? ` · ${a.region}` : ''}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-emerald-500" />
          Safety tips
        </h2>
        <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-3">
          {scamTips.map((t) => (
            <div
              key={t.id}
              className="p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors"
            >
              <h3 className="font-semibold text-white mb-1">{t.title}</h3>
              <p className="text-sm text-slate-400">{t.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
