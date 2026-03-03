import { Quote, CheckCircle } from 'lucide-react';
import { testimonials, caseStudies, asSeenIn } from '@/lib/data/testimonials';

interface TestimonialsProps {
  isDark?: boolean;
}

export function Testimonials({ isDark = true }: TestimonialsProps) {
  const cardBg = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-600';
  const textDim = isDark ? 'text-slate-500' : 'text-slate-500';
  const borderT = isDark ? 'border-slate-800' : 'border-slate-200';
  const caseBg = isDark ? 'bg-gradient-to-br from-slate-900 to-slate-900/50 border-slate-800' : 'bg-gradient-to-br from-slate-50 to-white border-slate-200';

  return (
    <div className="space-y-16">
      <section className="text-center">
        <p className={`text-xs font-bold uppercase tracking-wider mb-4 ${textDim}`}>As seen in</p>
        <div className={`flex flex-wrap items-center justify-center gap-8 grayscale opacity-80 ${textDim}`}>
          {asSeenIn.map((m) => (
            <span key={m.slug} className="text-sm font-medium">{m.name}</span>
          ))}
        </div>
      </section>
      <section>
        <h2 className={`text-2xl font-bold mb-8 text-center ${textPrimary}`}>Trusted by people like you</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t) => (
            <div key={t.id} className={`p-6 border rounded-2xl flex flex-col ${cardBg}`}>
              <Quote className="w-8 h-8 text-emerald-500/50 mb-4" />
              <p className={`flex-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>&ldquo;{t.quote}&rdquo;</p>
              <div className={`mt-4 pt-4 border-t flex items-center justify-between ${borderT}`}>
                <div>
                  <p className={`font-semibold ${textPrimary}`}>{t.name}</p>
                  <p className={`text-sm ${textDim}`}>{t.role}</p>
                </div>
                {t.outcome && (
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-500">
                    <CheckCircle className="w-4 h-4" /> {t.outcome}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className={`border-t pt-16 ${borderT}`}>
        <h2 className={`text-2xl font-bold mb-8 text-center ${textPrimary}`}>Real outcomes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {caseStudies.map((c) => (
            <div key={c.id} className={`p-6 border rounded-2xl ${caseBg}`}>
              <p className="text-2xl font-bold text-emerald-500 mb-1">{c.amountSaved}</p>
              <h3 className={`text-lg font-bold mb-2 ${textPrimary}`}>{c.title}</h3>
              <p className={`text-sm ${textMuted}`}>{c.summary}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
