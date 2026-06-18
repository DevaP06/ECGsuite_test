import { useState, useEffect } from 'react';
import {
  Upload, Users, Activity, AlertTriangle, ClipboardList,
  Clock, FlaskConical, Brain, UserPlus, ArrowRight, Loader2,
  Zap, AlertCircle,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import AppShell from '../../layouts/AppShell';
import { useAuth } from '../../features/auth/useAuth';
import { patientService } from '../../services/patientService';
import { reviewService } from '../../services/reviewService';
import { dashboardService } from '../../services/dashboardService';
import type { DoctorDashboardStats } from '../../services/dashboardService';
import { extractErrorMessage } from '../../utils/errorUtils';
import type { PatientListItem } from '../../types/patient';
import type { ReviewQueueItem, ReviewPriority } from '../../types/review';

// ─── Shared sub-components ────────────────────────────────────────────────────
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

// ─── Priority badge helper ────────────────────────────────────────────────────
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

// ─── Pending Review Requests ──────────────────────────────────────────────────
function PendingReviewRequests() {
  const [requests, setRequests] = useState<ReviewQueueItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [err, setErr]           = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await reviewService.getMyRequests();
        if (!cancelled) setRequests(Array.isArray(data) ? data : []);
      } catch (e: unknown) {
        if (!cancelled) setErr(extractErrorMessage(e, 'Could not load review requests'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Review Requests</h3>
        <Link
          to="/doctor/review-request"
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold transition"
        >
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
        </div>
      ) : err ? (
        <p className="text-xs text-slate-400 text-center py-4">{err}</p>
      ) : requests.length === 0 ? (
        <div className="text-center py-5">
          <p className="text-xs text-slate-400 mb-1">No review requests submitted yet.</p>
          <span className="text-xs text-blue-500 bg-blue-50 rounded-full px-2 py-0.5 font-semibold">
            Backend integration pending
          </span>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {requests.slice(0, 5).map((r) => {
            const PIcon = PRIORITY_ICON[r.priority] ?? Clock;
            const pColor = PRIORITY_COLOR[r.priority] ?? 'text-slate-400';
            return (
              <div key={r._id} className="flex items-center justify-between py-2.5 gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {r.patientName ?? 'Unknown Patient'}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{r.primaryDiagnosis ?? '—'}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <PIcon className={`w-3.5 h-3.5 ${pColor}`} />
                  <span className={`text-xs font-semibold capitalize ${pColor}`}>
                    {r.priority}
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

// ─── Recent Patients mini-list ────────────────────────────────────────────────
function RecentPatients() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await patientService.getPatients({
          sort: 'createdAt', dir: 'desc', pageSize: 5,
        });
        if (!cancelled) setPatients(Array.isArray(res.data) ? res.data : []);
      } catch (err: unknown) {
        if (!cancelled) setErrorMsg(extractErrorMessage(err, 'Could not load patients'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Recent Patients</h3>
        <Link
          to="/patients"
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold transition"
        >
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
        </div>
      ) : errorMsg ? (
        <p className="text-xs text-slate-400 text-center py-4">{errorMsg}</p>
      ) : patients.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-xs text-slate-400 mb-3">No patients registered yet.</p>
          <Link
            to="/patients/register"
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold transition"
          >
            <UserPlus className="w-3.5 h-3.5" /> Register first patient
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {patients.map((p) => (
            <div
              key={p._id}
              onClick={() => navigate(`/patients/${p._id}`)}
              className="flex items-center justify-between py-2.5 cursor-pointer hover:bg-blue-50/30 -mx-2 px-2 rounded-lg transition"
            >
              <div>
                <p className="text-sm font-semibold text-slate-800">{p.name}</p>
                <p className="text-xs text-slate-500">
                  {p.age} · {p.gender}
                  {p.totalECGs !== undefined && ` · ${p.totalECGs} ECG${p.totalECGs !== 1 ? 's' : ''}`}
                </p>
              </div>
              <div className="text-right shrink-0">
                {p.lastVisit && (
                  <p className="text-xs text-slate-400">
                    {new Date(p.lastVisit).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </p>
                )}
                <ArrowRight className="w-3.5 h-3.5 text-slate-300 ml-auto mt-0.5" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function DoctorDashboard() {
  const { session } = useAuth();
  const name = session?.user?.username ?? 'Doctor';
  const [stats, setStats] = useState<DoctorDashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await dashboardService.getDoctorStats();
        if (!cancelled) setStats(data);
      } catch {
        // non-fatal — stats show "—"
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <AppShell title="Doctor Dashboard">
      {/* Welcome */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Welcome back, {name}</h2>
        <p className="text-sm text-slate-500 mt-1">Here's your clinical overview for today.</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="ECGs Today"      value={statsLoading ? '…' : stats ? String(stats.ecgsToday) : '—'} sub={stats ? 'Today' : 'Awaiting backend'} />
        <StatCard label="Pending Reviews" value={statsLoading ? '…' : stats ? String(stats.pendingReviews) : '—'} sub={stats ? 'Active' : 'Awaiting backend'} accent="text-amber-600" />
        <StatCard label="Critical Alerts" value={statsLoading ? '…' : stats ? String(stats.criticalAlerts) : '—'} sub={stats ? 'Unresolved' : 'Awaiting backend'} accent="text-red-600" />
        <StatCard label="Patients"        value={statsLoading ? '…' : stats ? String(stats.totalPatients) : '—'} sub={stats ? 'Registered' : 'Awaiting backend'} />
      </div>

      {/* Primary action cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link
          to="/ecgupload"
          className="group bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-xl p-6 text-white shadow-lg shadow-blue-900/20 transition"
        >
          <Upload className="w-8 h-8 mb-4 opacity-90" />
          <h3 className="text-lg font-bold">Upload ECG</h3>
          <p className="text-sm text-blue-100 mt-1">Submit a new ECG for AI-powered analysis.</p>
        </Link>

        <Link
          to="/patients"
          className="group bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition"
        >
          <Users className="w-8 h-8 mb-4 text-blue-500" />
          <h3 className="text-lg font-bold text-slate-800">Patients</h3>
          <p className="text-sm text-slate-500 mt-1">View and manage your patient list.</p>
        </Link>

        <Link
          to="/patients/register"
          className="group bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition"
        >
          <UserPlus className="w-8 h-8 mb-4 text-emerald-500" />
          <h3 className="text-lg font-bold text-slate-800">Register Patient</h3>
          <p className="text-sm text-slate-500 mt-1">Create a new patient record before ECG upload.</p>
        </Link>
      </div>

      {/* Two-column: Recent Patients + Review Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <RecentPatients />
        <PendingReviewRequests />
      </div>

      {/* Module grid */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Modules</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <PlaceholderCard
              title="Recent ECG Uploads"
              description="Latest uploaded ECG analyses and their AI results."
              icon={Activity}
              accent="text-blue-500"
              bg="bg-blue-50"
              to="/doctor/insights"
            />
            <PlaceholderCard
              title="AI Insights"
              description="Aggregated condition trends and confidence distributions from recent analyses."
              icon={Brain}
              accent="text-purple-500"
              bg="bg-purple-50"
              to="/doctor/insights"
            />
            <PlaceholderCard
              title="Critical Alerts"
              description="Tier 1 emergency findings requiring immediate clinical action."
              icon={AlertTriangle}
              accent="text-red-500"
              bg="bg-red-50"
            />
            <PlaceholderCard
              title="Review Requests"
              description="Send ECG cases to a cardiologist for specialist review and override."
              icon={ClipboardList}
              accent="text-amber-500"
              bg="bg-amber-50"
              to="/doctor/review-request"
            />
            <PlaceholderCard
              title="Clinical Dashboard"
              description="Access patient clinical history and evidence fusion."
              icon={FlaskConical}
              accent="text-emerald-500"
              bg="bg-emerald-50"
              to="/doctor/clinical"
            />
            <PlaceholderCard
              title="Upcoming Appointments"
              description="Scheduled patient follow-ups and consultation reminders."
              icon={Clock}
              accent="text-teal-500"
              bg="bg-teal-50"
            />
          </div>
      </div>
    </AppShell>
  );
}
