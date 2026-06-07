import type { OntologyItem } from '../../types/ecg';
import { AlertCircle, Info } from 'lucide-react';

interface Props {
  ontologyItems: OntologyItem[] | undefined;
}

const URGENCY_CLASS: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  high:     'bg-orange-100 text-orange-700',
  moderate: 'bg-yellow-100 text-yellow-700',
  low:      'bg-green-100 text-green-700',
};

export default function EvidenceFusionPanel({ ontologyItems }: Props) {
  const items = ontologyItems?.filter(
    (item) => item.evidence && item.evidence.length > 0
  ) ?? [];

  if (!items.length) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">
          Evidence Fusion
        </h3>
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <Info className="w-4 h-4 shrink-0" />
          <span>No evidence data provided by the analysis engine.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
        Evidence Fusion
      </h3>

      {items.map((item, idx) => (
        <div key={idx} className="border-l-2 border-blue-400 pl-4 space-y-1.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="font-semibold text-slate-800 text-sm">{item.displayName}</span>
            <div className="flex items-center gap-1.5">
              {item.confidence !== undefined && (
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-mono">
                  {item.confidence}%
                </span>
              )}
              <span
                className={`text-xs px-2 py-0.5 rounded font-semibold ${
                  URGENCY_CLASS[item.urgencyTier] ?? 'bg-gray-100 text-gray-600'
                }`}
              >
                {item.urgencyTier}
              </span>
            </div>
          </div>

          <ul className="space-y-1">
            {item.evidence!.map((ev, evIdx) => (
              <li key={evIdx} className="flex items-start gap-2 text-xs text-slate-600">
                <AlertCircle className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <span>{ev}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
