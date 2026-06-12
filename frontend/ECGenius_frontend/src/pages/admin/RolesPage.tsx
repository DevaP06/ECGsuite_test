import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Key, Stethoscope, Heart, User, ShieldCheck, Loader2, AlertTriangle, RefreshCw, ArrowRight } from 'lucide-react';
import AppShell from '../../layouts/AppShell';
import { adminService } from '../../services/adminService';
import { extractErrorMessage } from '../../utils/errorUtils';
import { ROLE_DISPLAY_NAMES, type UserRole } from '../../types/rbac';
import type { AdminStats } from '../../types/admin';

interface RoleCardConfig {
  role: UserRole;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  bg: string;
  description: string;
}

const ROLE_CARDS: RoleCardConfig[] = [
  {
    role: 'PATIENT',
    icon: User,
    accent: 'text-emerald-500',
    bg: 'bg-emerald-50',
    description: 'Upload ECGs, view AI-generated reports, and track heart health history.',
  },
  {
    role: 'PHC_DOCTOR',
    icon: Stethoscope,
    accent: 'text-blue-500',
    bg: 'bg-blue-50',
    description: 'Manage patients, upload ECGs, view AI insights, and request specialist reviews.',
  },
  {
    role: 'CARDIOLOGIST',
    icon: Heart,
    accent: 'text-red-500',
    bg: 'bg-red-50',
    description: 'Review referred cases, validate or override AI diagnoses, and manage ontology rules.',
  },
  {
    role: 'ADMIN',
    icon: ShieldCheck,
    accent: 'text-purple-500',
    bg: 'bg-purple-50',
    description: 'Manage user accounts, roles, audit logs, system health, and model versions.',
  },
];

export default function RolesPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStats(await adminService.getStats());
    } catch (err: unknown) {
      setError(extractErrorMessage(err, 'Failed to load role distribution.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return (
    <AppShell title="Roles">
      <div className="space-y-5 pb-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Key className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Roles</h1>
              <p className="text-xs text-slate-500">
                {loading ? 'Loading role distribution…' : `${stats?.users.total ?? 0} total users across 4 roles`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 border border-gray-200 rounded-lg px-3 py-2 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[30vh] gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm text-slate-500">Loading roles…</p>
          </div>
        ) : error ? (
          <div className="max-w-md mx-auto mt-6 bg-white border border-red-200 rounded-xl p-6 text-center shadow-sm">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-800 mb-1">Failed to load roles</h3>
            <p className="text-sm text-slate-600 mb-4">{error}</p>
            <button
              onClick={fetchStats}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
            >
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ROLE_CARDS.map(({ role, icon: Icon, accent, bg, description }) => (
              <div key={role} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${accent}`} />
                  </div>
                  <p className="text-3xl font-bold text-slate-800">{stats?.users.byRole?.[role] ?? 0}</p>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-800">{ROLE_DISPLAY_NAMES[role]}</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{description}</p>
                </div>
                <Link
                  to={`/admin/users?role=${role}`}
                  className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition mt-auto pt-2"
                >
                  Manage users <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Note */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-start gap-3">
          <ShieldCheck className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800">
            Role reassignment is performed from the <Link to="/admin/users" className="font-semibold underline">Users</Link> page.
            Admins cannot change their own role — ask another admin if you need to update your access level.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
