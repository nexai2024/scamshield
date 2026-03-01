import { Lock, Database, ShieldCheck } from 'lucide-react';

interface SecurityBadgesProps {
  isDark?: boolean;
  variant?: 'inline' | 'stack';
  className?: string;
}

export function SecurityBadges({ isDark = true, variant = 'inline', className = '' }: SecurityBadgesProps) {
  const textClass = isDark ? 'text-slate-400' : 'text-slate-500';
  const items = [
    { icon: Lock, label: 'Encrypted' },
    { icon: Database, label: 'No data stored' },
    { icon: ShieldCheck, label: 'Secure analysis' },
  ];

  return (
    <div
      className={`flex gap-4 flex-wrap items-center ${variant === 'stack' ? 'flex-col items-start' : ''} ${className}`}
      role="group"
      aria-label="Security and privacy"
    >
      {items.map(({ icon: Icon, label }) => (
        <span
          key={label}
          className={`inline-flex items-center gap-2 text-xs font-medium ${textClass}`}
        >
          <Icon className="w-3.5 h-3.5 text-emerald-500" aria-hidden />
          {label}
        </span>
      ))}
    </div>
  );
}
