export default function AlertsPanel() {
  const alerts = [
    { id: "al1", msg: "Abnormal rhythm detected for John Smith", severity: "High" },
    { id: "al2", msg: "ECG review pending for Ali Khan", severity: "Medium" },
  ];

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">AI Alerts</h3>
      <ul className="space-y-2 text-sm">
        {alerts.map((a) => (
          <li
            key={a.id}
            className={`p-2 rounded ${
              a.severity === "High"
                ? "bg-red-100 text-red-700"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {a.msg}
          </li>
        ))}
      </ul>
    </div>
  );
}

