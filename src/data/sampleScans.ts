export interface SampleScan {
  id: string;
  label: string;
  text: string;
}

export const sampleScans: SampleScan[] = [
  {
    id: 'zelle',
    label: 'Fake Zelle payment',
    text: 'Kindly send the $200 refundable insurance fee via Zelle immediately to secure your order.',
  },
  {
    id: 'irs',
    label: 'IRS threat',
    text: 'IRS Alert: A warrant has been issued for your arrest. Call this number immediately to resolve this matter and avoid legal action.',
  },
  {
    id: 'mover',
    label: 'Marketplace mover scam',
    text: 'I am currently deployed overseas but I will send a mover to pick up the item. I will pay you in advance via certified check.',
  },
  {
    id: 'romance',
    label: 'Romance / emergency',
    text: 'I need your help urgently. I am stuck abroad and need $500 for a flight. I will pay you back as soon as I get home. You are the only one I can trust.',
  },
];
