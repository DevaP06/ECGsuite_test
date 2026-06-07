import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Loader2, AlertTriangle, RefreshCw, User,
  CheckSquare, XSquare, Save, ClipboardCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import AppShell from '../../layouts/AppShell';
import WaveformAnnotationPanel, { ECG_LEADS } from '../../components/annotation/WaveformAnnotationPanel';
import FeedbackPanel from '../../components/analytics/FeedbackPanel';
import { ecgService } from '../../services/ecgService';
import { annotationService } from '../../services/annotationService';
import { reviewService } from '../../services/reviewService';
import { extractErrorMessage } from '../../utils/errorUtils';
import type { ECGAnalysis } from '../../types/ecg';
import type { AnnotationRecord, WaveformMark, LeadAnnotation, CreateAnnotationPayload } from '../../types/annotation';
import type { SpecialistReview } from '../../types/review';

function groupMarksByLead(marks: WaveformMark[]): LeadAnnotation[] {
  const byLead = new Map<string, WaveformMark[]>();
  marks.forEach((mark) => {
    const lead = mark.lead ?? 'unspecified';
    const existing = byLead.get(lead);
    if (existing) existing.push(mark);
    else byLead.set(lead, [mark]);
  });
  return Array.from(byLead.entries()).map(([lead, leadMarks]) => ({
    lead,
    marks: leadMarks,
    samplingRate: undefined,
  }));
}

// ─── Form state ────────────────────────────────────────────────────────────────
interface AnnotationForm {
  rhythmIsCorrect: boolean;
  validatedRhythm: string;
  overallQuality: 'good' | 'acceptable' | 'poor' | 'unreadable' | '';
  confirmedAbnormalities: string[];
  rejectedAbnormalities: string[];
  additionalFindings: string;
  clinicalNotes: string;
  waveformNotes: string;
  leadNotes: Record<string, string>;
}

const BLANK_FORM: AnnotationForm = {
  rhythmIsCorrect: true,
  validatedRhythm: '',
  overallQuality: '',
  confirmedAbnormalities: [],
  rejectedAbnormalities: [],
  additionalFindings: '',
  clinicalNotes: '',
  waveformNotes: '',
  leadNotes: {},
};

const QUALITY_OPTIONS: { value: AnnotationForm['overallQuality']; label: string }[] = [
  { value: '',            label: 'Select quality…' },
  { value: 'good',        label: 'Good — clear signal throughout' },
  { value: 'acceptable',  label: 'Acceptable — minor noise' },
  { value: 'poor',        label: 'Poor — significant interference' },
  { value: 'unreadable',  label: 'Unreadable — cannot assess' },
];

function buildNotesText(form: AnnotationForm): string {
  const parts: string[] = [];
  if (form.confirmedAbnormalities.length > 0) {
    parts.push(`CONFIRMED: ${form.confirmedAbnormalities.join(', ')}`);
  }
  if (form.rejectedAbnormalities.length > 0) {
    parts.push(`REJECTED: ${form.rejectedAbnormalities.join(', ')}`);
  }
  if (form.additionalFindings) {
    parts.push(`ADDITIONAL FINDINGS: ${form.additionalFindings}`);
  }
  if (form.clinicalNotes) {
    parts.push(`CLINICAL NOTES: ${form.clinicalNotes}`);
  }
  if (form.waveformNotes) {
    parts.push(`WAVEFORM NOTES: ${form.waveformNotes}`);
  }
  const leadEntries = Object.entries(form.leadNotes).filter(([, v]) => v.trim());
  if (leadEntries.length > 0) {
    const leadText = leadEntries.map(([lead, note]) => `${lead}: ${note}`).join('\n');
    parts.push(`LEAD NOTES:\n${leadText}`);
  }
  return parts.join('\n\n');
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{title}</h3>
      {children}
    </div>
  );
}

// ─── Abnormality toggle ────────────────────────────────────────────────────────
function AbnormalityToggle({
  label,
  confirmed,
  rejected,
  onConfirm,
  onReject,
}: {
  label: string;
  confirmed: boolean;
  rejected: boolean;
  onConfirm: () => void;
  onReject: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-700 flex-1 truncate">{label}</span>
      <button
        type="button"
        onClick={onConfirm}
        title="Confirm finding"
        className={`p-1.5 rounded-lg transition ${confirmed ? 'bg-emerald-100 text-emerald-600' : 'hover:bg-gray-100 text-slate-400'}`}
      >
        <CheckSquare className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={onReject}
        title="Reject finding"
        className={`p-1.5 rounded-lg transition ${rejected ? 'bg-red-100 text-red-600' : 'hover:bg-gray-100 text-slate-400'}`}
      >
        <XSquare className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AnnotationWorkspacePage() {
  const { analysisId } = useParams<{ analysisId: string }>();
  const navigate = useNavigate();

  const [analysis, setAnalysis]   = useState<ECGAnalysis | null>(null);
  const [existing, setExisting]   = useState<AnnotationRecord | null>(null);
  const [review, setReview]       = useState<SpecialistReview | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [form, setForm]           = useState<AnnotationForm>(BLANK_FORM);
  const [marks, setMarks]         = useState<WaveformMark[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const load = useCallback(async () => {
    if (!analysisId) return;
    setLoading(true);
    setError(null);
    try {
      const ecg = await ecgService.getAnalysis(analysisId);
      setAnalysis(ecg);
      const [ann, rev] = await Promise.all([
        annotationService.getAnnotation(analysisId),
        reviewService.getAnalysisReview(analysisId),
      ]);
      setExisting(ann);
      setReview(rev);
      // Pre-fill form from existing annotation if present
      if (ann) {
        setForm((f) => ({
          ...f,
          rhythmIsCorrect: ann.rhythmIsCorrect ?? true,
          validatedRhythm: ann.validatedRhythm ?? '',
          overallQuality: ann.overallQuality ?? '',
          clinicalNotes: ann.notes ?? '',
        }));
      }
    } catch (err: unknown) {
      setError(extractErrorMessage(err, 'Failed to load annotation workspace.'));
    } finally {
      setLoading(false);
    }
  }, [analysisId]);

  useEffect(() => { load(); }, [load]);

  const toggleAbnormality = (
    field: 'confirmedAbnormalities' | 'rejectedAbnormalities',
    opposite: 'confirmedAbnormalities' | 'rejectedAbnormalities',
    label: string,
  ) => {
    setForm((f) => {
      const current = f[field];
      const isActive = current.includes(label);
      return {
        ...f,
        [field]: isActive ? current.filter((x) => x !== label) : [...current, label],
        [opposite]: f[opposite].filter((x) => x !== label),
      };
    });
  };

  const handleSubmit = async () => {
    if (!analysisId) return;
    setSubmitting(true);
    try {
      const payload: CreateAnnotationPayload = {
        rhythmIsCorrect: form.rhythmIsCorrect,
        validatedRhythm: form.validatedRhythm || undefined,
        overallQuality: form.overallQuality || undefined,
        notes: buildNotesText(form) || undefined,
        leadAnnotations: marks.length > 0
          ? groupMarksByLead(marks)
          : undefined,
      };
      const result = await annotationService.createAnnotation(analysisId, payload);
      setExisting(result);
      setSubmitted(true);
      toast.success('Annotation saved successfully.');
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err, 'Failed to save annotation.'));
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <AppShell title="Annotation Workspace">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
          <p className="text-slate-600 font-semibold">Loading annotation workspace…</p>
        </div>
      </AppShell>
    );
  }

  if (error || !analysis) {
    return (
      <AppShell title="Annotation Workspace">
        <div className="max-w-md mx-auto mt-10 bg-white border border-red-200 rounded-xl p-6 text-center shadow-sm">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 mb-1">Failed to load workspace</h3>
          <p className="text-sm text-slate-600 mb-5">{error ?? 'Analysis not found.'}</p>
          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={load}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
            >
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-slate-600 hover:bg-gray-50 transition"
            >
              Go Back
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  const { patientInfo, analysisResult, _id } = analysis;
  const findings   = analysisResult?.abnormalities ?? [];
  const rhythm     = analysisResult?.rhythm;
  const confidence = analysisResult?.confidence;
  const explanation = analysisResult?.explanation;

  return (
    <AppShell title="Annotation Workspace">
      <div className="max-w-5xl mx-auto space-y-5 pb-10">

        {/* Navigation */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate(`/cardiologist/review/${analysisId}`)}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Case Review
          </button>
          <div className="flex items-center gap-2">
            {existing && (
              <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-full">
                Annotation saved
              </span>
            )}
            <span className="text-xs font-mono bg-gray-100 text-slate-500 rounded px-2 py-1">
              {_id.slice(-10)}
            </span>
          </div>
        </div>

        {/* Patient summary */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-slate-800">{patientInfo.name}</h1>
              <p className="text-sm text-slate-500">
                {patientInfo.age} y/o · {patientInfo.gender}
              </p>
            </div>
            <div className="text-right shrink-0 space-y-1">
              <h2 className="text-base font-bold text-slate-700">Annotation Workspace</h2>
              <p className="text-xs text-slate-400">Cardiologist specialist annotation</p>
            </div>
          </div>
        </div>

        {/* AI Findings summary */}
        <Section title="AI Diagnosis Summary">
          <div className="flex flex-wrap gap-2">
            {rhythm && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                Rhythm: {rhythm}
              </span>
            )}
            {confidence !== undefined && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-100">
                AI Confidence: {confidence}%
              </span>
            )}
          </div>
          {findings.length > 0 && (
            <ul className="space-y-1">
              {findings.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          )}
          {review && (
            <div className="border-t border-gray-50 pt-3 text-sm text-slate-600">
              <span className="font-semibold">Review Decision:</span>{' '}
              <span className="capitalize">{review.reviewStatus}</span>
              {review.expertDiagnosis && (
                <span> · Expert: <span className="font-medium text-emerald-700">{review.expertDiagnosis}</span></span>
              )}
            </div>
          )}
        </Section>

        {/* Waveform Annotation Panel */}
        <WaveformAnnotationPanel
          explanation={explanation}
          onMarksUpdate={setMarks}
        />

        {/* Diagnosis Confirmation */}
        {findings.length > 0 && (
          <Section title="Diagnosis Confirmation">
            <p className="text-xs text-slate-500 -mt-2">
              Confirm (✓) or reject (✗) each AI-detected finding. Leave blank if uncertain.
            </p>
            <div className="space-y-2">
              {findings.map((f) => (
                <AbnormalityToggle
                  key={f}
                  label={f}
                  confirmed={form.confirmedAbnormalities.includes(f)}
                  rejected={form.rejectedAbnormalities.includes(f)}
                  onConfirm={() => toggleAbnormality('confirmedAbnormalities', 'rejectedAbnormalities', f)}
                  onReject={() => toggleAbnormality('rejectedAbnormalities', 'confirmedAbnormalities', f)}
                />
              ))}
            </div>
          </Section>
        )}

        {/* Rhythm Assessment */}
        <Section title="Rhythm Assessment">
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-slate-700">AI Rhythm Correct?</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, rhythmIsCorrect: true }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  form.rhythmIsCorrect
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, rhythmIsCorrect: false }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  !form.rhythmIsCorrect
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                }`}
              >
                No
              </button>
            </div>
          </div>

          {!form.rhythmIsCorrect && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">
                Corrected Rhythm <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.validatedRhythm}
                onChange={(e) => setForm((f) => ({ ...f, validatedRhythm: e.target.value }))}
                placeholder="Enter the correct rhythm classification…"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600">Signal Quality</label>
            <select
              value={form.overallQuality}
              onChange={(e) => setForm((f) => ({ ...f, overallQuality: e.target.value as AnnotationForm['overallQuality'] }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            >
              {QUALITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </Section>

        {/* Clinical and Waveform Notes */}
        <Section title="Notes">
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Additional Findings</label>
              <input
                type="text"
                value={form.additionalFindings}
                onChange={(e) => setForm((f) => ({ ...f, additionalFindings: e.target.value }))}
                placeholder="Findings not captured by AI…"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Clinical Notes</label>
              <textarea
                value={form.clinicalNotes}
                onChange={(e) => setForm((f) => ({ ...f, clinicalNotes: e.target.value }))}
                placeholder="Overall clinical observations and context…"
                rows={3}
                maxLength={2000}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Waveform Notes</label>
              <textarea
                value={form.waveformNotes}
                onChange={(e) => setForm((f) => ({ ...f, waveformNotes: e.target.value }))}
                placeholder="Specific observations about ECG waveform morphology…"
                rows={2}
                maxLength={1000}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          </div>
        </Section>

        {/* Lead Notes */}
        <Section title="Lead Notes">
          <p className="text-xs text-slate-400 -mt-2">Optional per-lead observations.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {ECG_LEADS.map((lead) => (
              <div key={lead} className="space-y-0.5">
                <label className="text-xs font-semibold text-slate-600">Lead {lead}</label>
                <input
                  type="text"
                  value={form.leadNotes[lead] ?? ''}
                  onChange={(e) => setForm((f) => ({
                    ...f,
                    leadNotes: { ...f.leadNotes, [lead]: e.target.value },
                  }))}
                  placeholder="Observation…"
                  className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 transition"
                />
              </div>
            ))}
          </div>
        </Section>

        {/* Submit */}
        {!submitted ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Annotation
                </>
              )}
            </button>
            <p className="text-xs text-slate-400">
              Annotation is recorded for audit. No diagnosis is generated automatically.
            </p>
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex items-center gap-3">
            <ClipboardCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">Annotation saved</p>
              <p className="text-xs text-emerald-600">Your specialist annotation has been recorded.</p>
            </div>
          </div>
        )}

        {/* Active learning feedback */}
        <FeedbackPanel analysisId={_id} />

      </div>
    </AppShell>
  );
}
