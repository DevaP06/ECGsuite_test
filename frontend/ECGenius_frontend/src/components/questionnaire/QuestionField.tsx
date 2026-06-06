import type { Question, QuestionValue } from '../../types/questionnaire';

interface QuestionFieldProps {
  question: Question;
  value: QuestionValue;
  error?: string;
  disabled?: boolean;
  onChange: (value: QuestionValue) => void;
}

// ─── Shared input base classes ─────────────────────────────────────────────
const INPUT_BASE =
  'w-full px-3 py-2.5 text-sm border rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition disabled:bg-gray-50 disabled:text-slate-400';

const PILL_BASE =
  'px-4 py-2.5 rounded-lg border text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed';

// ─── Boolean (Yes / No pills) ──────────────────────────────────────────────
function BooleanField({ question, value, disabled, onChange }: QuestionFieldProps) {
  return (
    <div className="flex gap-3" role="group" aria-label={question.label}>
      <button
        type="button"
        disabled={disabled}
        aria-pressed={value === true}
        onClick={() => onChange(true)}
        className={`flex-1 ${PILL_BASE} ${
          value === true
            ? 'bg-emerald-50 border-emerald-400 text-emerald-700 shadow-sm'
            : 'border-gray-200 text-slate-600 hover:border-gray-300 hover:bg-gray-50'
        }`}
      >
        Yes
      </button>
      <button
        type="button"
        disabled={disabled}
        aria-pressed={value === false}
        onClick={() => onChange(false)}
        className={`flex-1 ${PILL_BASE} ${
          value === false
            ? 'bg-red-50 border-red-300 text-red-700 shadow-sm'
            : 'border-gray-200 text-slate-600 hover:border-gray-300 hover:bg-gray-50'
        }`}
      >
        No
      </button>
    </div>
  );
}

// ─── Single select (pills for ≤ 4 opts, native select otherwise) ──────────
function SingleSelectField({ question, value, disabled, onChange }: QuestionFieldProps) {
  const opts = question.options ?? [];

  if (opts.length <= 4) {
    return (
      <div
        className={`grid gap-2 ${opts.length <= 2 ? 'grid-cols-2' : 'grid-cols-2'}`}
        role="radiogroup"
        aria-label={question.label}
      >
        {opts.map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="radio"
            disabled={disabled}
            aria-checked={value === opt.value}
            onClick={() => onChange(opt.value)}
            className={`${PILL_BASE} text-left ${
              value === opt.value
                ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-sm'
                : 'border-gray-200 text-slate-600 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <select
      disabled={disabled}
      value={typeof value === 'string' ? value : ''}
      onChange={(e) => onChange(e.target.value || null)}
      className={INPUT_BASE + ' appearance-none bg-select-arrow'}
      aria-label={question.label}
    >
      <option value="">Select an option…</option>
      {opts.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

// ─── Multi select (checkbox pills) ────────────────────────────────────────
function MultiSelectField({ question, value, disabled, onChange }: QuestionFieldProps) {
  const opts = question.options ?? [];
  const selected: string[] = Array.isArray(value) ? value : [];

  const toggle = (v: string) => {
    if (selected.includes(v)) {
      onChange(selected.filter((s) => s !== v));
    } else {
      onChange([...selected, v]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={question.label}>
      {opts.map((opt) => {
        const active = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            role="checkbox"
            disabled={disabled}
            aria-checked={active}
            onClick={() => toggle(opt.value)}
            className={`px-3 py-1.5 rounded-full border text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed ${
              active
                ? 'bg-blue-100 border-blue-400 text-blue-700'
                : 'border-gray-200 text-slate-600 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Number ───────────────────────────────────────────────────────────────
function NumberField({ question, value, disabled, onChange }: QuestionFieldProps) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        disabled={disabled}
        value={typeof value === 'number' ? value : ''}
        min={question.min}
        max={question.max}
        aria-label={question.label}
        placeholder="0"
        onChange={(e) => {
          const n = e.target.value === '' ? null : parseFloat(e.target.value);
          onChange(n);
        }}
        className={INPUT_BASE + ' max-w-[160px]'}
      />
      {question.unit && (
        <span className="text-sm text-slate-500 shrink-0">{question.unit}</span>
      )}
    </div>
  );
}

// ─── Date ─────────────────────────────────────────────────────────────────
function DateField({ question, value, disabled, onChange }: QuestionFieldProps) {
  return (
    <input
      type="date"
      disabled={disabled}
      value={typeof value === 'string' ? value : ''}
      aria-label={question.label}
      onChange={(e) => onChange(e.target.value || null)}
      className={INPUT_BASE + ' max-w-[220px]'}
    />
  );
}

// ─── Text ─────────────────────────────────────────────────────────────────
function TextField({ question, value, disabled, onChange }: QuestionFieldProps) {
  return (
    <input
      type="text"
      disabled={disabled}
      value={typeof value === 'string' ? value : ''}
      placeholder={question.placeholder ?? ''}
      aria-label={question.label}
      onChange={(e) => onChange(e.target.value)}
      className={INPUT_BASE}
    />
  );
}

// ─── Textarea ─────────────────────────────────────────────────────────────
function TextareaField({ question, value, disabled, onChange }: QuestionFieldProps) {
  return (
    <textarea
      disabled={disabled}
      value={typeof value === 'string' ? value : ''}
      placeholder={question.placeholder ?? ''}
      aria-label={question.label}
      rows={3}
      onChange={(e) => onChange(e.target.value)}
      className={INPUT_BASE + ' resize-none leading-relaxed'}
    />
  );
}

// ─── Main dispatcher ───────────────────────────────────────────────────────
export default function QuestionField(props: QuestionFieldProps) {
  const { question, error } = props;

  const fieldEl = (() => {
    switch (question.type) {
      case 'boolean':       return <BooleanField {...props} />;
      case 'single_select': return <SingleSelectField {...props} />;
      case 'multi_select':  return <MultiSelectField {...props} />;
      case 'number':        return <NumberField {...props} />;
      case 'date':          return <DateField {...props} />;
      case 'textarea':      return <TextareaField {...props} />;
      default:              return <TextField {...props} />;
    }
  })();

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-700 leading-snug">
        {question.label}
        {question.required && <span className="text-red-500 ml-1" aria-hidden>*</span>}
      </label>

      {fieldEl}

      {question.hint && !error && (
        <p className="text-xs text-slate-400 leading-snug">{question.hint}</p>
      )}
      {error && (
        <p role="alert" className="text-xs text-red-600 font-medium">
          {error}
        </p>
      )}
    </div>
  );
}
