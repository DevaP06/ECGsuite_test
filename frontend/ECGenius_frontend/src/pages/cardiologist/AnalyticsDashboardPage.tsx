import { useState, useEffect, useCallback } from 'react';
import {
  BarChart2, TrendingUp, Loader2, RefreshCw, AlertTriangle, Calendar,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import AppShell from '../../layouts/AppShell';
import { analyticsService } from '../../services/analyticsService';
import { extractErrorMessage } from '../../utils/errorUtils';
import type { ReviewMetrics, CardiologistInsights } from '../../types/analytics';

// ─── Typed tooltip ─────────────────────────────────────────────────────────────
interface TooltipEntry {
  name: string;
  value: number;
  color: string;
  dataKey: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-slate-600">{entry.name}:</span>
          <span className="font-semibold text-slate-800">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

type Period = 'day' | 'week' | 'month' | 'all';

// ─── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, accent, subLabel }: { label: string; value: string; accent?: string; subLabel?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${accent ?? 'text-slate-800'}`}>{value}</p>
      {subLabel && <p className="text-xs text-slate-400 mt-1">{subLabel}</p>}
    </div>
  );
}

// ─── Empty state ───────────────────────────────────────────────────────────────
function PendingState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-2">
      <BarChart2 className="w-8 h-8 text-gray-300" />
      <p className="text-sm text-slate-400 text-center">{message}</p>
      <span className="text-xs text-blue-500 bg-blue-50 px-3 py-1 rounded-full font-semibold">
        Backend integration pending
      </span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AnalyticsDashboardPage() {
  const [period, setPeriod]     = useState<Period>('week');
  const [metrics, setMetrics]   = useState<ReviewMetrics | null>(null);
  const [insights, setInsights] = useState<CardiologistInsights | null>(null);
  const [loading, setLoading]   = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const [m, i] = await Promise.all([
        analyticsService.getReviewMetrics(period),
        analyticsService.getInsights(period),
      ]);
      setMetrics(m);
      setInsights(i);
    } catch (err: unknown) {
      setFetchError(extractErrorMessage(err, 'Failed to load analytics.'));
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const hasMetrics  = metrics  && metrics.accuracy.totalReviewed > 0;
  const hasInsights = insights && insights.totalCases > 0;
  const hasDailyStats = metrics && metrics.dailyStats.length >= 2;

  return (
    <AppShell title="Analytics">
      <div className="max-w-6xl mx-auto space-y-6 pb-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-500" />
              Analytics Dashboard
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Population-level review analytics and specialist activity.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              {(['day', 'week', 'month', 'all'] as Period[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-md transition capitalize ${
                    period === p ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {p === 'all' ? 'All' : p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-slate-600 hover:bg-gray-50 transition disabled:opacity-60"
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

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
          </div>
        ) : (
          <>
            {/* Summary stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <StatCard
                label="Total Reviews"
                value={hasMetrics ? String(metrics?.accuracy.totalReviewed) : '—'}
                accent="text-indigo-700"
              />
              <StatCard
                label="AI Approved"
                value={hasMetrics ? String(metrics?.accuracy.aiCorrect) : '—'}
                accent="text-emerald-700"
              />
              <StatCard
                label="Overridden"
                value={hasMetrics ? String(metrics?.accuracy.aiOverridden) : '—'}
                accent="text-amber-700"
              />
              <StatCard
                label="Avg Review Time"
                value={hasMetrics ? `${metrics?.avgReviewMinutes}m` : '—'}
                accent="text-blue-700"
              />
              <StatCard
                label="Urgent Cases"
                value={hasMetrics ? String(metrics?.sla.tier1Critical.total) : '—'}
                subLabel={hasMetrics ? `${metrics?.sla.tier1Critical.met} met / ${metrics?.sla.tier1Critical.target} target` : undefined}
                accent="text-red-700"
              />
            </div>

            {/* Daily Review Trends */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Review Trends</h3>
              </div>
              {hasDailyStats ? (
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={metrics?.dailyStats} margin={{ top: 4, right: 16, left: -10, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10 }}
                        tickFormatter={(d: string) => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      />
                      <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="reviewed"  name="Reviewed"  stroke="#6366f1" strokeWidth={2} dot={false} connectNulls />
                      <Line type="monotone" dataKey="overridden" name="Overridden" stroke="#f59e0b" strokeWidth={2} dot={false} connectNulls />
                      <Line type="monotone" dataKey="escalated"  name="Escalated"  stroke="#ef4444" strokeWidth={2} dot={false} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <PendingState message="Daily trend data will appear after reviews are completed." />
              )}
            </div>

            {/* SLA Compliance + Diagnosis Distribution — two columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              {/* SLA Compliance bar chart */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">SLA Compliance</h3>
                {hasMetrics ? (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { tier: 'Critical (4h)', pct: metrics?.sla.tier1Critical.total > 0 ? Math.round((metrics?.sla.tier1Critical.met / metrics?.sla.tier1Critical.total) * 100) : 0 },
                          { tier: 'Urgent (24h)',  pct: metrics?.sla.tier2Urgent.total > 0   ? Math.round((metrics?.sla.tier2Urgent.met   / metrics?.sla.tier2Urgent.total)   * 100) : 0 },
                          { tier: 'Normal (48h)',  pct: metrics?.sla.tier3Normal.total > 0   ? Math.round((metrics?.sla.tier3Normal.met   / metrics?.sla.tier3Normal.total)   * 100) : 0 },
                        ]}
                        margin={{ top: 4, right: 16, left: -10, bottom: 4 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="tier" tick={{ fontSize: 10 }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${v}%`} />
                        <Tooltip formatter={(v: number) => [`${v}%`, 'Met']} contentStyle={{ fontSize: 11 }} />
                        <Bar dataKey="pct" name="SLA Met %" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <PendingState message="SLA data will appear once reviews are completed." />
                )}
              </div>

              {/* Diagnosis distribution */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                  Diagnosis Distribution
                </h3>
                {hasInsights && insights?.diagnosisDistribution.length > 0 ? (
                  <div className="space-y-2">
                    {insights?.diagnosisDistribution.slice(0, 8).map((d) => {
                      const total = insights?.totalCases;
                      const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
                      return (
                        <div key={d.rhythm} className="space-y-0.5">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium text-slate-700 truncate max-w-[60%]">{d.rhythm}</span>
                            <span className="text-slate-500">{d.count} ({pct}%)</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <PendingState message="Diagnosis distribution will appear once data is available." />
                )}
              </div>
            </div>

            {/* Top abnormalities */}
            {hasInsights && insights?.topAbnormalities.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Top Abnormalities</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {insights?.topAbnormalities.map((a) => (
                    <div key={a.label} className="bg-gray-50 rounded-lg px-3 py-2.5">
                      <p className="text-xs font-semibold text-slate-700 leading-tight">{a.label}</p>
                      <p className="text-lg font-bold text-indigo-600">{a.count}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No data at all */}
            {!hasMetrics && !hasInsights && !fetchError && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 flex flex-col items-center gap-3 text-center">
                <BarChart2 className="w-10 h-10 text-gray-300" />
                <h3 className="text-base font-bold text-slate-700">No analytics data yet</h3>
                <p className="text-sm text-slate-400 max-w-sm">
                  Review activity and diagnosis patterns will appear here once the backend
                  analytics endpoints are implemented and cases are reviewed.
                </p>
                <span className="text-xs text-blue-500 bg-blue-50 px-3 py-1.5 rounded-full font-semibold">
                  Backend integration pending
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
