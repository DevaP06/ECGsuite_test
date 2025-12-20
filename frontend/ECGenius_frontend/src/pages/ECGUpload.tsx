import { useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";

export default function ECGUpload() {
  const [form, setForm] = useState({
    patientId: "",
    name: "",
    age: "",
    gender: "",
    notes: "",
  });

  const [file, setFile] = useState<File | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting ECG:", form, file);
    alert("ECG uploaded (mock)!");
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Upload ECG</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Patient Details */}
          <div>
            <label className="block text-sm font-medium mb-1">Patient ID</label>
            <input
              type="text"
              name="patientId"
              value={form.patientId}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
              placeholder="Enter patient ID"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
                placeholder="Patient name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Age</label>
              <input
                type="number"
                name="age"
                value={form.age}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
                placeholder="Age"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Gender</label>
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Clinical Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
              rows={3}
              placeholder="Any relevant notes (e.g. chest pain, post-surgery)"
            />
          </div>

          {/* ECG Upload */}
          <div>
            <label className="block text-sm font-medium mb-1">Upload ECG File</label>
            <input
              type="file"
              accept=".csv,.pdf,.png,.jpg"
              onChange={handleFileChange}
              className="w-full"
            />
            {file && (
              <p className="text-sm text-gray-500 mt-1">
                Selected file: <span className="font-medium">{file.name}</span>
              </p>
            )}
          </div>

          {/* Submit */}
          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              Upload ECG
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
