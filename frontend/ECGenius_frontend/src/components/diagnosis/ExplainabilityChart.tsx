import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Info } from 'lucide-react';

interface ExplainabilityChartProps {
  leadImportance?: Record<string, number>;
}

export const ExplainabilityChart: React.FC<ExplainabilityChartProps> = ({ leadImportance }) => {
  const chartData = leadImportance && Object.keys(leadImportance).length > 0
    ? Object.entries(leadImportance).map(([lead, importance]) => ({
        lead: lead.startsWith('Lead') ? lead : `Lead ${lead}`,
        importance,
      }))
    : [];

  const hasData = chartData.length > 0;

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-bold text-slate-800 mb-4">Explainability Insights (AI Attention Leads)</h3>
      
      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-10 px-4 bg-slate-50 border border-slate-200 border-dashed rounded-lg text-slate-500">
          <Info className="w-8 h-8 mb-2 text-slate-400" />
          <p className="text-sm text-center">Explainability data not available.</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <XAxis dataKey="lead" />
            <YAxis domain={[0, 1]} />
            <Tooltip formatter={(value: unknown) => [`${(Number(value) * 100).toFixed(0)}%`, "AI Weight"]} />
            <Bar dataKey="importance" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default ExplainabilityChart;
