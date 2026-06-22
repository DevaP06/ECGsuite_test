import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  ClipboardList, Loader2, AlertTriangle, FileSearch, ActivitySquare, ShieldCheck,
  CheckCircle2, X, ArrowLeft,
} from 'lucide-react';
import toast from 'react-hot-toast';
import AppShell from '../../layouts/AppShell';
import { ecgService } from '../../services/ecgService';
import { reviewService } from '../../services/reviewService';
import { extractErrorMessage } from '../../utils/errorUtils';
import type { ECGAnalysis } from '../../types/ecg';
import type { ReviewPriority } from '../../types/review';

interface PriorityOption {
  value: ReviewPriority;
  label: string;
  desc: string;
  selected: string;
  unselected: string;
  badge: string;
}

const PRIORITY_OPTIONS: PriorityOption[] = [
  {
    value: 'normal',
    label: 'Normal',
    desc: 'Standard review within 48 hours',
    selected: 'border-blue-400 bg-blue-50 text-blue-700',
    unselected: 'border-gray-200 hover:border-gray-300 text-slate-600',
    badge: 'bg-blue-50 text-blue-600',
  },
  {
    value: 'urgent',
    label: 'Urgent',
    desc: 'Priority review within 24 hours',
    selected: 'border-amber-400 bg-amber-50 text-amber-700',
    unselected: 'border-gray-200 hover:border-gray-300 text-slate-600',
    badge: 'bg-amber-50 text-amber-600',
  },
  {
    value: 'critical',
    label: 'Critical',
    desc: 'SLA Tier 1 — 4-hour response',
    selected: 'border-red-400 bg-red-50 text-red-700',
    unselected: 'border-gray-200 hover:border-gray-300 text-slate-600',
    badge: 'bg-red-50 text-red-600',
  },
];

export default function ReviewRequestPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedId = searchParams.get('analysisId');

  const [analyses, setAnalyses] = useState<ECGAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(preselectedId);
  const [priority, setPriority] = useState<ReviewPriority>('normal');
  const [notes, setNotes] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const data = await ecgService.getMyAnalyses();
        if (cancelled) return;
        const completed = data.filter((a) => a.status === 'completed' && a.analysisResult);
        setAnalyses(completed);
        if (!preselectedId && completed.length > 0) {
          setSelectedId(completed[0]._id);
        }
      } catch (err: unknown) {
        if (!cancelled) setFetchError(extractErrorMessage(err, 'Failed to load your ECG analyses.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [preselectedId]);

  const selected = useMemo(
    () => analyses.find((a) => a._id === selectedId) ?? null,
    [analyses, selectedId]
  );

  const priorityOpt = PRIORITY_OPTIONS.find((o) => o.value === priority)!;

  const handleConfirmSubmit = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await reviewService.requestReview({
        analysisId: selected._id,
        patientId: selected.userId,
        priority,
        notes: notes.trim() || undefined,
      });
      toast.success('Specialist review requested successfully.');
      setConfirmOpen(false);
      setSubmitted(true);
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err, 'Failed to submit review request.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell title="Request Review">
      <div className="max-w-4xl mx-auto space-y-5 pb-10">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-amber-500" />
              Request Specialist Review
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Send an ECG case to a cardiologist for expert review and override.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-slate-600 hover:bg-gray-50 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>

        {submitted && selected ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="text-lg font-bold text-slate-800">Review request submitted</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Your request for <span className="font-semibold text-slate-700">{selected.patientInfo.name}</span>'s
              ECG case has been sent to the cardiologist review queue with{' '}
              <span className="font-semibold">{priority}</span> priority.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Link
                to={`/clinical-dashboard/${selected._id}`}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-semibold text-white transition"
              >
                View Clinical Dashboard
              </Link>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setNotes('');
                  setPriority('normal');
                }}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-slate-600 hover:bg-gray-50 transition"
              >
                Submit Another Request
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Select analysis */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                <FileSearch className="w-4 h-4 text-slate-400" />
                Select ECG Case
              </h3>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
                </div>
              ) : fetchError ? (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {fetchError}
                </div>
              ) : analyses.length === 0 ? (
                <p className="text-sm text-slate-400 italic py-4 text-center">
                  No completed ECG analyses available to send for review.
                </p>
              ) : (
                <select
                  value={selectedId ?? ''}
                  onChange={(e) => setSelectedId(e.target.value || null)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                >
                  {analyses.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.patientInfo.name} · {a.analysisResult?.rhythm ?? 'Unknown rhythm'} · {new Date(a.createdAt).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {selected && (
              <>
                {/* Review preview */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                    <ActivitySquare className="w-4 h-4 text-slate-400" />
                    Review Preview
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-lg border border-gray-100 px-3 py-3">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Diagnosis</p>
                      <p className="text-sm font-bold text-slate-700 mt-1">
                        {selected.analysisResult?.rhythm ?? 'Not provided'}
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-100 px-3 py-3">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Confidence</p>
                      <p className="text-sm font-bold text-slate-700 mt-1">
                        {selected.analysisResult?.confidence !== undefined ? `${selected.analysisResult.confidence}%` : 'Not provided'}
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-100 px-3 py-3">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Patient</p>
                      <p className="text-sm font-bold text-slate-700 mt-1">
                        {selected.patientInfo.name} · {selected.patientInfo.age}{selected.patientInfo.gender ? `, ${selected.patientInfo.gender}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-100 px-3 py-3">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">ECG Summary</p>
                    {(selected.analysisResult?.abnormalities?.length ?? 0) > 0 ? (
                      <ul className="space-y-1">
                        {selected.analysisResult?.abnormalities.map((f, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-400 italic">No abnormalities reported.</p>
                    )}
                  </div>
                </div>

                {/* Priority selector */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-slate-400" />
                    Priority Level
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {PRIORITY_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setPriority(opt.value)}
                        className={`flex flex-col gap-0.5 p-3.5 rounded-xl border-2 text-left transition ${
                          priority === opt.value ? opt.selected : opt.unselected
                        }`}
                      >
                        <span className="text-sm font-bold">{opt.label}</span>
                        <span className="text-xs opacity-70 leading-tight">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clinical notes */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-2">
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-slate-400" />
                    Clinical Notes <span className="text-slate-400 font-normal normal-case">(optional)</span>
                  </h3>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Describe the specific concerns you'd like the specialist to address…"
                    rows={5}
                    maxLength={2000}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                  />
                  <p className="text-xs text-slate-400 text-right">{notes.length}/2000</p>
                </div>

                {/* Submit */}
                <div className="flex items-center justify-end gap-3">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${priorityOpt.badge}`}>
                    {priority.toUpperCase()} PRIORITY
                  </span>
                  <button
                    type="button"
                    onClick={() => setConfirmOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-sm font-semibold text-white transition"
                  >
                    <ClipboardList className="w-4 h-4" />
                    Review &amp; Submit Request
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Confirmation modal */}
      {confirmOpen && selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          onClick={(e) => { if (e.target === e.currentTarget && !submitting) setConfirmOpen(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Confirm Review Request</h2>
                <p className="text-xs text-slate-500 mt-0.5">Please confirm the details before sending.</p>
              </div>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={submitting}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Patient</span>
                <span className="font-semibold text-slate-700">{selected.patientInfo.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Diagnosis</span>
                <span className="font-semibold text-slate-700">{selected.analysisResult?.rhythm ?? 'Not provided'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Priority</span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${priorityOpt.badge}`}>
                  {priority.toUpperCase()}
                </span>
              </div>
              {notes.trim() && (
                <div className="pt-1.5 border-t border-gray-100">
                  <p className="text-slate-500 mb-1">Clinical Notes</p>
                  <p className="text-slate-700 whitespace-pre-wrap">{notes.trim()}</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-1 border-t border-gray-100">
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-sm font-semibold text-white transition disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Confirm &amp; Send
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={submitting}
                className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-slate-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
