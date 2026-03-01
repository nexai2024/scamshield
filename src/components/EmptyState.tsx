import React from 'react';
import { History, FileSearch, Bell, Inbox } from 'lucide-react';

export type EmptyStateVariant = 'history' | 'results' | 'alerts' | 'generic';

interface EmptyStateProps {
  variant: EmptyStateVariant;
  title?: string;
  description?: string;
  isDark?: boolean;
  className?: string;
}

const config: Record<EmptyStateVariant, { icon: React.ElementType; title: string; description: string }> = {
  history: {
    icon: History,
    title: 'No scan history yet',
    description: 'Scans you run will appear here. Try analyzing a message from the Scanner.',
  },
  results: {
    icon: FileSearch,
    title: 'No results to show',
    description: 'Paste some text and tap Analyze to see your first result.',
  },
  alerts: {
    icon: Bell,
    title: 'No alerts right now',
    description: 'When we have new scam alerts, they’ll show up here.',
  },
  generic: {
    icon: Inbox,
    title: 'Nothing here',
    description: 'This list is empty.',
  },
};

export function EmptyState({
  variant,
  title,
  description,
  isDark = true,
  className = '',
}: EmptyStateProps) {
  const c = config[variant];
  const Icon = c.icon;
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-600';
  const iconBg = isDark ? 'bg-slate-800' : 'bg-slate-100';

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${iconBg}`}>
        <Icon className={`w-8 h-8 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
      </div>
      <h3 className={`text-lg font-semibold mb-1 ${textPrimary}`}>{title ?? c.title}</h3>
      <p className={`text-sm max-w-sm ${textMuted}`}>{description ?? c.description}</p>
    </div>
  );
}
