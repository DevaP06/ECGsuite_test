import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, Loader2, RefreshCw, Info, ShieldAlert, Activity, ClipboardList,
  Stethoscope, TrendingUp, ArrowRight, CheckCircle2,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import AppShell from '../../layouts/AppShell';
import { ecgService } from '../../services/ecgService';
import { reviewService } from '../../services/reviewService';
import { getSubmittedClinicalContext } from '../../services/clinicalContextService';
import { extractErrorMessage } from '../../utils/errorUtils';
import { buildRiskSummary } from '../../utils/riskSummary';
import type { RiskSummary } from '../../utils/riskSummary';
import type { ECGAnalysis } from '../../types/ecg';
import type { ClinicalContext } from '../../types/clinicalContext';
import type { SpecialistReview } from '../../types/review';

function EmptyCard({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-6 py-8 text-center flex flex-col items-center gap-2">
      <Info className="w-5 h-5 text-slate-300" />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}

const URGENCY_BADGE: Record<string, string> = {
  'Tier 1': 'bg-red-50 text-red-700 border-red-200',
  'Tier 2': 'bg-amber-50 text-amber-700 border-amber-200',
  'Tier 3': 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export default function RiskSummaryPage() {
  const [analyses, setAnalyses] = useState<ECGAnalysis[]>([]);
  const [reviews, setReviews] = useState<Map<string, SpecialistReview | null>>(new Map());
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

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
      setFetchError(extractErrorMessage(err, 'Failed to load your risk summary.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const summary: RiskSummary = useMemo(() => {
    const contexts = new Map<string, ClinicalContext | null>();
    analyses.forEach((a) => contexts.set(a._id, getSubmittedClinicalContext(a._id)));
    return buildRiskSummary(analyses, contexts, reviews);
  }, [analyses, reviews]);

  const hasAnyData = analyses.length > 0;
  const trendData = summary.rhythmTrend.map((t) => ({ ...t, label: t.rhythm }));
  const maxTrend = Math.max(1, ...summary.rhythmTrend.map((t) => t.count));
  const maxFactor = Math.max(1, ...summary.riskFactors.map((f) => f.occurrences));

  return (
    <AppShell title="Risk Summary">
      <div className="max-w-5xl mx-auto space-y-6 pb-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Risk Summary
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Risk factors, diagnostic history, and specialist review outcomes derived from your accumulated ECG analyses.
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
            <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
          </div>
        ) : !hasAnyData ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center">
            <AlertTriangle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700 mb-1">No risk data yet</h3>
            <p className="text-sm text-slate-500">
              Your risk summary will populate once you upload an ECG and complete clinical context questionnaires.
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
            {/* Risk Category */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                Risk Category
              </h3>
              {summary.riskCategory ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {summary.riskCategory.isEmergency && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full border bg-red-50 text-red-700 border-red-200">
                        Emergency Flag
                      </span>
                    )}
                    {summary.riskCategory.urgencyTier && (
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${URGENCY_BADGE[summary.riskCategory.urgencyTier] ?? 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                        {summary.riskCategory.urgencyTier}
                      </span>
                    )}
                    {summary.riskCategory.severity && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full border bg-slate-50 text-slate-600 border-slate-200">
                        {summary.riskCategory.severity}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">
                    {summary.riskCategory.displayName ?? 'Reported by'} on{' '}
                    {new Date(summary.riskCategory.createdAt).toLocaleDateString()} ·{' '}
                    <Link to={`/diagnosisdetail/${summary.riskCategory.analysisId}`} className="font-semibold text-blue-600 hover:text-blue-800 transition">
                      View report
                    </Link>
                  </p>
                </div>
              ) : (
                <EmptyCard message="No risk category has been provided by the diagnostic engine for your analyses yet." />
              )}
              <p className="text-xs text-slate-400 pt-1 border-t border-gray-50">
                Reflects urgency and severity tiers reported directly by the diagnostic engine for your most recent completed analysis. No risk score is calculated by this platform.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Risk Factors */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-slate-400" />
                  Risk Factors
                </h3>
                {summary.riskFactors.length > 0 ? (
                  <div className="space-y-2.5">
                    {summary.riskFactors.map((f) => (
                      <div key={f.key} className="space-y-1">
                        <div className="flex justify-between gap-3 text-xs">
                          <span className="font-medium text-slate-700 truncate" title={f.label}>{f.label}</span>
                          <span className="text-slate-500 shrink-0">
                            Reported {f.occurrences}× across submissions
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-amber-400"
                            style={{ width: `${Math.round((f.occurrences / maxFactor) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyCard message="No risk factors have been recorded through your clinical context submissions yet." />
                )}
              </div>

              {/* Trends */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-slate-400" />
                  Diagnosis Trends
                </h3>
                {trendData.length > 0 ? (
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={trendData} margin={{ top: 4, right: 16, left: -10, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={50} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} domain={[0, maxTrend]} />
                        <Tooltip />
                        <Bar dataKey="count" name="Occurrences" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyCard message="No completed diagnoses yet — trends will appear as your analyses complete." />
                )}
              </div>
            </div>

            {/* Historical Diagnoses */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-slate-400" />
                Historical Diagnoses
              </h3>
              {summary.historicalDiagnoses.length > 0 ? (
                <ul className="divide-y divide-gray-50">
                  {summary.historicalDiagnoses.map((d) => (
                    <li key={d.analysisId} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{d.rhythm}</p>
                        <p className="text-xs text-slate-400">
                          {new Date(d.createdAt).toLocaleDateString()}
                          {d.confidence !== undefined && <> · Confidence: {d.confidence}%</>}
                        </p>
                      </div>
                      <Link
                        to={`/diagnosisdetail/${d.analysisId}`}
                        className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition shrink-0"
                      >
                        View <ArrowRight className="w-3 h-3" />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyCard message="Completed diagnoses will be listed here once your ECG analyses finish processing." />
              )}
            </div>

            {/* Specialist Review Outcomes */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-slate-400" />
                Specialist Review Outcomes
              </h3>
              {summary.reviewOutcomes.length > 0 ? (
                <div className="space-y-3">
                  {summary.reviewOutcomes.map((o) => (
                    <div key={o.analysisId} className="rounded-lg border border-gray-100 p-3.5 space-y-1.5">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-slate-800">
                          {o.expertDiagnosis ?? 'Reviewed — outcome on file'}
                        </span>
                        {o.reviewDate && (
                          <span className="text-xs text-slate-400 shrink-0">{new Date(o.reviewDate).toLocaleDateString()}</span>
                        )}
                      </div>
                      {o.overrideReason && (
                        <p className="text-xs text-slate-500"><span className="font-semibold text-slate-600">Override reason:</span> {o.overrideReason}</p>
                      )}
                      {o.reviewNotes && (
                        <p className="text-xs text-slate-500"><span className="font-semibold text-slate-600">Notes:</span> {o.reviewNotes}</p>
                      )}
                      <Link
                        to={`/diagnosisdetail/${o.analysisId}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
                      >
                        View report <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyCard message="Specialist review outcomes will appear here once a cardiologist completes a review of your case." />
              )}
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-400 px-1">
              <Activity className="w-3.5 h-3.5" />
              All figures above are counted directly from your records — no risk score is calculated by this platform.
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
