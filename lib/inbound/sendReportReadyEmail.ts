/**
 * Send “your report is ready” via Resend HTTP API (no extra npm package).
 */
export async function sendReportReadyEmail(params: {
  to: string;
  reportUrl: string;
  riskLevel: string;
  riskScore: number;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.INBOUND_REPLY_FROM?.trim();
  if (!apiKey) {
    return { ok: false, error: 'RESEND_API_KEY not configured' };
  }
  if (!from) {
    return { ok: false, error: 'INBOUND_REPLY_FROM not configured' };
  }

  const subject = `ScamShield: your email scan — ${params.riskLevel} (${params.riskScore})`;
  const text = [
    'Your forwarded message was analyzed by ScamShield.',
    '',
    `Risk: ${params.riskLevel} (score ${params.riskScore})`,
    '',
    `View the full report (link expires in about 7 days):`,
    params.reportUrl,
    '',
    'This link is private. Do not forward it to untrusted people.',
    '',
    '— ScamShield',
  ].join('\n');

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #0f172a; max-width: 560px;">
  <p>Your forwarded message was analyzed by <strong>ScamShield</strong>.</p>
  <p><strong>Risk:</strong> ${escapeHtml(params.riskLevel)} (score ${params.riskScore})</p>
  <p><a href="${escapeAttr(params.reportUrl)}" style="display: inline-block; padding: 12px 20px; background: #0d9488; color: #fff; text-decoration: none; border-radius: 10px; font-weight: 600;">Open full report</a></p>
  <p style="font-size: 14px; color: #64748b;">This link is private and expires in about 7 days. Do not share it with untrusted people.</p>
  <p style="font-size: 12px; color: #94a3b8;">— ScamShield · Not legal advice</p>
</body>
</html>`.trim();

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [params.to],
        subject,
        text,
        html,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    if (!res.ok) {
      return { ok: false, error: data?.message || `Resend HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Resend request failed' };
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
