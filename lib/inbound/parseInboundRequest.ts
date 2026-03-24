/**
 * Normalize forwarded / inbound email into plain text for analysis.
 */
export function stripHtmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Pull first email-like address from a From header. */
export function parseFromAddress(from: string | null | undefined): string | null {
  if (!from || typeof from !== 'string') return null;
  const m = from.match(/<([^>\s]+@[^>\s]+)>/);
  if (m) return m[1].toLowerCase();
  const bare = from.trim().match(/^([^\s]+@[^\s]+)$/);
  if (bare) return bare[1].toLowerCase();
  return null;
}

/**
 * SendGrid Inbound Parse: multipart/form-data fields include text, html, from, subject, etc.
 * @see https://docs.sendgrid.com/for-developers/parsing-email/setting-up-the-inbound-parse-webhook
 */
export async function parseSendGridInbound(request: Request): Promise<{
  from: string | null;
  text: string;
  subject: string | null;
} | null> {
  const ct = request.headers.get('content-type') || '';
  if (!ct.includes('multipart/form-data')) return null;
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return null;
  }
  const textField = formData.get('text');
  const htmlField = formData.get('html');
  const fromField = formData.get('from');
  const subjectField = formData.get('subject');

  const from = typeof fromField === 'string' ? fromField : null;
  const subject = typeof subjectField === 'string' ? subjectField : null;

  let text = '';
  if (typeof textField === 'string' && textField.trim()) {
    text = textField.trim();
  } else if (typeof htmlField === 'string' && htmlField.trim()) {
    text = stripHtmlToText(htmlField);
  }

  return { from, text, subject };
}

/**
 * Resend "email.received" style webhook (simplified): expects JSON body.
 * Adjust field paths if Resend changes schema — see Resend inbound docs.
 */
export function parseResendInboundJson(body: unknown): {
  from: string | null;
  text: string;
  subject: string | null;
} | null {
  if (!body || typeof body !== 'object') return null;
  const rec = body as Record<string, unknown>;
  const data = rec.data;
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  const email = d.email ?? d;
  if (!email || typeof email !== 'object') return null;
  const e = email as Record<string, unknown>;

  const from =
    typeof e.from === 'string'
      ? e.from
      : e.from && typeof e.from === 'object' && typeof (e.from as Record<string, unknown>).email === 'string'
        ? String((e.from as Record<string, unknown>).email)
        : null;

  const subject = typeof e.subject === 'string' ? e.subject : null;
  let text = '';
  if (typeof e.text === 'string' && e.text.trim()) text = e.text.trim();
  else if (typeof e.html === 'string' && e.html.trim()) text = stripHtmlToText(e.html);

  return { from, text, subject };
}

/** Local / manual test: POST JSON { "from", "text", "subject?" } */
export function parseDevJsonBody(body: unknown): {
  from: string | null;
  text: string;
  subject: string | null;
} | null {
  if (!body || typeof body !== 'object') return null;
  const rec = body as Record<string, unknown>;
  const text = typeof rec.text === 'string' ? rec.text : '';
  const from = typeof rec.from === 'string' ? rec.from : null;
  const subject = typeof rec.subject === 'string' ? rec.subject : null;
  if (!text.trim()) return null;
  return { from, text: text.trim(), subject };
}

export async function extractInboundEmailPayload(request: Request): Promise<{
  from: string | null;
  text: string;
  subject: string | null;
} | null> {
  const ct = request.headers.get('content-type') || '';

  if (ct.includes('multipart/form-data')) {
    return parseSendGridInbound(request);
  }

  if (ct.includes('application/json')) {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return null;
    }
    const dev = parseDevJsonBody(body);
    if (dev) return dev;
    return parseResendInboundJson(body);
  }

  return null;
}
