import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, AlertTriangle, ArrowLeft, ClipboardList, RefreshCw, CheckCircle2, Clock, History } from 'lucide-react';
import AppShell from '../../layouts/AppShell';
import { ecgService } from '../../services/ecgService';
import { loadDraft } from '../../services/questionnaireService';
import { hasClinicalContext } from '../../services/clinicalContextService';
import { buildOntologyInput } from '../../services/ontologyFusionService';
import { buildFusionResult } from '../../utils/ontologyFusion';
import { answersArrayToMap } from '../../types/questionnaire';
import { extractErrorMessage } from '../../utils/errorUtils';
import { getDashboardRoute } from '../../features/auth/roleUtils';
import EvidenceFusionPanel from '../../components/clinical/EvidenceFusionPanel';
import EvidenceFusionSummary from '../../components/clinical/EvidenceFusionSummary';
import EvidenceTimeline from '../../components/clinical/EvidenceTimeline';
import ConfidenceBreakdown from '../../components/clinical/ConfidenceBreakdown';
import RiskFactorPanel from '../../components/clinical/RiskFactorPanel';
import ClinicalActionsPanel from '../../components/clinical/ClinicalActionsPanel';
import RequestReviewButton from '../../components/review/RequestReviewButton';
import ReviewStatusTracker from '../../components/review/ReviewStatusTracker';
import type { ECGAnalysis } from '../../types/ecg';
import type { AnswersMap } from '../../types/questionnaire';

export default function ClinicalDashboard() {
  const { analysisId } = useParams<{ analysisId: string }>();
  const navigate = useNavigate();
  const dashboardPath = getDashboardRoute();

  const [analysis, setAnalysis] = useState<ECGAnalysis | null>(null);
  const [answers, setAnswers] = useState<AnswersMap>({});
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

        const draft = loadDraft(analysisId);
        if (draft?.answers?.length) {
          setAnswers(answersArrayToMap(draft.answers));
        }
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

  const { patientInfo, analysisResult, createdAt, processedAt, _id } = analysis;
  const ontologyItems = analysisResult?.ontologyEnrichment;
  const findings = analysisResult?.abnormalities ?? [];
  const rhythm = analysisResult?.rhythm;
  const confidence = analysisResult?.confidence;

  const fusionResult = (ontologyItems?.length ?? 0) > 0
    ? buildFusionResult(buildOntologyInput(analysis))
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
            <RequestReviewButton analysisId={analysisId ?? ''} />
            <button
              type="button"
              onClick={() => navigate(`/questionnaire/${analysisId}`)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-sm font-semibold text-white transition"
            >
              <ClipboardList className="w-4 h-4" />
              Edit Clinical History
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
            <div className="text-right shrink-0 space-y-1">
              <span className="inline-block text-xs font-mono bg-gray-100 text-slate-500 rounded px-2 py-1">
                {_id.slice(-8)}
              </span>
              <p className="text-xs text-slate-400">
                {processedAt
                  ? new Date(processedAt).toLocaleString()
                  : new Date(createdAt).toLocaleString()}
              </p>
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

        {/* Evidence Fusion Summary */}
        <EvidenceFusionSummary result={fusionResult} analysisId={analysisId ?? ''} />

        {/* Evidence timeline + Confidence breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <EvidenceTimeline result={fusionResult} />
          <ConfidenceBreakdown scores={fusionResult?.scores} />
        </div>

        {/* Evidence + Risk factors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <EvidenceFusionPanel ontologyItems={ontologyItems} />
          <RiskFactorPanel answers={answers} />
        </div>

        {/* Actions + Review */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ClinicalActionsPanel ontologyItems={ontologyItems} />
          <div id="review-status">
            <ReviewStatusTracker analysisId={analysisId ?? ''} />
          </div>
        </div>

      </div>
    </AppShell>
  );
}
