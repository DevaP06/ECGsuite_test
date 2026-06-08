import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, Loader2, RefreshCw, AlertTriangle, ClipboardList, CheckCircle2, ShieldAlert,
  Timer, Gauge, BarChart2, PieChart, ListTree, Stethoscope, Info, ArrowRight,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import AppShell from '../../layouts/AppShell';
import { reviewService } from '../../services/reviewService';
import { analyticsService } from '../../services/analyticsService';
import { extractErrorMessage } from '../../utils/errorUtils';
import { buildCardiologistInsights } from '../../utils/cardiologistInsights';
import type { CardiologistInsightsSummary } from '../../utils/cardiologistInsights';
import type { ReviewMetrics } from '../../types/analytics';
import type { ReviewPriority, ReviewStatus } from '../../types/review';

function StatCard({ label, value, subLabel, accent, icon: Icon }: {
  label: string; value: string; subLabel?: string; accent?: string; icon: typeof Activity;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-start gap-3">
      <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${accent ?? 'bg-purple-50 text-purple-600'}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-slate-800 mt-0.5">{value}</p>
        {subLabel && <p className="text-xs text-slate-400 mt-0.5">{subLabel}</p>}
      </div>
    </div>
  );
}

function EmptyCard({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-6 py-8 text-center flex flex-col items-center gap-2">
      <Info className="w-5 h-5 text-slate-300" />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}

const PRIORITY_LABEL: Record<ReviewPriority, string> = {
  critical: 'Critical',
  urgent:   'Urgent',
  normal:   'Normal',
};

const PRIORITY_BAR: Record<ReviewPriority, string> = {
  critical: 'bg-red-400',
  urgent:   'bg-amber-400',
  normal:   'bg-blue-400',
};

const STATUS_LABEL: Record<ReviewStatus, string> = {
  pending:   'Pending',
  assigned:  'Assigned',
  in_review: 'In Review',
  completed: 'Completed',
  escalated: 'Escalated',
  rejected:  'Rejected',
};

const STATUS_BAR: Record<ReviewStatus, string> = {
  pending:   'bg-yellow-400',
  assigned:  'bg-blue-400',
  in_review: 'bg-purple-400',
  completed: 'bg-emerald-400',
  escalated: 'bg-red-400',
  rejected:  'bg-gray-400',
};

export default function CardiologistInsightsPage() {
  const [summary, setSummary] = useState<CardiologistInsightsSummary | null>(null);
  const [metrics, setMetrics] = useState<ReviewMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const [queue, m] = await Promise.all([
        reviewService.getQueue(),
        analyticsService.getReviewMetrics('month'),
      ]);
      setSummary(buildCardiologistInsights(queue));
      setMetrics(m);
    } catch (err: unknown) {
      setFetchError(extractErrorMessage(err, 'Failed to load insights.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const hasActivity = (summary?.reviewQueueCount ?? 0) > 0 || (summary?.completedReviewsCount ?? 0) > 0;
  const trendData = (summary?.reviewVolumeTrend ?? []).map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
  }));
  const hasTrendActivity = trendData.some((d) => d.count > 0);

  const hasMetrics = metrics && metrics.accuracy.totalReviewed > 0;
  const slaTotal = metrics ? metrics.sla.tier1Critical.total + metrics.sla.tier2Urgent.total + metrics.sla.tier3Normal.total : 0;
  const slaMet = metrics ? metrics.sla.tier1Critical.met + metrics.sla.tier2Urgent.met + metrics.sla.tier3Normal.met : 0;
  const slaPct = slaTotal > 0 ? Math.round((slaMet / slaTotal) * 100) : null;

  const maxPriority = Math.max(1, ...(summary?.priorityDistribution ?? []).map((p) => p.count));
  const maxStatus = Math.max(1, ...(summary?.statusBreakdown ?? []).map((s) => s.count));

  return (
    <AppShell title="AI Insights">
      <div className="max-w-6xl mx-auto space-y-6 pb-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-500" />
              AI Insights
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Your personal review activity, workload distribution, and case patterns.
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
            <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
          </div>
        ) : !summary ? null : !hasActivity ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center">
            <Activity className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700 mb-1">No review activity yet</h3>
            <p className="text-sm text-slate-500">
              Insights will appear here once cases start arriving in your review queue.
            </p>
          </div>
        ) : (
          <>
            {/* Summary stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <StatCard
                label="Review Queue"
                value={String(summary.reviewQueueCount)}
                accent="bg-blue-50 text-blue-600"
                icon={ClipboardList}
              />
              <StatCard
                label="Completed Reviews"
                value={String(summary.completedReviewsCount)}
                accent="bg-emerald-50 text-emerald-600"
                icon={CheckCircle2}
              />
              <StatCard
                label="Urgent Cases"
                value={String(summary.urgentCasesCount)}
                accent="bg-red-50 text-red-600"
                icon={ShieldAlert}
              />
              <StatCard
                label="Avg Review Time"
                value={hasMetrics ? `${metrics!.avgReviewMinutes}m` : 'Not provided'}
                accent="bg-indigo-50 text-indigo-600"
                icon={Timer}
              />
              <StatCard
                label="SLA Compliance"
                value={slaPct !== null ? `${slaPct}%` : 'Not provided'}
                subLabel={slaPct !== null ? `${slaMet} met / ${slaTotal} cases` : undefined}
                accent="bg-teal-50 text-teal-600"
                icon={Gauge}
              />
            </div>

            {/* Review volume */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-purple-500" />
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Review Volume (Last 14 Days)</h3>
              </div>
              {hasTrendActivity ? (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendData} margin={{ top: 4, right: 16, left: -10, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" name="Cases" fill="#a855f7" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyCard message="No cases assigned to your queue in the last 14 days." />
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Priority distribution */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-slate-400" />
                  Priority Distribution
                </h3>
                {summary.priorityDistribution.some((p) => p.count > 0) ? (
                  <div className="space-y-2.5">
                    {summary.priorityDistribution.map((p) => (
                      <div key={p.priority} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-slate-700">{PRIORITY_LABEL[p.priority]}</span>
                          <span className="text-slate-500">{p.count}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${PRIORITY_BAR[p.priority]}`}
                            style={{ width: `${Math.round((p.count / maxPriority) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyCard message="No priority data available in your queue." />
                )}
              </div>

              {/* Review status breakdown */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                  <ListTree className="w-4 h-4 text-slate-400" />
                  Review Status Breakdown
                </h3>
                {summary.statusBreakdown.length > 0 ? (
                  <div className="space-y-2.5">
                    {summary.statusBreakdown.map((s) => (
                      <div key={s.status} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-slate-700">{STATUS_LABEL[s.status]}</span>
                          <span className="text-slate-500">{s.count}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${STATUS_BAR[s.status]}`}
                            style={{ width: `${Math.round((s.count / maxStatus) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyCard message="No status data available in your queue." />
                )}
              </div>
            </div>

            {/* Most reviewed conditions */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-slate-400" />
                Most Reviewed Conditions
              </h3>
              {summary.mostReviewedConditions.length > 0 ? (
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {summary.mostReviewedConditions.map(({ label, count }) => (
                    <li key={label} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-gray-100">
                      <span className="text-sm text-slate-700 truncate">{label}</span>
                      <span className="text-xs font-semibold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full shrink-0">
                        {count}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyCard message="No diagnosis data recorded across your reviewed cases yet." />
              )}
            </div>

            <div className="flex justify-end">
              <Link
                to="/cardiologist/queue"
                className="flex items-center gap-1.5 text-sm font-semibold text-purple-600 hover:text-purple-800 transition"
              >
                Open Review Queue <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
