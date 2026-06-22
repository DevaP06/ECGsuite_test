import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Search, X, UserPlus } from "lucide-react";
import AppShell from "../layouts/AppShell";
import { ecgService } from "../services/ecgService";
import { patientService } from "../services/patientService";
import UploadProgress from "../components/ecg/UploadProgress";
import { extractErrorMessage } from "../utils/errorUtils";
import { isDoctor } from "../features/auth/roleUtils";
import type { PatientListItem } from "../types/patient";

export default function ECGUpload() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedPatientId = searchParams.get("patientId");

  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "",
    notes: "",
  });
  const [selectedPatient, setSelectedPatient] = useState<PatientListItem | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);

  // Patient search state
  const [patientQuery, setPatientQuery] = useState("");
  const [patientResults, setPatientResults] = useState<PatientListItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load preselected patient from URL
  useEffect(() => {
    if (!preselectedPatientId) return;
    (async () => {
      try {
        const p = await patientService.getPatient(preselectedPatientId);
        const item: PatientListItem = {
          _id: p._id,
          name: p.name,
          age: p.age,
          gender: p.gender,
          createdAt: p.createdAt,
        };
        selectPatient(item);
      } catch {
        // Patient not found — let user fill manually
      }
    })();
  }, [preselectedPatientId]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced patient search
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!patientQuery.trim()) {
      setPatientResults([]);
      return;
    }
    searchTimerRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await patientService.getPatients({ q: patientQuery, pageSize: 5 });
        setPatientResults(res.data);
      } catch {
        setPatientResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  }, [patientQuery]);

  const selectPatient = (p: PatientListItem) => {
    setSelectedPatient(p);
    setForm(prev => ({
      ...prev,
      name: p.name,
      age: String(p.age),
      gender: p.gender ? p.gender.charAt(0).toUpperCase() + p.gender.slice(1) : '',
    }));
    setShowDropdown(false);
    setPatientQuery("");
  };

  const clearPatient = () => {
    setSelectedPatient(null);
    setForm({ name: "", age: "", gender: "", notes: form.notes });
  };

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
    if (selectedPatient) {
      formData.append("patientId", selectedPatient._id);
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
            if (isDoctor()) {
              navigate(`/clinical-context/${result.analysisId}`);
            } else {
              navigate(`/diagnosisdetail/${result.analysisId}`);
            }
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
          {/* Patient selector */}
          <div ref={dropdownRef} className="relative">
            <label className="block text-sm font-semibold text-slate-700 mb-1">Link to Patient</label>
            {selectedPatient ? (
              <div className="flex items-center justify-between border border-blue-200 bg-blue-50 rounded px-3 py-2">
                <span className="text-sm font-semibold text-blue-800">
                  {selectedPatient.name} &middot; {selectedPatient.age}y &middot; <span className="capitalize">{selectedPatient.gender}</span>
                </span>
                <button
                  type="button"
                  onClick={clearPatient}
                  disabled={isUploading}
                  className="text-blue-500 hover:text-blue-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={patientQuery}
                  onChange={(e) => {
                    setPatientQuery(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => patientQuery.trim() && setShowDropdown(true)}
                  disabled={isUploading}
                  placeholder="Search registered patients by name…"
                  className="w-full border border-slate-300 pl-9 pr-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            )}

            {showDropdown && !selectedPatient && (
              <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {searchLoading ? (
                  <p className="px-3 py-2 text-xs text-slate-400">Searching…</p>
                ) : patientResults.length > 0 ? (
                  patientResults.map((p) => (
                    <button
                      key={p._id}
                      type="button"
                      onClick={() => selectPatient(p)}
                      className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm transition"
                    >
                      <span className="font-semibold text-slate-800">{p.name}</span>
                      <span className="text-slate-500 ml-2">{p.age}y · <span className="capitalize">{p.gender}</span></span>
                    </button>
                  ))
                ) : patientQuery.trim() ? (
                  <div className="px-3 py-3 text-center">
                    <p className="text-xs text-slate-400 mb-2">No patients found.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDropdown(false);
                        navigate("/patients/register");
                      }}
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      <UserPlus className="w-3 h-3" /> Register new patient
                    </button>
                  </div>
                ) : null}
              </div>
            )}
            <p className="text-xs text-slate-400 mt-1">
              {selectedPatient
                ? "ECG will be linked to this patient's record."
                : "Optional — link this ECG to a registered patient for history tracking."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Patient Name *</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                disabled={isUploading || !!selectedPatient}
                required
                className="w-full border border-slate-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-slate-50 disabled:text-slate-500"
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
                disabled={isUploading || !!selectedPatient}
                required
                className="w-full border border-slate-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-slate-50 disabled:text-slate-500"
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
              disabled={isUploading || !!selectedPatient}
              required
              className="w-full border border-slate-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-slate-50 disabled:text-slate-500"
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
