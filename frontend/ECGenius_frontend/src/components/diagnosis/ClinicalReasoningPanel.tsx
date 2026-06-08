import { Brain, Info } from 'lucide-react';

interface Props {
  reasoning?: string | null;
}

export default function ClinicalReasoningPanel({ reasoning }: Props) {
  const text = reasoning?.trim();

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-4 h-4 text-blue-500" />
        <h3 className="text-sm font-semibold text-slate-800">Clinical Reasoning</h3>
      </div>

      {text ? (
        <div className="rounded-lg bg-blue-50/50 border border-blue-100 px-5 py-4">
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{text}</p>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-6 py-8 text-center flex flex-col items-center gap-2">
          <Info className="w-5 h-5 text-slate-300" />
          <p className="text-sm text-slate-500">Clinical reasoning narrative is not yet available for this analysis.</p>
          <p className="text-xs text-slate-400">It will appear here once provided by the diagnostic engine.</p>
        </div>
      )}
    </div>
  );
}
