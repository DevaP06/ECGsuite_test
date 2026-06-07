import { CheckCircle2, Clock, ListChecks } from 'lucide-react';
import type { AuditEvent } from '../../types/audit';

interface Props {
  events: AuditEvent[];
}

export default function AuditTimeline({ events }: Props) {
  if (!events || events.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <ListChecks className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-700">Audit Trail</h3>
        </div>
        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-6 py-8 text-center">
          <p className="text-sm text-slate-500">No audit events available for this analysis.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-5">
        <ListChecks className="w-4 h-4 text-blue-500" />
        <h3 className="text-sm font-semibold text-slate-800">Audit Trail</h3>
      </div>

      <ol className="relative border-l-2 border-gray-100 ml-2 space-y-6">
        {events.map((event, i) => {
          const completed = event.status === 'completed';
          return (
            <li key={`${event.type}-${i}`} className="ml-5">
              <span
                className={`absolute -left-[11px] flex items-center justify-center w-5 h-5 rounded-full border-2 ${
                  completed
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-600'
                    : 'bg-gray-50 border-gray-200 text-gray-400'
                }`}
              >
                {completed ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-sm font-semibold ${completed ? 'text-slate-800' : 'text-slate-400'}`}>
                  {event.label}
                </span>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                    completed
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-gray-50 text-gray-500 border-gray-200'
                  }`}
                >
                  {completed ? 'Completed' : 'Pending'}
                </span>
                {event.timestamp && (
                  <span className="text-xs text-slate-400">{new Date(event.timestamp).toLocaleString()}</span>
                )}
              </div>
              {event.description && (
                <p className={`text-xs mt-1 ${completed ? 'text-slate-500' : 'text-slate-400'}`}>
                  {event.description}
                </p>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
