import { Pencil, AlertCircle } from 'lucide-react';
import type { QuestionGroup, AnswersMap } from '../../types/questionnaire';
import { isQuestionVisible, isValueEmpty } from '../../types/questionnaire';

interface QuestionnaireSummaryProps {
  sections: QuestionGroup[];
  answers: AnswersMap;
  submitting: boolean;
  onEditSection: (index: number) => void;
  onSubmit: () => void;
  onSaveDraft: () => void;
}

function formatValue(q: import('../../types/questionnaire').Question, raw: import('../../types/questionnaire').QuestionValue): string {
  if (raw === null || raw === undefined) return '—';
  if (typeof raw === 'boolean') return raw ? 'Yes' : 'No';
  if (typeof raw === 'number') return q.unit ? `${raw} ${q.unit}` : String(raw);
  if (typeof raw === 'string') {
    if (q.type === 'date' && raw) {
      return new Date(raw).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    if (q.type === 'single_select') {
      const opt = q.options?.find((o) => o.value === raw);
      return opt?.label ?? raw;
    }
    return raw || '—';
  }
  if (Array.isArray(raw)) {
    if (raw.length === 0) return '—';
    return raw
      .map((v) => q.options?.find((o) => o.value === v)?.label ?? v)
      .join(', ');
  }
  return '—';
}

export default function QuestionnaireSummary({
  sections,
  answers,
  submitting,
  onEditSection,
  onSubmit,
  onSaveDraft,
}: QuestionnaireSummaryProps) {
  const hasRequiredUnanswered = sections.some((section) =>
    section.questions.some(
      (q) => isQuestionVisible(q, answers) && q.required && isValueEmpty(answers[q.id] ?? null)
    )
  );

  return (
    <div className="space-y-5">
      {/* Warning banner */}
      {hasRequiredUnanswered && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Required fields missing</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Some required questions are unanswered. You can still save as a draft,
              but submission requires all required fields.
            </p>
          </div>
        </div>
      )}

      {/* Sections */}
      {sections.map((section, sectionIdx) => {
        const visible = section.questions.filter((q) => isQuestionVisible(q, answers));
        const hasContent = visible.some((q) => !isValueEmpty(answers[q.id] ?? null));

        return (
          <div key={section.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <div>
                <h3 className="text-sm font-bold text-slate-800">{section.label}</h3>
                {!hasContent && (
                  <span className="text-xs text-slate-400">No answers provided</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => onEditSection(sectionIdx)}
                className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition"
                aria-label={`Edit ${section.label}`}
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </button>
            </div>

            {hasContent && (
              <div className="px-5 py-4 space-y-3">
                {visible.map((q) => {
                  const raw = answers[q.id] ?? null;
                  const isEmpty = isValueEmpty(raw);
                  const isMissing = q.required && isEmpty;

                  return (
                    <div key={q.id} className="flex items-start justify-between gap-4">
                      <p className={`text-xs font-medium leading-snug max-w-sm ${isMissing ? 'text-red-600' : 'text-slate-600'}`}>
                        {q.label}
                        {q.required && <span className="text-red-400 ml-0.5">*</span>}
                      </p>
                      <p className={`text-xs text-right shrink-0 max-w-[180px] ${isMissing ? 'text-red-500 italic' : 'text-slate-800 font-medium'}`}>
                        {isMissing ? 'Required — not answered' : formatValue(q, raw)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={submitting}
          className="flex-1 py-3 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-slate-700 hover:bg-gray-50 transition disabled:opacity-50"
        >
          Save Draft
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting || hasRequiredUnanswered}
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-sm font-semibold text-white shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
          title={hasRequiredUnanswered ? 'Complete all required fields before submitting' : undefined}
        >
          {submitting ? 'Submitting…' : 'Confirm & Submit'}
        </button>
      </div>
    </div>
  );
}
