import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export type FieldValidity = 'idle' | 'checking' | 'valid' | 'invalid';

interface FieldStatusProps {
  state: FieldValidity;
  className?: string;
}

const STATE_DISPLAY: Record<Exclude<FieldValidity, 'idle'>, { icon: typeof Loader2; className: string }> = {
  checking: { icon: Loader2,      className: 'text-slate-400 animate-spin' },
  valid:    { icon: CheckCircle2, className: 'text-emerald-400' },
  invalid:  { icon: XCircle,      className: 'text-red-400' },
};

// Small trailing-icon indicator meant to sit inside a `relative` input wrapper
// (absolute-positioned at the right edge) — gives an at-a-glance read on
// whether the current field value is acceptable, without any text.
export default function FieldStatus({ state, className = '' }: FieldStatusProps) {
  if (state === 'idle') return null;
  const { icon: Icon, className: toneClass } = STATE_DISPLAY[state];
  return (
    <span className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 ${className}`}>
      <Icon className={`w-4 h-4 ${toneClass}`} aria-hidden="true" />
    </span>
  );
}
