interface DataPolicyProps {
  isDark?: boolean;
  compact?: boolean;
  className?: string;
}

const POLICY_TEXT = `We analyze the text you paste only to run our scam-detection model. We do not store your pasted content, emails, or personal data for marketing or resale. Scan results may be cached temporarily to improve performance. Pro/Lifetime users can optionally save scan history locally in their browser. We use encryption in transit (HTTPS) and follow industry best practices for security.`;

export function DataPolicy({ isDark = true, compact = false, className = '' }: DataPolicyProps) {
  const textClass = isDark ? 'text-slate-400' : 'text-slate-600';

  if (compact) {
    return (
      <p className={`text-xs ${textClass} ${className}`}>
        We don’t store your pasted text or sell your data. Analysis is encrypted.{' '}
        <a href="#data-policy" className="text-emerald-500 hover:underline">
          Full policy
        </a>
      </p>
    );
  }

  return (
    <section id="data-policy" className={className}>
      <h3 className={`text-sm font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
        What we do with your data
      </h3>
      <p className={`text-sm leading-relaxed ${textClass}`}>{POLICY_TEXT}</p>
    </section>
  );
}
