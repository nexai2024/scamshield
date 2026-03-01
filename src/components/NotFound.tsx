import { ShieldAlert, Scan } from 'lucide-react';

interface NotFoundProps {
  onGoToScanner: () => void;
  isDark?: boolean;
}

export function NotFound({ onGoToScanner, isDark = true }: NotFoundProps) {
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-600';

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mb-6">
        <ShieldAlert className="w-10 h-10 text-amber-500" />
      </div>
      <h1 className={`text-3xl font-bold mb-2 ${textPrimary}`}>Page not found</h1>
      <p className={`max-w-md mb-8 ${textMuted}`}>
        This page doesn’t exist or has been moved. Head back to the scanner to analyze a message.
      </p>
      <button
        type="button"
        onClick={onGoToScanner}
        className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold rounded-xl transition-colors"
      >
        <Scan className="w-5 h-5" />
        Back to Scanner
      </button>
    </div>
  );
}
