// Placeholder for the future Clinical Dashboard and Evidence Fusion workflow.
// This page will become the Unified Clinical Dashboard once Tasks 21+ are implemented.
// Route: /clinical-dashboard/:analysisId

import { useParams, Link } from 'react-router-dom';
import { FlaskConical, ArrowLeft, CheckCircle2 } from 'lucide-react';
import AppShell from '../layouts/AppShell';
import { getDashboardRoute } from '../features/auth/roleUtils';

const UPCOMING_MODULES = [
  { label: 'Evidence Fusion Engine',           status: 'planned' },
  { label: 'AI + Clinical Context Synthesis',  status: 'planned' },
  { label: 'Differential Diagnosis Ranking',   status: 'planned' },
  { label: 'Risk Stratification Score',         status: 'planned' },
  { label: 'Clinical Decision Support Output', status: 'planned' },
  { label: 'Integrated Report Generation',     status: 'planned' },
];

export default function ClinicalDashboardPlaceholder() {
  const { analysisId } = useParams<{ analysisId: string }>();

  return (
    <AppShell title="Clinical Dashboard">
      <div className="max-w-2xl mx-auto py-8">

        {/* Success confirmation */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-6 py-6 mb-8 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-emerald-800">Clinical History Submitted</h2>
          <p className="text-sm text-emerald-700 mt-1">
            The questionnaire has been recorded for analysis ID{' '}
            <span className="font-mono font-semibold">{analysisId?.slice(-8)}</span>.
          </p>
        </div>

        {/* Placeholder card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center mb-6">
          <div className="inline-flex p-4 rounded-2xl bg-blue-50 mb-4">
            <FlaskConical className="w-10 h-10 text-blue-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">
            Unified Clinical Dashboard — Coming Soon
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
            The clinical dashboard will fuse AI analysis results with the collected
            clinical history to produce a comprehensive evidence-based diagnosis summary.
          </p>
        </div>

        {/* Upcoming modules */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-gray-50">
            <h4 className="text-sm font-semibold text-slate-700">Modules in this dashboard</h4>
          </div>
          <ul className="divide-y divide-gray-50">
            {UPCOMING_MODULES.map((m) => (
              <li key={m.label} className="flex items-center justify-between px-5 py-3">
                <span className="text-sm text-slate-600">{m.label}</span>
                <span className="text-xs font-medium text-slate-400 bg-gray-100 rounded-full px-2.5 py-0.5">
                  Planned
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to={`/diagnosisdetail/${analysisId}`}
            className="flex items-center justify-center gap-2 flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-slate-700 hover:bg-gray-50 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Diagnosis
          </Link>
          <Link
            to={getDashboardRoute()}
            className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-semibold text-white text-center transition"
          >
            Return to Dashboard
          </Link>
        </div>

      </div>
    </AppShell>
  );
}
