import type { QuestionGroup, AnswersMap, QuestionValue } from '../../types/questionnaire';
import { isQuestionVisible } from '../../types/questionnaire';
import QuestionField from './QuestionField';

interface QuestionnaireRendererProps {
  section: QuestionGroup;
  answers: AnswersMap;
  errors: Record<string, string>;
  disabled?: boolean;
  onAnswer: (questionId: string, value: QuestionValue) => void;
}

export default function QuestionnaireRenderer({
  section,
  answers,
  errors,
  disabled,
  onAnswer,
}: QuestionnaireRendererProps) {
  const visibleQuestions = section.questions.filter((q) =>
    isQuestionVisible(q, answers)
  );

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
      {/* Section header */}
      <div className="px-6 py-5 border-b border-gray-100">
        <h2 className="text-lg font-bold text-slate-800">{section.label}</h2>
        {section.description && (
          <p className="text-sm text-slate-500 mt-0.5">{section.description}</p>
        )}
      </div>

      {/* Questions */}
      <div className="px-6 py-6 space-y-7">
        {visibleQuestions.length === 0 ? (
          <p className="text-sm text-slate-400 italic text-center py-4">
            No questions in this section.
          </p>
        ) : (
          visibleQuestions.map((q) => (
            <QuestionField
              key={q.id}
              question={q}
              value={answers[q.id] ?? null}
              error={errors[q.id]}
              disabled={disabled}
              onChange={(val) => onAnswer(q.id, val)}
            />
          ))
        )}
      </div>

      {/* Required field notice */}
      {visibleQuestions.some((q) => q.required) && (
        <div className="px-6 pb-4">
          <p className="text-xs text-slate-400">
            <span className="text-red-500">*</span> Required fields
          </p>
        </div>
      )}
    </div>
  );
}
