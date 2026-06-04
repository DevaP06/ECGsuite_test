import React from 'react';
import { ClipboardList, CheckCircle } from 'lucide-react';

interface RecommendationsPanelProps {
  recommendedTests?: string[];
}

export const RecommendationsPanel: React.FC<RecommendationsPanelProps> = ({ recommendedTests = [] }) => {
  const hasData = recommendedTests.length > 0;

  return (
    <div className="bg-white shadow rounded-lg p-6 h-full">
      <h3 className="text-lg font-bold text-slate-800 mb-4">Post-Diagnostic Intelligence</h3>
      
      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-10 px-4 bg-slate-50 border border-slate-200 border-dashed rounded-lg text-slate-500 text-center">
          <CheckCircle className="w-8 h-8 mb-2 text-slate-400" />
          <p className="text-sm font-medium">No recommendations available.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">The AI model recommends the following follow-up diagnostic procedures based on the ontology analysis:</p>
          <ul className="space-y-3">
            {recommendedTests.map((test, idx) => (
              <li
                key={idx}
                className="flex items-start gap-3 p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-sm text-slate-700 hover:bg-blue-50 transition"
              >
                <ClipboardList className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <span className="font-semibold text-slate-800">{test}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default RecommendationsPanel;
