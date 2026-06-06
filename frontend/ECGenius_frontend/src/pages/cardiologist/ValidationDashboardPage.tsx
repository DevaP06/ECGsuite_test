import { useState, useEffect, useCallback } from 'react';
import {
  Shield, CheckCircle2, XCircle, TrendingUp, Clock,
  Loader2, RefreshCw, AlertTriangle, BarChart2,
} from 'lucide-react';
import AppShell from '../../layouts/AppShell';
import { analyticsService } from '../../services/analyticsService';
import { extractErrorMessage } from '../../utils/errorUtils';
import type { ReviewMetrics } from '../../types/analytics';

// ─── Metric card ──────────────────────────────────────────────────────────────
function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  accent = 'text-slate-800',
  iconBg = 'bg-gray-100',
  iconColor = 'text-slate-400',
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  accent?: string;
  iconBg?: string;
  iconColor?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
        <p className={`text-2xl font-bold mt-0.5 ${accent}`}>{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── SLA compliance bar ────────────────────────────────────────────────────────
function SlaBar({
  label,
  met,
  total,
  target,
  colorClass,
}: {
  label: string;
  met: number;
  total: number;
  target: number;
  colorClass: string;
}) {
  const pct = total > 0 ? Math.round((met / total) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="font-semibold text-slate-700">{label}</span>
        <span className="text-slate-500">{pct}% met · target {target}h</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-slate-400">{met} of {total} cases met SLA</p>
    </div>
  );
}

type Period = 'day' | 'week' | 'month' | 'all';

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ValidationDashboardPage() {
  const [period, setPeriod]   = useState<Period>('week');
  const [metrics, setMetrics] = useState<ReviewMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await analyticsService.getReviewMetrics(period);
      setMetrics(data);
    } catch (err: unknown) {
      setFetchError(extractErrorMessage(err, 'Failed to load validation metrics.'));
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const approvalRate = metrics && metrics.accuracy.totalReviewed > 0
    ? ((1 - metrics.accuracy.overrideRate) * 100).toFixed(1)
    : null;

  const overrideRate = metrics
    ? (metrics.accuracy.overrideRate * 100).toFixed(1)
    : null;

  const hasData = metrics && metrics.accuracy.totalReviewed > 0;

  return (
    <AppShell title="Validation Dashboard">
      <div className="max-w-5xl mx-auto space-y-6 pb-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />
              Validation Dashboard
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Review accuracy and SLA compliance metrics.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Period selector */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              {(['day', 'week', 'month', 'all'] as Period[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-md transition capitalize ${
                    period === p ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {p === 'all' ? 'All Time' : p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-slate-600 hover:bg-gray-50 transition disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Error */}
        {fetchError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-700">{fetchError}</p>
          </div>
        )}

        {/* Pending notice */}
        {!loading && !fetchError && !hasData && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 flex items-center gap-3">
            <BarChart2 className="w-5 h-5 text-blue-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-800">Backend integration pending</p>
              <p className="text-xs text-blue-600 mt-0.5">
                Metrics will populate once the analytics endpoints are implemented on the backend.
              </p>
            </div>
          </div>
        )}

        {/* Metric cards */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <MetricCard
                label="Total Reviewed"
                value={hasData ? String(metrics!.accuracy.totalReviewed) : '—'}
                sub={`Period: ${period === 'all' ? 'All time' : `Past ${period}`}`}
                icon={CheckCircle2}
                iconBg="bg-blue-50"
                iconColor="text-blue-500"
                accent="text-blue-700"
              />
              <MetricCard
                label="Approval Rate"
                value={approvalRate ? `${approvalRate}%` : '—'}
                sub={hasData ? 'AI diagnosis confirmed' : 'Awaiting data'}
                icon={CheckCircle2}
                iconBg="bg-emerald-50"
                iconColor="text-emerald-500"
                accent="text-emerald-700"
              />
              <MetricCard
                label="Override Rate"
                value={overrideRate ? `${overrideRate}%` : '—'}
                sub={hasData ? `${metrics!.accuracy.aiOverridden} overrides` : 'Awaiting data'}
                icon={XCircle}
                iconBg="bg-amber-50"
                iconColor="text-amber-500"
                accent="text-amber-700"
              />
              <MetricCard
                label="Pending Reviews"
                value={hasData ? String(metrics!.pendingCount) : '—'}
                sub="Awaiting cardiologist action"
                icon={Clock}
                iconBg="bg-yellow-50"
                iconColor="text-yellow-500"
                accent="text-yellow-700"
              />
              <MetricCard
                label="Completed Today"
                value={hasData ? String(metrics!.completedToday) : '—'}
                sub="Reviews finished today"
                icon={TrendingUp}
                iconBg="bg-purple-50"
                iconColor="text-purple-500"
                accent="text-purple-700"
              />
              <MetricCard
                label="Avg Review Time"
                value={hasData ? `${metrics!.avgReviewMinutes} min` : '—'}
                sub="Mean time per review"
                icon={Clock}
                iconBg="bg-teal-50"
                iconColor="text-teal-500"
                accent="text-teal-700"
              />
            </div>

            {/* SLA Compliance */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-5">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">SLA Compliance</h3>
              {hasData ? (
                <div className="space-y-4">
                  <SlaBar
                    label="Tier 1 — Critical (4h target)"
                    met={metrics!.sla.tier1Critical.met}
                    total={metrics!.sla.tier1Critical.total}
                    target={4}
                    colorClass="bg-red-500"
                  />
                  <SlaBar
                    label="Tier 2 — Urgent (24h target)"
                    met={metrics!.sla.tier2Urgent.met}
                    total={metrics!.sla.tier2Urgent.total}
                    target={24}
                    colorClass="bg-amber-500"
                  />
                  <SlaBar
                    label="Tier 3 — Normal (48h target)"
                    met={metrics!.sla.tier3Normal.met}
                    total={metrics!.sla.tier3Normal.total}
                    target={48}
                    colorClass="bg-emerald-500"
                  />
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-4">
                  SLA data will appear once reviews are completed.
                </p>
              )}
            </div>

            {/* Accuracy breakdown */}
            {hasData && metrics!.accuracy.topOverriddenRhythm && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-center gap-3">
                <TrendingUp className="w-4 h-4 text-amber-600 shrink-0" />
                <p className="text-sm text-amber-800">
                  Most frequently overridden rhythm:{' '}
                  <span className="font-bold">{metrics!.accuracy.topOverriddenRhythm}</span>
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
