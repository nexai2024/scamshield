import OpenAI from 'openai';
import type { AnalysisResult } from '@/lib/types';
import { createLogger } from '@/lib/server/logger';

const log = createLogger('analyze');

const RISK_LEVELS = ['Safe', 'Low Risk', 'Medium Risk', 'High Risk', 'Critical'] as const;

function clampScore(n: number): number {
  const num = Number(n);
  if (Number.isNaN(num)) return 10;
  return Math.min(99, Math.max(0, Math.round(num)));
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

  return {
    risk_score: score,
    risk_level: level as AnalysisResult['risk_level'],
    scam_type: typeof parsed.scam_type === 'string' ? parsed.scam_type : 'N/A',
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
    },
  };
}

export const ANALYZE_SYSTEM_PROMPT =
  'You are a scam and fraud detection expert. Analyze the user message for signs of fraud, phishing, romance scams, impersonation, or other scams. Respond with a single JSON object only, no other text. Use this exact structure: {"risk_score": <number 0-100>, "risk_level": "<Safe | Low Risk | Medium Risk | High Risk | Critical>", "scam_type": "<short label>", "red_flags": ["list of specific red flags — order matters for indexing"], "verdict_summary": "<2-4 sentence summary>", "advice": "<1-3 sentences: what to do next>", "why_risky": "<optional 2-4 sentences>", "triggered_phrases": ["exact substrings copied verbatim from the user message that drove the risk score"], "phrase_attributions": [{"phrase": "<exact substring from message>", "linked_red_flag_indexes": [0, 1]}], "entities": {"names": ["..."], "emails": ["..."], "phones": ["..."], "addresses": ["..."], "businesses": ["..."], "nonprofits": ["..."], "validation_hints": ["quick search query or phrase to verify each entity"]}}. Rules: risk_score 0-100; be specific in red_flags; if legitimate set risk_score low; include empty arrays if no values are found. phrase_attributions must cover each triggered_phrase at least once with correct indexes into your red_flags array. For each extracted entity generate a brief validation hint that could be used in an internet search (Google/Bing). Output only valid JSON.';

export type AnalyzeErrorCode = 'no_api_key' | 'parse_error' | 'openai_error';

export type AnalyzeOutcome =
  | { ok: true; result: AnalysisResult }
  | { ok: false; code: AnalyzeErrorCode; message: string; openaiCode?: string; httpStatus?: number };

/**
 * Run the same scam analysis as POST /api/analyze (OpenAI + JSON normalize).
 */
export async function runAnalyze(text: string): Promise<AnalyzeOutcome> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { ok: false, code: 'no_api_key', message: 'OPENAI_API_KEY is not configured.' };
  }

  const openai = new OpenAI({ apiKey });
  let userContent = text.trim().slice(0, 8000);
  if (text.length > 8000) userContent += '\n\n[Message was truncated for analysis.]';

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: ANALYZE_SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
      temperature: 0.2,
      max_tokens: 1536,
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
    const httpStatus =
      e?.status === 429 ? 429 : e?.status === 401 ? 401 : undefined;
    return {
      ok: false,
      code: 'openai_error',
      message: e?.message || 'Analysis failed.',
      openaiCode: e?.code,
      httpStatus,
    };
  }
}
