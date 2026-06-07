import { CheckCircle2, History, Activity, Stethoscope, AlertTriangle, HeartPulse, Gauge } from 'lucide-react';
import type { EvidenceSource, OntologyFusionResult } from '../../types/ontologyFusion';

interface Props {
  result: OntologyFusionResult | null;
}

const TIMELINE_STEPS: { source: EvidenceSource; label: string; icon: typeof Activity }[] = [
  { source: 'ecg', label: 'ECG Evidence', icon: Activity },
  { source: 'symptom', label: 'Symptoms', icon: Stethoscope },
  { source: 'riskFactor', label: 'Risk Factors', icon: AlertTriangle },
  { source: 'vital', label: 'Vitals', icon: HeartPulse },
];

export default function EvidenceTimeline({ result }: Props) {
  if (!result) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-700">Evidence Timeline</h3>
        </div>
        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-6 py-8 text-center">
          <p className="text-sm text-slate-500">No evidence timeline available.</p>
          <p className="text-xs text-slate-400 mt-1">
            Evidence accumulates here as ECG findings and clinical context are recorded for this analysis.
          </p>
        </div>
      </div>
    );
  }

  const overall = result.scores.find((s) => s.category === 'overall');

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-5">
        <History className="w-4 h-4 text-blue-500" />
        <h3 className="text-sm font-semibold text-slate-800">Evidence Timeline</h3>
      </div>

      <ol className="relative border-l-2 border-gray-100 ml-2 space-y-6">
        {TIMELINE_STEPS.map(({ source, label, icon: Icon }) => {
          const items = result.evidenceGroups[source] ?? [];
          const hasItems = items.length > 0;
          return (
            <li key={source} className="ml-5">
              <span
                className={`absolute -left-[11px] flex items-center justify-center w-5 h-5 rounded-full border-2 ${
                  hasItems
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-600'
                    : 'bg-gray-50 border-gray-200 text-gray-400'
                }`}
              >
                <Icon className="w-3 h-3" />
              </span>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-sm font-semibold text-slate-700">{label}</span>
                <span className="text-xs text-slate-400">
                  {hasItems ? `${items.length} item${items.length !== 1 ? 's' : ''}` : 'No evidence recorded'}
                </span>
              </div>
              {hasItems ? (
                <ul className="space-y-1">
                  {items.map((evidence, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{evidence.label}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400 italic">No evidence recorded for this category.</p>
              )}
            </li>
          );
        })}

        <li className="ml-5">
          <span
            className={`absolute -left-[11px] flex items-center justify-center w-5 h-5 rounded-full border-2 ${
              overall?.available
                ? 'bg-blue-50 border-blue-300 text-blue-600'
                : 'bg-gray-50 border-gray-200 text-gray-400'
            }`}
          >
            <Gauge className="w-3 h-3" />
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-700">Overall Confidence</span>
            <span className="text-xs text-slate-400">
              {overall?.available && overall.value !== undefined
                ? `${overall.value}%`
                : 'Not provided by backend'}
            </span>
          </div>
        </li>
      </ol>
    </div>
  );
}
