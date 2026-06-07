import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users, UserPlus, Search, Loader2, AlertTriangle,
  ChevronLeft, ChevronRight, RefreshCw,
} from 'lucide-react';
import AppShell from '../../layouts/AppShell';
import { patientService } from '../../services/patientService';
import { isDoctor } from '../../features/auth/roleUtils';
import { extractErrorMessage } from '../../utils/errorUtils';
import type { PatientListItem, PatientQuery } from '../../types/patient';

const PAGE_SIZE = 10;

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status?: string }) {
  if (!status) return <span className="text-slate-400 text-xs">—</span>;
  const classes =
    status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
    status === 'failed'    ? 'bg-red-50 text-red-700'         :
    status === 'processing'? 'bg-yellow-50 text-yellow-700'   :
                             'bg-slate-50 text-slate-600';
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${classes}`}>
      {status}
    </span>
  );
}

// ─── Sort control ─────────────────────────────────────────────────────────────
type SortKey = PatientQuery['sort'];

function SortButton({
  label, sortKey, current, dir, onClick,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: 'asc' | 'desc';
  onClick: (key: SortKey) => void;
}) {
  const isActive = current === sortKey;
  return (
    <button
      type="button"
      onClick={() => onClick(sortKey)}
      className={`text-xs font-semibold px-2 py-1 rounded transition ${
        isActive
          ? 'bg-blue-50 text-blue-700'
          : 'text-slate-500 hover:bg-gray-50'
      }`}
    >
      {label} {isActive ? (dir === 'asc' ? '↑' : '↓') : ''}
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PatientListPage() {
  const navigate = useNavigate();
  const canRegister = isDoctor();

  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('createdAt');
  const [dir, setDir] = useState<'asc' | 'desc'>('desc');

  // Debounce search query
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState('');

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

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await patientService.getPatients({
        q: debouncedQuery || undefined,
        sort,
        dir,
        page,
        pageSize: PAGE_SIZE,
      });
      setPatients(Array.isArray(res.data) ? res.data : []);
      setTotal(res.total);
    } catch (err: unknown) {
      setError(extractErrorMessage(err, 'Failed to load patients.'));
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, sort, dir, page]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  const toggleSort = (key: SortKey) => {
    if (sort === key) {
      setDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSort(key);
      setDir('asc');
    }
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AppShell title="Patients">
      <div className="space-y-5 pb-10">

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Patients</h1>
              {!loading && !error && (
                <p className="text-xs text-slate-500">{total} patient{total !== 1 ? 's' : ''} registered</p>
              )}
            </div>
          </div>

          {canRegister && (
            <Link
              to="/patients/register"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-semibold text-white transition shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              Register Patient
            </Link>
          )}
        </div>

        {/* Search + Sort toolbar */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by patient name…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-xs text-slate-400 mr-1">Sort:</span>
            <SortButton label="Name"       sortKey="name"      current={sort} dir={dir} onClick={toggleSort} />
            <SortButton label="Age"        sortKey="age"       current={sort} dir={dir} onClick={toggleSort} />
            <SortButton label="Last Visit" sortKey="lastVisit" current={sort} dir={dir} onClick={toggleSort} />
            <SortButton label="Added"      sortKey="createdAt" current={sort} dir={dir} onClick={toggleSort} />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[30vh] gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm text-slate-500">Loading patients…</p>
          </div>
        ) : error ? (
          <div className="max-w-md mx-auto mt-6 bg-white border border-red-200 rounded-xl p-6 text-center shadow-sm">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-800 mb-1">Failed to load patients</h3>
            <p className="text-sm text-slate-600 mb-4">{error}</p>
            <button
              onClick={fetchPatients}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
            >
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        ) : patients.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-200 p-10 text-center">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-700 mb-1">No patients found</h3>
            {debouncedQuery ? (
              <p className="text-sm text-slate-500">
                No results for "<span className="font-medium">{debouncedQuery}</span>". Try a different search.
              </p>
            ) : (
              <p className="text-sm text-slate-500">
                {canRegister
                  ? 'Register your first patient to get started.'
                  : 'No patients have been registered yet.'}
              </p>
            )}
            {canRegister && !debouncedQuery && (
              <Link
                to="/patients/register"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
              >
                <UserPlus className="w-4 h-4" />
                Register First Patient
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Patient table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Patient</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Age / Gender</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide hidden md:table-cell">Last ECG</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide hidden lg:table-cell">ECGs</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Latest Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {patients.map((p) => (
                    <tr
                      key={p._id}
                      className="hover:bg-blue-50/30 cursor-pointer transition"
                      onClick={() => navigate(`/patients/${p._id}`)}
                    >
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-slate-800">{p.name}</p>
                        <p className="text-xs text-slate-500 sm:hidden">{p.age} · {p.gender}</p>
                      </td>
                      <td className="px-4 py-3.5 hidden sm:table-cell text-slate-600">
                        {p.age} · {p.gender}
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell text-slate-500 text-xs">
                        {p.lastVisit
                          ? new Date(p.lastVisit).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell text-slate-600">
                        {p.totalECGs ?? '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={p.latestStatus} />
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="text-xs font-semibold text-blue-600">View →</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between text-sm">
              <p className="text-xs text-slate-500">
                Page {page} of {totalPages} · {total} patient{total !== 1 ? 's' : ''}
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
