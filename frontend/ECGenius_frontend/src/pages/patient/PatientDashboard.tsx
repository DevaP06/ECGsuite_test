import { useState, useEffect } from 'react';
import { Upload, AlertTriangle, History, TrendingUp, Loader2, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import AppShell from '../../layouts/AppShell';
import { useAuth } from '../../features/auth/useAuth';
import { ecgService } from '../../services/ecgService';
import TrendAnalytics from '../../components/patients/TrendAnalytics';
import ReviewStatusTracker from '../../components/review/ReviewStatusTracker';
import type { ECGAnalysis } from '../../types/ecg';
import { extractErrorMessage } from '../../utils/errorUtils';

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const classes =
    status === 'completed'  ? 'bg-emerald-50 text-emerald-700' :
    status === 'failed'     ? 'bg-red-50 text-red-700'         :
    status === 'processing' ? 'bg-yellow-50 text-yellow-700'   :
                              'bg-slate-50 text-slate-600';
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${classes}`}>
      {status}
    </span>
  );
}

// ─── Recent Reports mini-list ─────────────────────────────────────────────────
function RecentReports({ analyses }: { analyses: ECGAnalysis[] }) {
  const navigate = useNavigate();
  const recent = [...analyses]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  if (!recent.length) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-slate-500 mb-3">No ECG reports yet.</p>
        <Link
          to="/ecgupload"
          className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-semibold transition"
        >
          <Upload className="w-4 h-4" /> Upload your first ECG
        </Link>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-50">
      {recent.map((a) => {
        const isFailed = a.status === 'failed';
        const path = isFailed
          ? `/analysis-failed/${a._id}`
          : `/diagnosisdetail/${a._id}`;
        return (
          <div
            key={a._id}
            onClick={() => navigate(path)}
            className="flex items-center justify-between py-3 cursor-pointer hover:bg-blue-50/30 -mx-2 px-2 rounded-lg transition"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">
                {a.analysisResult?.rhythm
                  ? a.analysisResult.rhythm.replace(/_/g, ' ')
                  : isFailed
                  ? 'Failed Analysis'
                  : 'ECG Upload'}
              </p>
              <p className="text-xs text-slate-400">
                {new Date(a.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric', month: 'short', day: 'numeric',
                })}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <StatusBadge status={a.status} />
              <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function PatientDashboard() {
  const { session } = useAuth();
  const name = session?.user?.username ?? 'there';

  const [analyses, setAnalyses] = useState<ECGAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await ecgService.getMyAnalyses();
        if (!cancelled) setAnalyses(data);
      } catch (err: unknown) {
        if (!cancelled) setLoadError(extractErrorMessage(err, 'Could not load reports'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const latestCompletedId = loading
    ? undefined
    : [...analyses]
        .filter((a) => a.status === 'completed')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]?._id;

  return (
    <AppShell title="My Health Dashboard">
      {/* Welcome */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Hello, {name}</h2>
        <p className="text-sm text-slate-500 mt-1">Track your ECG results and heart health over time.</p>
      </div>

      {/* Primary action */}
      <div className="mb-8">
        <Link
          to="/ecgupload"
          className="flex items-center gap-5 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-xl p-6 text-white shadow-lg shadow-blue-900/20 transition max-w-lg"
        >
          <div className="bg-white/20 rounded-xl p-3">
            <Upload className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Upload Your ECG</h3>
            <p className="text-sm text-blue-100 mt-0.5">
              Submit an ECG file for instant AI-powered analysis.
            </p>
          </div>
        </Link>
      </div>

      {/* Privacy notice */}
      <div className="mb-8 bg-blue-50 border border-blue-100 rounded-xl px-5 py-4 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-700">
          <span className="font-semibold">Privacy notice:</span>{' '}
          Your ECG data and reports are private. You can only view your own analyses.
        </p>
      </div>

      {/* Two-column: Recent Reports + Trend Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">

        {/* Recent Reports */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Recent Reports</h3>
            </div>
            <Link
              to="/patient/history"
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold transition"
            >
              Full history <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            </div>
          ) : loadError ? (
            <p className="text-xs text-slate-400 text-center py-4">{loadError}</p>
          ) : (
            <RecentReports analyses={analyses} />
          )}
        </div>

        {/* Trend Analytics */}
        <div className="lg:col-span-3">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Trend Summary</h3>
          </div>
          {loading ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex items-center justify-center min-h-[200px]">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : (
            <TrendAnalytics analyses={analyses} />
          )}
        </div>
      </div>

      {/* Specialist review status for most recent completed analysis */}
      {latestCompletedId && (
        <div className="mb-8">
          <ReviewStatusTracker analysisId={latestCompletedId} />
        </div>
      )}

      {/* Risk summary + History quick-links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/patient/risk"
          className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition flex items-start gap-4"
        >
          <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-700">Risk Summary</h4>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Rolling summary of your heart health indicators and risk trends over time.
            </p>
            <span className="text-xs font-medium text-blue-500 bg-blue-50 rounded-full px-2.5 py-0.5 mt-2 inline-block">
              Coming soon
            </span>
          </div>
        </Link>

        <Link
          to="/patient/history"
          className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition flex items-start gap-4"
        >
          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
            <History className="w-5 h-5 text-slate-500" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-700">Full History</h4>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Complete timeline of your ECG uploads, diagnoses, and review outcomes.
            </p>
            <span className="text-xs font-medium text-blue-500 bg-blue-50 rounded-full px-2.5 py-0.5 mt-2 inline-block">
              Coming soon
            </span>
          </div>
        </Link>
      </div>
    </AppShell>
  );
}
