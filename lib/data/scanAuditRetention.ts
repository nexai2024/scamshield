export const SCAN_AUDIT_RETENTION_OPTIONS = [7, 30, 90] as const;
export type ScanAuditRetentionDays = (typeof SCAN_AUDIT_RETENTION_OPTIONS)[number];

export function isValidRetentionDays(n: number): n is ScanAuditRetentionDays {
  return SCAN_AUDIT_RETENTION_OPTIONS.includes(n as ScanAuditRetentionDays);
}
