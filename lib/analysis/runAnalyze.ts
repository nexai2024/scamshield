import OpenAI from 'openai';
import type {
  AnalysisResult,
  PiiPaymentFinding,
  PiiPaymentKind,
  RiskBreakdown,
  ScamPatternInfo,
} from '@/lib/types';
import { createLogger } from '@/lib/server/logger';
import { enrichAnalysisWithForensics } from '@/lib/analysis/enrichAnalysisResult';

const log = createLogger('analyze');

const RISK_LEVELS = ['Safe', 'Low Risk', 'Medium Risk', 'High Risk', 'Critical'] as const;

const PII_KINDS_SET = new Set<PiiPaymentKind>([
  'otp_verification_code',
  'ssn',
  'bank_account',
  'payment_card',
  'gift_card',
  'crypto_wallet',
  'wire_transfer_pressure',
  'other_sensitive',
]);

const DEFAULT_SAFE_REPLIES = [
  'I’ll verify this using the official number on my card or statement — not a callback number from this message.',
  'I can’t share verification codes or account details here. Please use my bank’s official app or website.',
  'I’ll look up your company on your official site and call the listed customer service line directly.',
];

function clampScore(n: number): number {
  const num = Number(n);
  if (Number.isNaN(num)) return 10;
  return Math.min(99, Math.max(0, Math.round(num)));
}

function clampBreakdown(n: number): number {
  const num = Number(n);
  if (Number.isNaN(num)) return 0;
  return Math.min(100, Math.max(0, Math.round(num)));
}

function parseJsonFromResponse(content: string | null): Record<string, unknown> | null {
  if (!content || typeof content !== 'string') return null;
  const trimmed = content.trim();
  const codeBlock = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = codeBlock ? codeBlock[1].trim() : trimmed;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function filterStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => typeof item === 'string');
}

function normalizePhraseAttributions(
  value: unknown,
  redFlagsLength: number
): { phrase: string; linked_red_flag_indexes: number[] }[] | undefined {
  if (!Array.isArray(value) || redFlagsLength === 0) return undefined;
  const out: { phrase: string; linked_red_flag_indexes: number[] }[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const rec = item as Record<string, unknown>;
    const phrase = rec.phrase;
    const idxRaw = rec.linked_red_flag_indexes;
    if (typeof phrase !== 'string' || !phrase.trim()) continue;
    if (!Array.isArray(idxRaw)) continue;
    const linked_red_flag_indexes = [
      ...new Set(
        idxRaw
          .map((n) => (typeof n === 'number' ? Math.trunc(n) : NaN))
          .filter((n) => Number.isInteger(n) && n >= 0 && n < redFlagsLength)
      ),
    ];
    if (linked_red_flag_indexes.length === 0) continue;
    out.push({ phrase: phrase.trim(), linked_red_flag_indexes });
  }
  return out.length > 0 ? out : undefined;
}

function normalizePiiFindings(value: unknown): PiiPaymentFinding[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const out: PiiPaymentFinding[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const rec = item as Record<string, unknown>;
    const kind = rec.kind;
    if (typeof kind !== 'string' || !PII_KINDS_SET.has(kind as PiiPaymentKind)) continue;
    const summary = rec.summary;
    const never_share = rec.never_share;
    if (typeof summary !== 'string' || !summary.trim()) continue;
    if (typeof never_share !== 'string' || !never_share.trim()) continue;
    const excerpt = typeof rec.excerpt === 'string' ? rec.excerpt : undefined;
    out.push({
      kind: kind as PiiPaymentKind,
      summary: summary.trim(),
      never_share: never_share.trim(),
      excerpt: excerpt?.trim() || undefined,
    });
  }
  return out.length ? out : undefined;
}

function normalizeScamPattern(value: unknown, score: number, scamType: string): ScamPatternInfo | undefined {
  if (!value || typeof value !== 'object') {
    return {
      label: `Likely: ${scamType}`,
      confidence: Math.min(95, score),
      typical_next_steps:
        'Common next steps include urgency, requests for gift cards or crypto, phishing links, or asking for one-time codes. Verify using an official channel before acting.',
    };
  }
  const rec = value as Record<string, unknown>;
  const label = typeof rec.label === 'string' && rec.label.trim() ? rec.label.trim() : `Likely: ${scamType}`;
  const confidence = clampBreakdown(typeof rec.confidence === 'number' ? rec.confidence : score);
  const typical =
    typeof rec.typical_next_steps === 'string' && rec.typical_next_steps.trim()
      ? rec.typical_next_steps.trim()
      : 'Requests for payment, credentials, or codes; continued pressure via phone or text.';
  return { label, confidence, typical_next_steps: typical };
}

function normalizeRiskBreakdown(value: unknown, score: number): RiskBreakdown {
  if (!value || typeof value !== 'object') {
    return {
      sender_authenticity: clampBreakdown(Math.round(score * 0.85)),
      link_safety: clampBreakdown(Math.round(score * 0.88)),
      payment_risk: clampBreakdown(Math.round(score * 0.72)),
      identity_theft_risk: clampBreakdown(Math.round(score * 0.8)),
    };
  }
  const rec = value as Record<string, unknown>;
  return {
    sender_authenticity: clampBreakdown((rec.sender_authenticity as number) ?? score),
    link_safety: clampBreakdown((rec.link_safety as number) ?? score),
    payment_risk: clampBreakdown((rec.payment_risk as number) ?? score * 0.8),
    identity_theft_risk: clampBreakdown((rec.identity_theft_risk as number) ?? score),
  };
}

function normalizeResult(parsed: Record<string, unknown> | null): AnalysisResult | null {
  if (!parsed || typeof parsed !== 'object') return null;
  const score = clampScore((parsed.risk_score as number) ?? 0);
  let level = parsed.risk_level as string;
  if (!RISK_LEVELS.includes(level as (typeof RISK_LEVELS)[number])) {
    if (score >= 90) level = 'Critical';
    else if (score >= 75) level = 'High Risk';
    else if (score >= 50) level = 'Medium Risk';
    else if (score >= 20) level = 'Low Risk';
    else level = 'Safe';
  }

  const rawEntities =
    typeof parsed.entities === 'object' && parsed.entities !== null ? (parsed.entities as Record<string, unknown>) : {};

  const red_flags = Array.isArray(parsed.red_flags)
    ? (parsed.red_flags as string[]).filter((f) => typeof f === 'string')
    : ['No obvious red flags detected.'];

  const phrase_attributions = normalizePhraseAttributions(parsed.phrase_attributions, red_flags.length);
  const scam_type = typeof parsed.scam_type === 'string' ? parsed.scam_type : 'N/A';

  const ocrRaw = typeof parsed.ocr_text === 'string' ? parsed.ocr_text.trim() : '';
  const ocr_text = ocrRaw.length > 0 ? ocrRaw : undefined;

  const urlsField = filterStringArray(rawEntities.urls);

  return {
    risk_score: score,
    risk_level: level as AnalysisResult['risk_level'],
    scam_type,
    red_flags,
    verdict_summary:
      typeof parsed.verdict_summary === 'string'
        ? parsed.verdict_summary
        : 'Analysis complete. Review the red flags and recommended action.',
    advice:
      typeof parsed.advice === 'string'
        ? parsed.advice
        : 'Proceed with caution. Verify the sender through a known channel before sharing money or personal details.',
    why_risky: typeof parsed.why_risky === 'string' ? parsed.why_risky : undefined,
    triggered_phrases: Array.isArray(parsed.triggered_phrases)
      ? (parsed.triggered_phrases as string[]).filter((p) => typeof p === 'string')
      : undefined,
    phrase_attributions,
    entities: {
      names: filterStringArray(rawEntities.names),
      emails: filterStringArray(rawEntities.emails),
      phones: filterStringArray(rawEntities.phones),
      addresses: filterStringArray(rawEntities.addresses),
      businesses: filterStringArray(rawEntities.businesses),
      nonprofits: filterStringArray(rawEntities.nonprofits),
      validation_hints: filterStringArray(rawEntities.validation_hints),
      urls: urlsField.length ? urlsField : undefined,
    },
    ocr_text,
    scam_pattern: normalizeScamPattern(parsed.scam_pattern, score, scam_type),
    risk_breakdown: normalizeRiskBreakdown(parsed.risk_breakdown, score),
    safe_reply_suggestions: (() => {
      const arr = filterStringArray(parsed.safe_reply_suggestions).map((s) => s.trim()).filter(Boolean);
      return arr.length >= 2 ? arr : DEFAULT_SAFE_REPLIES;
    })(),
    pii_payment_findings: normalizePiiFindings(parsed.pii_payment_findings),
  };
}

export const ANALYZE_SYSTEM_PROMPT =
  'You are a scam and fraud detection expert. Analyze the user content (text and/or screenshot) for fraud, phishing, impersonation, and social engineering. Respond with a single JSON object only — no markdown, no prose. Required JSON shape: {"risk_score": <0-100 int>, "risk_level": "<Safe | Low Risk | Medium Risk | High Risk | Critical>", "scam_type": "<short label>", "red_flags": ["ordered list"], "verdict_summary": "<2-4 sentences>", "advice": "<1-3 sentences>", "why_risky": "<optional 2-4 sentences>", "triggered_phrases": ["exact substrings from the analyzed text"], "phrase_attributions": [{"phrase": "<exact substring>", "linked_red_flag_indexes": [0]}], "scam_pattern": {"label": "<e.g. delivery reschedule scam>", "confidence": <0-100>, "typical_next_steps": "<what attackers usually ask for next>"}, "risk_breakdown": {"sender_authenticity": <0-100>, "link_safety": <0-100>, "payment_risk": <0-100>, "identity_theft_risk": <0-100>}, "safe_reply_suggestions": ["3-6 short neutral replies that do not leak personal info"], "pii_payment_findings": [{"kind": "<otp_verification_code|ssn|bank_account|payment_card|gift_card|crypto_wallet|wire_transfer_pressure|other_sensitive>", "summary": "<what was requested or implied>", "excerpt": "<optional short cue>", "never_share": "<clear never-share guidance>"}], "ocr_text": "<when screenshot provided, full verbatim readable text; else empty string>", "entities": {"names": [], "emails": [], "phones": [], "addresses": [], "businesses": [], "nonprofits": [], "validation_hints": [], "urls": []}}. Rules: phrase linkages must reference valid red_flags indexes; if legitimate keep scores low; use empty arrays when nothing applies; ocr_text must be empty string for text-only input; include entity validation_hints for searches; safe_reply_suggestions should help users stall safely without confirming account ownership.';

async function completeOpenAIAnalysis(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  maxTokens: number
): Promise<AnalyzeOutcome> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { ok: false, code: 'no_api_key', message: 'OPENAI_API_KEY is not configured.' };
  }
  const openai = new OpenAI({ apiKey });
  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages,
      temperature: 0.2,
      max_tokens: maxTokens,
    });
    const content = completion.choices?.[0]?.message?.content ?? null;
    const parsed = parseJsonFromResponse(content);
    const result = normalizeResult(parsed);
    if (!result) {
      return { ok: false, code: 'parse_error', message: 'Could not parse analysis from the model.' };
    }
    return { ok: true, result };
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string; code?: string };
    log.error('openai_request_failed', {
      openaiStatus: e?.status,
      openaiCode: e?.code,
      openaiMessage: e?.message,
    });
    const httpStatus = e?.status === 429 ? 429 : e?.status === 401 ? 401 : undefined;
    return {
      ok: false,
      code: 'openai_error',
      message: e?.message || 'Analysis failed.',
      openaiCode: e?.code,
      httpStatus,
    };
  }
}

export type AnalyzeErrorCode = 'no_api_key' | 'parse_error' | 'openai_error';

export type AnalyzeOutcome =
  | { ok: true; result: AnalysisResult }
  | { ok: false; code: AnalyzeErrorCode; message: string; openaiCode?: string; httpStatus?: number };

/**
 * Run the same scam analysis as POST /api/analyze (OpenAI + JSON normalize).
 */
export async function runAnalyze(text: string): Promise<AnalyzeOutcome> {
  let userContent = text.trim().slice(0, 8000);
  if (text.length > 8000) userContent += '\n\n[Message was truncated for analysis.]';
  return completeOpenAIAnalysis(
    [
      { role: 'system', content: ANALYZE_SYSTEM_PROMPT },
      { role: 'user', content: userContent },
    ],
    2048
  );
}

/**
 * Analyze a screenshot (mobile-first) with optional user-provided context text.
 */
export async function runVisionAnalyze(
  imageBase64: string,
  mimeType: string,
  contextText: string
): Promise<AnalyzeOutcome> {
  const safeMime = mimeType.toLowerCase().includes('png')
    ? 'image/png'
    : mimeType.toLowerCase().includes('webp')
      ? 'image/webp'
      : mimeType.toLowerCase().includes('gif')
        ? 'image/gif'
        : 'image/jpeg';
  const ctx = contextText.trim().slice(0, 4000);
  const userPreamble = ctx
    ? `Additional typed context from the user (not necessarily visible in the image):\n${ctx}`
    : 'No additional typed context. Analyze the attached screenshot.';
  const url = `data:${safeMime};base64,${imageBase64}`;

  return completeOpenAIAnalysis(
    [
      { role: 'system', content: ANALYZE_SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          { type: 'text', text: `${userPreamble}\n\nReturn ocr_text with all legible text from the image, and align triggered_phrases with that OCR text when applicable.` },
          { type: 'image_url', image_url: { url } },
        ],
      },
    ],
    2500
  );
}

function buildCombinedForensicText(userText: string, result: AnalysisResult): string {
  const u = userText.trim();
  const o = (result.ocr_text || '').trim();
  if (u && o) return `${u}\n\n${o}`;
  return u || o;
}

/**
 * Text and/or screenshot → OpenAI analysis → link/domain inspection + heuristic PII merge.
 */
export async function runFullAnalyze(opts: {
  text: string;
  imageBase64?: string;
  imageMimeType?: string;
}): Promise<AnalyzeOutcome> {
  const text = opts.text ?? '';
  const hasImage = Boolean(opts.imageBase64 && opts.imageBase64.length > 64);
  let outcome: AnalyzeOutcome;
  if (hasImage) {
    outcome = await runVisionAnalyze(opts.imageBase64!, opts.imageMimeType || 'image/jpeg', text);
  } else if (text.trim()) {
    outcome = await runAnalyze(text);
  } else {
    return { ok: false, code: 'parse_error', message: 'No text or image provided for analysis.' };
  }
  if (!outcome.ok) return outcome;

  const combined = buildCombinedForensicText(text, outcome.result);
  const enriched = await enrichAnalysisWithForensics(combined || text || outcome.result.ocr_text || '', outcome.result);
  return { ok: true, result: enriched };
}
