import type { AnalysisResult, ScanHistoryEntry } from '../types';

const KEY = 'scamshield_scan_history';
const MAX_ENTRIES = 500;

function getStored(userEmail: string): ScanHistoryEntry[] {
  try {
    const raw = localStorage.getItem(`${KEY}_${userEmail}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ScanHistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setStored(userEmail: string, entries: ScanHistoryEntry[]) {
  try {
    localStorage.setItem(`${KEY}_${userEmail}`, JSON.stringify(entries.slice(-MAX_ENTRIES)));
  } catch {
    // ignore
  }
}

export function getScanHistory(userEmail: string): ScanHistoryEntry[] {
  return getStored(userEmail);
}

export function addScan(
  userEmail: string,
  snippet: string,
  fullResult: AnalysisResult
): ScanHistoryEntry {
  const entries = getStored(userEmail);
  const entry: ScanHistoryEntry = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    date: new Date().toISOString(),
    snippet: snippet.slice(0, 200),
    risk_score: fullResult.risk_score,
    risk_level: fullResult.risk_level,
    scam_type: fullResult.scam_type,
    fullResult,
  };
  entries.push(entry);
  setStored(userEmail, entries);
  return entry;
}

export function deleteScan(userEmail: string, id: string): void {
  const entries = getStored(userEmail).filter((e) => e.id !== id);
  setStored(userEmail, entries);
}

export function exportHistoryCSV(entries: ScanHistoryEntry[]): string {
  const header = 'Date,Risk Score,Risk Level,Scam Type,Snippet\n';
  const rows = entries.map(
    (e) =>
      `${e.date},${e.risk_score},${e.risk_level},${e.scam_type.replace(/,/g, ';')},"${e.snippet.replace(/"/g, '""')}"`
  );
  return header + rows.join('\n');
}

export function downloadReportPDF(entry: ScanHistoryEntry): void {
  const r = entry.fullResult;
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>ScamShield Report - ${entry.date.slice(0, 10)}</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 24px; max-width: 640px; margin: 0 auto; color: #1e293b; }
    h1 { color: #0f172a; }
    .score { font-size: 2rem; font-weight: bold; margin: 8px 0; }
    .level { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-weight: bold; margin-bottom: 16px; }
    .red { background: #fef2f2; color: #b91c1c; }
    .amber { background: #fffbeb; color: #b45309; }
    .green { background: #f0fdf4; color: #15803d; }
    section { margin: 20px 0; }
    ul { padding-left: 20px; }
    .footer { margin-top: 32px; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <h1>ScamShield Analysis Report</h1>
  <p>Generated: ${new Date(entry.date).toLocaleString()}</p>
  <div class="score">Risk Score: ${r.risk_score}</div>
  <div class="level ${r.risk_score > 75 ? 'red' : r.risk_score > 40 ? 'amber' : 'green'}">${r.risk_level}</div>
  <section>
    <h2>Summary</h2>
    <p>${r.verdict_summary}</p>
  </section>
  <section>
    <h2>Red Flags</h2>
    <ul>${r.red_flags.map((f) => `<li>${f}</li>`).join('')}</ul>
  </section>
  ${r.why_risky ? `<section><h2>Why This Is Risky</h2><p>${r.why_risky}</p></section>` : ''}
  ${r.triggered_phrases?.length ? `<section><h2>Triggered Phrases</h2><ul>${r.triggered_phrases.map((p) => `<li>${p}</li>`).join('')}</ul></section>` : ''}
  <section>
    <h2>Recommended Action</h2>
    <p>${r.advice}</p>
  </section>
  <div class="footer">This report is for informational purposes only. Not legal advice. © ScamShield AI.</div>
</body>
</html>`;
  const w = window.open('', '_blank');
  if (w) {
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  }
}
