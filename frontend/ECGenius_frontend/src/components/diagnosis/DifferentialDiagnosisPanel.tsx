import { ListOrdered, AlertTriangle, Stethoscope, ShieldAlert, Activity } from 'lucide-react';
import type { OntologyDiagnosis } from '../../types/ontologyFusion';
import ConfidenceTierBadge from '../ecg/ConfidenceTierBadge';

interface Props {
  diagnoses: OntologyDiagnosis[] | undefined;
}

const URGENCY_COLOR: Record<string, string> = {
  'Tier 1': 'text-red-600 bg-red-50 border-red-200',
  'Tier 2': 'text-amber-600 bg-amber-50 border-amber-200',
  'Tier 3': 'text-emerald-600 bg-emerald-50 border-emerald-200',
};

function EvidenceList({ icon: Icon, label, items }: { icon: typeof Stethoscope; label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <span className="font-medium text-slate-700 block">{label}</span>
        <ul className="space-y-0.5 list-disc list-inside text-slate-500">
          {items.map((entry, i) => <li key={i} className="truncate">{entry}</li>)}
        </ul>
      </div>
    </div>
  );
}

function DiagnosisCard({ diagnosis, rank }: { diagnosis: OntologyDiagnosis; rank: number }) {
  const urgencyColor = diagnosis.urgencyTier
    ? URGENCY_COLOR[diagnosis.urgencyTier] ?? 'text-slate-600 bg-slate-100 border-slate-200'
    : null;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 flex items-start justify-between gap-3">
        <div className="min-w-0 flex items-start gap-3">
          <span className="shrink-0 w-6 h-6 rounded-full bg-blue-50 text-blue-600 text-xs font-bold flex items-center justify-center mt-0.5">
            {rank}
          </span>
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-slate-800 leading-snug">{diagnosis.displayName}</h4>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {diagnosis.confidenceTier && <ConfidenceTierBadge tier={diagnosis.confidenceTier} size="sm" />}
              {diagnosis.confidence != null && (
                <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold">
                  {diagnosis.confidence}% confidence
                </span>
              )}
              {diagnosis.severity && (
                <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                  {diagnosis.severity}
                </span>
              )}
              {diagnosis.isEmergency && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-semibold">
                  <ShieldAlert className="w-3 h-3" /> Emergency
                </span>
              )}
            </div>
          </div>
        </div>
        {diagnosis.urgencyTier && urgencyColor && (
          <span className={`shrink-0 text-xs font-semibold border rounded-full px-2.5 py-1 ${urgencyColor}`}>
            {diagnosis.urgencyTier}
          </span>
        )}
      </div>

      <div className="border-t border-gray-50 px-5 py-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
        <EvidenceList icon={Activity} label="ECG Findings" items={diagnosis.ecgFindings} />
        <EvidenceList icon={Stethoscope} label="Symptoms" items={diagnosis.symptoms} />
        <EvidenceList icon={AlertTriangle} label="Risk Factors" items={diagnosis.riskFactors} />
      </div>

      {diagnosis.evidence.length > 0 && (
        <div className="border-t border-gray-50 px-5 py-3">
          <p className="text-xs font-medium text-slate-700 mb-1.5">Supporting Evidence</p>
          <div className="flex flex-wrap gap-1.5">
            {diagnosis.evidence.map((ev, i) => (
              <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-gray-50 text-slate-600 border border-gray-100">
                {ev.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DifferentialDiagnosisPanel({ diagnoses }: Props) {
  if (!diagnoses || diagnoses.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <ListOrdered className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-700">Differential Diagnosis</h3>
        </div>
        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-6 py-8 text-center">
          <p className="text-sm text-slate-500">No differential diagnoses available.</p>
          <p className="text-xs text-slate-400 mt-1">
            Ranked candidate conditions will appear here once ontology evidence is generated for this analysis.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <ListOrdered className="w-4 h-4 text-blue-500" />
        <h3 className="text-sm font-semibold text-slate-800">Differential Diagnosis</h3>
        <span className="ml-auto text-xs text-slate-400">
          {diagnoses.length} candidate{diagnoses.length !== 1 ? 's' : ''} · ranked by confidence
        </span>
      </div>
      <div className="space-y-3">
        {diagnoses.map((diagnosis, i) => (
          <DiagnosisCard key={`${diagnosis.displayName}-${i}`} diagnosis={diagnosis} rank={i + 1} />
        ))}
      </div>
    </div>
  );
}
