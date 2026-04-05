import type { OfficialContactEntry } from '@/lib/types';

/**
 * Curated pointers for user education only — always show disclaimers in UI.
 * Numbers/URLs change; user must verify on the live official site.
 */
export const OFFICIAL_CONTACTS: OfficialContactEntry[] = [
  {
    id: 'paypal',
    displayName: 'PayPal',
    primaryUrl: 'https://www.paypal.com/us/cshelp',
    supportPhone: '+1-888-221-1161',
    notes: 'Use contact options linked from paypal.com — ignore numbers in unexpected messages.',
  },
  {
    id: 'bank-of-america',
    displayName: 'Bank of America',
    primaryUrl: 'https://www.bankofamerica.com/contactus/',
    supportPhone: '+1-800-432-1000',
    notes: 'Call the number on your debit/credit card or statement when unknown senders request action.',
  },
  {
    id: 'chase',
    displayName: 'Chase',
    primaryUrl: 'https://www.chase.com/digital/customer-service',
    supportPhone: '+1-800-935-9935',
    notes: 'Use chase.com customer service links; do not trust numbers from suspicious texts.',
  },
  {
    id: 'wells-fargo',
    displayName: 'Wells Fargo',
    primaryUrl: 'https://www.wellsfargo.com/help/contact/',
    supportPhone: '+1-800-869-3557',
    notes: 'Verify against the number on your card before sharing account details.',
  },
  {
    id: 'usps',
    displayName: 'USPS',
    primaryUrl: 'https://www.usps.com/help/contact.htm',
    supportPhone: '+1-800-275-8777',
    notes: 'Tracking and delivery scams are common; open USPS only from usps.com in your browser.',
  },
  {
    id: 'irs',
    displayName: 'IRS (United States)',
    primaryUrl: 'https://www.irs.gov/help/telephone-assistance',
    supportPhone: '+1-800-829-1040',
    notes: 'The IRS does not demand immediate payment by gift card or wire via text — treat such messages as fraud.',
  },
  {
    id: 'ftc',
    displayName: 'FTC — ReportFraud',
    primaryUrl: 'https://reportfraud.ftc.gov/',
    notes: 'Use this to report scams (US). Not a bank support line.',
  },
];

export function searchOfficialContacts(query: string): OfficialContactEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return OFFICIAL_CONTACTS;
  return OFFICIAL_CONTACTS.filter(
    (e) =>
      e.displayName.toLowerCase().includes(q) ||
      e.id.replace(/-/g, ' ').includes(q) ||
      (e.notes?.toLowerCase().includes(q) ?? false)
  );
}
