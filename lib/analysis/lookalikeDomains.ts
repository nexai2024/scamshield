/**
 * Heuristic lookalike / typosquat hints vs common institutional brands (best-effort).
 */

const BRAND_ALIASES: Record<string, string[]> = {
  paypal: ['paypal', 'paypak', 'paypai'],
  amazon: ['amazon', 'amaz0n', 'arnazon'],
  apple: ['apple', 'appie', 'applle', 'icloud'],
  microsoft: ['microsoft', 'outlook', 'live', 'msn', 'office365', 'azure'],
  google: ['google', 'gmail', 'googIe'], // capital i homoglyph listed for regex elsewhere
  chase: ['chase', 'jpmorgan', 'jpmorganchase'],
  bankofamerica: ['bankofamerica', 'bofa', 'bac'],
  wellsfargo: ['wellsfargo', 'wellsfarg0'],
  citi: ['citi', 'citibank', 'citicards'],
  usps: ['usps', 'postal'],
  ups: ['ups'],
  fedex: ['fedex'],
  netflix: ['netflix'],
  venmo: ['venmo'],
  zelle: ['zelle'],
  irs: ['irs', 'treasury'],
  coinbase: ['coinbase'],
  binance: ['binance'],
};

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

/** Extract registrable-ish name: strip leading www; use last two labels for common cases. */
export function registrableLabel(host: string): string {
  const h = host.toLowerCase().replace(/^www\./, '');
  const parts = h.split('.').filter(Boolean);
  if (parts.length >= 2) {
    // naive: second-level + TLD (good enough for many abuse cases)
    return parts.slice(-2).join('.');
  }
  return h;
}

export function lookalikeWarningForHost(hostname: string): string | undefined {
  if (!hostname) return undefined;
  const reg = registrableLabel(hostname);
  const base = reg.replace(/\.[a-z]{2,24}$/i, '').replace(/\.co$/i, ''); // "foo" from foo.com
  const leaf = reg.includes('.') ? reg.split('.')[0] : reg;

  for (const [, variants] of Object.entries(BRAND_ALIASES)) {
    for (const brand of variants) {
      if (leaf === brand && !reg.endsWith('.com') && reg.includes('.')) {
        return `Domain “${hostname}” resembles “${brand}” but uses an unusual TLD/registrar pattern — verify on the official site.`;
      }
      const distLeaf = levenshtein(leaf, brand);
      if (leaf.length >= 4 && distLeaf === 1 && leaf !== brand) {
        return `Possible lookalike: “${hostname}” is one character off from a common “${brand}” domain — confirm the exact spelling on an independent search.`;
      }
      const distReg = levenshtein(reg, `${brand}.com`);
      if (reg !== `${brand}.com` && reg.length >= 6 && distReg <= 2 && reg.includes(brand.slice(0, Math.min(4, brand.length)))) {
        return `Possible typosquat: “${reg}” is very similar to typical “${brand}” domains — do not log in or pay through this link without verifying.`;
      }
    }
  }
  return undefined;
}
