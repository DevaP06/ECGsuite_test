import { useState } from 'react';
import {
  CheckCircle2, AlertTriangle, MessageSquare, ArrowUpCircle, Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { reviewService } from '../../services/reviewService';
import { extractErrorMessage } from '../../utils/errorUtils';
import type { SpecialistReview } from '../../types/review';

interface Props {
  analysisId: string;
  onDecisionSubmitted?: (review: SpecialistReview) => void;
}

type DecisionType = 'approve' | 'override' | 'more_info' | 'escalate';

interface DecisionConfig {
  type: DecisionType;
  label: string;
  description: string;
  icon: React.ElementType;
  buttonClass: string;
  requiresDiagnosis: boolean;
  requiresReason: boolean;
  requiresNotes: boolean;
}

const DECISIONS: DecisionConfig[] = [
  {
    type: 'approve',
    label: 'Approve',
    description: 'Confirm the AI diagnosis is correct.',
    icon: CheckCircle2,
    buttonClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    requiresDiagnosis: false,
    requiresReason: false,
    requiresNotes: false,
  },
  {
    type: 'override',
    label: 'Override Diagnosis',
    description: 'Enter your expert diagnosis.',
    icon: AlertTriangle,
    buttonClass: 'bg-amber-600 hover:bg-amber-700 text-white',
    requiresDiagnosis: true,
    requiresReason: true,
    requiresNotes: false,
  },
  {
    type: 'more_info',
    label: 'Request More Info',
    description: 'Return to doctor with questions.',
    icon: MessageSquare,
    buttonClass: 'bg-blue-600 hover:bg-blue-700 text-white',
    requiresDiagnosis: false,
    requiresReason: false,
    requiresNotes: true,
  },
  {
    type: 'escalate',
    label: 'Escalate',
    description: 'Refer to a senior specialist.',
    icon: ArrowUpCircle,
    buttonClass: 'bg-red-600 hover:bg-red-700 text-white',
    requiresDiagnosis: false,
    requiresReason: false,
    requiresNotes: true,
  },
];

export default function ReviewDecisionPanel({ analysisId, onDecisionSubmitted }: Props) {
  const [selected, setSelected] = useState<DecisionType | null>(null);
  const [expertDiagnosis, setExpertDiagnosis] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const config = DECISIONS.find((d) => d.type === selected) ?? null;

  const handleSelect = (type: DecisionType) => {
    setSelected(type);
    setExpertDiagnosis('');
    setOverrideReason('');
    setReviewNotes('');
  };

  const handleSubmit = async () => {
    if (!selected) return;

    if (config?.requiresDiagnosis && !expertDiagnosis.trim()) {
      toast.error('Expert diagnosis is required for an override.');
      return;
    }
    if (config?.requiresReason && !overrideReason.trim()) {
      toast.error('Override reason is required.');
      return;
    }
    if (config?.requiresNotes && !reviewNotes.trim()) {
      toast.error('Please add notes before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      // Map decision type to backend reviewStatus enum (pending | in_review | completed)
      const reviewStatus =
        selected === 'more_info' ? 'pending' as const : 'completed' as const;

      // Prefix escalation note so it can be identified downstream
      const finalNotes =
        selected === 'escalate'
          ? `[ESCALATED] ${reviewNotes.trim()}`
          : reviewNotes.trim() || undefined;

      const result = await reviewService.submitDecision(analysisId, {
        reviewStatus,
        expertDiagnosis: config?.requiresDiagnosis ? expertDiagnosis.trim() : undefined,
        overrideReason: config?.requiresReason ? overrideReason.trim() : undefined,
        reviewNotes: finalNotes,
      });

      toast.success('Decision submitted successfully.');
      setSubmitted(true);
      onDecisionSubmitted?.(result);
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err, 'Failed to submit decision.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-white rounded-xl border border-emerald-200 shadow-sm p-6 text-center space-y-3">
        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-800">Decision Submitted</h3>
        <p className="text-sm text-slate-500">
          Your review decision has been recorded and the referring doctor has been notified.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-5">
      <div>
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Review Decision</h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Select an action and submit your specialist decision.
        </p>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-2">
        {DECISIONS.map((dec) => {
          const Icon = dec.icon;
          const isActive = selected === dec.type;
          return (
            <button
              key={dec.type}
              type="button"
              onClick={() => handleSelect(dec.type)}
              className={`flex flex-col items-start gap-1 p-3 rounded-xl border-2 text-left transition ${
                isActive
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span className={`text-sm font-semibold ${isActive ? 'text-blue-700' : 'text-slate-700'}`}>
                  {dec.label}
                </span>
              </div>
              <span className="text-xs text-slate-400 leading-tight">{dec.description}</span>
            </button>
          );
        })}
      </div>

      {/* Contextual fields */}
      {selected && (
        <div className="space-y-3 border-t border-gray-50 pt-4">

          {config?.requiresDiagnosis && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Expert Diagnosis <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={expertDiagnosis}
                onChange={(e) => setExpertDiagnosis(e.target.value)}
                placeholder="Enter your specialist diagnosis…"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              <p className="text-xs text-amber-600">
                Manually enter your diagnosis. Do not copy from AI output.
              </p>
            </div>
          )}

          {config?.requiresReason && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Override Reason <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Why does the AI diagnosis need correction?"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          )}

          {(config?.requiresNotes || selected === 'approve') && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Reviewer Notes{' '}
                {config?.requiresNotes && <span className="text-red-500">*</span>}
                {!config?.requiresNotes && (
                  <span className="text-slate-400 normal-case font-normal">(optional)</span>
                )}
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder={
                  selected === 'escalate'
                    ? 'Describe why this case is being escalated…'
                    : selected === 'more_info'
                    ? 'What additional information is needed?'
                    : 'Any additional clinical observations…'
                }
                rows={3}
                maxLength={2000}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              <p className="text-xs text-slate-400 text-right">{reviewNotes.length}/2000</p>
            </div>
          )}

          {/* Submit */}
          {config && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition disabled:opacity-60 ${config.buttonClass}`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <config.icon className="w-4 h-4" />
                  Confirm: {config.label}
                </>
              )}
            </button>
          )}
        </div>
      )}

      {!selected && (
        <p className="text-xs text-slate-400 text-center py-2">
          Select an action above to proceed.
        </p>
      )}
    </div>
  );
}
