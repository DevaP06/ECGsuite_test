import { Pencil, Send, FastForward } from 'lucide-react';
import type { AnswerValue, Question, QuestionCategory } from '../../types/clinicalContext';

interface ReviewAnswersProps {
  categories: Record<QuestionCategory, Question[]>;
  answers: Record<string, AnswerValue>;
  onEdit: (category: QuestionCategory) => void;
  onSubmit: () => void;
  onCompleteWithoutAnswers: () => void;
  submitting?: boolean;
}

const CATEGORY_LABELS: Record<QuestionCategory, string> = {
  symptoms: 'Symptoms',
  riskFactors: 'Risk Factors',
  vitals: 'Vitals',
};

const ANSWER_LABELS: Record<AnswerValue, string> = {
  yes: 'Yes',
  no: 'No',
  unknown: 'Not specified',
};

const ANSWER_STYLES: Record<AnswerValue, string> = {
  yes: 'text-emerald-300',
  no: 'text-rose-300',
  unknown: 'text-gray-500',
};

const CATEGORY_ORDER: QuestionCategory[] = ['symptoms', 'riskFactors', 'vitals'];

export default function ReviewAnswers({
  categories,
  answers,
  onEdit,
  onSubmit,
  onCompleteWithoutAnswers,
  submitting = false,
}: ReviewAnswersProps) {
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-white">Review &amp; Submit</h2>
        <p className="text-sm text-gray-400">
          {answeredCount > 0
            ? 'Confirm your answers below, or jump back to edit any section.'
            : "You haven't answered any questions yet — that's okay, you can still submit."}
        </p>
      </div>

      {CATEGORY_ORDER.map((category) => {
        const questions = categories[category];
        if (questions.length === 0) return null;

        return (
          <div key={category} className="rounded-2xl border border-gray-700 bg-gray-900/40 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">{CATEGORY_LABELS[category]}</h3>
              <button
                type="button"
                onClick={() => onEdit(category)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </button>
            </div>
            <ul className="space-y-2">
              {questions.map((question) => {
                const value = answers[question.key] ?? 'unknown';
                return (
                  <li key={question.key} className="flex items-start justify-between gap-4 text-sm">
                    <span className="text-gray-300">{question.label}</span>
                    <span className={`shrink-0 font-semibold ${ANSWER_STYLES[value]}`}>
                      {ANSWER_LABELS[value]}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-400 text-white font-semibold px-5 py-3 min-h-[44px] transition hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
          {submitting ? 'Submitting…' : 'Submit Clinical Context'}
        </button>
        <button
          type="button"
          onClick={onCompleteWithoutAnswers}
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 font-semibold px-5 py-3 min-h-[44px] transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <FastForward className="w-4 h-4" />
          Complete Without Answers
        </button>
      </div>
    </div>
  );
}
