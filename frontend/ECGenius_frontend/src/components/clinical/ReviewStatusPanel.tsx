import { Clock, UserCheck, Eye, CheckCircle2, AlertOctagon } from 'lucide-react';

type ReviewStatus = 'pending' | 'assigned' | 'in_review' | 'completed' | 'escalated';

const STATUS_CONFIG: Record<
  ReviewStatus,
  { label: string; colorClass: string; Icon: React.ElementType }
> = {
  pending:   { label: 'Pending Review',  colorClass: 'text-yellow-700 bg-yellow-50 border-yellow-200', Icon: Clock },
  assigned:  { label: 'Assigned',        colorClass: 'text-blue-700 bg-blue-50 border-blue-200',       Icon: UserCheck },
  in_review: { label: 'In Review',       colorClass: 'text-purple-700 bg-purple-50 border-purple-200', Icon: Eye },
  completed: { label: 'Review Complete', colorClass: 'text-green-700 bg-green-50 border-green-200',    Icon: CheckCircle2 },
  escalated: { label: 'Escalated',       colorClass: 'text-red-700 bg-red-50 border-red-200',          Icon: AlertOctagon },
};

export default function ReviewStatusPanel() {
  // Placeholder: specialist review backend API not yet wired
  const status: ReviewStatus = 'pending';
  const { label, colorClass, Icon } = STATUS_CONFIG[status];

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Specialist Review</h3>

      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-semibold ${colorClass}`}>
        <Icon className="w-4 h-4" />
        {label}
      </div>

      <dl className="space-y-1.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-slate-500">Assigned Cardiologist</dt>
          <dd className="text-slate-400 italic">Not yet assigned</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">Review Date</dt>
          <dd className="text-slate-400 italic">Pending</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">Reviewer Notes</dt>
          <dd className="text-slate-400 italic">None</dd>
        </div>
      </dl>

      <p className="text-xs text-slate-400 pt-1 border-t border-gray-50">
        Case is queued for cardiologist evaluation. Specialist review integration coming soon.
      </p>
    </div>
  );
}
