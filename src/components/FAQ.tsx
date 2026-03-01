import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { FAQItem } from '../data/faq';

interface FAQProps {
  items: FAQItem[];
  isDark?: boolean;
  title?: string;
  className?: string;
}

export function FAQ({ items, isDark = true, title = 'Frequently asked questions', className = '' }: FAQProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  const borderClass = isDark ? 'border-slate-800' : 'border-slate-200';
  const textPrimary = isDark ? 'text-green-500' : 'text-slate-900';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-600';

  return (
    <section className={className}>
      <h2 className={`text-xl font-bold mb-6 ${textPrimary}`}>{title}</h2>
      <div className="space-y-2">
        {items.map((item) => {
          const isOpen = openId === item.id;
          return (
            <div
              key={item.id}
              className={`border rounded-xl overflow-hidden ${borderClass}`}
            >
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : item.id)}
                className={`w-full flex items-center justify-between gap-4 px-4 py-3 text-left font-medium transition-colors ${textPrimary} ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}
                aria-expanded={isOpen}
              >
                {item.question}
                <ChevronDown
                  className={`w-5 h-5 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {isOpen && (
                <div className={`px-4 pb-3 pt-0 ${textMuted} text-sm leading-relaxed`}>
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
