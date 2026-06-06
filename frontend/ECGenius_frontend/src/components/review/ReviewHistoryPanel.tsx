import { Clock, UserCheck, Eye, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import type { SpecialistReview, ReviewStatus } from '../../types/review';

interface Props {
  review: SpecialistReview | null;
}

interface TimelineEvent {
  label: string;
  detail?: string;
  icon: React.ElementType;
  iconClass: string;
  date?: string;
}

const STATUS_ICON: Record<ReviewStatus, React.ElementType> = {
  pending:   Clock,
  assigned:  UserCheck,
  in_review: Eye,
  completed: CheckCircle2,
  escalated: AlertCircle,
  rejected:  XCircle,
};

const STATUS_COLOR: Record<ReviewStatus, string> = {
  pending:   'text-yellow-500',
  assigned:  'text-blue-500',
  in_review: 'text-purple-500',
  completed: 'text-emerald-500',
  escalated: 'text-red-500',
  rejected:  'text-gray-400',
};

function buildEvents(review: SpecialistReview): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  events.push({
    label: 'Review Requested',
    detail: review.requestedBy ? `By ${review.requestedBy}` : undefined,
    icon: Clock,
    iconClass: 'text-yellow-500',
    date: review.createdAt,
  });

  if (
    review.reviewStatus === 'assigned' ||
    review.reviewStatus === 'in_review' ||
    review.reviewStatus === 'completed'
  ) {
    events.push({
      label: 'Assigned to Cardiologist',
      detail: review.cardiologistName ?? undefined,
      icon: UserCheck,
      iconClass: 'text-blue-500',
    });
  }

  if (review.reviewStatus === 'in_review' || review.reviewStatus === 'completed') {
    events.push({
      label: 'Review In Progress',
      icon: Eye,
      iconClass: 'text-purple-500',
    });
  }

  if (review.reviewStatus === 'completed') {
    events.push({
      label: review.expertDiagnosis ? 'Review Completed (Override)' : 'Review Completed (Approved)',
      detail: review.expertDiagnosis,
      icon: CheckCircle2,
      iconClass: 'text-emerald-500',
      date: review.reviewDate ?? undefined,
    });
  }

  if (review.reviewStatus === 'escalated') {
    events.push({
      label: 'Case Escalated',
      detail: review.reviewNotes ?? undefined,
      icon: AlertCircle,
      iconClass: 'text-red-500',
    });
  }

  if (review.reviewStatus === 'rejected') {
    events.push({
      label: 'Review Rejected',
      icon: XCircle,
      iconClass: 'text-gray-400',
    });
  }

  return events;
}

export default function ReviewHistoryPanel({ review }: Props) {
  const Icon = review ? STATUS_ICON[review.reviewStatus] : Clock;
  const iconClass = review ? STATUS_COLOR[review.reviewStatus] : 'text-gray-300';

  if (!review) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Review History</h3>
        <div className="flex items-center gap-3 py-4">
          <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center">
            <Icon className={`w-4 h-4 ${iconClass}`} />
          </div>
          <p className="text-sm text-slate-400">No review history available.</p>
        </div>
      </div>
    );
  }

  const events = buildEvents(review);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Review History</h3>

      <div className="relative space-y-5">
        {events.map((event, idx) => {
          const EventIcon = event.icon;
          return (
            <div key={idx} className="flex gap-3">
              {/* Spine */}
              <div className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 bg-white ${
                  idx === events.length - 1 ? 'border-blue-300' : 'border-gray-200'
                }`}>
                  <EventIcon className={`w-3.5 h-3.5 ${event.iconClass}`} />
                </div>
                {idx < events.length - 1 && (
                  <div className="w-px flex-1 bg-gray-200 mt-1 min-h-[1rem]" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 leading-tight">{event.label}</p>
                {event.detail && (
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{event.detail}</p>
                )}
                {event.date && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(event.date).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {review.overrideReason && (
        <div className="border-t border-gray-50 pt-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
            Override Reason
          </p>
          <p className="text-sm text-slate-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            {review.overrideReason}
          </p>
        </div>
      )}
    </div>
  );
}
