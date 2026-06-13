import { BarChart3, AlertTriangle, CalendarRange, Activity } from 'lucide-react';
import type { PatientTrends } from '../../types/patient';

interface Props {
  trends: PatientTrends | null;
  loading: boolean;
}

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export default function PatientTrendsSummary({ trends, loading }: Props) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 animate-pulse h-40" />
    );
  }

  if (!trends || trends.summary.completedAnalyses === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="w-5 h-5 text-blue-500" />
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Trends Summary</h3>
        </div>
        <p className="text-sm text-slate-500">
          No completed analyses yet — trends will appear once ECGs are processed.
        </p>
      </div>
    );
  }

  const { summary, rhythmDistribution } = trends;
  const maxCount = Math.max(...rhythmDistribution.map((r) => r.count), 1);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-blue-500" />
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Trends Summary</h3>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
          <p className="text-xs text-slate-500">Total ECGs</p>
          <p className="text-lg font-bold text-slate-800">{summary.totalAnalyses}</p>
        </div>
        <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
          <p className="text-xs text-slate-500">Completed</p>
          <p className="text-lg font-bold text-slate-800">{summary.completedAnalyses}</p>
        </div>
        <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
          <p className="text-xs text-slate-500">Avg Confidence</p>
          <p className="text-lg font-bold text-slate-800">{summary.averageConfidence}%</p>
        </div>
        <div className={`rounded-lg border p-3 ${summary.emergencyCount > 0 ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
          <p className="text-xs text-slate-500 flex items-center gap-1">
            {summary.emergencyCount > 0 && <AlertTriangle className="w-3 h-3 text-red-500" />}
            Emergency Flags
          </p>
          <p className={`text-lg font-bold ${summary.emergencyCount > 0 ? 'text-red-600' : 'text-slate-800'}`}>
            {summary.emergencyCount}
          </p>
        </div>
      </div>

      {/* Date range */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <CalendarRange className="w-3.5 h-3.5" />
        <span>{formatDate(summary.dateRange.from)} – {formatDate(summary.dateRange.to)}</span>
      </div>

      {/* Rhythm distribution */}
      {rhythmDistribution.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-400" />
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Rhythm Distribution</p>
          </div>
          <div className="space-y-1.5">
            {rhythmDistribution.map((entry) => (
              <div key={entry.rhythm} className="flex items-center gap-2">
                <span className="text-xs text-slate-600 w-36 truncate" title={entry.rhythm.replace(/_/g, ' ')}>
                  {entry.rhythm.replace(/_/g, ' ')}
                </span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${(entry.count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-700 w-6 text-right">{entry.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
