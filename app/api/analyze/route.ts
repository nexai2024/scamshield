import { NextResponse } from 'next/server';
import OpenAI from 'openai';

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

function normalizeResult(parsed: Record<string, unknown> | null) {
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

  const rawEntities = typeof parsed.entities === 'object' && parsed.entities !== null ? (parsed.entities as Record<string, unknown>) : {};

  return {
    risk_score: score,
    risk_level: level,
    scam_type: typeof parsed.scam_type === 'string' ? parsed.scam_type : 'N/A',
    red_flags: Array.isArray(parsed.red_flags)
      ? (parsed.red_flags as string[]).filter((f) => typeof f === 'string')
      : ['No obvious red flags detected.'],
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

const SYSTEM_PROMPT =
  'You are a scam and fraud detection expert. Analyze the user message for signs of fraud, phishing, romance scams, impersonation, or other scams. Respond with a single JSON object only, no other text. Use this exact structure: {"risk_score": <number 0-100>, "risk_level": "<Safe | Low Risk | Medium Risk | High Risk | Critical>", "scam_type": "<short label>", "red_flags": ["list of specific red flags"], "verdict_summary": "<2-4 sentence summary>", "advice": "<1-3 sentences: what to do next>", "why_risky": "<optional 2-4 sentences>", "triggered_phrases": ["exact phrases from message"], "entities": {"names": ["..."], "emails": ["..."], "phones": ["..."], "addresses": ["..."], "businesses": ["..."], "nonprofits": ["..."], "validation_hints": ["quick search query or phrase to verify each entity"]}}. Rules: risk_score 0-100; be specific in red_flags; if legitimate set risk_score low; include empty arrays if no values are found. For each extracted entity generate a brief validation hint that could be used in an internet search (Google/Bing). Output only valid JSON.';

export async function POST(request: Request) {
  const openai = process.env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

  if (!openai) {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY is not configured. Set it in .env.' },
      { status: 503 }
    );
  }

  let body: { text?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const text = body?.text;
  if (typeof text !== 'string' || !text.trim()) {
    return NextResponse.json(
      { error: 'Missing or invalid "text" in request body.' },
      { status: 400 }
    );
  }

  let userContent = text.trim().slice(0, 8000);
  if (text.length > 8000) userContent += '\n\n[Message was truncated for analysis.]';

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
      temperature: 0.2,
      max_tokens: 1024,
    });

    const content = completion.choices?.[0]?.message?.content ?? null;
    const parsed = parseJsonFromResponse(content);
    const result = normalizeResult(parsed);

    if (!result) {
      return NextResponse.json(
        { error: 'Could not parse analysis from the model. Please try again.' },
        { status: 502 }
      );
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string; code?: string };
    console.error('OpenAI API error:', err);
    const status = e?.status === 429 ? 429 : e?.status === 401 ? 401 : 502;
    return NextResponse.json(
      { error: e?.message || 'Analysis failed. Please try again.', code: e?.code },
      { status }
    );
  }
}
