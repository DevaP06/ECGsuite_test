import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2, AlertTriangle, XCircle, Clock, RefreshCw, ExternalLink,
} from 'lucide-react';
import type { ECGAnalysis } from '../../types/ecg';

interface Props {
  analyses: ECGAnalysis[];
  /** If true, clicking goes to /clinical-dashboard instead of /diagnosisdetail */
  preferClinical?: boolean;
}

// ─── Status badge helpers ─────────────────────────────────────────────────────
type AnalysisStatus = 'completed' | 'failed' | 'processing' | 'uploaded' | string;

const STATUS_BADGE: Record<string, { label: string; colorClass: string; Icon: React.ElementType }> = {
  completed:  { label: 'Completed',   colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: CheckCircle2 },
  failed:     { label: 'Failed',      colorClass: 'bg-red-50 text-red-700 border-red-200',             Icon: XCircle },
  processing: { label: 'Processing',  colorClass: 'bg-yellow-50 text-yellow-700 border-yellow-200',    Icon: Clock },
  uploaded:   { label: 'Uploaded',    colorClass: 'bg-slate-50 text-slate-600 border-slate-200',       Icon: Clock },
};

function statusConfig(status: AnalysisStatus) {
  return (
    STATUS_BADGE[status] ?? {
      label: status,
      colorClass: 'bg-gray-50 text-gray-600 border-gray-200',
      Icon: Clock,
    }
  );
}

// ─── Risk indicator derived from ontology urgency tiers ──────────────────────
function riskColorClass(analysis: ECGAnalysis): string {
  const items = analysis.analysisResult?.ontologyEnrichment ?? [];
  if (items.some((i) => i.urgencyTier === 'critical' || i.isEmergency)) return 'text-red-600';
  if (items.some((i) => i.urgencyTier === 'high'))                        return 'text-orange-600';
  if (items.some((i) => i.urgencyTier === 'moderate'))                    return 'text-yellow-600';
  return 'text-emerald-600';
}

function riskLabel(analysis: ECGAnalysis): string {
  const items = analysis.analysisResult?.ontologyEnrichment ?? [];
  if (items.some((i) => i.urgencyTier === 'critical' || i.isEmergency)) return 'Critical';
  if (items.some((i) => i.urgencyTier === 'high'))                        return 'High';
  if (items.some((i) => i.urgencyTier === 'moderate'))                    return 'Moderate';
  if (analysis.analysisResult)                                            return 'Low';
  return '—';
}

// ─── Timeline entry ───────────────────────────────────────────────────────────
function TimelineEntry({
  analysis,
  preferClinical,
}: {
  analysis: ECGAnalysis;
  preferClinical: boolean;
}) {
  const navigate = useNavigate();
  const { label, colorClass, Icon } = statusConfig(analysis.status);
  const isFailed = analysis.status === 'failed';
  const isCompleted = analysis.status === 'completed';

  const diagnosisPath = `/diagnosisdetail/${analysis._id}`;
  const clinicalPath  = `/clinical-dashboard/${analysis._id}`;
  const failedPath    = `/analysis-failed/${analysis._id}`;

  const primaryPath = isFailed
    ? failedPath
    : preferClinical && isCompleted
    ? clinicalPath
    : diagnosisPath;

  const displayDate = new Date(analysis.createdAt).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  });
  const displayTime = new Date(analysis.createdAt).toLocaleTimeString(undefined, {
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="relative flex gap-4">
      {/* Timeline spine dot */}
      <div className="flex flex-col items-center">
        <div
          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 z-10 ${
            isFailed ? 'border-red-300 bg-red-50' : isCompleted ? 'border-emerald-300 bg-emerald-50' : 'border-slate-300 bg-white'
          }`}
        >
          <Icon className={`w-4 h-4 ${isFailed ? 'text-red-500' : isCompleted ? 'text-emerald-500' : 'text-slate-400'}`} />
        </div>
        <div className="w-px flex-1 bg-gray-200 mt-1" />
      </div>

      {/* Content card */}
      <div className="flex-1 pb-5">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-2">
          {/* Header row */}
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-xs text-slate-500">{displayDate} · {displayTime}</p>
              <p className="font-semibold text-slate-800 text-sm mt-0.5">
                {analysis.analysisResult?.rhythm
                  ? analysis.analysisResult.rhythm.replace(/_/g, ' ')
                  : isFailed
                  ? 'Analysis failed'
                  : 'ECG Upload'}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Status badge */}
              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-semibold ${colorClass}`}>
                <Icon className="w-3 h-3" />
                {label}
              </span>
              {/* Risk level (only when completed) */}
              {isCompleted && (
                <span className={`text-xs font-semibold ${riskColorClass(analysis)}`}>
                  {riskLabel(analysis)} risk
                </span>
              )}
            </div>
          </div>

          {/* Abnormalities (completed) */}
          {isCompleted && analysis.analysisResult?.abnormalities?.length ? (
            <div className="flex flex-wrap gap-1">
              {analysis.analysisResult.abnormalities.slice(0, 3).map((a, i) => (
                <span key={i} className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                  {a.replace(/_/g, ' ')}
                </span>
              ))}
              {(analysis.analysisResult.abnormalities.length ?? 0) > 3 && (
                <span className="text-xs text-slate-400">
                  +{analysis.analysisResult.abnormalities.length - 3} more
                </span>
              )}
            </div>
          ) : null}

          {/* Confidence (completed) */}
          {isCompleted && analysis.analysisResult?.confidence !== undefined && (
            <p className="text-xs text-slate-500">
              Confidence: <span className="font-semibold">{analysis.analysisResult.confidence}%</span>
            </p>
          )}

          {/* Failure reason (failed) */}
          {isFailed && analysis.failureReason && (
            <div className="flex items-start gap-1.5 bg-red-50 rounded-lg px-3 py-2">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{analysis.failureReason}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => navigate(primaryPath)}
              className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {isFailed ? 'View Failure Report' : preferClinical && isCompleted ? 'Clinical Dashboard' : 'View Diagnosis'}
            </button>

            {/* For failed: also offer retry */}
            {isFailed && (
              <button
                type="button"
                onClick={() => navigate('/ecgupload')}
                className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700 transition ml-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Upload
              </button>
            )}

            {/* For completed with preferClinical=false: still show clinical link */}
            {isCompleted && !preferClinical && (
              <button
                type="button"
                onClick={() => navigate(clinicalPath)}
                className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-emerald-600 transition ml-2"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Clinical Dashboard
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Timeline ─────────────────────────────────────────────────────────────────
export default function ECGTimeline({ analyses, preferClinical = false }: Props) {
  const sorted = [...analyses].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (!sorted.length) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-center">
        <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-500">No ECG records yet.</p>
        <p className="text-xs text-slate-400 mt-0.5">Upload an ECG to start tracking this patient's history.</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {sorted.map((analysis) => (
        <TimelineEntry
          key={analysis._id}
          analysis={analysis}
          preferClinical={preferClinical}
        />
      ))}
    </div>
  );
}
