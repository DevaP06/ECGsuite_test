interface QuestionnaireProgressProps {
  answered: number;
  total: number;
  coverage: number;
}

export default function QuestionnaireProgress({ answered, total, coverage }: QuestionnaireProgressProps) {
  const percent = total > 0 ? Math.round((answered / total) * 100) : 0;

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900/40 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
      <div className="flex-1">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
          <span>{answered} of {total} answered</span>
          <span>{percent}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-400 transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
      <div className="text-xs text-gray-500 whitespace-nowrap">
        Rhythm coverage: <span className="text-gray-300 font-semibold">{coverage}%</span>
      </div>
    </div>
  );
}
