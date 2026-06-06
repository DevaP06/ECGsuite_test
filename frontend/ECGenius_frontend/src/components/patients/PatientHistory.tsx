export default function PatientHistory() {
  const history = [
    "Hypertension (diagnosed 2020)",
    "Type 2 Diabetes (diagnosed 2018)",
    "Past smoker (quit 2015)"
  ];

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Medical History</h3>
      <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600">
        {history.map((h, idx) => <li key={idx}>{h}</li>)}
      </ul>
    </div>
  );
}
