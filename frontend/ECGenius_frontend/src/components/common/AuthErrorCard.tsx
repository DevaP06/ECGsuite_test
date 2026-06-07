import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, Lock, RefreshCw, LogIn, ServerCrash } from 'lucide-react';

export type AuthErrorReason = 'unauthorized' | 'forbidden' | 'sessionExpired' | 'serverError';

interface AuthErrorCardProps {
  reason: AuthErrorReason;
  onRetry?: () => void;
  className?: string;
}

const REASON_DISPLAY: Record<AuthErrorReason, {
  icon: typeof ShieldAlert;
  title: string;
  description: string;
  primaryLabel: string;
  primaryTo?: string;
}> = {
  unauthorized: {
    icon: LogIn,
    title: 'Sign in to continue',
    description: "You'll need to sign in to view this page.",
    primaryLabel: 'Go to login',
    primaryTo: '/login',
  },
  sessionExpired: {
    icon: Lock,
    title: 'Your session has expired',
    description: 'For your security, please sign in again to continue.',
    primaryLabel: 'Sign in again',
    primaryTo: '/login',
  },
  forbidden: {
    icon: ShieldAlert,
    title: "You don't have access to this page",
    description: "Your account role doesn't include permission to view this content. If you think this is a mistake, contact your administrator.",
    primaryLabel: 'Back to dashboard',
    primaryTo: '/',
  },
  serverError: {
    icon: ServerCrash,
    title: 'Something went wrong on our end',
    description: "We couldn't complete that request. Please try again in a moment — your data is safe.",
    primaryLabel: 'Try again',
  },
};

// Canned, role-agnostic copy keyed by *reason* rather than raw backend text —
// guarantees auth/permission/server failures never surface a raw HTTP status,
// stack trace, or JSON payload to the user. Pair with a `RoleGuard`/`AuthGuard`
// failure or a caught 401/403/5xx from any service call.
export default function AuthErrorCard({ reason, onRetry, className = '' }: AuthErrorCardProps) {
  const navigate = useNavigate();
  const display = REASON_DISPLAY[reason];
  const Icon = display.icon;

  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm py-12 px-6 flex flex-col items-center justify-center gap-3 text-center max-w-md mx-auto ${className}`}>
      <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
        <Icon className="w-7 h-7 text-red-500" />
      </div>
      <div>
        <p className="text-base font-bold text-slate-800">{display.title}</p>
        <p className="text-sm text-slate-500 mt-1.5">{display.description}</p>
      </div>
      <div className="flex items-center gap-2 mt-1">
        {reason === 'serverError' ? (
          <button
            type="button"
            onClick={onRetry ?? (() => navigate(0))}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-semibold text-white transition"
          >
            <RefreshCw className="w-4 h-4" />
            {display.primaryLabel}
          </button>
        ) : (
          <Link
            to={display.primaryTo ?? '/'}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-semibold text-white transition"
          >
            {display.primaryLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
