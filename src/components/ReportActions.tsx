import { FileText, ExternalLink } from 'lucide-react';
import type { ScanHistoryEntry } from '../types';
import { downloadReportPDF } from '../utils/scanHistory';

const FTC_REPORT_URL = 'https://reportfraud.ftc.gov/#/';

interface ReportActionsProps {
  entry: ScanHistoryEntry | null;
  isProOrLifetime: boolean;
  isDark: boolean;
}

export function ReportActions({ entry, isProOrLifetime, isDark }: ReportActionsProps) {
  if (!isProOrLifetime) return null;

  const handlePrintReport = () => {
    if (entry) downloadReportPDF(entry);
  };

  const handleReportFTC = () => {
    window.open(FTC_REPORT_URL, '_blank', 'noopener,noreferrer');
  };

  const btnClass = isDark
    ? 'flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors'
    : 'flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors';

  return (
    <div className="flex flex-wrap gap-3">
      {entry && (
        <button onClick={handlePrintReport} className={btnClass}>
          <FileText className="w-4 h-4" /> Download PDF report
        </button>
      )}
      <button onClick={handleReportFTC} className={btnClass}>
        <ExternalLink className="w-4 h-4" /> Report to FTC
      </button>
    </div>
  );
}
