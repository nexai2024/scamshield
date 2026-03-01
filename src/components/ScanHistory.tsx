import { useState, useMemo } from 'react';
import { History, Search, Download, FileText, X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { ScanHistoryEntry } from '../types';
import { getScanHistory, exportHistoryCSV, downloadReportPDF, deleteScan } from '../utils/scanHistory';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { EmptyState } from './EmptyState';
import { Tooltip } from './ui/Tooltip';

interface ScanHistoryProps {
  userEmail: string;
  onBack: () => void;
  onSelectEntry: (entry: ScanHistoryEntry) => void;
  isDark: boolean;
}

const PAGE_SIZE = 10;

export function ScanHistory({ userEmail, onBack, onSelectEntry, isDark }: ScanHistoryProps) {
  const [search, setSearch] = useState('');
  const [entries, setEntries] = useState<ScanHistoryEntry[]>(() => getScanHistory(userEmail));
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    if (!search.trim()) return entries;
    const q = search.toLowerCase();
    return entries.filter(
      (e) =>
        e.snippet.toLowerCase().includes(q) ||
        e.risk_level.toLowerCase().includes(q) ||
        e.scam_type.toLowerCase().includes(q)
    );
  }, [entries, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(
    () => filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [filtered, page]
  );

  const handleExportCSV = () => {
    const csv = exportHistoryCSV(filtered);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scamshield-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = (id: string) => {
    deleteScan(userEmail, id);
    setEntries(getScanHistory(userEmail));
    setDeleteConfirmId(null);
  };

  const cardBg = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
  const inputBg = isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className={`flex items-center gap-2 transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-2">
          <Tooltip label="Export history as CSV">
            <button
              onClick={handleExportCSV}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm transition-colors ${isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}`}
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </Tooltip>
        </div>
      </div>
      <h1 className={`text-2xl font-bold mb-2 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
        <History className="w-6 h-6" /> Scan history
      </h1>
      <p className={`mb-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Search and export your past scans.</p>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by snippet, risk level, or scam type..."
          className={`w-full pl-12 pr-4 py-3 rounded-xl border ${inputBg} ${isDark ? 'text-white placeholder:text-slate-500' : 'text-slate-900 placeholder:text-slate-400'} focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent`}
        />
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <EmptyState variant="history" isDark={isDark} />
        ) : (
          paginated.map((entry) => (
            <div
              key={entry.id}
              className={`${cardBg} border rounded-xl p-4 flex items-start justify-between gap-4 ${isDark ? 'hover:border-slate-700' : 'hover:border-slate-300'} transition-colors`}
            >
              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => onSelectEntry(entry)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-sm font-bold ${
                      entry.risk_score > 75
                        ? 'text-red-500'
                        : entry.risk_score > 40
                          ? 'text-amber-500'
                          : 'text-emerald-500'
                    }`}
                  >
                    {entry.risk_score} · {entry.risk_level}
                  </span>
                  <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                    {new Date(entry.date).toLocaleString()}
                  </span>
                </div>
                <p className={`text-sm truncate ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{entry.snippet}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => downloadReportPDF(entry)}
                  className={`p-2 rounded-lg transition-colors ${isDark ? 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800' : 'text-slate-500 hover:text-emerald-500 hover:bg-slate-100'}`}
                  title="Download PDF report"
                >
                  <FileText className="w-4 h-4" />
                </button>
                <Tooltip label="Delete scan">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirmId(entry.id);
                    }}
                    className={`p-2 rounded-lg transition-colors ${isDark ? 'text-slate-400 hover:text-red-400 hover:bg-slate-800' : 'text-slate-500 hover:text-red-500 hover:bg-slate-100'}`}
                    aria-label="Delete"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </Tooltip>
              </div>
            </div>
          ))
        )}
        {filtered.length > PAGE_SIZE && (
          <div className={`flex items-center justify-between pt-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <span className="text-sm">
              Page {page + 1} of {totalPages} ({filtered.length} scans)
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className={`p-2 rounded-lg ${page === 0 ? 'opacity-50 cursor-not-allowed' : isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-200'}`}
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className={`p-2 rounded-lg ${page >= totalPages - 1 ? 'opacity-50 cursor-not-allowed' : isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-200'}`}
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteConfirmId !== null}
        title="Delete this scan?"
        message="This will remove the scan from your history. This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => deleteConfirmId && handleDelete(deleteConfirmId)}
        onCancel={() => setDeleteConfirmId(null)}
        isDark={isDark}
      />
    </div>
  );
}
