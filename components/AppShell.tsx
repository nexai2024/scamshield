'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs';
import { Settings } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { Sidebar } from '@/components/Sidebar';
import { Settings as SettingsModal } from '@/components/Settings';
import { SecurityBadges } from '@/components/SecurityBadges';
import { CONTENT_MAX_W } from '@/lib/constants';
import { getStoredTheme, setStoredTheme, applyTheme, getEffectiveTheme } from '@/lib/utils/theme';
import type { ThemeMode } from '@/lib/types';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isLoaded: userLoaded } = useUser();
  const [theme, setTheme] = useState<ThemeMode>(() =>
    typeof window === 'undefined' ? 'light' : getStoredTheme()
  );
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    setTheme(getStoredTheme());
  }, []);
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const isDark = getEffectiveTheme(theme) === 'dark';
  const navBorder = isDark ? 'border-slate-700/80 bg-slate-900/85' : 'border-sky-100/80 bg-white/90';
  const navLinkActive = isDark ? 'text-slate-50' : 'text-slate-900';
  const navLinkInactive = isDark ? 'text-slate-400 hover:text-slate-100' : 'text-slate-600 hover:text-slate-900';
  const navHoverBg = isDark ? 'hover:bg-slate-800/80' : 'hover:bg-sky-50';

  const handleThemeChange = (t: ThemeMode) => {
    setStoredTheme(t);
    setTheme(t);
  };

  const showSidebar = userLoaded && Boolean(user) && pathname !== '/';

  return (
    <div
      className={`min-h-screen font-sans selection:bg-teal-500/25 ${isDark ? 'bg-[#121a24] text-slate-200' : 'bg-[#f4f7fb] text-slate-800'}`}
    >
      <div className={`w-full ${CONTENT_MAX_W} mx-auto min-h-screen flex flex-col`}>
        <header className={`border-b backdrop-blur-md sticky top-0 z-50 ${navBorder}`}>
          <div className="px-4 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 rounded-lg hover:opacity-90 transition-opacity" aria-label="Go to home">
              <div className="bg-teal-600/10 p-2 rounded-lg border border-teal-600/15 dark:bg-teal-400/10 dark:border-teal-400/20">
                <Image src="/scamshield-logo-sm.png" alt="ScamShield" width={32} height={32} />
              </div>
              <span className={`text-xl font-bold tracking-tight ${navLinkActive}`}>
                Scam<span className="text-teal-600 dark:text-teal-400">Shield</span>
              </span>
            </Link>
            <nav className="flex items-center gap-4 sm:gap-6">
              <Link href="/dashboard" className={`text-sm font-medium transition-colors ${pathname === '/dashboard' ? navLinkActive : navLinkInactive}`}>Scanner</Link>
              <Link href="/history" className={`text-sm font-medium transition-colors ${pathname === '/history' ? navLinkActive : navLinkInactive}`}>History</Link>
              <Link href="/community" className={`text-sm font-medium transition-colors ${pathname === '/community' ? navLinkActive : navLinkInactive}`}>Community</Link>
              <Link href="/pricing" className={`text-sm font-medium transition-colors hidden sm:block ${pathname === '/pricing' ? navLinkActive : navLinkInactive}`}>Pricing</Link>
              <Tooltip label="Settings">
                <button type="button" onClick={() => setShowSettings(true)} className={`p-2 rounded-full transition-colors ${navLinkInactive} ${navHoverBg}`} aria-label="Settings">
                  <Settings className="w-4 h-4" />
                </button>
              </Tooltip>
              {userLoaded && (
                <>
                  {user ? (
                    <UserButton afterSignOutUrl="/" />
                  ) : (
                    <span className="flex items-center gap-2">
                      <SignInButton mode="modal">
                        <button className={`text-sm font-medium px-3 py-1.5 rounded-lg border transition-colors ${isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-sky-50'}`}>Sign in</button>
                      </SignInButton>
                      <SignUpButton mode="modal">
                        <button className="text-sm font-medium px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-sm shadow-teal-600/20 transition-colors">
                          Sign up
                        </button>
                      </SignUpButton>
                    </span>
                  )}
                </>
              )}
            </nav>
          </div>
        </header>
        {showSidebar && (
          <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen((o) => !o)} onSettings={() => setShowSettings(true)} isDark={isDark} />
        )}
        <main className={showSidebar ? 'flex-1 lg:pl-56' : 'flex-1'}>{children}</main>
        <footer className={`border-t py-8 mt-12 ${isDark ? 'border-slate-700/60 bg-slate-900/40' : 'border-sky-100/90 bg-white/70'}`}>
          <div className="px-4 text-center space-y-2">
            <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>© {new Date().getFullYear()} ScamShield AI. Not legal advice. For informational purposes only.</p>
            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>We do not store your pasted text or sell your data. Analysis is encrypted.</p>
            <SecurityBadges isDark={isDark} className="justify-center" />
          </div>
        </footer>
      </div>
      {showSettings && (
        <SettingsModal theme={theme} onThemeChange={handleThemeChange} onClose={() => setShowSettings(false)} isDark={isDark} />
      )}
    </div>
  );
}
