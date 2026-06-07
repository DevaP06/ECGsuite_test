export default function PatientMedications() {
  const meds = [
    { id: 1, name: "Metformin", dose: "500mg", freq: "2x daily" },
    { id: 2, name: "Amlodipine", dose: "5mg", freq: "1x daily" }
  ];

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Medications</h3>
      <ul className="space-y-2 text-sm">
        {meds.map((m) => (
          <li key={m.id}>
            <span className="font-medium">{m.name}</span> — {m.dose}, {m.freq}
          </li>
        ))}
      </ul>
    </div>
  );
}
