import { XCircle, CheckCircle2, Info } from 'lucide-react';

export type FeedbackTone = 'error' | 'success' | 'info';

interface FormFeedbackProps {
  tone: FeedbackTone;
  message?: string | null;
}

const TONE_STYLES: Record<FeedbackTone, { wrapperClass: string; icon: typeof Info }> = {
  error:   { wrapperClass: 'bg-red-900/50 border-red-500 text-red-200',         icon: XCircle },
  success: { wrapperClass: 'bg-emerald-900/40 border-emerald-500 text-emerald-200', icon: CheckCircle2 },
  info:    { wrapperClass: 'bg-blue-900/40 border-blue-500 text-blue-200',       icon: Info },
};

// Raw/leaky backend error shapes that must never reach the user verbatim —
// generic axios status text, server-error wording, stack-trace fragments, or
// connection-level failures. Anything matching (or implausibly long) is
// swapped for a calm, generic message instead.
const RAW_ERROR_PATTERNS: RegExp[] = [
  /request failed with status code 5\d{2}/i,
  /\b5\d{2}\b/,
  /internal server error/i,
  /<html|<!doctype/i,
  /\bat\s+\S+\s+\(.*:\d+:\d+\)/, // stack-trace frame
  /ECONNREFUSED|ETIMEDOUT|ENOTFOUND|ECONNRESET/,
];

const GENERIC_FALLBACK = "Something went wrong on our end. Please try again in a moment.";

function sanitize(message: string): string {
  if (!message) return message;
  const looksRaw = RAW_ERROR_PATTERNS.some((pattern) => pattern.test(message)) || message.length > 180;
  return looksRaw ? GENERIC_FALLBACK : message;
}

// Form-level feedback banner for auth screens — replaces ad-hoc inline error
// `<div>`s. Error messages are sanitized so raw backend/HTTP-500 text never
// renders directly; success/info messages pass through as-is (they originate
// from our own copy, not the backend).
export default function FormFeedback({ tone, message }: FormFeedbackProps) {
  if (!message) return null;
  const display = tone === 'error' ? sanitize(message) : message;
  const { wrapperClass, icon: Icon } = TONE_STYLES[tone];

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`mb-4 p-3 rounded-md border text-sm flex items-start gap-2 ${wrapperClass}`}
    >
      <Icon className="w-4 h-4 shrink-0 mt-0.5" />
      <span>{display}</span>
    </div>
  );
}
