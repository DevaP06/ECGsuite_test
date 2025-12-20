export default function ECGDiagnosisPanel() {
  const diagnoses = [
    { condition: "Atrial Fibrillation", confidence: 0.82 },
    { condition: "Left Bundle Branch Block", confidence: 0.67 },
    { condition: "Normal Sinus Rhythm", confidence: 0.22 },
  ];

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">AI Differential Diagnosis</h3>
      <ul className="space-y-3">
        {diagnoses.map((d, idx) => (
          <li key={idx} className="flex justify-between items-center">
            <span>{d.condition}</span>
            <span
              className={`px-2 py-1 text-xs rounded ${
                d.confidence > 0.75
                  ? "bg-green-100 text-green-800"
                  : d.confidence > 0.5
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {(d.confidence * 100).toFixed(0)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
