'use client';

import { X, Sun, Moon, Monitor } from 'lucide-react';
import type { ThemeMode } from '@/lib/types';
import { applyTheme } from '@/lib/utils/theme';
import { FAQ } from '@/components/FAQ';
import { faqItems } from '@/lib/data/faq';

interface SettingsProps {
  theme: ThemeMode;
  onThemeChange: (t: ThemeMode) => void;
  onClose: () => void;
  isDark: boolean;
}

const themeOptions: { value: ThemeMode; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
  { value: 'system', label: 'System', Icon: Monitor },
];

export function Settings({ theme, onThemeChange, onClose, isDark }: SettingsProps) {
  const handleTheme = (t: ThemeMode) => {
    onThemeChange(t);
    applyTheme(t);
  };
  const bg = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
  const text = isDark ? 'text-white' : 'text-slate-900';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-600';
  const border = isDark ? 'border-slate-800' : 'border-slate-200';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-800/30 backdrop-blur-sm dark:bg-slate-900/45">
      <div className={`w-full max-w-md rounded-2xl border p-6 shadow-xl ${bg} ${border}`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-xl font-bold ${text}`}>Settings</h2>
          <button onClick={onClose} className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`} aria-label="Close settings">
            <X className="w-5 h-5" />
          </button>
        </div>
        <section>
          <h3 className={`text-sm font-semibold ${textMuted} mb-3`}>Theme</h3>
          <div className="flex gap-3">
            {themeOptions.map(({ value, label, Icon }) => (
              <button
                key={value}
                onClick={() => handleTheme(value)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border transition-colors ${theme === value ? 'border-teal-600 bg-teal-600/10 text-teal-700 dark:text-teal-400' : isDark ? 'border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300' : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-800'}`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </section>
        <section className={`mt-6 pt-6 border-t ${border}`}>
          <FAQ items={faqItems} isDark={isDark} title="FAQ" />
        </section>
      </div>
    </div>
  );
}
