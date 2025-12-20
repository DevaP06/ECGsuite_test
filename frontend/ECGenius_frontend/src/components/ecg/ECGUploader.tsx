export default function ECGUploader() {
  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-bold">Upload ECG</h3>
      <input type="file" accept=".csv,.json" className="mt-2" />
    </div>
  );
}
