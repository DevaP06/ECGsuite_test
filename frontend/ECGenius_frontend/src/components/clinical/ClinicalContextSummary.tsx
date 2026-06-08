import { ClipboardList, Stethoscope, ShieldAlert, HeartPulse, Clock } from 'lucide-react';
import { getQuestionLabel } from '../../data/questionLabels';
import type { ClinicalContext } from '../../types/clinicalContext';

interface Props {
  context: ClinicalContext | null;
  submittedAt: string | null;
}

interface Group {
  key: keyof ClinicalContext;
  label: string;
  icon: typeof Stethoscope;
  badgeClass: string;
}

const GROUPS: Group[] = [
  { key: 'symptoms',    label: 'Symptoms',     icon: Stethoscope, badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' },
  { key: 'riskFactors', label: 'Risk Factors', icon: ShieldAlert, badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' },
  { key: 'vitals',      label: 'Vitals',       icon: HeartPulse,  badgeClass: 'bg-rose-50 text-rose-700 border-rose-200' },
];

export default function ClinicalContextSummary({ context, submittedAt }: Props) {
  if (!context) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-5 space-y-2">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-slate-400" />
          Clinical Context Summary
        </h3>
        <p className="text-sm text-slate-400 italic">
          No clinical context has been submitted for this analysis yet.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-slate-400" />
          Clinical Context Summary
        </h3>
        {submittedAt && (
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            Submitted {new Date(submittedAt).toLocaleString()}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {GROUPS.map((group) => {
          const entries = Object.entries(context[group.key] ?? {}).filter(([, present]) => present);
          const Icon = group.icon;
          return (
            <div key={group.key} className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5 text-slate-400" />
                {group.label}
              </h4>
              {entries.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {entries.map(([key]) => {
                    const label = getQuestionLabel(key);
                    return (
                      <span
                        key={key}
                        title={label}
                        className={`inline-block max-w-[260px] truncate text-xs font-medium px-2.5 py-1 rounded-full border ${group.badgeClass}`}
                      >
                        {label}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">None reported</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
