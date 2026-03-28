import OpenAI from 'openai';
import type { CountryCode } from 'libphonenumber-js';
import { extractEntities } from '@/lib/entities/extract';
import { mergeExtractedEntities } from '@/lib/entities/merge';
import type { ExtractedEntities } from '@/lib/entities/types';
import {
  getOrCreateRequestId,
  jsonClientError,
  jsonInternalError,
  jsonOk,
  jsonUpstreamError,
  USER_SAFE,
} from '@/lib/server/api-response';
import { createLogger } from '@/lib/server/logger';
import { guardExtractEntitiesRateLimit } from '@/lib/rateLimit/guard';

const log = createLogger('api:extract-entities');

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
  return value.filter((item): item is string => typeof item === 'string');
}

const EMPTY: ExtractedEntities = {
  emails: [],
  phones: [],
  places: [],
  properNames: [],
  urls: [],
};

function nerJsonToExtracted(parsed: Record<string, unknown> | null): ExtractedEntities {
  if (!parsed) return { ...EMPTY };

  const properNamesField = filterStringArray(parsed.properNames);
  const namesField = filterStringArray(parsed.names);
  const properNames = properNamesField.length > 0 ? properNamesField : namesField;

  const placesMerged = mergeExtractedEntities(
    { ...EMPTY, places: filterStringArray(parsed.places) },
    { ...EMPTY, places: filterStringArray(parsed.addresses) }
  ).places;

  return {
    emails: filterStringArray(parsed.emails),
    phones: filterStringArray(parsed.phones),
    places: placesMerged,
    properNames,
    urls: filterStringArray(parsed.urls),
  };
}

const SYSTEM_PROMPT =
  'You extract structured entities from user text for fraud-review tooling. Reply with a single JSON object only, no markdown. ' +
  'Shape: {"emails":[],"phones":[],"places":[],"properNames":[],"urls":[]}. ' +
  'Rules: copy substrings from the text when possible; use international phone formats if clear; ' +
  'places are geographic locations (cities, regions, countries, street-level addresses); ' +
  'properNames are people or person-like signatures (not company names unless clearly a person); ' +
  'urls include http(s) links; also include bare www.example.com as urls with that exact spelling from text; ' +
  'omit fields that would be empty; use empty arrays when nothing found. Output only valid JSON.';

export async function POST(request: Request) {
  const requestId = getOrCreateRequestId(request);

  try {
    const limited = await guardExtractEntitiesRateLimit(request);
    if (limited) {
      limited.headers.set('X-Request-Id', requestId);
      return limited;
    }

    const openai = process.env.OPENAI_API_KEY
      ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      : null;

    if (!openai) {
      log.error('misconfiguration', { requestId, code: 'no_openai_key' });
      return jsonClientError(
        requestId,
        'Entity extraction is not configured. Please try again later.',
        503,
        'service_unavailable'
      );
    }

    let body: { text?: string; mergeWithLocal?: boolean; defaultCountry?: string };
    try {
      body = await request.json();
    } catch {
      return jsonClientError(requestId, 'Invalid JSON body.', 400);
    }

    const text = body?.text;
    if (typeof text !== 'string' || !text.trim()) {
      return jsonClientError(requestId, 'Missing or invalid "text" in request body.', 400);
    }

    const mergeWithLocal = body.mergeWithLocal !== false;
    const defaultCountry =
      typeof body.defaultCountry === 'string' && body.defaultCountry.length === 2
        ? (body.defaultCountry.toUpperCase() as CountryCode)
        : 'US';

    let userContent = text.trim().slice(0, 12000);
    if (text.length > 12000) userContent += '\n\n[Text was truncated.]';

    try {
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userContent },
        ],
        temperature: 0.15,
        max_tokens: 800,
      });

      const content = completion.choices?.[0]?.message?.content ?? null;
      const parsed = parseJsonFromResponse(content);
      const nerOnly = nerJsonToExtracted(parsed);

      const localOnly = extractEntities(text, defaultCountry);
      const entities = mergeWithLocal ? mergeExtractedEntities(localOnly, nerOnly) : nerOnly;

      return jsonOk(requestId, {
        entities,
        source: mergeWithLocal ? 'openai+local' : 'openai',
      });
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string; code?: string };
      if (e?.status === 429) {
        return jsonUpstreamError(requestId, 'api:extract-entities', err, {
          status: 429,
          userMessage: 'Service is busy. Please wait and try again.',
          code: e?.code ?? 'rate_limited',
          provider: 'openai',
        });
      }
      if (e?.status === 401) {
        return jsonUpstreamError(requestId, 'api:extract-entities', err, {
          status: 503,
          userMessage: USER_SAFE.ENTITY_UNAVAIL,
          code: 'upstream_auth',
          provider: 'openai',
        });
      }
      return jsonUpstreamError(requestId, 'api:extract-entities', err, {
        status: 502,
        userMessage: USER_SAFE.ENTITY_UNAVAIL,
        code: e?.code,
        provider: 'openai',
      });
    }
  } catch (cause) {
    return jsonInternalError(requestId, 'api:extract-entities', cause);
  }
}
