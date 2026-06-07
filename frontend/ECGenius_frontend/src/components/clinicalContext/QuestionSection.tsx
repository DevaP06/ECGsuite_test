import { useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import type { AnswerValue, Question } from '../../types/clinicalContext';
import QuestionCard from './QuestionCard';

interface QuestionSectionProps {
  title: string;
  description: string;
  questions: Question[];
  answers: Record<string, AnswerValue>;
  onAnswer: (key: string, value: AnswerValue) => void;
  onSkipSection: () => void;
  onAutoAdvance: () => void;
}

export default function QuestionSection({
  title,
  description,
  questions,
  answers,
  onAnswer,
  onSkipSection,
  onAutoAdvance,
}: QuestionSectionProps) {
  const hasAutoAdvanced = useRef(false);

  useEffect(() => {
    if (questions.length === 0 && !hasAutoAdvanced.current) {
      hasAutoAdvanced.current = true;
      onAutoAdvance();
    }
  }, [questions.length, onAutoAdvance]);

  if (questions.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-700 bg-gray-900/40 p-8 text-center">
        <p className="text-gray-400 text-sm">
          No relevant questions for this section based on the predicted rhythms — skipping ahead.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-white">{title}</h2>
          <p className="text-sm text-gray-400">{description}</p>
        </div>
        <button
          type="button"
          onClick={onSkipSection}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 text-xs font-semibold transition"
        >
          Skip Section
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-3">
        {questions.map((question) => (
          <QuestionCard
            key={question.key}
            question={question}
            value={answers[question.key] ?? null}
            onAnswer={onAnswer}
          />
        ))}
      </div>
    </div>
  );
}
