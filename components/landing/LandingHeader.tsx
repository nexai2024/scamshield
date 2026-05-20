'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { Shield, Menu, X } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { ScanCtaLink } from '@/components/landing/ScanCtaLink';
import { APP_LINKS, LANDING_ANCHOR_LINKS, LANDING_SECTION_IDS } from '@/lib/landing/constants';
import { scrollToLandingSection } from '@/lib/landing/scroll';

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const anchorClick = (href: string, closeMobile = false) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (closeMobile) setMobileOpen(false);
    scrollToLandingSection(href);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/90 dark:bg-gray-950/90 backdrop-blur-lg shadow-md' : 'bg-transparent'
      }`}
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <a
          href="#"
          className="flex items-center gap-2 group"
          onClick={(e) => {
            e.preventDefault();
            scrollToLandingSection('#');
          }}
        >
          <Shield className="w-7 h-7 text-[#1a56db]" />
          <span className="font-display text-xl font-bold tracking-tight text-foreground">
            Scam<span className="text-[#10b981]">Shield</span>
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-1">
          {LANDING_ANCHOR_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={anchorClick(l.href)}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50"
            >
              {l.label}
            </a>
          ))}
          <Link
            href={APP_LINKS.pricing}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50"
          >
            Pricing
          </Link>
          <SignedOut>
            <SignInButton mode="modal">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50"
              >
                Sign in
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <ScanCtaLink className="ml-2 h-9 px-4 rounded-lg text-sm bg-[#10b981] hover:bg-[#059669] text-white shadow-sm">
            Try Free Scan
          </ScanCtaLink>
          <a
            href={`#${LANDING_SECTION_IDS.signup}`}
            onClick={anchorClick(`#${LANDING_SECTION_IDS.signup}`)}
            className="ml-2 inline-flex items-center justify-center h-9 px-4 rounded-lg text-sm font-medium border border-input bg-background/80 hover:bg-muted/50 transition-colors"
          >
            Get Updates
          </a>
          <ThemeToggle />
        </nav>

        <div className="flex md:hidden items-center gap-1">
          <ThemeToggle />
          <button
            type="button"
            className="p-2 rounded-lg hover:bg-muted/50"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white/95 dark:bg-gray-950/95 backdrop-blur-lg border-t border-border"
          >
            <div className="px-4 py-4 flex flex-col gap-2">
              {LANDING_ANCHOR_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={anchorClick(l.href, true)}
                  className="px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 rounded-lg text-left"
                >
                  {l.label}
                </a>
              ))}
              <Link
                href={APP_LINKS.pricing}
                className="px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 rounded-lg"
                onClick={() => setMobileOpen(false)}
              >
                Pricing
              </Link>
              <ScanCtaLink
                className="mt-2 w-full h-10 rounded-lg text-sm bg-[#10b981] hover:bg-[#059669] text-white"
                onClick={() => setMobileOpen(false)}
              >
                Try Free Scan
              </ScanCtaLink>
              <a
                href={`#${LANDING_SECTION_IDS.signup}`}
                onClick={anchorClick(`#${LANDING_SECTION_IDS.signup}`, true)}
                className="w-full inline-flex items-center justify-center h-10 rounded-lg text-sm font-medium bg-[#1a56db] hover:bg-[#1544b5] text-white transition-colors"
              >
                Get Updates
              </a>
              <SignedOut>
                <SignInButton mode="modal">
                  <button
                    type="button"
                    className="w-full px-4 py-3 text-sm font-medium text-foreground border border-input rounded-lg hover:bg-muted/50"
                  >
                    Sign in
                  </button>
                </SignInButton>
              </SignedOut>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
