import React from 'react';
import type { OntologyItem } from '../../types/ecg';

interface DiagnosisOverviewProps {
  ontologyEnrichment?: OntologyItem[];
  rhythm?: string;
  abnormalities?: string[];
}

export const DiagnosisOverview: React.FC<DiagnosisOverviewProps> = ({
  ontologyEnrichment = [],
  rhythm,
  abnormalities = [],
}) => {
  const formatCode = (code: string) => {
    return code
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  const hasData = ontologyEnrichment.length > 0 || rhythm || abnormalities.length > 0;

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-bold text-slate-800 mb-4">Differential Diagnosis & Clinical Ontology</h3>

      {!hasData ? (
        <div className="text-center py-6 text-slate-500 text-sm">
          No diagnosis information available.
        </div>
      ) : ontologyEnrichment.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-xs">
                <th className="py-2.5">Condition</th>
                <th className="py-2.5 text-center">Confidence</th>
                <th className="py-2.5 text-center">Urgency</th>
                <th className="py-2.5 text-right">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {ontologyEnrichment.map((item, idx) => {
                const isUrgent = item.urgencyTier === 'Tier1' || item.isEmergency;
                const isModerate = item.urgencyTier === 'Tier2';
                
                return (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="py-3 font-semibold text-slate-800">{item.displayName}</td>
                    <td className="py-3 text-center">
                      <span className="px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700 border border-blue-100">
                        {item.confidenceTier}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          isUrgent
                            ? 'bg-red-50 text-red-700 border border-red-100'
                            : isModerate
                            ? 'bg-amber-50 text-amber-700 border border-amber-100'
                            : 'bg-green-50 text-green-700 border border-green-100'
                        }`}
                      >
                        {item.urgencyTier}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <span className={`capitalize text-xs font-semibold ${item.severity === 'severe' ? 'text-red-600' : (item.severity === 'moderate' ? 'text-amber-600' : 'text-green-600')}`}>
                        {item.severity}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Detected Rhythm</h4>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-800 text-md">{rhythm ? formatCode(rhythm) : "Unknown Rhythm"}</span>
              <span className={`px-2.5 py-0.5 text-xs font-semibold rounded capitalize ${rhythm === 'normal' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                {rhythm === 'normal' ? 'Normal' : 'Abnormal'}
              </span>
            </div>
          </div>

          {abnormalities.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Abnormal Findings</h4>
              <div className="flex flex-wrap gap-2">
                {abnormalities.map((ab, idx) => (
                  <span key={idx} className="px-3 py-1 bg-red-50 text-red-700 border border-red-100 text-xs font-semibold rounded-full">
                    {formatCode(ab)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DiagnosisOverview;
