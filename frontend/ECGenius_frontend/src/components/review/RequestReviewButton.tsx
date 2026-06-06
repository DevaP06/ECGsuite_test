import { useState } from 'react';
import { ClipboardList, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { reviewService } from '../../services/reviewService';
import { extractErrorMessage } from '../../utils/errorUtils';
import { isDoctor } from '../../features/auth/roleUtils';
import type { ReviewPriority } from '../../types/review';

interface Props {
  analysisId: string;
  patientId?: string;
  label?: string;
}

interface PriorityOption {
  value: ReviewPriority;
  label: string;
  desc: string;
  selected: string;
  unselected: string;
}

const PRIORITY_OPTIONS: PriorityOption[] = [
  {
    value: 'normal',
    label: 'Normal',
    desc: 'Standard review within 48 hours',
    selected: 'border-blue-400 bg-blue-50 text-blue-700',
    unselected: 'border-gray-200 hover:border-gray-300 text-slate-600',
  },
  {
    value: 'urgent',
    label: 'Urgent',
    desc: 'Priority review within 24 hours',
    selected: 'border-amber-400 bg-amber-50 text-amber-700',
    unselected: 'border-gray-200 hover:border-gray-300 text-slate-600',
  },
  {
    value: 'critical',
    label: 'Critical',
    desc: 'SLA Tier 1 — 4-hour response',
    selected: 'border-red-400 bg-red-50 text-red-700',
    unselected: 'border-gray-200 hover:border-gray-300 text-slate-600',
  },
];

const PRIORITY_BADGE: Record<ReviewPriority, string> = {
  normal:   'bg-blue-50 text-blue-600',
  urgent:   'bg-amber-50 text-amber-600',
  critical: 'bg-red-50 text-red-600',
};

export default function RequestReviewButton({
  analysisId,
  patientId,
  label = 'Request Specialist Review',
}: Props) {
  const [open, setOpen] = useState(false);
  const [priority, setPriority] = useState<ReviewPriority>('normal');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isDoctor()) return null;

  const handleClose = () => {
    if (!submitting) {
      setOpen(false);
      setNotes('');
      setPriority('normal');
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await reviewService.requestReview({
        analysisId,
        patientId,
        priority,
        notes: notes.trim() || undefined,
      });
      toast.success('Specialist review requested successfully.');
      handleClose();
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err, 'Failed to submit review request.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-sm font-semibold text-white transition"
      >
        <ClipboardList className="w-4 h-4" />
        {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5">

            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Request Specialist Review</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  A cardiologist will review this ECG case.
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Priority Level</label>
              <div className="grid grid-cols-3 gap-2">
                {PRIORITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPriority(opt.value)}
                    className={`flex flex-col gap-0.5 p-3 rounded-xl border-2 text-left transition ${
                      priority === opt.value ? opt.selected : opt.unselected
                    }`}
                  >
                    <span className="text-sm font-bold">{opt.label}</span>
                    <span className="text-xs opacity-70 leading-tight">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">
                Clinical Notes{' '}
                <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe the specific concerns you'd like the specialist to address…"
                rows={4}
                maxLength={2000}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              />
              <p className="text-xs text-slate-400 text-right">{notes.length}/2000</p>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 pt-1 border-t border-gray-100">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-sm font-semibold text-white transition disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    <ClipboardList className="w-4 h-4" />
                    Submit Request
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-slate-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <span
                className={`ml-auto text-xs font-semibold px-2.5 py-1 rounded-full ${PRIORITY_BADGE[priority]}`}
              >
                {priority.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
