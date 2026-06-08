import { Loader2 } from 'lucide-react';

interface LoadingStateCardProps {
  title?: string;
  message?: string;
  className?: string;
}

// Shared loading placeholder matching the standard dashboard card convention —
// drop-in replacement for ad-hoc `<Loader2 className="animate-spin" />` blocks
// so every async page shows the same calm, branded loading state.
export default function LoadingStateCard({
  title = 'Loading…',
  message,
  className = '',
}: LoadingStateCardProps) {
  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm py-14 px-6 flex flex-col items-center justify-center gap-3 text-center ${className}`}>
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      <div>
        <p className="text-sm font-semibold text-slate-700">{title}</p>
        {message && <p className="text-xs text-slate-400 mt-1 max-w-sm">{message}</p>}
      </div>
    </div>
  );
}
