'use client';

import { useEffect } from 'react';

export default function GlobalError({
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
        scope: 'client:global-error',
        msg: 'root_layout_error',
        digest: error.digest,
        errName: error.name,
        errMessage: error.message,
      })
    );
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          background: '#0f172a',
          color: '#e2e8f0',
          padding: 24,
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <h1 style={{ fontSize: '1.25rem', marginBottom: 12 }}>Something went wrong</h1>
          <p style={{ opacity: 0.85, marginBottom: 24, lineHeight: 1.5 }}>
            Please refresh the page or try again in a moment.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              padding: '10px 20px',
              borderRadius: 12,
              border: 'none',
              background: '#10b981',
              color: '#04120c',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
