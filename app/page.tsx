import { LandingPage } from '@/components/landing/LandingPage';
import { LandingJsonLd } from '@/components/landing/LandingJsonLd';
import { landingMetadata } from '@/lib/landing/metadata';

export const metadata = landingMetadata;

export default function Home() {
  return (
    <>
      <LandingJsonLd />
      <LandingPage />
    </>
  );
}
