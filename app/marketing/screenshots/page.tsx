import type { Metadata } from 'next';
import { MarketingScreenshotPanels } from '@/components/marketing/MarketingScreenshotPanels';

export const metadata: Metadata = {
  title: 'Marketing screenshots — ScamShield',
  description: 'Canonical UI frames for press, social, and decks. Not indexed.',
  robots: { index: false, follow: false },
};

export default function MarketingScreenshotsPage() {
  return <MarketingScreenshotPanels />;
}
