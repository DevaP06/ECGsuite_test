export default function PatientAppointments() {
  const appts = [
    { id: 1, date: "2025-10-20 10:00 AM", reason: "Follow-up ECG" },
    { id: 2, date: "2025-11-05 11:30 AM", reason: "Blood tests review" }
  ];

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Upcoming Appointments</h3>
      <ul className="space-y-2 text-sm">
        {appts.map((a) => (
          <li key={a.id} className="flex justify-between">
            <span>{a.reason}</span>
            <span className="text-gray-500">{a.date}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
