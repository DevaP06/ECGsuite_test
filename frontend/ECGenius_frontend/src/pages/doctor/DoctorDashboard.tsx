import {
  Upload, Users, Activity, AlertTriangle, ClipboardList,
  Clock, FlaskConical, Brain,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import AppShell from '../../layouts/AppShell';
import { useAuth } from '../../features/auth/useAuth';

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

export default function DoctorDashboard() {
  const { session } = useAuth();
  const name = session?.user?.username ?? 'Doctor';

  return (
    <AppShell title="Doctor Dashboard">
      {/* Welcome */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Welcome back, {name}</h2>
        <p className="text-sm text-slate-500 mt-1">Here's your clinical overview for today.</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="ECGs Today"      value="—" sub="Awaiting backend" />
        <StatCard label="Pending Reviews" value="—" sub="Awaiting backend" accent="text-amber-600" />
        <StatCard label="Critical Alerts" value="—" sub="Awaiting backend" accent="text-red-600" />
        <StatCard label="Patients"        value="—" sub="Awaiting backend" />
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
          to="/doctor/clinical"
          className="group bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition"
        >
          <FlaskConical className="w-8 h-8 mb-4 text-emerald-500" />
          <h3 className="text-lg font-bold text-slate-800">Clinical Dashboard</h3>
          <p className="text-sm text-slate-500 mt-1">Access patient clinical history and evidence fusion.</p>
        </Link>
      </div>

      {/* Module grid */}
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Modules</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <PlaceholderCard
          title="Recent ECG Uploads"
          description="Latest uploaded ECG analyses and their AI results."
          icon={Activity}
          accent="text-blue-500"
          bg="bg-blue-50"
          to="/doctor/insights"
        />
        <PlaceholderCard
          title="Recent Patients"
          description="Recently updated patient records and consultations."
          icon={Users}
          accent="text-slate-500"
          bg="bg-slate-100"
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
          title="Upcoming Appointments"
          description="Scheduled patient follow-ups and consultation reminders."
          icon={Clock}
          accent="text-teal-500"
          bg="bg-teal-50"
        />
      </div>
    </AppShell>
  );
}
