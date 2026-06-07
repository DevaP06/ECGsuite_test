import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, Loader2, RefreshCw, AlertTriangle, ListChecks, ShieldAlert, ClipboardList, ArrowRight, Info,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import AppShell from '../../layouts/AppShell';
import { getDoctorInsights } from '../../services/doctorInsightsService';
import { extractErrorMessage } from '../../utils/errorUtils';
import type { DoctorInsightsSummary } from '../../utils/doctorInsights';

function StatCard({ label, value, accent, icon: Icon }: { label: string; value: string; accent?: string; icon: typeof Activity }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-start gap-3">
      <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${accent ?? 'bg-purple-50 text-purple-600'}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-slate-800 mt-0.5">{value}</p>
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

export default function DoctorInsightsPage() {
  const [summary, setSummary] = useState<DoctorInsightsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await getDoctorInsights();
      setSummary(data);
    } catch (err: unknown) {
      setFetchError(extractErrorMessage(err, 'Failed to load insights.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const hasUploads = (summary?.totalUploads ?? 0) > 0;
  const trendData = (summary?.uploadTrend ?? []).map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
  }));
  const hasTrendActivity = trendData.some((d) => d.count > 0);

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
              Trends and highlights drawn from your own ECG uploads and review requests.
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

        {/* Error */}
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
        ) : !summary ? null : !hasUploads ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center">
            <Activity className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700 mb-1">No uploads yet</h3>
            <p className="text-sm text-slate-500">
              Insights will appear here once you've uploaded and analyzed ECG recordings.
            </p>
          </div>
        ) : (
          <>
            {/* Summary stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <StatCard
                label="Total Uploads"
                value={String(summary!.totalUploads)}
                accent="bg-indigo-50 text-indigo-600"
                icon={ListChecks}
              />
              <StatCard
                label="Pending Reviews"
                value={String(summary!.pendingReviewsCount)}
                accent="bg-amber-50 text-amber-600"
                icon={ClipboardList}
              />
              <StatCard
                label="Emergency Alerts"
                value={String(summary!.emergencyAlerts.length)}
                accent="bg-red-50 text-red-600"
                icon={ShieldAlert}
              />
            </div>

            {/* Upload trend */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-500" />
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Upload Volume (Last 14 Days)</h3>
              </div>
              {hasTrendActivity ? (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendData} margin={{ top: 4, right: 16, left: -10, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" name="Uploads" fill="#a855f7" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyCard message="No uploads recorded in the last 14 days." />
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Top abnormalities */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Top Abnormalities</h3>
                {summary!.topAbnormalities.length > 0 ? (
                  <ul className="space-y-2">
                    {summary!.topAbnormalities.map(({ label, count }) => (
                      <li key={label} className="flex items-center gap-3">
                        <span className="text-sm text-slate-700 flex-1 truncate">{label}</span>
                        <span className="text-xs font-semibold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
                          {count}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyCard message="No abnormalities recorded across your analyses yet." />
                )}
              </div>

              {/* Emergency alerts */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Emergency Alerts</h3>
                {summary!.emergencyAlerts.length > 0 ? (
                  <ul className="space-y-2">
                    {summary!.emergencyAlerts.map((alert) => (
                      <li key={alert.analysisId}>
                        <Link
                          to={`/diagnosisdetail/${alert.analysisId}`}
                          className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-red-100 bg-red-50/50 hover:bg-red-50 transition"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">{alert.patientName}</p>
                            <p className="text-xs text-slate-500">
                              {alert.rhythm ?? 'Unknown rhythm'} · {new Date(alert.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-red-400 shrink-0" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyCard message="No emergency-flagged analyses among your uploads." />
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
