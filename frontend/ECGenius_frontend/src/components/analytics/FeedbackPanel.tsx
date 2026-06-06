import { useState } from 'react';
import {
  ThumbsUp, ThumbsDown, MessageSquare, AlertCircle, CheckCircle2, Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { analyticsService } from '../../services/analyticsService';
import { extractErrorMessage } from '../../utils/errorUtils';
import type { FeedbackType } from '../../types/analytics';

interface Props {
  analysisId: string;
  onSubmitted?: () => void;
}

interface FeedbackOption {
  type: FeedbackType;
  label: string;
  description: string;
  icon: React.ElementType;
  selectedClass: string;
}

const FEEDBACK_OPTIONS: FeedbackOption[] = [
  {
    type: 'model_correct',
    label: 'Model Correct',
    description: 'AI diagnosis was accurate for this case',
    icon: ThumbsUp,
    selectedClass: 'border-emerald-400 bg-emerald-50 text-emerald-700',
  },
  {
    type: 'model_incorrect',
    label: 'Model Incorrect',
    description: 'AI diagnosis differed significantly from my assessment',
    icon: ThumbsDown,
    selectedClass: 'border-red-400 bg-red-50 text-red-700',
  },
  {
    type: 'needs_more_data',
    label: 'Needs More Data',
    description: 'More ECG data needed for a confident diagnosis',
    icon: MessageSquare,
    selectedClass: 'border-blue-400 bg-blue-50 text-blue-700',
  },
  {
    type: 'false_positive',
    label: 'False Positive',
    description: 'AI flagged a condition that is not present',
    icon: AlertCircle,
    selectedClass: 'border-amber-400 bg-amber-50 text-amber-700',
  },
  {
    type: 'false_negative',
    label: 'False Negative',
    description: 'AI missed a condition that is present',
    icon: AlertCircle,
    selectedClass: 'border-orange-400 bg-orange-50 text-orange-700',
  },
];

export default function FeedbackPanel({ analysisId, onSubmitted }: Props) {
  const [selected, setSelected]   = useState<FeedbackType | null>(null);
  const [notes, setNotes]         = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await analyticsService.submitFeedback({ analysisId, feedbackType: selected, notes: notes.trim() || undefined });
      setSubmitted(true);
      onSubmitted?.();
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err, 'Failed to submit feedback.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-white rounded-xl border border-emerald-200 shadow-sm p-5 flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-slate-800">Feedback recorded</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Thank you. Your input helps improve the AI model.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
          Model Feedback
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Help improve future AI predictions by rating this case.
        </p>
      </div>

      {/* Feedback type selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {FEEDBACK_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isActive = selected === opt.type;
          return (
            <button
              key={opt.type}
              type="button"
              onClick={() => setSelected(opt.type)}
              className={`flex items-start gap-2 p-3 rounded-xl border-2 text-left transition ${
                isActive ? opt.selectedClass : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isActive ? '' : 'text-slate-400'}`} />
              <div className="min-w-0">
                <p className={`text-xs font-semibold ${isActive ? '' : 'text-slate-700'}`}>
                  {opt.label}
                </p>
                <p className={`text-xs leading-tight mt-0.5 ${isActive ? 'opacity-80' : 'text-slate-400'}`}>
                  {opt.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Notes */}
      {selected && (
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">
            Additional Notes <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Describe what the model got right or wrong…"
            rows={2}
            maxLength={500}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
          <p className="text-xs text-slate-400 text-right">{notes.length}/500</p>
        </div>
      )}

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!selected || submitting}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold transition disabled:opacity-50"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Submitting…
          </>
        ) : (
          'Submit Feedback'
        )}
      </button>

      <p className="text-xs text-slate-400">
        Feedback is collected for model retraining. No clinical action is taken automatically.
      </p>
    </div>
  );
}
