import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Loader2, AlertTriangle, RefreshCw, User, PencilLine,
} from 'lucide-react';
import AppShell from '../../layouts/AppShell';
import ECGHeatmap from '../../components/ecg/ECGHeatmap';
import ECGWaveformViewer from '../../components/ecg/ECGWaveformViewer';
import ClinicalContextSummary from '../../components/clinical/ClinicalContextSummary';
import EvidenceFusionPanel from '../../components/clinical/EvidenceFusionPanel';
import ReviewHistoryPanel from '../../components/review/ReviewHistoryPanel';
import ReviewDecisionPanel from '../../components/review/ReviewDecisionPanel';
import { ecgService } from '../../services/ecgService';
import { reviewService } from '../../services/reviewService';
import { getSubmittedClinicalContext, getSubmittedAt } from '../../services/clinicalContextService';
import { extractErrorMessage } from '../../utils/errorUtils';
import type { ECGAnalysis } from '../../types/ecg';
import type { ClinicalContext } from '../../types/clinicalContext';
import type { SpecialistReview } from '../../types/review';

export default function CaseReviewPage() {
  // reviewId is used as the ECG analysisId — the only backend reference point available
  const { reviewId } = useParams<{ reviewId: string }>();
  const navigate = useNavigate();

  const [analysis, setAnalysis]   = useState<ECGAnalysis | null>(null);
  const [review, setReview]       = useState<SpecialistReview | null>(null);
  const [clinicalContext, setClinicalContext] = useState<ClinicalContext | null>(null);
  const [contextSubmittedAt, setContextSubmittedAt] = useState<string | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!reviewId) return;
    setLoading(true);
    setError(null);
    try {
      const ecg = await ecgService.getAnalysis(reviewId);
      setAnalysis(ecg);
      // Fetch existing review (gracefully returns null if not found)
      const existing = await reviewService.getAnalysisReview(reviewId);
      setReview(existing);
      setClinicalContext(getSubmittedClinicalContext(reviewId));
      setContextSubmittedAt(getSubmittedAt(reviewId));
    } catch (err: unknown) {
      setError(extractErrorMessage(err, 'Failed to load case.'));
    } finally {
      setLoading(false);
    }
  }, [reviewId]);

  useEffect(() => { load(); }, [load]);

  const handleDecisionSubmitted = (submitted: SpecialistReview) => {
    setReview(submitted);
  };

  if (loading) {
    return (
      <AppShell title="Case Review">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
          <p className="text-slate-600 font-semibold">Loading case…</p>
        </div>
      </AppShell>
    );
  }

  if (error || !analysis) {
    return (
      <AppShell title="Case Review">
        <div className="max-w-md mx-auto mt-10 bg-white border border-red-200 rounded-xl p-6 text-center shadow-sm">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 mb-1">Failed to load case</h3>
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
              onClick={() => navigate('/cardiologist/queue')}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-slate-600 hover:bg-gray-50 transition"
            >
              Back to Queue
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  const { patientInfo, analysisResult, createdAt, processedAt, _id } = analysis;
  const ontologyItems = analysisResult?.ontologyEnrichment;
  const findings      = analysisResult?.abnormalities ?? [];
  const rhythm        = analysisResult?.rhythm;
  const confidence    = analysisResult?.confidence;
  const heatmapUrl    = analysisResult?.explanation?.heatmapUrl ?? null;
  const waveformAnnotations = analysisResult?.explanation?.waveformAnnotations ?? null;
  const rawSignalData = analysisResult?.explanation?.rawSignalData ?? null;

  return (
    <AppShell title="Case Review">
      <div className="max-w-[1600px] mx-auto space-y-5 pb-10">

        {/* Navigation */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate('/cardiologist/queue')}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Review Queue
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-gray-100 text-slate-500 rounded px-2 py-1">
              {_id.slice(-12)}
            </span>
            {review?.reviewStatus === 'completed' && (
              <button
                type="button"
                onClick={() => navigate(`/cardiologist/annotation/${_id}`)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition"
              >
                <PencilLine className="w-4 h-4" />
                Continue to Annotation
              </button>
            )}
          </div>
        </div>

        {/* 3-column workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

          {/* Left column — Patient / Diagnosis / Clinical Context / ECG Findings */}
          <div className="lg:col-span-3 space-y-5">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base font-bold text-slate-800 truncate">{patientInfo.name}</h1>
                  <p className="text-xs text-slate-500">
                    {patientInfo.age} yrs · <span className="capitalize">{patientInfo.gender}</span>
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-400 pt-1 border-t border-gray-50">
                Analysed: {processedAt ? new Date(processedAt).toLocaleString() : new Date(createdAt).toLocaleString()}
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-5 space-y-2.5">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Diagnosis</h3>
              <div className="flex flex-wrap gap-1.5">
                {rhythm && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                    {rhythm}
                  </span>
                )}
                {confidence !== undefined && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-100">
                    AI Confidence: {confidence}%
                  </span>
                )}
              </div>
            </div>

            <ClinicalContextSummary context={clinicalContext} submittedAt={contextSubmittedAt} />

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-5 space-y-2.5">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">ECG Findings</h3>
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

            <EvidenceFusionPanel ontologyItems={ontologyItems} />
          </div>

          {/* Center column — ECG Viewer / Heatmap / Waveform */}
          <div className="lg:col-span-6 space-y-5">
            <ECGHeatmap heatmapUrl={heatmapUrl} />
            <ECGWaveformViewer
              rawSignalData={rawSignalData}
              waveformAnnotations={waveformAnnotations}
            />
          </div>

          {/* Right column — sticky Review Actions */}
          <div className="lg:col-span-3 space-y-5 lg:sticky lg:top-20 self-start">
            {/* LIVE ENDPOINT: POST /api/ecg/analysis/:id/specialist-review */}
            <ReviewDecisionPanel
              analysisId={_id}
              onDecisionSubmitted={handleDecisionSubmitted}
            />
            <ReviewHistoryPanel review={review} />
          </div>
        </div>

      </div>
    </AppShell>
  );
}
