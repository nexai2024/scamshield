export const LANDING_HEADER_OFFSET = 80;

export const LANDING_SECTION_IDS = {
  howItWorks: 'how-it-works',
  features: 'features',
  value: 'value',
  signup: 'signup',
} as const;

export const LANDING_ANCHOR_LINKS = [
  { label: 'How It Works', href: `#${LANDING_SECTION_IDS.howItWorks}` },
  { label: 'Features', href: `#${LANDING_SECTION_IDS.features}` },
  { label: 'Why ScamShield', href: `#${LANDING_SECTION_IDS.value}` },
] as const;

export const APP_LINKS = {
  dashboard: '/dashboard',
  pricing: '/pricing',
  history: '/history',
  community: '/community',
} as const;
