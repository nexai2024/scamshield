export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export const faqItems: FAQItem[] = [
  {
    id: 'what-is-risk-score',
    question: 'What is the risk score?',
    answer:
      'The risk score is a number from 0 to 100 that indicates how likely a message is to be a scam. Higher scores mean higher risk. We use AI to analyze language patterns, urgency, and common scam phrases to calculate this.',
  },
  {
    id: 'what-are-red-flags',
    question: 'What are red flags?',
    answer:
      'Red flags are specific reasons why a message was flagged as suspicious—for example, urgent requests for money, fake authority (IRS, bank), or classic scam phrases. We list them so you can see exactly what triggered the warning.',
  },
  {
    id: 'do-you-store-data',
    question: 'Do you store my pasted text?',
    answer:
      'We do not store your pasted content for marketing or resale. Analysis runs in real time and we may cache results temporarily to improve performance. Pro/Lifetime users can optionally save scan history locally in their browser.',
  },
  {
    id: 'how-accurate',
    question: 'How accurate is ScamShield?',
    answer:
      'Our AI is trained on known scam patterns and is very good at spotting common fraud. No tool is 100% accurate—always use your judgment and never share financial details or send money based solely on a message.',
  },
  {
    id: 'what-types',
    question: 'What types of scams can you detect?',
    answer:
      'We detect a wide range: phishing, romance scams, fake invoices, IRS/bank impersonation, tech support fraud, lottery/prize scams, and more. Paste any suspicious text or email and we’ll analyze it.',
  },
];
