import { Gauge, Info } from 'lucide-react';
import type { OntologyScore } from '../../types/ontologyFusion';

interface Props {
  scores: OntologyScore[] | undefined;
}

const BAR_COLOR: Record<string, string> = {
  overall: 'bg-blue-500',
  ecg: 'bg-emerald-500',
  clinical: 'bg-purple-500',
  risk: 'bg-amber-500',
  vitals: 'bg-rose-500',
};

export default function ConfidenceBreakdown({ scores }: Props) {
  if (!scores || scores.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Gauge className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-700">Confidence Breakdown</h3>
        </div>
        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-6 py-8 text-center">
          <p className="text-sm text-slate-500">No confidence breakdown available.</p>
          <p className="text-xs text-slate-400 mt-1">
            Per-category confidence will appear here once the diagnostic engine provides it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-5">
        <Gauge className="w-4 h-4 text-blue-500" />
        <h3 className="text-sm font-semibold text-slate-800">Confidence Breakdown</h3>
      </div>

      <div className="space-y-4">
        {scores.map((score) => {
          const showValue = score.available && score.value !== undefined;
          const barColor = BAR_COLOR[score.category] ?? 'bg-slate-400';
          return (
            <div key={score.category}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-slate-700">{score.label}</span>
                {showValue ? (
                  <span className="text-xs font-semibold text-slate-600">{score.value}%</span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-400 italic">
                    <Info className="w-3 h-3" />
                    Not provided by backend
                  </span>
                )}
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                {showValue ? (
                  <div
                    className={`h-full rounded-full ${barColor}`}
                    style={{ width: `${Math.max(0, Math.min(100, score.value as number))}%` }}
                  />
                ) : (
                  <div className="h-full w-full rounded-full bg-gray-100" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
