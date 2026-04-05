import type { AnalysisResult } from '@/lib/types';
import { extractEntities } from '@/lib/entities/extract';
import { inspectLinksInText } from '@/lib/analysis/linkInspection';
import { detectPiiPaymentRequests } from '@/lib/analysis/piiDetection';

function clamp(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
}

function mergeUniqueStrings(a?: string[], b?: string[]): string[] | undefined {
  const set = new Set<string>();
  for (const x of a ?? []) {
    const v = x.trim();
    if (v) set.add(v);
  }
  for (const x of b ?? []) {
    const v = x.trim();
    if (v) set.add(v);
  }
  return set.size ? [...set] : undefined;
}

function mergePii(
  model: import('@/lib/types').PiiPaymentFinding[] | undefined,
  heur: import('@/lib/types').PiiPaymentFinding[]
): import('@/lib/types').PiiPaymentFinding[] | undefined {
  const seen = new Set<string>();
  const out: import('@/lib/types').PiiPaymentFinding[] = [];
  for (const item of [...(model ?? []), ...heur]) {
    const key = `${item.kind}|${item.summary}|${item.never_share}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out.length ? out : undefined;
}

/**
 * Attach URL list, async link inspections, and heuristic PII/payment flags.
 */
export async function enrichAnalysisWithForensics(
  combinedText: string,
  base: AnalysisResult
): Promise<AnalysisResult> {
  const extractedUrls = extractEntities(combinedText).urls;
  const entities = base.entities
    ? {
        ...base.entities,
        urls: mergeUniqueStrings(base.entities.urls, extractedUrls),
      }
    : undefined;

  const [link_inspections, heuristicPii] = await Promise.all([
    inspectLinksInText(combinedText),
    Promise.resolve(detectPiiPaymentRequests(combinedText)),
  ]);

  const pii_payment_findings = mergePii(base.pii_payment_findings, heuristicPii);

  const rb = base.risk_breakdown;
  const adjustedRb = rb
    ? {
        ...rb,
        link_safety: clamp(
          rb.link_safety +
            (link_inspections.some((l) => l.lookalike_warning) ? 12 : 0) +
            (link_inspections.some((l) => l.expand_error) ? 4 : 0)
        ),
        payment_risk: clamp(
          rb.payment_risk + (heuristicPii.some((p) => p.kind === 'gift_card' || p.kind === 'crypto_wallet') ? 10 : 0)
        ),
        identity_theft_risk: clamp(
          rb.identity_theft_risk +
            (heuristicPii.some((p) => p.kind === 'otp_verification_code' || p.kind === 'ssn') ? 15 : 0)
        ),
      }
    : undefined;

  return {
    ...base,
    entities,
    link_inspections: link_inspections.length ? link_inspections : base.link_inspections,
    pii_payment_findings,
    risk_breakdown: adjustedRb ?? base.risk_breakdown,
  };
}
