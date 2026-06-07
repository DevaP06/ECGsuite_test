export default function PatientVitals() {
  const vitals = {
    heartRate: 78,
    bp: "120/80",
    spo2: 98,
    temp: "36.7°C"
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Vitals</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div><p className="font-medium">Heart Rate</p><p>{vitals.heartRate} bpm</p></div>
        <div><p className="font-medium">Blood Pressure</p><p>{vitals.bp}</p></div>
        <div><p className="font-medium">SpO₂</p><p>{vitals.spo2}%</p></div>
        <div><p className="font-medium">Temperature</p><p>{vitals.temp}</p></div>
      </div>
    </div>
  );
}
