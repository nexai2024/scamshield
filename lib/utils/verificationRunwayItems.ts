import type { EntityRecognitionResult } from '@/lib/types';

export type VerificationItemKind = 'hint' | 'phone' | 'email' | 'business' | 'nonprofit' | 'static';

export interface VerificationRunwayItem {
  id: string;
  kind: VerificationItemKind;
  title: string;
  detail?: string;
  googleQuery?: string;
  href?: string;
  externalLabel?: string;
}

const FTC_URL = 'https://reportfraud.ftc.gov/#/';

function domainFromEmail(email: string): string | null {
  const at = email.lastIndexOf('@');
  if (at < 0 || at === email.length - 1) return null;
  return email.slice(at + 1).trim().toLowerCase();
}

function googleSearchUrl(query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

/**
 * Build ordered checklist rows for the verification runway from entities + hints + risk context.
 */
export function buildVerificationRunwayItems(
  entities: EntityRecognitionResult | undefined,
  riskScore: number
): VerificationRunwayItem[] {
  const items: VerificationRunwayItem[] = [];

  (entities?.names ?? []).forEach((name, i) => {
    const n = name.trim();
    if (!n) return;
    items.push({
      id: `name-${i}-${n.slice(0, 16)}`,
      kind: 'hint',
      title: 'Confirm who you are really talking to',
      detail: `Search whether “${n}” is tied to known scams or impersonation, and compare with official sources — not only what the message claims.`,
      googleQuery: `${n} scam OR impersonation`,
    });
  });

  (entities?.addresses ?? []).forEach((addr, i) => {
    const a = addr.trim();
    if (!a) return;
    items.push({
      id: `addr-${i}-${a.slice(0, 12)}`,
      kind: 'hint',
      title: 'Verify this address',
      detail: a,
      googleQuery: `${a} scam OR verify address`,
    });
  });

  (entities?.validation_hints ?? []).forEach((hint, i) => {
    const q = hint.trim();
    if (!q) return;
    items.push({
      id: `hint-${i}-${q.slice(0, 24)}`,
      kind: 'hint',
      title: 'Run an independent search',
      detail: q,
      googleQuery: q,
    });
  });

  (entities?.phones ?? []).forEach((phone, i) => {
    const p = phone.trim();
    if (!p) return;
    items.push({
      id: `phone-${i}-${p.slice(0, 16)}`,
      kind: 'phone',
      title: 'Verify this phone number outside the message',
      detail: `Do not use callback numbers from the thread. Look up “${p}” scam or spam reports, or call the organization from an official number you find yourself.`,
      googleQuery: `${p} scam OR spam`,
    });
  });

  (entities?.emails ?? []).forEach((email, i) => {
    const e = email.trim();
    if (!e) return;
    const domain = domainFromEmail(e);
    items.push({
      id: `email-${i}-${e.slice(0, 20)}`,
      kind: 'email',
      title: 'Check the sender domain',
      detail: domain
        ? `Confirm whether “${domain}” matches the real company’s domain. Scammers often use look-alike domains.`
        : `Confirm whether this address is expected: ${e}`,
      googleQuery: domain ? `${domain} official website` : `${e} scam`,
      href: domain ? `https://who.is/whois/${encodeURIComponent(domain)}` : undefined,
      externalLabel: domain ? 'WHOIS lookup' : undefined,
    });
  });

  (entities?.businesses ?? []).forEach((biz, i) => {
    const b = biz.trim();
    if (!b) return;
    items.push({
      id: `biz-${i}-${b.slice(0, 16)}`,
      kind: 'business',
      title: 'Confirm the business independently',
      detail: `Search for official contact info for “${b}” — not only what appears in the message.`,
      googleQuery: `${b} official contact`,
    });
  });

  (entities?.nonprofits ?? []).forEach((org, i) => {
    const o = org.trim();
    if (!o) return;
    items.push({
      id: `np-${i}-${o.slice(0, 16)}`,
      kind: 'nonprofit',
      title: 'Verify charity / nonprofit status',
      detail: `Use Charity Navigator, BBB Wise Giving, or your regulator’s registry for “${o}”.`,
      googleQuery: `${o} charity verify`,
    });
  });

  items.push({
    id: 'static-ftc',
    kind: 'static',
    title: 'Report fraud (US)',
    detail: 'If you believe you encountered a scam, the FTC collects reports to help law enforcement.',
    href: FTC_URL,
    externalLabel: 'ReportFraud.ftc.gov',
  });

  if (riskScore >= 40) {
    items.push({
      id: 'static-callback',
      kind: 'static',
      title: 'Never use “callback” contact details from the message',
      detail: 'Look up the bank, agency, or company using a number from your statement, card, or their official site — not links or numbers the sender gave you.',
    });
  }

  if (riskScore >= 60) {
    items.push({
      id: 'static-payment',
      kind: 'static',
      title: 'Pause before sending money or codes',
      detail: 'Gift cards, wire transfers, and crypto are common scam payment rails. If someone rushes you, stop and verify through a second channel.',
    });
  }

  return items;
}

export { googleSearchUrl };
