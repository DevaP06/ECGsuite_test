import { Upload, FileText, AlertTriangle, Clock, History, Bell } from 'lucide-react';
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
    <div className="bg-white rounded-xl border border-dashed border-gray-200 p-6 flex flex-col gap-3 hover:border-blue-200 hover:shadow-sm transition">
      <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${accent}`} />
      </div>
      <div>
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

export default function PatientDashboard() {
  const { session } = useAuth();
  const name = session?.user?.username ?? 'there';

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

      {/* Module grid */}
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">My Modules</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <PlaceholderCard
          title="My Reports"
          description="View AI analysis results for your previously uploaded ECGs."
          icon={FileText}
          accent="text-blue-500"
          bg="bg-blue-50"
          to="/patient/reports"
        />
        <PlaceholderCard
          title="Risk Summary"
          description="A rolling summary of your heart health indicators and risk trends over time."
          icon={AlertTriangle}
          accent="text-amber-500"
          bg="bg-amber-50"
          to="/patient/risk"
        />
        <PlaceholderCard
          title="History"
          description="Complete timeline of your ECG uploads, diagnoses, and review outcomes."
          icon={History}
          accent="text-slate-500"
          bg="bg-slate-100"
          to="/patient/history"
        />
        <PlaceholderCard
          title="Review Status"
          description="Track whether a cardiologist has reviewed your referred case."
          icon={Clock}
          accent="text-purple-500"
          bg="bg-purple-50"
        />
        <PlaceholderCard
          title="Emergency Alerts"
          description="Notifications for any critical findings detected in your ECG analyses."
          icon={Bell}
          accent="text-red-500"
          bg="bg-red-50"
        />
      </div>
    </AppShell>
  );
}
