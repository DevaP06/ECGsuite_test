import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const mockECG = Array.from({ length: 250 }, (_, i) => ({
  time: i,
  leadI: Math.sin(i / 10) * 0.2 + Math.random() * 0.05,
  leadII: Math.cos(i / 15) * 0.3 + Math.random() * 0.05,
}));

export default function ECGWaveform() {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">ECG Waveform (Sample Leads)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={mockECG}>
          <XAxis dataKey="time" hide />
          <YAxis domain={[-1, 1]} />
          <Tooltip />
          <Line type="monotone" dataKey="leadI" stroke="#2563eb" dot={false} />
          <Line type="monotone" dataKey="leadII" stroke="#dc2626" dot={false} />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-xs text-gray-500 mt-2">Currently showing Lead I & Lead II (mock data)</p>
    </div>
  );
}
