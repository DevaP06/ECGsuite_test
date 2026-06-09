import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AppShell from "../layouts/AppShell";
import { ecgService } from "../services/ecgService";
import UploadProgress from "../components/ecg/UploadProgress";
import { extractErrorMessage } from "../utils/errorUtils";

export default function ECGUpload() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "",
    notes: "",
  });

  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      const allowedExtensions = ['.png', '.jpg', '.jpeg'];
      const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();

      if (!allowedExtensions.includes(fileExtension)) {
        toast.error("Unsupported file type! Only .png, .jpg, and .jpeg files are supported.");
        e.target.value = "";
        setFile(null);
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!form.name.trim()) {
      toast.error("Patient name is required.");
      return;
    }
    if (!form.age) {
      toast.error("Patient age is required.");
      return;
    }
    if (Number(form.age) <= 0 || Number(form.age) > 120) {
      toast.error("Please enter a valid age between 1 and 120.");
      return;
    }
    if (!form.gender) {
      toast.error("Patient gender is required.");
      return;
    }
    if (!file) {
      toast.error("Please select an ECG file to upload.");
      return;
    }

    setUploadStatus('uploading');
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("ecgFile", file);
    formData.append("patientName", form.name.trim());
    formData.append("patientAge", form.age);
    formData.append("patientGender", form.gender.toLowerCase());
    if (form.notes.trim()) {
      formData.append("notes", form.notes.trim());
    }

    try {
      const result = await ecgService.uploadECG(formData, (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(Math.min(percentCompleted, 99));
        }
      });

      if (result.success && result.analysisId) {
        setUploadProgress(100);
        setUploadStatus('success');

        if (result.status === 'failed') {
          toast.error("ECG analysis failed. Please review the failure report.");
          setTimeout(() => {
            navigate(`/analysis-failed/${result.analysisId}`);
          }, 1000);
        } else {
          toast.success("ECG uploaded and analyzed successfully!");
          setTimeout(() => {
            navigate(`/diagnosisdetail/${result.analysisId}`);
          }, 1000);
        }
      } else {
        throw new Error("Invalid response from server.");
      }
    } catch (err: unknown) {
      setUploadStatus('error');
      toast.error(extractErrorMessage(err, 'Failed to upload and analyze ECG.'));
    }
  };

  const isUploading = uploadStatus === 'uploading';

  return (
    <AppShell title="Upload ECG">
      <div className="max-w-2xl mx-auto bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-slate-800">Upload ECG for AI Diagnosis</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Patient Name *</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                disabled={isUploading}
                required
                className="w-full border border-slate-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Patient full name"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Age *</label>
              <input
                type="number"
                name="age"
                min="1"
                max="120"
                value={form.age}
                onChange={handleChange}
                disabled={isUploading}
                required
                className="w-full border border-slate-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Patient age"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Gender *</label>
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              disabled={isUploading}
              required
              className="w-full border border-slate-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Clinical Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              disabled={isUploading}
              className="w-full border border-slate-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              rows={3}
              placeholder="E.g. chest pain, hypertension, previous infarct"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Upload ECG File *</label>
            <input
              type="file"
              accept=".png,.jpg,.jpeg"
              onChange={handleFileChange}
              disabled={isUploading}
              required
              className="w-full border border-slate-300 px-3 py-2 rounded file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-xs text-slate-400 mt-1">
              Supported formats: .png, .jpg, .jpeg (Max size: 20MB)
            </p>
          </div>

          <UploadProgress progress={uploadProgress} status={uploadStatus} />

          <div className="pt-2">
            <button
              type="submit"
              disabled={isUploading}
              className={`w-full text-white py-2.5 rounded font-semibold transition shadow ${
                isUploading 
                  ? "bg-blue-400 cursor-not-allowed" 
                  : "bg-blue-600 hover:bg-blue-700 active:scale-98"
              }`}
            >
              {isUploading ? "Uploading & Analyzing..." : "Upload & Analyze ECG"}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
