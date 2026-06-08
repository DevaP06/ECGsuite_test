import { Check, X, HelpCircle } from 'lucide-react';
import type { AnswerValue, Question } from '../../types/clinicalContext';

interface QuestionCardProps {
  question: Question;
  value: AnswerValue | null;
  onAnswer: (key: string, value: AnswerValue) => void;
  allowUnknown?: boolean;
}

const OPTIONS: { value: AnswerValue; label: string; icon: typeof Check }[] = [
  { value: 'yes', label: 'Yes', icon: Check },
  { value: 'no', label: 'No', icon: X },
  { value: 'unknown', label: "Don't know", icon: HelpCircle },
];

const SELECTED_STYLES: Record<AnswerValue, string> = {
  yes: 'bg-emerald-500/20 border-emerald-400 text-emerald-300',
  no: 'bg-rose-500/20 border-rose-400 text-rose-300',
  unknown: 'bg-amber-500/20 border-amber-400 text-amber-300',
};

export default function QuestionCard({ question, value, onAnswer, allowUnknown = true }: QuestionCardProps) {
  const options = allowUnknown ? OPTIONS : OPTIONS.filter((o) => o.value !== 'unknown');

  return (
    <div
      role="group"
      aria-label={question.label}
      className="rounded-2xl border border-gray-700 bg-gray-900/50 p-5 sm:p-6"
    >
      <p className="text-base sm:text-lg font-medium text-white leading-relaxed mb-4">
        {question.label}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {options.map(({ value: optionValue, label, icon: Icon }) => {
          const isSelected = value === optionValue;
          return (
            <button
              key={optionValue}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onAnswer(question.key, optionValue)}
              className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3.5 min-h-[44px] text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 ${
                isSelected
                  ? SELECTED_STYLES[optionValue]
                  : 'bg-black/30 border-gray-700 text-gray-300 hover:bg-gray-800/60 hover:border-gray-500'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
