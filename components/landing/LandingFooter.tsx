import Link from 'next/link';
import { Shield } from 'lucide-react';
import { APP_LINKS } from '@/lib/landing/constants';

const footerLinks = [
  { label: 'Free Scanner', href: APP_LINKS.dashboard },
  { label: 'Pricing', href: APP_LINKS.pricing },
  { label: 'Community', href: APP_LINKS.community },
] as const;

export function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="py-12 bg-card border-t border-border">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#1a56db]" />
              <span className="font-display text-lg font-bold tracking-tight text-foreground">
                Scam<span className="text-[#10b981]">Shield</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm">
              AI-powered fraud detection with explainable results. Not legal advice — for informational
              purposes only.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Footer">
            {footerLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="mt-8 text-xs text-muted-foreground text-center sm:text-left">
          © {year} ScamShield. We do not sell your data. Paste analysis is processed for your request only.
        </p>
        <p>
        <a href="https://plugyourbuild.com/listing/scamshield-c75884" rel="dofollow">
  <img src="https://plugyourbuild.com/api/badge/scamshield-c75884?style=transparent"
       alt="Listed on Plug Your Build" width="180" height="40" />
</a>
        </p>
      </div>
    </footer>
  );
}
