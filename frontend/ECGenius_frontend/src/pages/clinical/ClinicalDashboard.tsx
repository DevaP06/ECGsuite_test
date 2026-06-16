import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Loader2, AlertTriangle, ArrowLeft, ClipboardList, RefreshCw, CheckCircle2, Clock, History,
  Eye, LayoutDashboard, IdCard, CalendarClock,
} from 'lucide-react';
import AppShell from '../../layouts/AppShell';
import { ecgService } from '../../services/ecgService';
import { hasClinicalContext, getSubmittedClinicalContext, getSubmittedAt } from '../../services/clinicalContextService';
import { buildOntologyInput } from '../../services/ontologyFusionService';
import { buildFusionResult } from '../../utils/ontologyFusion';
import { extractErrorMessage } from '../../utils/errorUtils';
import { getDashboardRoute } from '../../features/auth/roleUtils';
import EvidenceFusionPanel from '../../components/clinical/EvidenceFusionPanel';
import EvidenceFusionSummary from '../../components/clinical/EvidenceFusionSummary';
// (RiskFactorPanel removed with the old questionnaire — its data source is gone.)
import EvidenceTimeline from '../../components/clinical/EvidenceTimeline';
import ConfidenceBreakdown from '../../components/clinical/ConfidenceBreakdown';
import ClinicalContextSummary from '../../components/clinical/ClinicalContextSummary';
import ClinicalActionsPanel from '../../components/clinical/ClinicalActionsPanel';
import RequestReviewButton from '../../components/review/RequestReviewButton';
import ReviewStatusTracker from '../../components/review/ReviewStatusTracker';
import DifferentialDiagnosisPanel from '../../components/diagnosis/DifferentialDiagnosisPanel';
import ClinicalReasoningPanel from '../../components/diagnosis/ClinicalReasoningPanel';
import PDFExportButton from '../../components/common/PDFExportButton';
import type { ECGAnalysis } from '../../types/ecg';
import type { ClinicalContext } from '../../types/clinicalContext';

export default function ClinicalDashboard() {
  const { analysisId } = useParams<{ analysisId: string }>();
  const navigate = useNavigate();
  const dashboardPath = getDashboardRoute();

  const [analysis, setAnalysis] = useState<ECGAnalysis | null>(null);
  const [clinicalContext, setClinicalContext] = useState<ClinicalContext | null>(null);
  const [contextSubmittedAt, setContextSubmittedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!analysisId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const ecg = await ecgService.getAnalysis(analysisId);
        if (cancelled) return;
        setAnalysis(ecg);

        setClinicalContext(getSubmittedClinicalContext(analysisId));
        setContextSubmittedAt(getSubmittedAt(analysisId));
      } catch (err: unknown) {
        if (cancelled) return;
        setError(extractErrorMessage(err, 'Failed to load clinical dashboard.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [analysisId]);

  if (loading) {
    return (
      <AppShell title="Clinical Dashboard">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
          <p className="text-slate-600 font-semibold">Loading clinical dashboard…</p>
        </div>
      </AppShell>
    );
  }

  if (error || !analysis) {
    return (
      <AppShell title="Clinical Dashboard">
        <div className="max-w-md mx-auto mt-10 bg-white border border-red-200 rounded-xl p-6 text-center shadow-sm">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 mb-1">Failed to load dashboard</h3>
          <p className="text-sm text-slate-600 mb-5">{error ?? 'Analysis not found.'}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
            <Link
              to={dashboardPath}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-slate-600 hover:bg-gray-50 transition"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const { patientInfo, analysisResult, createdAt, _id } = analysis;
  const ontologyItems = analysisResult?.ontologyEnrichment;
  const findings = analysisResult?.abnormalities ?? [];
  const rhythm = analysisResult?.rhythm;
  const confidence = analysisResult?.confidence;
  const heartRate = analysisResult?.heartRate;
  const qrsDuration = analysisResult?.qrsDuration;
  const qtInterval = analysisResult?.qtInterval;
  const qtcInterval = analysisResult?.signalMetrics?.qtcInterval;
  const reasoning = analysisResult?.explanation?.reasoning ?? null;

  const fusionResult = ((ontologyItems?.length ?? 0) > 0 || clinicalContext)
    ? buildFusionResult(buildOntologyInput(analysis, clinicalContext))
    : null;

  return (
    <AppShell title="Clinical Dashboard">
      <div className="max-w-5xl mx-auto space-y-5 pb-10">

        {/* Navigation header */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(`/diagnosisdetail/${analysisId}`)}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Diagnosis
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(`/audit/${analysisId}`)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-slate-600 hover:bg-gray-50 transition"
            >
              <History className="w-4 h-4" />
              View Audit Trail
            </button>
            <button
              type="button"
              onClick={() => navigate(`/clinical-context/${analysisId}`)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-sm font-semibold text-white transition"
            >
              <ClipboardList className="w-4 h-4" />
              Edit Clinical Context
            </button>
          </div>
        </div>

        {/* Patient summary */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-slate-800">Clinical Dashboard</h1>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-sm text-slate-500">
                <span>Patient: <span className="font-semibold text-slate-700">{patientInfo.name}</span></span>
                <span>·</span>
                <span>Age: <span className="font-semibold text-slate-700">{patientInfo.age}</span></span>
                <span>·</span>
                <span>Gender: <span className="font-semibold text-slate-700 capitalize">{patientInfo.gender}</span></span>
              </div>
            </div>
            <div className="text-right shrink-0 space-y-1.5">
              <div className="flex items-center justify-end gap-1.5 text-xs text-slate-500">
                <IdCard className="w-3.5 h-3.5 text-slate-400" />
                <span>Patient ID: <span className="font-mono text-slate-600">{_id.slice(-8)}</span></span>
              </div>
              <div className="flex items-center justify-end gap-1.5 text-xs text-slate-500">
                <CalendarClock className="w-3.5 h-3.5 text-slate-400" />
                <span>Upload Date: <span className="text-slate-600">{new Date(createdAt).toLocaleString()}</span></span>
              </div>
              {analysisId && (
                hasClinicalContext(analysisId) ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Clinical Context Completed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
                    <Clock className="w-3.5 h-3.5" /> Pending Clinical Context
                  </span>
                )
              )}
            </div>
          </div>
        </div>

        {/* ECG Findings */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">ECG Findings</h3>
          <div className="flex flex-wrap gap-2">
            {rhythm && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                Rhythm: {rhythm}
              </span>
            )}
            {confidence !== undefined && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-100">
                Confidence: {confidence}%
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="rounded-lg border border-gray-100 px-3 py-2.5 text-center">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Heart Rate</p>
              <p className="text-sm font-bold text-slate-700 mt-0.5">{heartRate != null ? `${heartRate} bpm` : 'Not provided'}</p>
            </div>
            <div className="rounded-lg border border-gray-100 px-3 py-2.5 text-center">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">QRS Duration</p>
              <p className="text-sm font-bold text-slate-700 mt-0.5">{qrsDuration != null ? `${qrsDuration} ms` : 'Not provided'}</p>
            </div>
            <div className="rounded-lg border border-gray-100 px-3 py-2.5 text-center">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">QT Interval</p>
              <p className="text-sm font-bold text-slate-700 mt-0.5">{qtInterval != null ? `${qtInterval} ms` : 'Not provided'}</p>
            </div>
            <div className="rounded-lg border border-gray-100 px-3 py-2.5 text-center">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">QTc Interval</p>
              <p className="text-sm font-bold text-slate-700 mt-0.5">{qtcInterval != null ? `${qtcInterval} ms` : 'Not provided'}</p>
            </div>
          </div>

          {findings.length > 0 ? (
            <ul className="space-y-1.5">
              {findings.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400 italic">No abnormalities reported.</p>
          )}
        </div>

        {/* Clinical Context Summary */}
        <ClinicalContextSummary context={clinicalContext} submittedAt={contextSubmittedAt} />

        {/* Evidence Fusion Summary */}
        <EvidenceFusionSummary result={fusionResult} analysisId={analysisId ?? ''} />

        {/* Evidence timeline + Confidence breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <EvidenceTimeline result={fusionResult} />
          <ConfidenceBreakdown scores={fusionResult?.scores} />
        </div>

        {/* Differential diagnosis */}
        <DifferentialDiagnosisPanel diagnoses={fusionResult?.diagnoses} />

        {/* Evidence fusion */}
        <EvidenceFusionPanel ontologyItems={ontologyItems} />

        {/* Clinical reasoning */}
        <ClinicalReasoningPanel reasoning={reasoning} />

        {/* Actions + Review */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ClinicalActionsPanel ontologyItems={ontologyItems} />
          <div id="review-status">
            <ReviewStatusTracker analysisId={analysisId ?? ''} />
          </div>
        </div>

        {/* Clinical Actions */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Clinical Actions</h3>
          <div className="flex flex-wrap items-center gap-2.5">
            <RequestReviewButton analysisId={analysisId ?? ''} />
            {analysisId && (
              <PDFExportButton analysisId={analysisId} patientName={patientInfo.name} />
            )}
            <button
              type="button"
              onClick={() => navigate(`/diagnosisdetail/${analysisId}`)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-slate-600 hover:bg-gray-50 transition"
            >
              <Eye className="w-4 h-4" />
              View Diagnosis
            </button>
            <Link
              to={dashboardPath}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-slate-600 hover:bg-gray-50 transition"
            >
              <LayoutDashboard className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>

      </div>
    </AppShell>
  );
}
