import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList, Loader2, AlertTriangle, Search, RefreshCw,
  ArrowRight, Clock, Zap, AlertCircle,
} from 'lucide-react';
import AppShell from '../../layouts/AppShell';
import { reviewService } from '../../services/reviewService';
import { extractErrorMessage } from '../../utils/errorUtils';
import type { ReviewQueueItem, ReviewPriority, ReviewStatus } from '../../types/review';

// ─── Priority badge ────────────────────────────────────────────────────────────
interface PriorityConf {
  label: string;
  colorClass: string;
  icon: React.ElementType;
}

const PRIORITY_BADGE: Record<ReviewPriority, PriorityConf> = {
  normal:   { label: 'Normal',   colorClass: 'bg-blue-50 text-blue-700 border-blue-200',    icon: Clock       },
  urgent:   { label: 'Urgent',   colorClass: 'bg-amber-50 text-amber-700 border-amber-200', icon: Zap         },
  critical: { label: 'Critical', colorClass: 'bg-red-50 text-red-700 border-red-200',        icon: AlertCircle },
};

const STATUS_BADGE: Record<ReviewStatus, string> = {
  pending:   'bg-yellow-50 text-yellow-700 border-yellow-200',
  assigned:  'bg-blue-50 text-blue-700 border-blue-200',
  in_review: 'bg-purple-50 text-purple-700 border-purple-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  escalated: 'bg-red-50 text-red-700 border-red-200',
  rejected:  'bg-gray-50 text-gray-500 border-gray-200',
};

const STATUS_LABELS: Record<ReviewStatus, string> = {
  pending:   'Pending',
  assigned:  'Assigned',
  in_review: 'In Review',
  completed: 'Completed',
  escalated: 'Escalated',
  rejected:  'Rejected',
};

type PriorityFilter = 'all' | ReviewPriority;
type StatusFilter   = 'all' | 'active' | ReviewStatus;

// ─── Queue row ─────────────────────────────────────────────────────────────────
function QueueRow({ item }: { item: ReviewQueueItem }) {
  const navigate = useNavigate();
  const pConf = PRIORITY_BADGE[item.priority] ?? PRIORITY_BADGE.normal;
  const PIcon = pConf.icon;

  return (
    <tr
      className="hover:bg-blue-50/30 cursor-pointer transition"
      onClick={() => navigate(`/cardiologist/review/${item.analysisId}`)}
    >
      <td className="px-4 py-3">
        <p className="text-sm font-semibold text-slate-800">{item.patientName ?? '—'}</p>
        <p className="text-xs text-slate-400">
          {item.patientAge ? `${item.patientAge} y/o` : ''}
          {item.gender ? ` · ${item.gender}` : ''}
        </p>
      </td>
      <td className="px-4 py-3 text-sm text-slate-600 hidden md:table-cell">
        {item.primaryDiagnosis ?? <span className="text-slate-300">—</span>}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${pConf.colorClass}`}>
          <PIcon className="w-3 h-3" />
          {pConf.label}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-slate-500 hidden lg:table-cell">
        {item.requestedBy ?? '—'}
      </td>
      <td className="px-4 py-3 text-xs text-slate-400 hidden sm:table-cell">
        {new Date(item.createdAt).toLocaleDateString(undefined, {
          month: 'short', day: 'numeric', year: 'numeric',
        })}
      </td>
      <td className="px-4 py-3">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_BADGE[item.status] ?? STATUS_BADGE.pending}`}>
          {STATUS_LABELS[item.status] ?? item.status}
        </span>
      </td>
      <td className="px-4 py-3">
        <ArrowRight className="w-4 h-4 text-slate-300" />
      </td>
    </tr>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function ReviewQueuePage() {
  const [items, setItems]           = useState<ReviewQueueItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [search, setSearch]         = useState('');
  const [priorityF, setPriorityF]   = useState<PriorityFilter>('all');
  const [statusF, setStatusF]       = useState<StatusFilter>('active');

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await reviewService.getQueue();
      setItems(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setFetchError(extractErrorMessage(err, 'Failed to load review queue.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter((it) => {
    if (priorityF !== 'all' && it.priority !== priorityF) return false;
    if (statusF === 'active') {
      if (it.status === 'completed' || it.status === 'rejected') return false;
    } else if (statusF !== 'all' && it.status !== statusF) {
      return false;
    }
    if (search) {
      const q = search.toLowerCase();
      if (
        !it.patientName?.toLowerCase().includes(q) &&
        !it.primaryDiagnosis?.toLowerCase().includes(q) &&
        !it.requestedBy?.toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  const pendingCount = items.filter(
    (i) => i.status !== 'completed' && i.status !== 'rejected',
  ).length;

  return (
    <AppShell title="Review Queue">
      <div className="max-w-6xl mx-auto space-y-5 pb-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-amber-500" />
              Review Queue
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              ECG cases referred by PHC Doctors for specialist review.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <span className="text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-full">
                {pendingCount} pending
              </span>
            )}
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-slate-600 hover:bg-gray-50 transition disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search patient, diagnosis, doctor…"
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            <div className="flex items-center gap-1">
              {(['all', 'normal', 'urgent', 'critical'] as PriorityFilter[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriorityF(p)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition capitalize ${
                    priorityF === p
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                  }`}
                >
                  {p === 'all' ? 'All Priority' : p}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1">
              {(['active', 'all', 'completed'] as StatusFilter[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusF(s)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                    statusF === s
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                  }`}
                >
                  {s === 'active' ? 'Active' : s === 'all' ? 'All Status' : 'Completed'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-sm text-slate-500">Loading review queue…</p>
          </div>
        ) : fetchError ? (
          <div className="bg-white rounded-xl border border-red-200 shadow-sm p-8 flex flex-col items-center gap-3 text-center">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <p className="text-sm font-semibold text-slate-700">{fetchError}</p>
            <button
              type="button"
              onClick={load}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
            >
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 flex flex-col items-center gap-3 text-center">
            <ClipboardList className="w-10 h-10 text-gray-300" />
            <h3 className="text-base font-bold text-slate-700">Queue is empty</h3>
            <p className="text-sm text-slate-400 max-w-sm">
              No review requests have been submitted. Once PHC Doctors request specialist
              reviews, they will appear here.
            </p>
            <span className="text-xs text-blue-500 bg-blue-50 px-3 py-1.5 rounded-full font-semibold">
              Backend integration pending
            </span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
            <p className="text-sm text-slate-400">No items match the current filters.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Patient</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Diagnosis</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Submitted By</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((item) => (
                  <QueueRow key={item._id} item={item} />
                ))}
              </tbody>
            </table>
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-xs text-slate-400">
              Showing {filtered.length} of {items.length} cases
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
