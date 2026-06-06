import type { ComponentType } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Construction } from 'lucide-react';
import AppShell from '../../layouts/AppShell';
import { getDashboardRoute } from '../../features/auth/roleUtils';

interface Props {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  iconBg?: string;
  iconColor?: string;
  plannedFeatures?: string[];
}

export default function ComingSoonLayout({
  title,
  description,
  icon: Icon,
  iconBg = 'bg-blue-50',
  iconColor = 'text-blue-500',
  plannedFeatures,
}: Props) {
  return (
    <AppShell title={title}>
      <div className="max-w-2xl mx-auto py-8">
        <Link
          to={getDashboardRoute()}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center mb-5">
          <div className={`inline-flex p-4 rounded-2xl ${iconBg} mb-5`}>
            <Icon className={`w-10 h-10 ${iconColor}`} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">{title}</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed mb-5">{description}</p>
          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-1.5">
            <Construction className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-semibold text-amber-700">Backend integration in progress</span>
          </div>
        </div>

        {plannedFeatures && plannedFeatures.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <h4 className="text-sm font-semibold text-slate-700">Planned features</h4>
            </div>
            <ul className="divide-y divide-gray-50">
              {plannedFeatures.map((f) => (
                <li key={f} className="flex items-center justify-between px-5 py-3">
                  <span className="text-sm text-slate-600">{f}</span>
                  <span className="text-xs font-medium text-slate-400 bg-gray-100 rounded-full px-2.5 py-0.5">
                    Planned
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </AppShell>
  );
}
