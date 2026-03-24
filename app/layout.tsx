import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { ToastProvider } from '@/context/ToastContext';
import { TourProvider } from '@/context/TourContext';
import { ToastContainer } from '@/components/ui/Toast';
import { TourOverlay } from '@/components/TourOverlay';
import { AppShell } from '@/components/AppShell';
import './globals.css';
import { Analytics } from "@vercel/analytics/next"

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ScamShield – AI scam & fraud detection',
  description: 'Paste any message to get an instant risk score and clear next steps.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <ToastProvider>
        <TourProvider>
          <html lang="en" suppressHydrationWarning>
            <body
              className={`${plusJakarta.variable} font-sans antialiased min-h-screen bg-[#f4f7fb] text-slate-800 dark:bg-[#121a24] dark:text-slate-100`}
            >
              <AppShell>{children}</AppShell>
              <ToastContainer />
              <TourOverlay />
            </body>
          </html>
          <Analytics />
        </TourProvider>
      </ToastProvider>
    </ClerkProvider>
  );
}
