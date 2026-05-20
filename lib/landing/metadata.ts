import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://scamshield.ai';

export const landingMetadata: Metadata = {
  title: 'ScamShield – AI scam & fraud detection',
  description:
    'Paste suspicious messages or upload screenshots for instant AI fraud analysis with clear explanations and next steps. Free to try.',
  keywords: [
    'scam detection',
    'fraud analysis',
    'phishing',
    'senior fraud protection',
    'AI scam checker',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'ScamShield',
    title: 'ScamShield – AI scam & fraud detection',
    description:
      'Instant, explainable AI fraud detection for suspicious texts and screenshots.',
    images: [
      {
        url: `${siteUrl}/80210e30-accc-45b8-a1d9-bba6afd57870.png`,
        width: 1200,
        height: 630,
        alt: 'ScamShield protecting against digital fraud',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ScamShield – AI scam & fraud detection',
    description: 'Instant, explainable AI fraud detection for suspicious messages.',
    images: [`${siteUrl}/80210e30-accc-45b8-a1d9-bba6afd57870.png`],
  },
  robots: { index: true, follow: true },
};

export function getLandingJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'ScamShield',
    applicationCategory: 'SecurityApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    description: landingMetadata.description,
    url: siteUrl,
  };
}
