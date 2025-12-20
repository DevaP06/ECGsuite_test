import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

const mockExplain = [
  { lead: "Lead I", importance: 0.7 },
  { lead: "Lead II", importance: 0.9 },
  { lead: "V1", importance: 0.4 },
  { lead: "V2", importance: 0.6 },
  { lead: "V3", importance: 0.8 },
];

export default function ECGExplainPanel() {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Explainability Insights</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={mockExplain}>
          <XAxis dataKey="lead" />
          <YAxis domain={[0, 1]} />
          <Tooltip />
          <Bar dataKey="importance" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
      <p className="text-xs text-gray-500 mt-2">
        Higher importance means this lead contributed more to the AI's decision.
      </p>
    </div>
  );
}
