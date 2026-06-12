import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Users, Search, Loader2, AlertTriangle, ChevronLeft, ChevronRight,
  RefreshCw, CheckCircle2, XCircle, Shield,
} from 'lucide-react';
import AppShell from '../../layouts/AppShell';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../features/auth/useAuth';
import { extractErrorMessage } from '../../utils/errorUtils';
import { ROLE_DISPLAY_NAMES, type UserRole } from '../../types/rbac';
import type { AdminUser, UserStatus } from '../../types/admin';

const PAGE_SIZE = 20;

const ROLE_OPTIONS: UserRole[] = ['PATIENT', 'PHC_DOCTOR', 'CARDIOLOGIST', 'ADMIN'];
const STATUS_OPTIONS: UserStatus[] = ['active', 'inactive', 'suspended'];

const ROLE_BADGE: Record<UserRole, string> = {
  ADMIN: 'bg-purple-50 text-purple-700',
  CARDIOLOGIST: 'bg-blue-50 text-blue-700',
  PHC_DOCTOR: 'bg-emerald-50 text-emerald-700',
  PATIENT: 'bg-slate-50 text-slate-600',
};

const STATUS_BADGE: Record<UserStatus, string> = {
  active: 'bg-emerald-50 text-emerald-700',
  inactive: 'bg-slate-50 text-slate-600',
  suspended: 'bg-red-50 text-red-700',
};

function formatDate(value?: string | null): string {
  if (!value) return 'Never';
  return new Date(value).toLocaleDateString();
}

export default function UsersPage() {
  const { session } = useAuth();
  const selfId = session?.user?.id;
  const [searchParams] = useSearchParams();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>(() => {
    const initial = searchParams.get('role');
    return ROLE_OPTIONS.includes(initial as UserRole) ? (initial as UserRole) : '';
  });
  const [statusFilter, setStatusFilter] = useState<UserStatus | ''>('');

  const [updating, setUpdating] = useState<{ id: string; field: 'role' | 'status' } | null>(null);

  // Debounce search query
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 350);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getUsers({
        page,
        limit: PAGE_SIZE,
        search: debouncedQuery || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
      });
      setUsers(res.users ?? []);
      setTotal(res.pagination?.total ?? 0);
    } catch (err: unknown) {
      setError(extractErrorMessage(err, 'Failed to load users.'));
    } finally {
      setLoading(false);
    }
  }, [page, debouncedQuery, roleFilter, statusFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleRoleChange = async (user: AdminUser, role: UserRole) => {
    if (role === user.role) return;
    if (!window.confirm(`Change ${user.username}'s role from ${ROLE_DISPLAY_NAMES[user.role]} to ${ROLE_DISPLAY_NAMES[role]}?`)) {
      return;
    }
    setUpdating({ id: user._id, field: 'role' });
    try {
      const updated = await adminService.updateUserRole(user._id, role);
      setUsers((prev) => prev.map((u) => (u._id === updated._id ? updated : u)));
      toast.success(`${user.username}'s role updated to ${ROLE_DISPLAY_NAMES[role]}.`);
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err, 'Failed to update role.'));
    } finally {
      setUpdating(null);
    }
  };

  const handleStatusChange = async (user: AdminUser, status: UserStatus) => {
    if (status === user.status) return;
    setUpdating({ id: user._id, field: 'status' });
    try {
      const updated = await adminService.updateUserStatus(user._id, status);
      setUsers((prev) => prev.map((u) => (u._id === updated._id ? updated : u)));
      toast.success(`${user.username}'s status updated to ${status}.`);
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err, 'Failed to update status.'));
    } finally {
      setUpdating(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AppShell title="Users">
      <div className="space-y-5 pb-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Users</h1>
              {!loading && !error && (
                <p className="text-xs text-slate-500">{total} user{total !== 1 ? 's' : ''} registered</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={fetchUsers}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 border border-gray-200 rounded-lg px-3 py-2 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by username, email, or name…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value as UserRole | ''); setPage(1); }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition shrink-0"
          >
            <option value="">All roles</option>
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>{ROLE_DISPLAY_NAMES[r]}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as UserStatus | ''); setPage(1); }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition shrink-0 capitalize"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s} className="capitalize">{s}</option>
            ))}
          </select>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[30vh] gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm text-slate-500">Loading users…</p>
          </div>
        ) : error ? (
          <div className="max-w-md mx-auto mt-6 bg-white border border-red-200 rounded-xl p-6 text-center shadow-sm">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-800 mb-1">Failed to load users</h3>
            <p className="text-sm text-slate-600 mb-4">{error}</p>
            <button
              onClick={fetchUsers}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
            >
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-200 p-10 text-center">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-700 mb-1">No users found</h3>
            <p className="text-sm text-slate-500">
              {debouncedQuery || roleFilter || statusFilter
                ? 'Try adjusting your search or filters.'
                : 'No users have registered yet.'}
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">User</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Role</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide hidden md:table-cell">Verified</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Last Login</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map((u) => {
                    const isSelf = !!selfId && String(selfId) === String(u._id);
                    const roleUpdating = updating?.id === u._id && updating.field === 'role';
                    const statusUpdating = updating?.id === u._id && updating.field === 'status';
                    return (
                      <tr key={u._id} className="hover:bg-blue-50/30 transition">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-800">{u.username}</p>
                            {isSelf && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600">
                                <Shield className="w-3 h-3" /> You
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">{u.email}</p>
                          {u.fullName && <p className="text-xs text-slate-400">{u.fullName}</p>}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_BADGE[u.role]}`}>
                              {ROLE_DISPLAY_NAMES[u.role]}
                            </span>
                            {roleUpdating && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
                          </div>
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u, e.target.value as UserRole)}
                            disabled={isSelf || roleUpdating}
                            title={isSelf ? 'You cannot change your own role' : 'Change role'}
                            className="mt-1.5 text-xs border border-slate-200 rounded-md px-1.5 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {ROLE_OPTIONS.map((r) => (
                              <option key={r} value={r}>{ROLE_DISPLAY_NAMES[r]}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_BADGE[u.status]}`}>
                              {u.status}
                            </span>
                            {statusUpdating && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
                          </div>
                          <select
                            value={u.status}
                            onChange={(e) => handleStatusChange(u, e.target.value as UserStatus)}
                            disabled={isSelf || statusUpdating}
                            title={isSelf ? 'You cannot change your own status' : 'Change status'}
                            className="mt-1.5 text-xs border border-slate-200 rounded-md px-1.5 py-1 capitalize focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s} className="capitalize">{s}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3.5 hidden md:table-cell">
                          {u.isVerified ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-slate-300" />
                          )}
                        </td>
                        <td className="px-4 py-3.5 hidden lg:table-cell text-slate-500 text-xs">
                          {formatDate(u.lastLogin)}
                        </td>
                        <td className="px-4 py-3.5 hidden lg:table-cell text-slate-500 text-xs">
                          {formatDate(u.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between text-sm">
              <p className="text-xs text-slate-500">
                Page {page} of {totalPages} · {total} user{total !== 1 ? 's' : ''}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 text-xs text-slate-600 font-medium">{page}</span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
