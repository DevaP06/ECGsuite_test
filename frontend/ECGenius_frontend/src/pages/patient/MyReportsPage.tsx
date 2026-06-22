import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, Loader2, AlertTriangle, RefreshCw, Eye, LayoutDashboard, Filter, Search, Info,
} from 'lucide-react';
import AppShell from '../../layouts/AppShell';
import { ecgService } from '../../services/ecgService';
import { extractErrorMessage } from '../../utils/errorUtils';
import PDFExportButton from '../../components/common/PDFExportButton';
import type { ECGAnalysis } from '../../types/ecg';

type StatusFilter = 'all' | 'completed' | 'processing' | 'failed';
type DateFilter = 'all' | '7' | '30' | '90';

const STATUS_BADGE: Record<string, string> = {
  completed:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  processing: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  failed:     'bg-red-50 text-red-700 border-red-200',
  uploaded:   'bg-slate-50 text-slate-600 border-slate-200',
  archived:   'bg-slate-50 text-slate-600 border-slate-200',
};

export default function MyReportsPage() {
  const [analyses, setAnalyses] = useState<ECGAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await ecgService.getMyAnalyses();
      setAnalyses(data);
    } catch (err: unknown) {
      setFetchError(extractErrorMessage(err, 'Failed to load your reports.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const diagnosisOptions = useMemo(() => {
    const set = new Set<string>();
    analyses.forEach((a) => {
      if (a.analysisResult?.rhythm) set.add(a.analysisResult.rhythm);
    });
    return Array.from(set).sort();
  }, [analyses]);

  const [diagnosisFilter, setDiagnosisFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    const now = Date.now();
    return [...analyses]
      .filter((a) => {
        if (statusFilter !== 'all' && a.status !== statusFilter) return false;
        if (diagnosisFilter !== 'all' && a.analysisResult?.rhythm !== diagnosisFilter) return false;
        if (dateFilter !== 'all') {
          const ageDays = (now - new Date(a.createdAt).getTime()) / (1000 * 60 * 60 * 24);
          if (ageDays > Number(dateFilter)) return false;
        }
        if (search.trim()) {
          const term = search.trim().toLowerCase();
          const haystack = `${a.analysisResult?.rhythm ?? ''} ${a.patientInfo?.name ?? ''} ${a.originalName ?? a.fileName ?? ''}`.toLowerCase();
          if (!haystack.includes(term)) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [analyses, statusFilter, diagnosisFilter, dateFilter, search]);

  const hasAnyReports = analyses.length > 0;

  return (
    <AppShell title="My Reports">
      <div className="max-w-5xl mx-auto space-y-5 pb-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              My Reports
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Your ECG analysis reports, diagnoses, and review status — all in one place.
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-slate-600 hover:bg-gray-50 transition disabled:opacity-60 self-start sm:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {fetchError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-700">{fetchError}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          </div>
        ) : !hasAnyReports ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700 mb-1">No reports yet</h3>
            <p className="text-sm text-slate-500">
              Your ECG analysis reports will appear here once you upload and analyze a recording.
            </p>
            <Link
              to="/ecgupload"
              className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-semibold text-white transition"
            >
              Upload an ECG
            </Link>
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wide">
                <Filter className="w-4 h-4 text-slate-400" />
                Filters
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by diagnosis or file…"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                >
                  <option value="all">All time</option>
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                </select>
                <select
                  value={diagnosisFilter}
                  onChange={(e) => setDiagnosisFilter(e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                >
                  <option value="all">All diagnoses</option>
                  {diagnosisOptions.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                >
                  <option value="all">All statuses</option>
                  <option value="completed">Completed</option>
                  <option value="processing">Processing</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>

            {/* Report cards */}
            {filtered.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center flex flex-col items-center gap-2">
                <Info className="w-5 h-5 text-slate-300" />
                <p className="text-sm text-slate-500">No reports match the selected filters.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((a) => (
                  <div key={a._id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-slate-800 truncate">
                            {a.analysisResult?.rhythm ?? 'Diagnosis pending'}
                          </h3>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ${STATUS_BADGE[a.status] ?? 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                            {a.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(a.createdAt).toLocaleString()}
                          {a.analysisResult?.confidence !== undefined && (
                            <> · Confidence: <span className="font-semibold text-slate-600">{a.analysisResult.confidence}%</span></>
                          )}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <Link
                          to={a.status === 'failed' ? `/analysis-failed/${a._id}` : `/diagnosisdetail/${a._id}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-slate-600 hover:bg-gray-50 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Open Report
                        </Link>
                        {a.status === 'completed' && (
                          <>
                            <PDFExportButton analysisId={a._id} patientName={a.patientInfo?.name} variant="icon" />
                            <Link
                              to={`/clinical-dashboard/${a._id}`}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-slate-600 hover:bg-gray-50 transition"
                            >
                              <LayoutDashboard className="w-3.5 h-3.5" />
                              Clinical Dashboard
                            </Link>
                          </>
                        )}
                      </div>
                    </div>

                    {(a.analysisResult?.abnormalities?.length ?? 0) > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1 border-t border-gray-50">
                        {a.analysisResult?.abnormalities.slice(0, 4).map((f, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                            {f}
                          </span>
                        ))}
                        {a.analysisResult?.abnormalities.length > 4 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 border border-gray-200">
                            +{a.analysisResult?.abnormalities.length - 4} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
