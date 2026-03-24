/**
 * Best-effort client IP for rate limiting behind proxies (Vercel, Cloudflare, etc.).
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp?.trim()) return realIp.trim();
  const cf = request.headers.get('cf-connecting-ip');
  if (cf?.trim()) return cf.trim();
  return 'unknown';
}
