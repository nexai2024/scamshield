'use client';

import { ChevronRight, Home, Scan, History, FileText } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: () => void;
  icon?: React.ReactNode;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  isDark?: boolean;
}

export function Breadcrumbs({ items, isDark = true }: BreadcrumbsProps) {
  const textLink = isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900';
  const textCurrent = isDark ? 'text-white' : 'text-slate-900';
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm flex-wrap">
      {items.map((item, i) => (
        <span key={i} className="contents">
          {i > 0 && <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />}
          {i === items.length - 1 ? (
            <span className={`font-medium flex items-center gap-1.5 ${textCurrent}`}>{item.icon}{item.label}</span>
          ) : item.href ? (
            <button type="button" onClick={item.href} className={`flex items-center gap-1.5 transition-colors ${textLink}`}>{item.icon}{item.label}</button>
          ) : (
            <span className={`flex items-center gap-1.5 ${textLink}`}>{item.icon}{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export const breadcrumbIcons = { Home, Scan, History, Result: FileText };
