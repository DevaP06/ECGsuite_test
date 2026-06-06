import { useState, useEffect } from 'react';
import { Clock, UserCheck, Eye, CheckCircle2, Loader2 } from 'lucide-react';
import { reviewService } from '../../services/reviewService';
import { extractErrorMessage } from '../../utils/errorUtils';
import type { SpecialistReview, ReviewStatus } from '../../types/review';

interface Props {
  analysisId: string;
  compact?: boolean;
}

interface StatusStep {
  status: ReviewStatus;
  label: string;
  icon: React.ElementType;
}

const STATUS_STEPS: StatusStep[] = [
  { status: 'pending',   label: 'Pending',   icon: Clock        },
  { status: 'assigned',  label: 'Assigned',  icon: UserCheck    },
  { status: 'in_review', label: 'In Review', icon: Eye          },
  { status: 'completed', label: 'Complete',  icon: CheckCircle2 },
];

interface StatusBadgeConfig {
  label: string;
  colorClass: string;
}

const STATUS_BADGE: Record<ReviewStatus, StatusBadgeConfig> = {
  pending:   { label: 'Pending Review',    colorClass: 'bg-yellow-50 text-yellow-700 border-yellow-200'  },
  assigned:  { label: 'Assigned',          colorClass: 'bg-blue-50 text-blue-700 border-blue-200'        },
  in_review: { label: 'In Review',         colorClass: 'bg-purple-50 text-purple-700 border-purple-200'  },
  completed: { label: 'Review Complete',   colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  escalated: { label: 'Escalated',         colorClass: 'bg-red-50 text-red-700 border-red-200'           },
  rejected:  { label: 'Rejected',          colorClass: 'bg-gray-50 text-gray-700 border-gray-200'        },
};

export default function ReviewStatusTracker({ analysisId, compact = false }: Props) {
  const [review, setReview] = useState<SpecialistReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const data = await reviewService.getAnalysisReview(analysisId);
        if (!cancelled) setReview(data);
      } catch (err: unknown) {
        if (!cancelled) {
          setFetchError(extractErrorMessage(err, 'Unable to load review status.'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [analysisId]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">
          Specialist Review
        </h3>
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading review status…
        </div>
      </div>
    );
  }

  // Compact badge variant (for inline use in lists)
  if (compact) {
    if (!review) {
      return (
        <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border bg-gray-50 text-gray-500 border-gray-200">
          No Review
        </span>
      );
    }
    const badge = STATUS_BADGE[review.reviewStatus] ?? STATUS_BADGE.pending;
    return (
      <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border ${badge.colorClass}`}>
        {badge.label}
      </span>
    );
  }

  // Not yet requested (null from 404 or genuine empty)
  if (!review) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Specialist Review</h3>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-yellow-200 bg-yellow-50 text-sm font-semibold text-yellow-700">
          <Clock className="w-4 h-4 shrink-0" />
          {fetchError ? 'Review status unavailable' : 'Not yet requested'}
        </div>
        <p className="text-xs text-slate-400">
          {fetchError ?? 'No specialist review has been requested for this analysis.'}
        </p>
      </div>
    );
  }

  const badge = STATUS_BADGE[review.reviewStatus] ?? STATUS_BADGE.pending;
  const currentIdx = STATUS_STEPS.findIndex((s) => s.status === review.reviewStatus);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Specialist Review</h3>
        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${badge.colorClass}`}>
          {badge.label}
        </span>
      </div>

      {/* Status timeline */}
      <div className="flex items-start gap-0">
        {STATUS_STEPS.map((step, idx) => {
          const done = idx <= currentIdx;
          const current = idx === currentIdx;
          const Icon = step.icon;
          return (
            <div key={step.status} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1 flex-1">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition ${
                    done ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-200'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${done ? 'text-white' : 'text-gray-300'}`} />
                </div>
                <span
                  className={`text-xs text-center leading-tight ${
                    current ? 'font-semibold text-slate-700' : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {idx < STATUS_STEPS.length - 1 && (
                <div
                  className={`h-px flex-1 -mt-4 ${idx < currentIdx ? 'bg-blue-600' : 'bg-gray-200'}`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Details */}
      <dl className="space-y-2 text-sm border-t border-gray-50 pt-3">
        {review.cardiologistName && (
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500 shrink-0">Assigned Cardiologist</dt>
            <dd className="font-semibold text-slate-800 text-right">{review.cardiologistName}</dd>
          </div>
        )}
        {review.reviewDate && (
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500 shrink-0">Review Date</dt>
            <dd className="text-slate-700">{new Date(review.reviewDate).toLocaleDateString()}</dd>
          </div>
        )}
        {review.expertDiagnosis && (
          <div>
            <dt className="text-slate-500 mb-1">Expert Diagnosis</dt>
            <dd className="text-slate-800 font-medium bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 text-sm">
              {review.expertDiagnosis}
            </dd>
          </div>
        )}
        {review.reviewNotes && (
          <div>
            <dt className="text-slate-500 mb-1">Reviewer Notes</dt>
            <dd className="text-slate-700 text-xs bg-gray-50 rounded-lg px-3 py-2 whitespace-pre-wrap">
              {review.reviewNotes}
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}
