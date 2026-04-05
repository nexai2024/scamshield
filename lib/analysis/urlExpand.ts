/**
 * Resolve redirect chains for http(s) URLs with basic SSRF protections.
 */

const PRIVATE_IPV4_RE =
  /^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|0\.)/;

function hostnameLooksPrivate(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === 'localhost' || h.endsWith('.localhost') || h === '0.0.0.0') return true;
  if (h.startsWith('[')) return true; // IPv6 literal — skip
  if (PRIVATE_IPV4_RE.test(h)) return true;
  return false;
}

export function isPublicHttpUrlCandidate(raw: string): { ok: true; url: URL } | { ok: false; reason: string } {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return { ok: false, reason: 'invalid_url' };
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    return { ok: false, reason: 'unsupported_scheme' };
  }
  if (!u.hostname || hostnameLooksPrivate(u.hostname)) {
    return { ok: false, reason: 'blocked_host' };
  }
  return { ok: true, url: u };
}

const MAX_REDIRECTS = 8;
const FETCH_TIMEOUT_MS = 10_000;

/**
 * Follow redirects; returns final response URL (best effort).
 */
export async function expandUrlWithRedirects(initialUrl: string): Promise<{
  finalUrl: string;
  finalHostname: string;
  chain: string[];
  error?: string;
}> {
  const first = isPublicHttpUrlCandidate(initialUrl);
  if (!first.ok) {
    return { finalUrl: initialUrl, finalHostname: '', chain: [], error: first.reason };
  }

  const chain: string[] = [first.url.toString()];
  let current = first.url.toString();

  for (let i = 0; i < MAX_REDIRECTS; i++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(current, {
        method: 'HEAD',
        redirect: 'manual',
        signal: ctrl.signal,
        headers: { 'User-Agent': 'ScamShield-LinkExpand/1.0' },
      });
    } catch (e) {
      clearTimeout(t);
      const msg = e instanceof Error ? e.message : 'fetch_failed';
      return { finalUrl: current, finalHostname: safeHostname(current), chain, error: msg };
    }
    clearTimeout(t);

    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location');
      if (!loc) {
        return { finalUrl: current, finalHostname: safeHostname(current), chain, error: 'redirect_without_location' };
      }
      let next: string;
      try {
        next = new URL(loc, current).toString();
      } catch {
        return { finalUrl: current, finalHostname: safeHostname(current), chain, error: 'invalid_redirect' };
      }
      const check = isPublicHttpUrlCandidate(next);
      if (!check.ok) {
        return { finalUrl: current, finalHostname: safeHostname(current), chain, error: `blocked_redirect:${check.reason}` };
      }
      chain.push(next);
      current = next;
      continue;
    }

    // Some servers disallow HEAD — try GET once
    if (res.status === 405 || res.status === 501) {
      const ctrl2 = new AbortController();
      const t2 = setTimeout(() => ctrl2.abort(), FETCH_TIMEOUT_MS);
      let getRes: Response;
      try {
        getRes = await fetch(current, {
          method: 'GET',
          redirect: 'manual',
          signal: ctrl2.signal,
          headers: { 'User-Agent': 'ScamShield-LinkExpand/1.0', Range: 'bytes=0-0' },
        });
      } catch (e) {
        clearTimeout(t2);
        const msg = e instanceof Error ? e.message : 'get_failed';
        return { finalUrl: current, finalHostname: safeHostname(current), chain, error: msg };
      }
      clearTimeout(t2);
      if (getRes.status >= 300 && getRes.status < 400) {
        const loc = getRes.headers.get('location');
        if (!loc) {
          return { finalUrl: current, finalHostname: safeHostname(current), chain, error: 'redirect_without_location' };
        }
        let next: string;
        try {
          next = new URL(loc, current).toString();
        } catch {
          return { finalUrl: current, finalHostname: safeHostname(current), chain, error: 'invalid_redirect' };
        }
        const check = isPublicHttpUrlCandidate(next);
        if (!check.ok) {
          return { finalUrl: current, finalHostname: safeHostname(current), chain, error: `blocked_redirect:${check.reason}` };
        }
        chain.push(next);
        current = next;
        continue;
      }
      const u = new URL(getRes.url || current);
      return { finalUrl: u.toString(), finalHostname: u.hostname, chain };
    }

    const u = new URL(res.url || current);
    return { finalUrl: u.toString(), finalHostname: u.hostname, chain };
  }

  return { finalUrl: current, finalHostname: safeHostname(current), chain, error: 'too_many_redirects' };
}

function safeHostname(urlStr: string): string {
  try {
    return new URL(urlStr).hostname;
  } catch {
    return '';
  }
}
