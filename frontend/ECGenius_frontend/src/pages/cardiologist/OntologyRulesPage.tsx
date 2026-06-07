import { useState, useEffect, useCallback } from 'react';
import {
  BookOpen, Search, Loader2, AlertTriangle, RefreshCw,
  ChevronRight, Tag, Lock,
} from 'lucide-react';
import AppShell from '../../layouts/AppShell';
import { ontologyService } from '../../services/ontologyService';
import { extractErrorMessage } from '../../utils/errorUtils';
import type { OntologyRule, OntologySystem, OntologyUrgency } from '../../types/ontology';

// ─── Urgency badge ─────────────────────────────────────────────────────────────
const URGENCY_CLASS: Record<OntologyUrgency, string> = {
  critical: 'bg-red-50 text-red-700 border-red-200',
  high:     'bg-amber-50 text-amber-700 border-amber-200',
  moderate: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  low:      'bg-gray-50 text-gray-600 border-gray-200',
};

const SYSTEM_BADGE: Record<OntologySystem, { label: string; colorClass: string }> = {
  snomed:  { label: 'SNOMED CT', colorClass: 'bg-blue-50 text-blue-700 border-blue-200'     },
  icd10:   { label: 'ICD-10',    colorClass: 'bg-purple-50 text-purple-700 border-purple-200' },
  custom:  { label: 'Custom',    colorClass: 'bg-teal-50 text-teal-700 border-teal-200'       },
};

// ─── Rule detail modal ─────────────────────────────────────────────────────────
function RuleDetailModal({ rule, onClose }: { rule: OntologyRule; onClose: () => void }) {
  const sys    = SYSTEM_BADGE[rule.system] ?? SYSTEM_BADGE.custom;
  const urgBg  = URGENCY_CLASS[rule.urgencyTier] ?? URGENCY_CLASS.low;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-slate-800 break-words">{rule.display}</h2>
            <p className="text-xs font-mono text-slate-500 mt-0.5">{rule.code}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg font-bold leading-none mt-0.5 shrink-0"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${sys.colorClass}`}>
            {sys.label}
          </span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ${urgBg}`}>
            {rule.urgencyTier}
          </span>
          {rule.isEmergency && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full border bg-red-100 text-red-800 border-red-200">
              Emergency
            </span>
          )}
          {!rule.active && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full border bg-gray-100 text-gray-500 border-gray-200">
              Inactive
            </span>
          )}
        </div>

        <dl className="space-y-2 text-sm border-t border-gray-50 pt-3">
          <div className="flex justify-between">
            <dt className="text-slate-500">Confidence Threshold</dt>
            <dd className="font-semibold text-slate-800">{rule.confidenceThreshold}%</dd>
          </div>
          {rule.triageCategory && (
            <div className="flex justify-between">
              <dt className="text-slate-500">Triage Category</dt>
              <dd className="font-semibold text-slate-800">{rule.triageCategory}</dd>
            </div>
          )}
          {rule.version && (
            <div className="flex justify-between">
              <dt className="text-slate-500">Version</dt>
              <dd className="text-slate-700 font-mono text-xs">{rule.version}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-slate-500">Created</dt>
            <dd className="text-slate-700">{new Date(rule.createdAt).toLocaleDateString()}</dd>
          </div>
        </dl>

        {rule.triggerConditions && rule.triggerConditions.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
              Trigger Conditions
            </p>
            <ul className="space-y-1">
              {rule.triggerConditions.map((c, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        )}

        {rule.relatedCodes && rule.relatedCodes.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
              Related Codes
            </p>
            <div className="flex flex-wrap gap-1.5">
              {rule.relatedCodes.map((code) => (
                <span key={code} className="text-xs font-mono bg-gray-100 text-slate-600 rounded px-2 py-0.5">
                  {code}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
          <Lock className="w-3.5 h-3.5 text-slate-400" />
          <p className="text-xs text-slate-400">Read-only — editing requires backend permissions.</p>
        </div>
      </div>
    </div>
  );
}

// ─── Rule card ─────────────────────────────────────────────────────────────────
function RuleCard({ rule, onClick }: { rule: OntologyRule; onClick: () => void }) {
  const sys   = SYSTEM_BADGE[rule.system] ?? SYSTEM_BADGE.custom;
  const urgBg = URGENCY_CLASS[rule.urgencyTier] ?? URGENCY_CLASS.low;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:border-blue-200 transition group"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
          <Tag className="w-4 h-4 text-teal-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-slate-800 truncate">{rule.display}</p>
            {rule.isEmergency && (
              <span className="text-xs font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                Emergency
              </span>
            )}
          </div>
          <p className="text-xs font-mono text-slate-400 mt-0.5 truncate">{rule.code}</p>
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full border ${sys.colorClass}`}>
              {sys.label}
            </span>
            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full border capitalize ${urgBg}`}>
              {rule.urgencyTier}
            </span>
            <span className="text-xs text-slate-400">
              ≥{rule.confidenceThreshold}% confidence
            </span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 shrink-0 mt-1 transition" />
      </div>
    </button>
  );
}

// ─── Tab types ────────────────────────────────────────────────────────────────
type TabSystem = 'all' | OntologySystem;

const TABS: { value: TabSystem; label: string }[] = [
  { value: 'all',    label: 'All Rules' },
  { value: 'snomed', label: 'SNOMED CT' },
  { value: 'icd10',  label: 'ICD-10'   },
  { value: 'custom', label: 'Custom'   },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function OntologyRulesPage() {
  const [rules, setRules]         = useState<OntologyRule[]>([]);
  const [loading, setLoading]     = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [search, setSearch]       = useState('');
  const [tab, setTab]             = useState<TabSystem>('all');
  const [urgFilter, setUrgFilter] = useState<OntologyUrgency | 'all'>('all');
  const [selected, setSelected]   = useState<OntologyRule | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await ontologyService.getRules();
      setRules(data);
    } catch (err: unknown) {
      setFetchError(extractErrorMessage(err, 'Failed to load ontology rules.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = rules.filter((r) => {
    if (tab !== 'all' && r.system !== tab) return false;
    if (urgFilter !== 'all' && r.urgencyTier !== urgFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !r.display.toLowerCase().includes(q) &&
        !r.code.toLowerCase().includes(q) &&
        !r.triageCategory?.toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  return (
    <AppShell title="Ontology Rules">
      <div className="max-w-5xl mx-auto space-y-5 pb-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-teal-500" />
              Ontology Rules
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              SNOMED CT and ICD-10 mapping rules for AI-assisted diagnosis enrichment.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-500 font-medium">Read-only</span>
            </div>
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-slate-600 hover:bg-gray-50 transition disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters row */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by code, display name, or category…"
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
            />
          </div>

          {/* Tab filter */}
          <div className="flex items-center gap-1 flex-wrap">
            {TABS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTab(t.value)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                  tab === t.value
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                }`}
              >
                {t.label}
              </button>
            ))}
            <div className="w-px h-5 bg-gray-200 mx-1" />
            {(['all', 'critical', 'high', 'moderate', 'low'] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUrgFilter(u)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition capitalize ${
                  urgFilter === u
                    ? 'bg-slate-700 text-white'
                    : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                }`}
              >
                {u === 'all' ? 'All Urgency' : u}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {fetchError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-700">{fetchError}</p>
            <button
              type="button"
              onClick={load}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
          </div>
        ) : rules.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 flex flex-col items-center gap-3 text-center">
            <BookOpen className="w-10 h-10 text-gray-300" />
            <h3 className="text-base font-bold text-slate-700">No ontology rules available</h3>
            <p className="text-sm text-slate-400 max-w-sm">
              SNOMED CT and ICD-10 mapping rules will appear here once the backend ontology
              management endpoints are implemented.
            </p>
            <span className="text-xs text-teal-600 bg-teal-50 px-3 py-1.5 rounded-full font-semibold">
              Backend integration pending
            </span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
            <p className="text-sm text-slate-400">No rules match the current filters.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-400">
              Showing {filtered.length} of {rules.length} rules
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filtered.map((rule) => (
                <RuleCard key={rule._id} rule={rule} onClick={() => setSelected(rule)} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Rule detail modal */}
      {selected && (
        <RuleDetailModal rule={selected} onClose={() => setSelected(null)} />
      )}
    </AppShell>
  );
}
