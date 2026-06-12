import { useState, useEffect, useCallback } from 'react';
import { Server, Loader2, AlertTriangle, RefreshCw, Activity, ClipboardList, ScrollText, Cpu } from 'lucide-react';
import AppShell from '../../layouts/AppShell';
import { adminService } from '../../services/adminService';
import { extractErrorMessage } from '../../utils/errorUtils';
import type { SystemHealth } from '../../types/admin';

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function MetricCard({
  label, value, sub, icon: Icon, accent = 'text-slate-600', bg = 'bg-slate-100',
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: string;
  bg?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
        <Icon className={`w-5 h-5 ${accent}`} />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-slate-800 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function SystemHealthPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setHealth(await adminService.getHealth());
    } catch (err: unknown) {
      setError(extractErrorMessage(err, 'Failed to load system health.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHealth(); }, [fetchHealth]);

  return (
    <AppShell title="System Health">
      <div className="space-y-5 pb-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Server className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">System Health</h1>
              <p className="text-xs text-slate-500">Live platform performance and queue metrics</p>
            </div>
          </div>
          <button
            type="button"
            onClick={fetchHealth}
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
            <p className="text-sm text-slate-500">Loading system health…</p>
          </div>
        ) : error ? (
          <div className="max-w-md mx-auto mt-6 bg-white border border-red-200 rounded-xl p-6 text-center shadow-sm">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-800 mb-1">Failed to load system health</h3>
            <p className="text-sm text-slate-600 mb-4">{error}</p>
            <button
              onClick={fetchHealth}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
            >
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        ) : health && (
          <>
            {/* Server */}
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Server</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <MetricCard label="Uptime" value={formatUptime(health.server.uptimeSeconds)} icon={Server} accent="text-emerald-500" bg="bg-emerald-50" />
                <MetricCard label="Node Version" value={health.server.nodeVersion} icon={Cpu} accent="text-blue-500" bg="bg-blue-50" />
                <MetricCard label="Memory Usage" value={`${health.server.memoryMb} MB`} icon={Activity} accent="text-purple-500" bg="bg-purple-50" />
              </div>
            </div>

            {/* Analysis queue */}
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Analysis Queue</h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <MetricCard label="Total Pending" value={String(health.analysisQueue.total)} icon={ClipboardList} accent="text-slate-600" bg="bg-slate-100" />
                <MetricCard label="Uploaded" value={String(health.analysisQueue.byStatus.uploaded)} icon={ClipboardList} accent="text-slate-500" bg="bg-slate-100" />
                <MetricCard label="Processing" value={String(health.analysisQueue.byStatus.processing)} icon={ClipboardList} accent="text-amber-500" bg="bg-amber-50" />
                <MetricCard label="Pending Review" value={String(health.analysisQueue.byStatus.pending)} icon={ClipboardList} accent="text-blue-500" bg="bg-blue-50" />
              </div>
            </div>

            {/* Throughput (24h) */}
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Throughput (Last 24h)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <MetricCard label="Total Analyses" value={String(health.throughput24h.total)} icon={Activity} accent="text-slate-600" bg="bg-slate-100" />
                <MetricCard label="Completed" value={String(health.throughput24h.completed)} icon={Activity} accent="text-emerald-500" bg="bg-emerald-50" />
                <MetricCard label="Failed" value={String(health.throughput24h.failed)} icon={Activity} accent="text-red-500" bg="bg-red-50" />
                <MetricCard
                  label="Success Rate"
                  value={`${health.throughput24h.successRate}%`}
                  sub={health.throughput24h.avgProcessingSeconds != null ? `Avg ${health.throughput24h.avgProcessingSeconds}s processing` : undefined}
                  icon={Activity}
                  accent={health.throughput24h.successRate >= 90 ? 'text-emerald-500' : health.throughput24h.successRate >= 70 ? 'text-amber-500' : 'text-red-500'}
                  bg={health.throughput24h.successRate >= 90 ? 'bg-emerald-50' : health.throughput24h.successRate >= 70 ? 'bg-amber-50' : 'bg-red-50'}
                />
              </div>
            </div>

            {/* Review queue */}
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Specialist Review Queue</h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <MetricCard label="Critical" value={String(health.reviewQueue.critical)} icon={AlertTriangle} accent="text-red-500" bg="bg-red-50" />
                <MetricCard label="Urgent" value={String(health.reviewQueue.urgent)} icon={AlertTriangle} accent="text-amber-500" bg="bg-amber-50" />
                <MetricCard label="Normal" value={String(health.reviewQueue.normal)} icon={ClipboardList} accent="text-blue-500" bg="bg-blue-50" />
                <MetricCard label="Total Queued" value={String(health.reviewQueue.total)} icon={ClipboardList} accent="text-slate-600" bg="bg-slate-100" />
              </div>
            </div>

            {/* Audit activity */}
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Audit Activity</h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <MetricCard label="Events (Last Hour)" value={String(health.auditActivity.eventsLastHour)} icon={ScrollText} accent="text-slate-600" bg="bg-slate-100" />
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
