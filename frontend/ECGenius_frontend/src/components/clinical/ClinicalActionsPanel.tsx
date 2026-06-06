import type { OntologyItem } from '../../types/ecg';
import { Beaker, Info } from 'lucide-react';

interface Props {
  ontologyItems: OntologyItem[] | undefined;
}

export default function ClinicalActionsPanel({ ontologyItems }: Props) {
  const allTests = [
    ...new Set(ontologyItems?.flatMap((item) => item.recommendedTests) ?? []),
  ];

  if (!allTests.length) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">
          Recommended Actions
        </h3>
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <Info className="w-4 h-4 shrink-0" />
          <span>No recommendations provided by the analysis engine.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
        Recommended Actions
      </h3>

      <ul className="space-y-2">
        {allTests.map((test, idx) => (
          <li key={idx} className="flex items-start gap-2.5 text-sm">
            <Beaker className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <span className="text-slate-700">{test}</span>
          </li>
        ))}
      </ul>

      <p className="text-xs text-slate-400 pt-2 border-t border-gray-50">
        Recommendations are AI-generated based on detected ECG findings.
        Clinical judgement must be applied before any action.
      </p>
    </div>
  );
}
