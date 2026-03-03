import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { ToastProvider } from '@/context/ToastContext';
import { TourProvider } from '@/context/TourContext';
import { ToastContainer } from '@/components/ui/Toast';
import { TourOverlay } from '@/components/TourOverlay';
import { AppShell } from '@/components/AppShell';
import './globals.css';

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
            <body className="antialiased min-h-screen bg-slate-950 text-slate-100">
              <AppShell>{children}</AppShell>
              <ToastContainer />
              <TourOverlay />
            </body>
          </html>
        </TourProvider>
      </ToastProvider>
    </ClerkProvider>
  );
}
