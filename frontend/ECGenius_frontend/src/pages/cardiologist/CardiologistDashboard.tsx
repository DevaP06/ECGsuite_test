import { useState, useEffect } from 'react';
import {
  ClipboardList, CheckCircle, BarChart2, BookOpen,
  Activity, ShieldCheck, Timer, Loader2, ArrowRight, Clock, Zap, AlertCircle,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import AppShell from '../../layouts/AppShell';
import { useAuth } from '../../features/auth/useAuth';
import { reviewService } from '../../services/reviewService';
import { analyticsService } from '../../services/analyticsService';
import type { ReviewQueueItem, ReviewPriority } from '../../types/review';
import type { ReviewMetrics } from '../../types/analytics';

function PlaceholderCard({
  title, description, icon: Icon, accent = 'text-slate-400', bg = 'bg-gray-100', to,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: string;
  bg?: string;
  to?: string;
}) {
  const inner = (
    <div className="bg-white rounded-xl border border-dashed border-gray-200 p-6 flex flex-col gap-3 h-full hover:border-blue-200 hover:shadow-sm transition">
      <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${accent}`} />
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-semibold text-slate-700">{title}</h4>
        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{description}</p>
      </div>
      <span className="text-xs font-medium text-blue-500 bg-blue-50 rounded-full px-2.5 py-0.5 self-start">
        Coming soon
      </span>
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : <>{inner}</>;
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${accent ?? 'text-slate-800'}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Priority icon config ──────────────────────────────────────────────────────
const PRIORITY_ICON: Record<ReviewPriority, React.ElementType> = {
  normal:   Clock,
  urgent:   Zap,
  critical: AlertCircle,
};
const PRIORITY_COLOR: Record<ReviewPriority, string> = {
  normal:   'text-blue-500',
  urgent:   'text-amber-500',
  critical: 'text-red-500',
};

// ─── Live Review Queue preview ────────────────────────────────────────────────
function ReviewQueuePreview() {
  const navigate = useNavigate();
  const [items, setItems]   = useState<ReviewQueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await reviewService.getQueue();
        if (!cancelled) setItems(Array.isArray(data) ? data : []);
      } catch {
        // non-fatal — shows empty state
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const pending = items.filter((i) => i.status !== 'completed' && i.status !== 'rejected');

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Review Queue</h3>
        <Link
          to="/cardiologist/queue"
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold transition"
        >
          Open queue <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
        </div>
      ) : pending.length === 0 ? (
        <div className="text-center py-5">
          <p className="text-xs text-slate-400 mb-1">
            {items.length === 0 ? 'No review requests yet.' : 'All cases reviewed.'}
          </p>
          {items.length === 0 && (
            <span className="text-xs text-blue-500 bg-blue-50 rounded-full px-2 py-0.5 font-semibold">
              Backend integration pending
            </span>
          )}
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {pending.slice(0, 5).map((item) => {
            const PIcon = PRIORITY_ICON[item.priority] ?? Clock;
            const pColor = PRIORITY_COLOR[item.priority] ?? 'text-slate-400';
            return (
              <div
                key={item._id}
                onClick={() => navigate(`/cardiologist/review/${item.analysisId}`)}
                className="flex items-center justify-between py-2.5 cursor-pointer hover:bg-blue-50/30 -mx-2 px-2 rounded-lg transition gap-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {item.patientName ?? 'Unknown Patient'}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{item.primaryDiagnosis ?? '—'}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <PIcon className={`w-3.5 h-3.5 ${pColor}`} />
                  <span className={`text-xs font-semibold capitalize ${pColor}`}>
                    {item.priority}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CardiologistDashboard() {
  const { session } = useAuth();
  const name = session?.user?.username ?? 'Cardiologist';
  const [metrics, setMetrics] = useState<ReviewMetrics | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const m = await analyticsService.getReviewMetrics('day');
        if (!cancelled) setMetrics(m);
      } catch {
        // non-fatal — stats show "—"
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const hasStats = metrics && metrics.accuracy && metrics.accuracy.totalReviewed > 0;

  return (
    <AppShell title="Cardiologist Dashboard">
      {/* Welcome */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Welcome back, Dr. {name}</h2>
        <p className="text-sm text-slate-500 mt-1">Your specialist review queue and case analytics.</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Pending Reviews"
          value={statsLoading ? '…' : hasStats ? String(metrics!.pendingCount) : '—'}
          sub={hasStats ? 'Today' : 'Awaiting backend'}
          accent="text-amber-600"
        />
        <StatCard
          label="Total Reviewed"
          value={statsLoading ? '…' : hasStats ? String(metrics!.accuracy.totalReviewed) : '—'}
          sub={hasStats ? 'Today' : 'Awaiting backend'}
        />
        <StatCard
          label="Completed Today"
          value={statsLoading ? '…' : hasStats ? String(metrics!.completedToday) : '—'}
          sub={hasStats ? 'Cases resolved' : 'Awaiting backend'}
          accent="text-emerald-600"
        />
        <StatCard
          label="Avg Review Time"
          value={statsLoading ? '…' : hasStats ? `${metrics!.avgReviewMinutes}m` : '—'}
          sub={hasStats ? 'Per case' : 'Awaiting backend'}
        />
      </div>

      {/* Live review queue preview */}
      <div className="mb-6">
        <ReviewQueuePreview />
      </div>

      {/* Module grid */}
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Modules</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <PlaceholderCard
          title="Review Queue"
          description="Referred ECG cases waiting for your specialist review and override decision."
          icon={ClipboardList}
          accent="text-amber-500"
          bg="bg-amber-50"
          to="/cardiologist/queue"
        />
        <PlaceholderCard
          title="Pending Reviews"
          description="Cases flagged by PHC Doctors requiring cardiologist input before final diagnosis."
          icon={Timer}
          accent="text-blue-500"
          bg="bg-blue-50"
          to="/cardiologist/queue"
        />
        <PlaceholderCard
          title="Case Reviews"
          description="History of completed specialist reviews and your override decisions."
          icon={CheckCircle}
          accent="text-emerald-500"
          bg="bg-emerald-50"
          to="/cardiologist/reviews"
        />
        <PlaceholderCard
          title="AI Insights"
          description="Aggregated AI diagnosis statistics and accuracy trends across all reviewed cases."
          icon={Activity}
          accent="text-purple-500"
          bg="bg-purple-50"
          to="/cardiologist/insights"
        />
        <PlaceholderCard
          title="Analytics"
          description="Review turnaround time, SLA compliance, and diagnosis accuracy metrics."
          icon={BarChart2}
          accent="text-indigo-500"
          bg="bg-indigo-50"
          to="/cardiologist/analytics"
        />
        <PlaceholderCard
          title="Validation Metrics"
          description="Monitor SLA compliance — Tier 1 cases require response within 4 hours."
          icon={ShieldCheck}
          accent="text-red-500"
          bg="bg-red-50"
          to="/cardiologist/validation"
        />
      </div>

      <div className="mt-4">
        <PlaceholderCard
          title="Ontology Rules"
          description="View and manage SNOMED CT and ICD-10 mapping rules used in AI-assisted diagnosis."
          icon={BookOpen}
          accent="text-teal-500"
          bg="bg-teal-50"
          to="/cardiologist/ontology"
        />
      </div>
    </AppShell>
  );
}
