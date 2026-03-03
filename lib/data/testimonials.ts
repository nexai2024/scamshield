export interface Testimonial {
  id: string;
  name: string;
  role: string;
  quote: string;
  outcome?: string;
}

export interface CaseStudy {
  id: string;
  title: string;
  amountSaved: string;
  summary: string;
}

export const testimonials: Testimonial[] = [
  { id: '1', name: 'Maria K.', role: 'Small business owner', quote: 'A "client" wanted to pay with a check and have me wire the overpayment. ScamShield flagged it before I lost a cent.', outcome: 'Avoided $4,200 loss' },
  { id: '2', name: 'James T.', role: 'Retiree', quote: 'I got a text saying my Social Security was suspended. ScamShield told me it was a classic impersonation scam. So glad I checked.', outcome: 'Avoided identity theft risk' },
  { id: '3', name: 'Sarah L.', role: 'Parent', quote: 'My teen was about to send a Steam card to someone they met in a game. One scan and we both learned what to look for.', outcome: 'Protected family' },
];

export const caseStudies: CaseStudy[] = [
  { id: '1', title: 'Fake invoice caught before payment', amountSaved: '$12,500', summary: 'A construction company ran a vendor invoice through ScamShield. The urgent wire and slight domain typo were flagged. Finance verified and blocked the payment.' },
  { id: '2', title: 'Romance scam stopped early', amountSaved: 'Emotional and financial harm', summary: 'A user pasted messages from someone they met online who was stuck abroad and needed money. ScamShield high risk score helped them step back and report the profile.' },
];

export const asSeenIn = [
  { name: 'TechCrunch', slug: 'techcrunch' },
  { name: 'Wired', slug: 'wired' },
  { name: 'Consumer Reports', slug: 'consumer-reports' },
];
