import { getLandingJsonLd } from '@/lib/landing/metadata';

export function LandingJsonLd() {
  const jsonLd = getLandingJsonLd();
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
