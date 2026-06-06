import { Users, Server, ScrollText, Cpu, ShieldCheck, Key, HardDrive } from 'lucide-react';
import { Link } from 'react-router-dom';
import AppShell from '../../layouts/AppShell';
import { useAuth } from '../../features/auth/useAuth';

function PlaceholderCard({
  title, description, icon: Icon, accent = 'text-slate-400', bg = 'bg-gray-100', badge, to,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: string;
  bg?: string;
  badge?: string;
  to?: string;
}) {
  const inner = (
    <div className="bg-white rounded-xl border border-dashed border-gray-200 p-6 flex flex-col gap-3 hover:border-blue-200 hover:shadow-sm transition">
      <div className="flex items-start justify-between">
        <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${accent}`} />
        </div>
        {badge && (
          <span className={`text-xs font-medium rounded-full px-2.5 py-0.5 ${badge}`}>
            Restricted
          </span>
        )}
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

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${accent ?? 'text-slate-800'}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const { session } = useAuth();
  const name = session?.user?.username ?? 'Admin';

  return (
    <AppShell title="Platform Admin">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Platform Overview</h2>
          <p className="text-sm text-slate-500 mt-1">
            Logged in as <span className="font-semibold">{name}</span> · Platform Admin
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-semibold text-emerald-700">Admin Access</span>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Users"    value="—" sub="Awaiting backend" />
        <StatCard label="ECGs Processed" value="—" sub="Awaiting backend" accent="text-blue-600" />
        <StatCard label="System Health"  value="—" sub="Awaiting backend" accent="text-emerald-600" />
        <StatCard label="Active Models"  value="—" sub="Awaiting backend" />
      </div>

      {/* Access notice */}
      <div className="mb-8 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-start gap-3">
        <ShieldCheck className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-sm text-amber-800">
          <span className="font-semibold">Admin only:</span> You have platform management access but cannot submit
          clinical ECG reviews. Clinical review actions are restricted to Cardiologist accounts.
        </p>
      </div>

      {/* Module grid */}
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Admin Modules</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <PlaceholderCard
          title="Users"
          description="Create, suspend, and manage user accounts across all roles (Doctor, Cardiologist, Patient)."
          icon={Users}
          accent="text-blue-500"
          bg="bg-blue-50"
          to="/admin/users"
        />
        <PlaceholderCard
          title="Roles"
          description="Manage role assignments and permissions for all platform actors."
          icon={Key}
          accent="text-indigo-500"
          bg="bg-indigo-50"
          to="/admin/roles"
        />
        <PlaceholderCard
          title="Audit Logs"
          description="Complete audit trail of all user actions, diagnoses generated, and data access events."
          icon={ScrollText}
          accent="text-slate-500"
          bg="bg-slate-100"
          to="/admin/audit"
        />
        <PlaceholderCard
          title="System Health"
          description="Real-time monitoring of API health, database connections, and model inference services."
          icon={Server}
          accent="text-emerald-500"
          bg="bg-emerald-50"
          to="/admin/system"
        />
        <PlaceholderCard
          title="Models"
          description="Monitor AI model versions, inference accuracy metrics, and deployment health."
          icon={Cpu}
          accent="text-purple-500"
          bg="bg-purple-50"
          to="/admin/models"
        />
        <PlaceholderCard
          title="Resources"
          description="Platform usage statistics, storage consumption, and compute resource allocation."
          icon={HardDrive}
          accent="text-orange-500"
          bg="bg-orange-50"
        />
      </div>
    </AppShell>
  );
}
