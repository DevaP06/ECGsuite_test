import { Check } from 'lucide-react';
import type { QuestionGroup, AnswersMap } from '../../types/questionnaire';
import { isSectionComplete } from '../../services/questionnaireService';

interface QuestionnaireProgressProps {
  sections: QuestionGroup[];
  currentIndex: number;
  answers: AnswersMap;
  onJump: (index: number) => void;
  totalRequired: number;
  answeredRequired: number;
  percent: number;
}

export default function QuestionnaireProgress({
  sections,
  currentIndex,
  answers,
  onJump,
  totalRequired,
  answeredRequired,
  percent,
}: QuestionnaireProgressProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-4">
      {/* Overall progress bar */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-semibold text-slate-600">
            {answeredRequired} / {totalRequired} required answered
          </span>
          <span className="text-xs font-bold text-blue-600">{percent}%</span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
            style={{ width: `${percent}%` }}
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${percent}% complete`}
          />
        </div>
      </div>

      {/* Section stepper */}
      <nav aria-label="Questionnaire sections">
        {/* Desktop: horizontal tabs (overflow-x-auto) */}
        <div className="hidden sm:flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
          {sections.map((section, idx) => {
            const isCurrent = idx === currentIndex;
            const isDone = isSectionComplete(section, answers);
            const isPast = idx < currentIndex;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => onJump(idx)}
                aria-current={isCurrent ? 'step' : undefined}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                  isCurrent
                    ? 'bg-blue-600 text-white shadow-sm'
                    : isDone
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : isPast
                    ? 'bg-gray-100 text-slate-500'
                    : 'bg-gray-50 text-slate-400 hover:bg-gray-100'
                }`}
              >
                {isDone && !isCurrent ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                    isCurrent ? 'bg-white/20' : 'bg-current/10'
                  }`}>
                    {idx + 1}
                  </span>
                )}
                {section.label}
              </button>
            );
          })}
        </div>

        {/* Mobile: compact section indicator */}
        <div className="sm:hidden">
          <p className="text-xs text-slate-500">
            Section <span className="font-semibold text-slate-700">{currentIndex + 1}</span> of {sections.length}
            {' '}—{' '}
            <span className="font-semibold text-slate-700">{sections[currentIndex]?.label}</span>
          </p>
          {/* Mobile mini-dots */}
          <div className="flex gap-1.5 mt-2">
            {sections.map((section, idx) => {
              const isCurrent = idx === currentIndex;
              const isDone = isSectionComplete(section, answers);
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => onJump(idx)}
                  aria-label={`Go to ${section.label}`}
                  className={`h-1.5 rounded-full transition-all ${
                    isCurrent ? 'w-6 bg-blue-500' : isDone ? 'w-3 bg-emerald-400' : 'w-3 bg-gray-200'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
