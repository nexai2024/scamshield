import { Quote, CheckCircle } from 'lucide-react';
import { testimonials, caseStudies, asSeenIn } from '../data/testimonials';

export function Testimonials() {
  return (
    <div className="space-y-16">
      {/* As seen in */}
      <section className="text-center">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">As seen in</p>
        <div className="flex flex-wrap items-center justify-center gap-8 text-slate-500 grayscale opacity-80">
          {asSeenIn.map((m) => (
            <span key={m.slug} className="text-sm font-medium">
              {m.name}
            </span>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-8 text-center">
          Trusted by people like you
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col"
            >
              <Quote className="w-8 h-8 text-emerald-500/50 mb-4" />
              <p className="text-slate-300 flex-1">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white">{t.name}</p>
                  <p className="text-sm text-slate-500">{t.role}</p>
                </div>
                {t.outcome && (
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
                    <CheckCircle className="w-4 h-4" /> {t.outcome}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Case studies */}
      <section className="border-t border-slate-800 pt-16">
        <h2 className="text-2xl font-bold text-white mb-8 text-center">
          Real outcomes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {caseStudies.map((c) => (
            <div
              key={c.id}
              className="p-6 bg-gradient-to-br from-slate-900 to-slate-900/50 border border-slate-800 rounded-2xl"
            >
              <p className="text-2xl font-bold text-emerald-400 mb-1">{c.amountSaved}</p>
              <h3 className="text-lg font-bold text-white mb-2">{c.title}</h3>
              <p className="text-slate-400 text-sm">{c.summary}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
