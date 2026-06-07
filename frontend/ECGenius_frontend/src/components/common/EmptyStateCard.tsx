import { Inbox } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmptyStateAction {
  label: string;
  to?: string;
  onClick?: () => void;
}

interface EmptyStateCardProps {
  icon?: typeof Inbox;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  className?: string;
}

// Shared "nothing here yet" card matching the standard dashboard card
// convention — gives every page the same graceful, on-brand empty state
// instead of a bare "No data" string or a blank section.
export default function EmptyStateCard({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className = '',
}: EmptyStateCardProps) {
  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm py-12 px-6 flex flex-col items-center justify-center gap-2 text-center ${className}`}>
      <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
        <Icon className="w-6 h-6 text-slate-300" />
      </div>
      <p className="text-sm font-semibold text-slate-700 mt-1">{title}</p>
      {description && <p className="text-xs text-slate-400 max-w-sm">{description}</p>}
      {action && (
        action.to ? (
          <Link
            to={action.to}
            className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white transition"
          >
            {action.label}
          </Link>
        ) : (
          <button
            type="button"
            onClick={action.onClick}
            className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white transition"
          >
            {action.label}
          </button>
        )
      )}
    </div>
  );
}
