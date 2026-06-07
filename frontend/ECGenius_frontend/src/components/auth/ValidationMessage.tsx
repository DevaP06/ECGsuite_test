import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';

export type ValidationTone = 'error' | 'success' | 'warning' | 'info';

interface ValidationMessageProps {
  tone: ValidationTone;
  message?: string | null;
  className?: string;
}

const TONE_STYLES: Record<ValidationTone, { icon: typeof Info; textClass: string }> = {
  error:   { icon: XCircle,       textClass: 'text-red-300' },
  success: { icon: CheckCircle2,  textClass: 'text-emerald-300' },
  warning: { icon: AlertTriangle, textClass: 'text-amber-300' },
  info:    { icon: Info,          textClass: 'text-blue-300' },
};

// Inline, field-level message — pairs with FieldStatus to give real-time
// feedback as the user fills out an auth form (e.g. "Passwords do not match").
export default function ValidationMessage({ tone, message, className = '' }: ValidationMessageProps) {
  if (!message) return null;
  const { icon: Icon, textClass } = TONE_STYLES[tone];
  return (
    <p className={`flex items-start gap-1.5 text-xs mt-1.5 ${textClass} ${className}`}>
      <Icon className="w-3.5 h-3.5 shrink-0 mt-px" />
      <span>{message}</span>
    </p>
  );
}
