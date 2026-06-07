import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';
import AppShell from '../layouts/AppShell';
import AuditTimeline from '../components/audit/AuditTimeline';
import { ecgService } from '../services/ecgService';
import { reviewService } from '../services/reviewService';
import { hasClinicalContext, getSubmittedAt } from '../services/clinicalContextService';
import { getOntologyStatus } from '../services/ontologyFusionService';
import { buildAuditTimeline } from '../utils/auditTimeline';
import { extractErrorMessage } from '../utils/errorUtils';
import { getDashboardRoute } from '../features/auth/roleUtils';
import type { ECGAnalysis } from '../types/ecg';
import type { SpecialistReview } from '../types/review';
import type { AuditEvent } from '../types/audit';

export default function AuditTrailPage() {
  const { analysisId } = useParams<{ analysisId: string }>();
  const navigate = useNavigate();
  const dashboardPath = getDashboardRoute();

  const [analysis, setAnalysis] = useState<ECGAnalysis | null>(null);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTimeline = useCallback(async () => {
    if (!analysisId) return;
    setLoading(true);
    setError(null);
    try {
      const ecg = await ecgService.getAnalysis(analysisId);
      setAnalysis(ecg);

      let review: SpecialistReview | null = null;
      try {
        review = await reviewService.getAnalysisReview(analysisId);
      } catch {
        review = null;
      }

      const submittedAt = getSubmittedAt(analysisId);
      const ontologyStatus = getOntologyStatus(ecg, hasClinicalContext(analysisId));

      setEvents(buildAuditTimeline(ecg, submittedAt, ontologyStatus, review));
    } catch (err: unknown) {
      setError(extractErrorMessage(err, 'Failed to load audit trail.'));
    } finally {
      setLoading(false);
    }
  }, [analysisId]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  if (loading) {
    return (
      <AppShell title="Audit Trail">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
          <p className="text-slate-600 font-semibold">Loading audit trail…</p>
        </div>
      </AppShell>
    );
  }

  if (error || !analysis) {
    return (
      <AppShell title="Audit Trail">
        <div className="max-w-md mx-auto mt-10 bg-white border border-red-200 rounded-xl p-6 text-center shadow-sm">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 mb-1">Failed to load audit trail</h3>
          <p className="text-sm text-slate-600 mb-5">{error ?? 'Analysis not found.'}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={fetchTimeline}
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

  return (
    <AppShell title="Audit Trail">
      <div className="max-w-3xl mx-auto space-y-5 pb-10">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(`/clinical-dashboard/${analysisId}`)}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Clinical Dashboard
          </button>
          <span className="text-xs text-slate-400">Analysis ID: {analysis._id}</span>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-5">
          <h1 className="text-xl font-bold text-slate-800">Audit Trail</h1>
          <p className="text-sm text-slate-500 mt-1">
            Chronological record of every workflow stage completed for{' '}
            <span className="font-semibold text-slate-700">{analysis.patientInfo.name}</span>'s ECG analysis.
          </p>
        </div>

        <AuditTimeline events={events} />
      </div>
    </AppShell>
  );
}
