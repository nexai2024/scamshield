'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs';
import { ShieldCheck, Settings } from 'lucide-react';
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
  const [theme, setTheme] = useState<ThemeMode>('system');
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    setTheme(getStoredTheme());
  }, []);
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const isDark = getEffectiveTheme(theme) === 'dark';
  const navBorder = isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-white/80';
  const navLinkActive = isDark ? 'text-white' : 'text-slate-900';
  const navLinkInactive = isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900';
  const navHoverBg = isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100';

  const handleThemeChange = (t: ThemeMode) => {
    setStoredTheme(t);
    setTheme(t);
  };

  return (
    <div className={`min-h-screen font-sans selection:bg-emerald-500/30 ${isDark ? 'bg-slate-950 text-slate-200' : 'bg-slate-100 text-slate-800'}`}>
      <div className={`w-full ${CONTENT_MAX_W} mx-auto min-h-screen flex flex-col`}>
        <header className={`border-b backdrop-blur-md sticky top-0 z-50 ${navBorder}`}>
          <div className="px-4 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 rounded-lg hover:opacity-90 transition-opacity" aria-label="Go to home">
              <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                
                <Image src="/logo-scamshield.png" alt="ScamShield" width={32} height={32} />  
                
                

              </div>
              <span className={`text-xl font-bold tracking-tight ${navLinkActive}`}>Scam<span className="text-emerald-500">Shield</span></span>
            </Link>
            <nav className="flex items-center gap-4 sm:gap-6">
              <Link href="/dashboard" className={`text-sm font-medium transition-colors ${pathname === '/dashboard' ? navLinkActive : navLinkInactive}`}>Scanner</Link>
              <Link href="/history" className={`text-sm font-medium transition-colors ${pathname === '/history' ? navLinkActive : navLinkInactive}`}>History</Link>
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
                        <button className={`text-sm font-medium px-3 py-1.5 rounded-lg border transition-colors ${isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}`}>Sign in</button>
                      </SignInButton>
                      <SignUpButton mode="modal">
                        <button className="text-sm font-medium px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-900 transition-colors">Sign up</button>
                      </SignUpButton>
                    </span>
                  )}
                </>
              )}
            </nav>
          </div>
        </header>
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen((o) => !o)} onSettings={() => setShowSettings(true)} isDark={isDark} />
        <main className="flex-1 lg:pl-56">{children}</main>
        <footer className={`border-t py-8 mt-12 ${isDark ? 'border-slate-800 bg-slate-900/30' : 'border-slate-200 bg-slate-200/50'}`}>
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
