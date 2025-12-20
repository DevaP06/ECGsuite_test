export default function RecentECGs() {
  const ecgs = [
    { id: "e1", patient: "John Smith", date: "2025-10-15", status: "Completed" },
    { id: "e2", patient: "Mary Johnson", date: "2025-10-14", status: "Pending" },
  ];

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Recent ECG Uploads</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-500 text-left">
            <th className="pb-2">Patient</th>
            <th className="pb-2">Date</th>
            <th className="pb-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {ecgs.map((e) => (
            <tr key={e.id} className="border-t">
              <td className="py-2">{e.patient}</td>
              <td className="py-2">{e.date}</td>
              <td className={`py-2 font-medium ${
                e.status === "Completed" ? "text-green-600" : "text-yellow-600"
              }`}>
                {e.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
