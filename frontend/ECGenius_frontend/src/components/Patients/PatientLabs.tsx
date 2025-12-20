export default function PatientLabs() {
  const labs = [
    { id: 1, test: "HbA1c", result: "7.2%", date: "2025-10-01" },
    { id: 2, test: "Cholesterol", result: "210 mg/dL", date: "2025-09-15" }
  ];

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Lab Results</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-500 text-left">
            <th className="pb-2">Test</th>
            <th className="pb-2">Result</th>
            <th className="pb-2">Date</th>
          </tr>
        </thead>
        <tbody>
          {labs.map((l) => (
            <tr key={l.id} className="border-t">
              <td className="py-2">{l.test}</td>
              <td className="py-2">{l.result}</td>
              <td className="py-2">{l.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
