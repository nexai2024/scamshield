import type { PiiPaymentFinding } from '@/lib/types';

function pushUnique(out: PiiPaymentFinding[], item: PiiPaymentFinding) {
  const key = `${item.kind}:${item.summary}`;
  if (out.some((x) => `${x.kind}:${x.summary}` === key)) return;
  out.push(item);
}

/**
 * Rule-based detection for sensitive requests — complements LLM analysis.
 * Excerpts are truncated and partially redacted where possible.
 */

export function detectPiiPaymentRequests(text: string): PiiPaymentFinding[] {
  const t = text;
  const lower = t.toLowerCase();
  const out: PiiPaymentFinding[] = [];

  const otpRe =
    /\b(?:otp|one[-\s]?time|2fa|two[-\s]?factor|verification\s+code|security\s+code|authenticate\s+with\s+the\s+code|text\s+you\s+(?:a\s+)?code)\b/i;
  const askShareRe = /\b(?:send|share|give|provide|confirm|tell\s+(?:me|us)|reply\s+with)\b/i;
  if (otpRe.test(t) && askShareRe.test(t)) {
    pushUnique(out, {
      kind: 'otp_verification_code',
      summary: 'Message appears to ask for a one-time or verification code.',
      never_share:
        'Never share OTPs, 2FA codes, or app approval prompts with anyone — legitimate banks and services will not ask you to relay these.',
    });
  }

  if (/\bssn\b|social\s+security\s*(?:number)?/i.test(t)) {
    pushUnique(out, {
      kind: 'ssn',
      summary: 'References to Social Security numbers.',
      never_share: 'Never send your full SSN by text or email. If unsure, contact the agency using a number from an official statement.',
    });
  }

  const routing = /\b(?:routing|aba)\s*(?:number)?\s*[:#]?\s*\d{5,}/i.test(t);
  const accountHint = /\b(?:bank\s*account|checking|savings)\b.*\b(?:number|ending\s+in)\b/i.test(lower);
  if (routing || /\b\d{9}\b/.test(t) && accountHint) {
    pushUnique(out, {
      kind: 'bank_account',
      summary: 'Possible request or discussion of bank routing/account details.',
      never_share:
        'Never share full account or routing numbers with unknown contacts. Look up your bank independently and call the number on your card.',
    });
  }

  if (/\b(?:card\s*number|cvv|cvc|expiration\s*date)\b/i.test(t) && askShareRe.test(t)) {
    pushUnique(out, {
      kind: 'payment_card',
      summary: 'Possible request for payment card details.',
      never_share: 'Never share card numbers, CVV, or PINs in messaging apps or email.',
    });
  }

  if (/\b(?:gift\s*card|google\s*play|itunes|steam\s*wallet|vanilla\s*visa)\b/i.test(lower)) {
    pushUnique(out, {
      kind: 'gift_card',
      summary: 'Gift card payment language detected — common scam rail.',
      never_share:
        'Legitimate businesses rarely demand gift cards. Treat urgent gift-card payment requests as highly suspicious.',
    });
  }

  const btc = /\b(?:bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}\b/.test(t);
  const eth = /\b0x[a-fA-F0-9]{40}\b/.test(t);
  if (btc || eth) {
    pushUnique(out, {
      kind: 'crypto_wallet',
      summary: 'Cryptocurrency address detected in message.',
      excerpt: btc ? 'BTC-like address' : 'ETH-like address',
      never_share:
        'Crypto transfers are irreversible. Verify addresses out-of-band and beware pushy “investment” or “refund” instructions.',
    });
  }

  if (/\b(?:western\s+union|moneygram|wire\s+transfer|zelle\s+me|venmo\s+me)\b/i.test(lower) && /\burgent\b|\bimmediately\b|\btoday\b/i.test(lower)) {
    pushUnique(out, {
      kind: 'wire_transfer_pressure',
      summary: 'Urgent push toward wire-transfer style payments.',
      never_share:
        'Pause if someone pressures you to move money fast via wire, P2P, or crypto — verify through a second, trusted channel.',
    });
  }

  return out;
}
