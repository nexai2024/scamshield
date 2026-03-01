import React from 'react';
import { Check, X, AlertCircle, Info } from 'lucide-react';
import type { ToastItem, ToastType } from '../../context/ToastContext';
import { useToast } from '../../context/ToastContext';

const typeStyles: Record<ToastType, string> = {
  success: 'bg-emerald-500/90 text-white border-emerald-400/50',
  error: 'bg-red-500/90 text-white border-red-400/50',
  info: 'bg-slate-700/95 text-white border-slate-500/50',
};

const icons: Record<ToastType, React.ReactNode> = {
  success: <Check className="w-4 h-4" />,
  error: <AlertCircle className="w-4 h-4" />,
  info: <Info className="w-4 h-4" />,
};

function ToastItemComponent({ toast }: { toast: ToastItem }) {
  const { dismissToast } = useToast();
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg ${typeStyles[toast.type]} animate-in fade-in slide-in-from-top-2 duration-300`}
      role="alert"
    >
      {icons[toast.type]}
      <span className="text-sm font-medium flex-1">{toast.message}</span>
      <button
        type="button"
        onClick={() => dismissToast(toast.id)}
        className="p-1 rounded hover:bg-white/20 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts } = useToast();
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((t) => (
        <ToastItemComponent key={t.id} toast={t} />
      ))}
    </div>
  );
}
