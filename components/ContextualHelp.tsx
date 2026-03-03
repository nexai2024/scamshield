'use client';

import { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

interface ContextualHelpProps {
  title: string;
  content: string;
  isDark?: boolean;
  className?: string;
}

export function ContextualHelp({ title, content, isDark = true, className = '' }: ContextualHelpProps) {
  const [open, setOpen] = useState(false);
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-600';
  const bg = isDark ? 'bg-slate-800' : 'bg-slate-100';

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={isDark ? 'p-1.5 rounded-full text-slate-400 hover:text-emerald-400 hover:bg-slate-800' : 'p-1.5 rounded-full text-slate-500 hover:text-emerald-600 hover:bg-slate-200'}
        aria-label={`Help: ${title}`}
      >
        <HelpCircle className="w-4 h-4" />
      </button>
      {open && (
        <div className={`absolute left-0 top-full mt-2 z-10 w-72 p-4 rounded-xl border shadow-lg ${bg} ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</span>
            <button type="button" onClick={() => setOpen(false)} className="p-1 rounded hover:bg-slate-700 text-slate-400" aria-label="Close">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className={`text-xs leading-relaxed ${textMuted}`}>{content}</p>
        </div>
      )}
    </div>
  );
}
