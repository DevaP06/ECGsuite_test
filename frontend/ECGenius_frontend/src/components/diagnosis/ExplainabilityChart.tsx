import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const explainData = [
  { lead: "Lead I", importance: 0.7 },
  { lead: "Lead II", importance: 0.9 },
  { lead: "V1", importance: 0.5 },
  { lead: "V2", importance: 0.6 },
  { lead: "V3", importance: 0.8 },
];

export default function ExplainabilityChart() {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Explainability Insights</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={explainData}>
          <XAxis dataKey="lead" />
          <YAxis domain={[0, 1]} />
          <Tooltip />
          <Bar dataKey="importance" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
