export default function RecommendationsPanel() {
  const recs = [
    { id: 1, text: "Refer to cardiologist within 1 week", level: "high" },
    { id: 2, text: "Repeat ECG in 24 hours", level: "medium" },
    { id: 3, text: "Check HbA1c and lipid profile", level: "low" },
  ];

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Post-Diagnostic Intelligence</h3>
      <ul className="space-y-2">
        {recs.map((r) => (
          <li
            key={r.id}
            className={`px-3 py-2 rounded ${
              r.level === "high"
                ? "bg-red-100 text-red-800"
                : r.level === "medium"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            {r.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
