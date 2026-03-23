/** Optional server env: Google Cloud Web Risk (Safe Browsing-style) lookup API key. */
const GOOGLE_WEB_RISK_BASE = 'https://webrisk.googleapis.com/v1/uris:search';

export type UrlThreatCheckPart = {
  provider: 'google_web_risk' | 'phishtank';
  /** Listed / matched a threat list */
  flagged: boolean;
  /** Extra context for UI (threat types, PhishTank detail link) */
  detail?: string;
  /** Lookup failed (network, auth); validation may continue without this signal */
  error?: string;
};

function threatTypesQueryParams(): string[] {
  return ['SOCIAL_ENGINEERING', 'MALWARE', 'UNWANTED_SOFTWARE'];
}

/**
 * GET v1/uris:search — returns a body with `threat` when the URI matches a list.
 * @see https://cloud.google.com/web-risk/docs/reference/rest/v1/uris/search
 */
export async function checkGoogleWebRisk(uri: string, apiKey: string): Promise<UrlThreatCheckPart> {
  const url = new URL(GOOGLE_WEB_RISK_BASE);
  url.searchParams.set('key', apiKey);
  url.searchParams.set('uri', uri);
  for (const t of threatTypesQueryParams()) {
    url.searchParams.append('threatTypes', t);
  }

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Network error';
    return { provider: 'google_web_risk', flagged: false, error: msg };
  }

  if (!res.ok) {
    return {
      provider: 'google_web_risk',
      flagged: false,
      error: `HTTP ${res.status}`,
    };
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    return { provider: 'google_web_risk', flagged: false, error: 'Invalid JSON response' };
  }

  const threat =
    data && typeof data === 'object' && 'threat' in data
      ? (data as { threat?: { threatTypes?: string[] } }).threat
      : undefined;
  const types = threat?.threatTypes;
  if (Array.isArray(types) && types.length > 0) {
    return {
      provider: 'google_web_risk',
      flagged: true,
      detail: types.join(', '),
    };
  }

  return { provider: 'google_web_risk', flagged: false, detail: 'No threat match' };
}

type PhishTankResults = {
  in_database?: boolean | string;
  verified?: string | boolean;
  phish_detail_page?: string;
  valid?: string;
};

function readPhishTankResults(data: unknown): PhishTankResults | null {
  if (!data || typeof data !== 'object') return null;
  const root = data as Record<string, unknown>;
  const results = root.results;
  if (Array.isArray(results) && results[0] && typeof results[0] === 'object') {
    return results[0] as PhishTankResults;
  }
  if (!results || typeof results !== 'object') return null;

  const r = results as Record<string, unknown>;
  if ('url0' in r && r.url0 && typeof r.url0 === 'object') {
    return r.url0 as PhishTankResults;
  }
  return results as PhishTankResults;
}

/**
 * POST checkurl — optional `PHISHTANK_APP_KEY` for higher rate limits.
 * @see https://phishtank.com/api_info.php
 */
export async function checkPhishTank(uri: string, appKey?: string): Promise<UrlThreatCheckPart> {
  const body = new URLSearchParams();
  body.set('url', uri);
  body.set('format', 'json');
  if (appKey) body.set('app_key', appKey);

  let res: Response;
  try {
    res = await fetch('https://checkurl.phishtank.com/checkurl/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
        'User-Agent': 'ScamShield/1.0 (url-threat-check)',
      },
      body: body.toString(),
      cache: 'no-store',
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Network error';
    return { provider: 'phishtank', flagged: false, error: msg };
  }

  if (!res.ok) {
    return {
      provider: 'phishtank',
      flagged: false,
      error: `HTTP ${res.status}`,
    };
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    return { provider: 'phishtank', flagged: false, error: 'Invalid JSON response' };
  }

  const row = readPhishTankResults(data);
  if (!row) {
    return { provider: 'phishtank', flagged: false, error: 'Unexpected response shape' };
  }

  const inDb = row.in_database === true || row.in_database === 'true';
  const verified =
    row.verified === 'y' ||
    row.verified === true ||
    row.verified === 'yes' ||
    row.valid === 'y' ||
    row.valid === 'true';

  const flagged = inDb && verified;
  const detailParts: string[] = [];
  if (inDb) detailParts.push('in PhishTank database');
  if (verified) detailParts.push('verified phish');
  if (row.phish_detail_page) detailParts.push(row.phish_detail_page);

  return {
    provider: 'phishtank',
    flagged,
    detail: detailParts.length ? detailParts.join('; ') : 'Not listed',
  };
}

export async function runOptionalUrlThreatChecks(uri: string): Promise<UrlThreatCheckPart[]> {
  const googleKey = process.env.GOOGLE_WEB_RISK_API_KEY?.trim();
  const phishKey = process.env.PHISHTANK_APP_KEY?.trim();

  const tasks: Promise<UrlThreatCheckPart>[] = [];

  if (googleKey) {
    tasks.push(checkGoogleWebRisk(uri, googleKey));
  }
  tasks.push(checkPhishTank(uri, phishKey || undefined));

  return Promise.all(tasks);
}

export function formatThreatSummary(parts: UrlThreatCheckPart[]): string {
  return parts
    .map((p) => {
      if (p.error) {
        return `${p.provider}: skipped (${p.error})`;
      }
      if (p.flagged) {
        return `${p.provider}: THREAT${p.detail ? ` (${p.detail})` : ''}`;
      }
      return `${p.provider}: clean${p.detail ? ` (${p.detail})` : ''}`;
    })
    .join(' · ');
}
