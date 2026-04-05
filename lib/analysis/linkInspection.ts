import type { LinkInspection } from '@/lib/types';
import { extractEntities } from '@/lib/entities/extract';
import { expandUrlWithRedirects } from '@/lib/analysis/urlExpand';
import { lookalikeWarningForHost } from '@/lib/analysis/lookalikeDomains';
import { fetchRdapDomainMeta } from '@/lib/analysis/rdapLookup';

const MAX_URLS_TO_INSPECT = 6;

/**
 * Extract HTTP(S) URLs from text and return expansion + light domain intelligence.
 */
export async function inspectLinksInText(text: string): Promise<LinkInspection[]> {
  const urls = extractEntities(text).urls.slice(0, MAX_URLS_TO_INSPECT);
  const results: LinkInspection[] = [];

  for (const original_url of urls) {
    const row: LinkInspection = { original_url };
    const expanded = await expandUrlWithRedirects(original_url);
    if (expanded.error && expanded.chain.length <= 1) {
      row.expand_error = expanded.error;
    }
    row.expanded_url = expanded.finalUrl;
    row.final_hostname = expanded.finalHostname || undefined;
    const host = expanded.finalHostname;
    if (host) {
      row.lookalike_warning = lookalikeWarningForHost(host);
      const rdap = await fetchRdapDomainMeta(host);
      if (rdap.registration_date) row.domain_registration_date = rdap.registration_date;
      if (rdap.registrar) row.registrar = rdap.registrar;
      if (rdap.error && !rdap.registration_date && !rdap.registrar) {
        row.rdap_error = rdap.error;
      }
    }
    results.push(row);
  }

  return results;
}
