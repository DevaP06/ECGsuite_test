import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock, Loader2, AlertTriangle, RefreshCw, Info, UploadCloud, Activity,
  ClipboardList, Send, CheckCircle2, ArrowRight,
} from 'lucide-react';
import AppShell from '../../layouts/AppShell';
import { ecgService } from '../../services/ecgService';
import { reviewService } from '../../services/reviewService';
import { getSubmittedAt } from '../../services/clinicalContextService';
import { extractErrorMessage } from '../../utils/errorUtils';
import { buildPatientHistory } from '../../utils/patientHistory';
import type { PatientHistoryEvent, PatientHistoryEventType } from '../../utils/patientHistory';
import type { ECGAnalysis } from '../../types/ecg';
import type { SpecialistReview } from '../../types/review';

const EVENT_DISPLAY: Record<PatientHistoryEventType, { icon: typeof UploadCloud; badgeClass: string }> = {
  upload:          { icon: UploadCloud,   badgeClass: 'bg-blue-50 text-blue-600 border-blue-200' },
  diagnosis:       { icon: Activity,      badgeClass: 'bg-purple-50 text-purple-600 border-purple-200' },
  clinicalContext: { icon: ClipboardList, badgeClass: 'bg-amber-50 text-amber-600 border-amber-200' },
  reviewRequested: { icon: Send,          badgeClass: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
  reviewCompleted: { icon: CheckCircle2,  badgeClass: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
};

const EVENT_TYPE_OPTIONS: { type: PatientHistoryEventType; label: string }[] = [
  { type: 'upload',           label: 'Uploads' },
  { type: 'diagnosis',        label: 'Diagnoses' },
  { type: 'clinicalContext',  label: 'Clinical Context' },
  { type: 'reviewRequested',  label: 'Review Requested' },
  { type: 'reviewCompleted',  label: 'Review Completed' },
];

const ALL_EVENT_TYPES = new Set<PatientHistoryEventType>(EVENT_TYPE_OPTIONS.map((o) => o.type));

function dateKey(iso: string): string {
  return iso.slice(0, 10);
}

function formatDateHeading(key: string): string {
  return new Date(key).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

export default function HistoryPage() {
  const [analyses, setAnalyses] = useState<ECGAnalysis[]>([]);
  const [reviews, setReviews] = useState<Map<string, SpecialistReview | null>>(new Map());
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [visibleTypes, setVisibleTypes] = useState<Set<PatientHistoryEventType>>(ALL_EVENT_TYPES);

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await ecgService.getMyAnalyses();
      setAnalyses(data);

      const reviewEntries = await Promise.all(
        data.map(async (a) => [a._id, await reviewService.getAnalysisReview(a._id)] as const),
      );
      setReviews(new Map(reviewEntries));
    } catch (err: unknown) {
      setFetchError(extractErrorMessage(err, 'Failed to load your history.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const timeline = useMemo(() => {
    const contextMap = new Map<string, string | null>();
    analyses.forEach((a) => contextMap.set(a._id, getSubmittedAt(a._id)));
    return buildPatientHistory(analyses, contextMap, reviews);
  }, [analyses, reviews]);

  const filtered = useMemo(
    () => timeline.filter((e) => visibleTypes.has(e.type)),
    [timeline, visibleTypes],
  );

  const groups = useMemo(() => {
    const map = new Map<string, PatientHistoryEvent[]>();
    filtered.forEach((event) => {
      const key = dateKey(event.timestamp);
      const bucket = map.get(key);
      if (bucket) bucket.push(event);
      else map.set(key, [event]);
    });
    return Array.from(map.entries());
  }, [filtered]);

  const toggleType = (type: PatientHistoryEventType) => {
    setVisibleTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next.size > 0 ? next : prev;
    });
  };

  const hasAnyHistory = timeline.length > 0;

  return (
    <AppShell title="History">
      <div className="max-w-4xl mx-auto space-y-5 pb-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-500" />
              History
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              A chronological timeline of your ECG uploads, diagnoses, clinical context submissions, and specialist reviews.
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-slate-600 hover:bg-gray-50 transition disabled:opacity-60 self-start sm:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {fetchError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-700">{fetchError}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin text-slate-400" />
          </div>
        ) : !hasAnyHistory ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center">
            <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700 mb-1">No activity yet</h3>
            <p className="text-sm text-slate-500">
              Your activity timeline will appear here once you upload an ECG and the diagnostic process begins.
            </p>
            <Link
              to="/ecgupload"
              className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-semibold text-white transition"
            >
              Upload an ECG
            </Link>
          </div>
        ) : (
          <>
            {/* Event-type filter chips */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide mr-1">Show:</span>
              {EVENT_TYPE_OPTIONS.map(({ type, label }) => {
                const active = visibleTypes.has(type);
                const { icon: Icon } = EVENT_DISPLAY[type];
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleType(type)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition ${
                      active
                        ? EVENT_DISPLAY[type].badgeClass
                        : 'bg-gray-50 text-gray-400 border-gray-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                );
              })}
            </div>

            {filtered.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center flex flex-col items-center gap-2">
                <Info className="w-5 h-5 text-slate-300" />
                <p className="text-sm text-slate-500">No events match the selected filters.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {groups.map(([key, events]) => (
                  <div key={key} className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide px-1">
                      {formatDateHeading(key)}
                    </h3>
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
                      {events.map((event, idx) => {
                        const { icon: Icon, badgeClass } = EVENT_DISPLAY[event.type];
                        return (
                          <div key={`${event.analysisId}-${event.type}-${idx}`} className="p-4 flex items-start gap-3">
                            <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center border ${badgeClass}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                                <h4 className="text-sm font-bold text-slate-800">{event.label}</h4>
                                <span className="text-xs text-slate-400 shrink-0">
                                  {new Date(event.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">{event.description}</p>
                              <Link
                                to={`/diagnosisdetail/${event.analysisId}`}
                                className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
                              >
                                View report <ArrowRight className="w-3 h-3" />
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
