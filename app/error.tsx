'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(
      JSON.stringify({
        ts: new Date().toISOString(),
        level: 'error',
        scope: 'client:error-boundary',
        msg: 'route_error',
        digest: error.digest,
        errName: error.name,
        errMessage: error.message,
      })
    );
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center max-w-lg mx-auto py-16">
      <div className="w-16 h-16 rounded-full bg-amber-500/15 flex items-center justify-center mb-6">
        <AlertTriangle className="w-8 h-8 text-amber-500" aria-hidden />
      </div>
      <h1 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">Something went wrong</h1>
      <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
        This page hit an unexpected problem. Your data is safe. Try again, or return to the scanner.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors"
        >
          <RefreshCw className="w-4 h-4" aria-hidden />
          Try again
        </button>
        <Link
          href="/dashboard"
          className="inline-flex items-center px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 font-medium hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
        >
          Back to scanner
        </Link>
      </div>
      {process.env.NODE_ENV === 'development' && error.digest ? (
        <p className="mt-8 text-xs text-slate-500 font-mono break-all">Digest: {error.digest}</p>
      ) : null}
    </div>
  );
}
