'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Scan, History, Settings, ChevronLeft, ChevronRight } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onSettings: () => void;
  isDark?: boolean;
}

export function Sidebar({ isOpen, onToggle, onSettings, isDark = true }: SidebarProps) {
  const pathname = usePathname();
  const bg = isDark ? 'bg-slate-900 border-slate-700/80' : 'bg-white border-sky-100';
  const linkActive = isDark ? 'bg-slate-800 text-teal-400' : 'bg-sky-50 text-teal-700';
  const linkInactive = isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-100' : 'text-slate-600 hover:bg-sky-50/80 hover:text-slate-900';
  const isDashboard = pathname === '/dashboard';
  const isHistory = pathname === '/history';
  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        className={`fixed left-0 top-20 z-30 p-2 rounded-r-lg border-b border-r transition-all ${isDark ? 'bg-slate-900 border-slate-600 text-slate-400' : 'bg-white border-sky-100 text-slate-500'}`}
        aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        {isOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
      </button>
      <aside className={`fixed left-0 top-16 z-20 h-[calc(100vh-4rem)] w-56 border-r transition-transform duration-200 lg:translate-x-0 ${bg} ${isOpen ? 'translate-x-0' : '-translate-x-full'}`} aria-label="Main navigation">
        <nav className="p-4 flex flex-col gap-1">
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-colors ${isDashboard ? linkActive : linkInactive}`}
          >
            <Scan className="w-5 h-5 shrink-0" />
            Scanner
          </Link>
          <Link
            href="/history"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-colors ${isHistory ? linkActive : linkInactive}`}
          >
            <History className="w-5 h-5 shrink-0" />
            History
          </Link>
          <div className={`mt-4 pt-4 border-t ${isDark ? 'border-slate-700' : 'border-sky-100'}`}>
            <button type="button" onClick={onSettings} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-colors w-full ${linkInactive}`}>
              <Settings className="w-5 h-5 shrink-0" />
              Settings
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
}
