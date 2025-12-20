import { Link, useParams } from "react-router-dom";

export default function PatientECGs() {
  const { id } = useParams();
  const ecgs = [
    { id: "ecg1", date: "2025-10-15", status: "Normal" },
    { id: "ecg2", date: "2025-09-12", status: "Abnormal" },
  ];

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">ECG Records</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-500 text-left">
            <th>Date</th>
            <th>Status</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {ecgs.map((e) => (
            <tr key={e.id} className="border-t">
              <td className="py-2">{e.date}</td>
              <td
                className={`py-2 ${
                  e.status === "Normal" ? "text-green-600" : "text-red-600"
                }`}
              >
                {e.status}
              </td>
              <td className="py-2 text-right space-x-3">
                {/* Option 1: Waveform + features */}
                <Link
                  to={`/patients/${id}/ecg/${e.id}`}
                  className="text-blue-600 hover:underline"
                >
                  View Details
                </Link>
                {/* Option 2: AI Insights */}
                <Link
                  to={`/diagnosisdetail/${id}/ecg/${e.id}`}
                  className="text-purple-600 hover:underline"
                >
                  AI Insights
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
