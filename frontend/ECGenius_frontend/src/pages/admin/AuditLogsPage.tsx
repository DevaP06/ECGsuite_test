import { useState, useEffect, useCallback } from 'react';
import {
  ScrollText, Loader2, AlertTriangle, ChevronLeft, ChevronRight, RefreshCw, X,
} from 'lucide-react';
import AppShell from '../../layouts/AppShell';
import { adminService } from '../../services/adminService';
import { extractErrorMessage } from '../../utils/errorUtils';
import type { AuditLogEntry, AuditAction, AuditEntityType } from '../../types/admin';

const PAGE_SIZE = 20;

const ACTION_OPTIONS: AuditAction[] = ['LOGIN', 'REGISTER', 'LOGOUT', 'UPLOAD', 'DELETE', 'UPDATE', 'VIEW', 'REVIEW'];

const ENTITY_TYPE_OPTIONS: AuditEntityType[] = [
  'USER', 'ECG_ANALYSIS', 'SPECIALIST_REVIEW', 'PATIENT', 'PATIENT_HISTORY',
  'ANNOTATION', 'VALIDATION', 'FEEDBACK', 'ONTOLOGY_RULE', 'MODEL_VERSION',
];

const ENTITY_LABELS: Record<AuditEntityType, string> = {
  USER: 'User',
  ECG_ANALYSIS: 'ECG Analysis',
  SPECIALIST_REVIEW: 'Specialist Review',
  PATIENT: 'Patient',
  PATIENT_HISTORY: 'Patient History',
  ANNOTATION: 'Annotation',
  VALIDATION: 'Validation',
  FEEDBACK: 'Feedback',
  ONTOLOGY_RULE: 'Ontology Rule',
  MODEL_VERSION: 'Model Version',
};

const ACTION_BADGE: Record<AuditAction, string> = {
  LOGIN: 'bg-slate-50 text-slate-600',
  LOGOUT: 'bg-slate-50 text-slate-500',
  REGISTER: 'bg-emerald-50 text-emerald-700',
  UPLOAD: 'bg-blue-50 text-blue-700',
  DELETE: 'bg-red-50 text-red-700',
  UPDATE: 'bg-amber-50 text-amber-700',
  VIEW: 'bg-slate-50 text-slate-500',
  REVIEW: 'bg-purple-50 text-purple-700',
};

function shortId(id?: string | null): string {
  if (!id) return '—';
  return id.length > 10 ? `${id.slice(0, 10)}…` : id;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [action, setAction] = useState<AuditAction | ''>('');
  const [entityType, setEntityType] = useState<AuditEntityType | ''>('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getAuditLogs({
        page,
        limit: PAGE_SIZE,
        action: action || undefined,
        entityType: entityType || undefined,
        from: from || undefined,
        to: to || undefined,
      });
      setLogs(res.logs ?? []);
      setTotal(res.pagination?.total ?? 0);
    } catch (err: unknown) {
      setError(extractErrorMessage(err, 'Failed to load audit logs.'));
    } finally {
      setLoading(false);
    }
  }, [page, action, entityType, from, to]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const hasFilters = !!(action || entityType || from || to);
  const clearFilters = () => {
    setAction('');
    setEntityType('');
    setFrom('');
    setTo('');
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AppShell title="Audit Logs">
      <div className="space-y-5 pb-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
              <ScrollText className="w-5 h-5 text-slate-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Audit Logs</h1>
              {!loading && !error && (
                <p className="text-xs text-slate-500">{total} event{total !== 1 ? 's' : ''} recorded</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 border border-gray-200 rounded-lg px-3 py-2 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex flex-col sm:flex-row flex-wrap gap-3 items-start sm:items-center">
          <select
            value={action}
            onChange={(e) => { setAction(e.target.value as AuditAction | ''); setPage(1); }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          >
            <option value="">All actions</option>
            {ACTION_OPTIONS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <select
            value={entityType}
            onChange={(e) => { setEntityType(e.target.value as AuditEntityType | ''); setPage(1); }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          >
            <option value="">All entity types</option>
            {ENTITY_TYPE_OPTIONS.map((e) => (
              <option key={e} value={e}>{ENTITY_LABELS[e]}</option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => { setFrom(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => { setTo(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-red-600 transition"
            >
              <X className="w-3.5 h-3.5" /> Clear filters
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[30vh] gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm text-slate-500">Loading audit logs…</p>
          </div>
        ) : error ? (
          <div className="max-w-md mx-auto mt-6 bg-white border border-red-200 rounded-xl p-6 text-center shadow-sm">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-800 mb-1">Failed to load audit logs</h3>
            <p className="text-sm text-slate-600 mb-4">{error}</p>
            <button
              onClick={fetchLogs}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
            >
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        ) : logs.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-200 p-10 text-center">
            <ScrollText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-700 mb-1">No audit events found</h3>
            <p className="text-sm text-slate-500">
              {hasFilters ? 'Try adjusting your filters.' : 'No activity has been recorded yet.'}
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Timestamp</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Action</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Entity</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide hidden md:table-cell">Entity ID</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide hidden lg:table-cell">User ID</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide hidden lg:table-cell">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-blue-50/30 transition">
                      <td className="px-5 py-3.5 text-slate-600 text-xs whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ACTION_BADGE[log.action]}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-700">
                        {ENTITY_LABELS[log.entityType] ?? log.entityType}
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell text-slate-400 text-xs font-mono" title={log.entityId ?? undefined}>
                        {shortId(log.entityId)}
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell text-slate-400 text-xs font-mono" title={log.userId ?? undefined}>
                        {shortId(log.userId)}
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell text-slate-500 text-xs">
                        {log.ipAddress ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between text-sm">
              <p className="text-xs text-slate-500">
                Page {page} of {totalPages} · {total} event{total !== 1 ? 's' : ''}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 text-xs text-slate-600 font-medium">{page}</span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
