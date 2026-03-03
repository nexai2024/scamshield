export interface ScamAlert {
  id: string;
  date: string;
  title: string;
  summary: string;
  region?: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface ScamTip {
  id: string;
  title: string;
  body: string;
}

export const scamAlerts: ScamAlert[] = [
  {
    id: '1',
    date: '2025-02-24',
    title: 'IRS / Tax impersonation texts on the rise',
    summary: 'Reports of fake IRS warrants and "verify your identity" SMS have spiked. The IRS never contacts by text or email for refunds.',
    region: 'US',
    severity: 'critical',
  },
  {
    id: '2',
    date: '2025-02-23',
    title: 'Romance scam pattern: "I\'m deployed overseas"',
    summary: 'Scammers are using military and overseas-worker personas to request gift cards and wire transfers. Never send money to someone you haven\'t met in person.',
    severity: 'warning',
  },
  {
    id: '3',
    date: '2025-02-22',
    title: 'Fake bank "suspicious activity" links',
    summary: 'Phishing emails and texts with "Click to verify" lead to fake login pages. Always open your bank\'s app or type the URL yourself.',
    severity: 'warning',
  },
  {
    id: '4',
    date: '2025-02-21',
    title: 'Zelle / Cash App "wrong number" ploy',
    summary: 'Strangers claim they sent money by mistake and ask you to "send it back." Once sent, the original payment may be reversed.',
    severity: 'warning',
  },
];

export const scamTips: ScamTip[] = [
  {
    id: 't1',
    title: 'Verify the sender independently',
    body: 'Use a known phone number or website (from a bill or card) to contact the company. Don\'t use links or numbers from the message.',
  },
  {
    id: 't2',
    title: 'Real agencies don\'t ask for gift cards',
    body: 'The IRS, police, and courts never request payment via gift cards, crypto, or wire. Any such request is a scam.',
  },
  {
    id: 't3',
    title: 'Slow down on "urgent" requests',
    body: 'Scammers create urgency so you skip checks. It\'s okay to pause and verify before sending money or clicking links.',
  },
];
