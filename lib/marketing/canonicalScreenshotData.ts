import type { AnalysisResult } from '@/lib/types';

/** Frozen demo copy for canonical marketing screenshots — do not tie to live user data. */
export const CANONICAL_DEMO_SOURCE_TEXT = `URGENT: Your account will be suspended within 24 hours unless you verify your identity.

Please click the link below and confirm your Social Security Number and debit card PIN for our security team.

This is your final notice. Failure to respond may result in legal action.

— Account Security Dept`;

export const CANONICAL_DEMO_RESULT: AnalysisResult = {
  risk_score: 78,
  risk_level: 'High Risk',
  scam_type: 'Phishing / account takeover pressure',
  red_flags: [
    'Artificial urgency (24 hours) to bypass careful thinking.',
    'Requests highly sensitive data (SSN, PIN) via unsolicited message — legitimate banks never do this.',
    'Threat of account suspension and vague “legal action” — classic fear tactics.',
    'Generic “Account Security Dept” without a verifiable institution name or known channel.',
  ],
  verdict_summary:
    'This message shows strong signs of a phishing or account-takeover scam. It combines urgency, threats, and a request for secrets that real financial institutions handle only through verified, official channels.',
  advice:
    'Do not click links, call numbers from the message, or share SSN or PIN. Log in only via your app or the URL you type yourself, or call the number on your card.',
  why_risky:
    'Scammers impersonate banks and services to harvest credentials. The combination of deadline pressure and sensitive data requests is a high-confidence scam pattern.',
  triggered_phrases: [
    'URGENT: Your account will be suspended within 24 hours unless you verify your identity.',
    'Social Security Number and debit card PIN',
    'This is your final notice. Failure to respond may result in legal action.',
  ],
  phrase_attributions: [
    { phrase: 'URGENT: Your account will be suspended within 24 hours unless you verify your identity.', linked_red_flag_indexes: [0] },
    { phrase: 'Please click the link below and confirm your Social Security Number and debit card PIN for our security team.', linked_red_flag_indexes: [1] },
    { phrase: 'This is your final notice. Failure to respond may result in legal action.', linked_red_flag_indexes: [2, 3] },
  ],
  entities: {
    names: [],
    emails: [],
    phones: [],
    addresses: [],
    businesses: ['Account Security Dept'],
    nonprofits: [],
    validation_hints: [
      'real bank identity verification process FTC phishing',
      'account suspension scam email verify legitimacy',
    ],
  },
};

/** Demo token shown in email-frame screenshot (not a live report). */
export const CANONICAL_DEMO_REPORT_PATH = '/report/demo-canonical-token';
