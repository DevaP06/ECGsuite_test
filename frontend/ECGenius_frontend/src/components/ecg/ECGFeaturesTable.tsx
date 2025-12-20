export default function ECGFeaturesTable() {
  const features = [
    { name: "Heart Rate", value: "78 bpm", normal: "60-100 bpm", flag: "normal" },
    { name: "PR Interval", value: "180 ms", normal: "120-200 ms", flag: "normal" },
    { name: "QRS Duration", value: "140 ms", normal: "< 120 ms", flag: "abnormal" },
    { name: "QT Interval", value: "420 ms", normal: "< 440 ms", flag: "normal" },
    { name: "QTc (Bazett)", value: "460 ms", normal: "< 440 ms", flag: "borderline" },
    { name: "P-wave Duration", value: "110 ms", normal: "< 120 ms", flag: "normal" },
    { name: "P-wave Axis", value: "65°", normal: "0° to 75°", flag: "normal" },
    { name: "QRS Axis", value: "-30°", normal: "-30° to +90°", flag: "normal" },
    { name: "T-wave Axis", value: "80°", normal: "15° to 75°", flag: "borderline" },
    { name: "R-wave Amplitude (Lead II)", value: "1.2 mV", normal: "> 0.5 mV", flag: "normal" },
    { name: "ST Segment Deviation", value: "2 mm", normal: "< 1 mm", flag: "abnormal" },
    { name: "QRS Area", value: "35 mV·ms", normal: "15-45 mV·ms", flag: "normal" },
  ];

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">ECG Features</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-500 text-left">
            <th>Feature</th>
            <th>Value</th>
            <th>Normal Range</th>
          </tr>
        </thead>
        <tbody>
          {features.map((f, idx) => (
            <tr key={idx} className="border-t">
              <td className="py-2">{f.name}</td>
              <td
                className={`py-2 ${
                  f.flag === "normal"
                    ? "text-green-600"
                    : f.flag === "abnormal"
                    ? "text-red-600"
                    : "text-yellow-600"
                }`}
              >
                {f.value}
              </td>
              <td className="py-2 text-gray-500">{f.normal}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
