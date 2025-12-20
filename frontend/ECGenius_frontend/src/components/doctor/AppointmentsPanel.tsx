export default function AppointmentsPanel() {
  const appts = [
    { id: "a1", patient: "Ali Khan", date: "2025-10-20 10:00 AM" },
    { id: "a2", patient: "Mary Johnson", date: "2025-10-21 02:00 PM" },
  ];

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Upcoming Appointments</h3>
      <ul className="space-y-3 text-sm">
        {appts.map((a) => (
          <li key={a.id} className="flex justify-between">
            <span>{a.patient}</span>
            <span className="text-gray-500">{a.date}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
