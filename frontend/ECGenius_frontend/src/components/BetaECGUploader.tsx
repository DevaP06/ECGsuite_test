import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import AxiosInstance from "../AxiosInstance";
import { useAuth } from "../features/auth/useAuth";

interface ServerResponse {
  success: boolean;
  message: string;
  data?: {
    analysisId?: string;
    fileName?: string;
    filePath?: string;
    analysisResult?: Record<string, unknown>;
    error?: string;
  };
}

const BetaECGUploader: React.FC = () => {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [ecg, setECG] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverResponse, setServerResponse] = useState<ServerResponse | null>(null);
  
  const { session } = useAuth();
  const isAuthenticated = !!session;

  const fileInputRef = useRef<HTMLInputElement>(null);


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isAuthenticated) {
      setError('Please sign in before uploading an ECG image.');
      setServerResponse(null);
      return;
    }

    if (!name || !age || !gender || !ecg) {
      setError("Please fill all fields and upload an ECG image.");
      setServerResponse(null);
      return;
    }
    setError(null);
    setLoading(true);

    const formData = new FormData();
    formData.append("patientName", name);
    formData.append("patientAge", age);
    formData.append("patientGender", gender);
    formData.append("notes", "Uploaded from Try Beta page");
    formData.append("ecgFile", ecg);

    try {
      const response = await AxiosInstance.post("/api/ecg/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      const data = response.data;
      setServerResponse({
        success: data.success,
        message: data.message || "Analysis complete.",
        data: data.data,
      });
    } catch (err: unknown) {
      setServerResponse(null);
      const errorVal = err as {
        response?: {
          data?: {
            message?: string;
            error?: string;
          };
        };
        message?: string;
      };
      setError(
        errorVal.response?.data?.message ||
        errorVal.response?.data?.error ||
        errorVal.message ||
        "Failed to send data. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className="max-w-md mx-auto mt-10 p-8 bg-black rounded-xl
      border-4 border-pink-500 shadow-[0_0_25px_5px_rgba(236,72,153,0.7)]
      hover:shadow-[0_0_35px_8px_rgba(236,72,153,0.95)] transition-shadow duration-500 ease-in-out
      scale-100 hover:scale-[1.02]"
      aria-live="polite"
    >
      <h2 className="text-3xl font-extrabold text-pink-400 mb-6 drop-shadow-md">
        Try Our <span className="text-white">Beta ECG Analyzer</span>
      </h2>
      <p className="mb-8 text-gray-400 tracking-wide leading-relaxed">
        Enter patient details and upload an ECG image for instant AI-powered analysis.
      </p>

      {!isAuthenticated && (
        <div className="mb-6 rounded-lg border border-pink-500/40 bg-pink-500/10 p-4 text-sm text-pink-200">
          <p className="mb-2">You need to sign in before using the beta analyzer.</p>
          <Link to="/Sign-Up-Page" className="font-semibold text-white underline underline-offset-4">
            Go to sign in
          </Link>
        </div>
      )}

      <form onSubmit={handleSubmit} encType="multipart/form-data" noValidate>
        {/* Patient Name */}
        <label className="block mb-6">
          <span className="text-gray-300 font-semibold mb-1 block">Patient Name</span>
          <input
            type="text"
            name="name"
            placeholder="Patient's full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            required
            className="w-full px-4 py-3 bg-gray-900 text-gray-100 rounded-lg border border-gray-700 
              shadow-sm focus:outline-none focus:ring-4 focus:ring-pink-300 focus:ring-opacity-70 
              transition duration-300 ease-in-out"
          />
        </label>

        {/* Age */}
        <label className="block mb-6">
          <span className="text-gray-300 font-semibold mb-1 block">Age</span>
          <input
            type="number"
            name="age"
            min={1}
            max={120}
            placeholder="Age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            disabled={loading}
            required
            className="w-full px-4 py-3 bg-gray-900 text-gray-100 rounded-lg border border-gray-700 
              shadow-sm focus:outline-none focus:ring-4 focus:ring-pink-300 focus:ring-opacity-70 
              transition duration-300 ease-in-out"
          />
        </label>

        {/* Gender */}
        <label className="block mb-8">
          <span className="text-gray-300 font-semibold mb-1 block">Gender</span>
          <select
            name="gender"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            disabled={loading}
            required
            className="w-full px-4 py-3 bg-gray-900 text-gray-100 rounded-lg border border-gray-700 
              shadow-sm focus:outline-none focus:ring-4 focus:ring-pink-300 focus:ring-opacity-70 
              transition duration-300 ease-in-out"
          >
            <option value="" disabled>
              Select gender
            </option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </select>
        </label>

        {/* Upload Button */}
        <label className="block mb-8 text-gray-300 font-semibold">
          ECG Image
          <div className="mt-2 flex items-center space-x-4">
            <button
              type="button"
              onClick={triggerFileSelect}
              disabled={loading}
              className="
                inline-flex items-center justify-center px-6 py-3 rounded-lg border-2 border-pink-500 
                text-pink-400 font-semibold shadow-md
                bg-black bg-opacity-30 backdrop-blur-sm
                hover:bg-pink-600 hover:text-white hover:scale-110 hover:shadow-[0_0_25px_6px_rgba(236,72,153,0.9)]
                transition transform duration-300 ease-in-out
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Select ECG Image
            </button>
            <span className="flex-1 truncate text-sm text-gray-400">{ecg ? ecg.name : "No file selected"}</span>
          </div>
          <input
            type="file"
            name="ecg"
            accept="image/png, image/jpeg"
            required
            onChange={(e) => setECG(e.target.files ? e.target.files[0] : null)}
            disabled={loading}
            ref={fileInputRef}
            className="hidden"
          />
        </label>

        {/* Error message */}
        {error && (
          <p className="mb-6 text-pink-400 font-semibold tracking-wide shadow-lg" role="alert">
            {error}
          </p>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !isAuthenticated}
          className={`w-full py-4 font-bold rounded-lg
            text-white 
            ${loading || !isAuthenticated ? "bg-pink-300 cursor-not-allowed" : "bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"} 
            shadow-lg 
            transition-all duration-300 ease-in-out
            transform 
            ${loading || !isAuthenticated ? "" : "hover:scale-105 hover:shadow-[0_0_30px_8px_rgba(236,72,153,0.9)] active:scale-95"}
          `}
        >
          {loading ? "Analyzing..." : "Analyze ECG"}
        </button>

        {/* Server Response */}
        {serverResponse && (
          <div className="mt-8 text-center">
            <p className={`text-lg font-semibold ${serverResponse.success ? "text-pink-400" : "text-red-500"} drop-shadow-lg`}>
              {serverResponse.message}
            </p>
            {/* Show features if present */}
            {serverResponse.data?.analysisResult && (
              <div className="mt-6 p-4 bg-gray-800 rounded-lg text-left text-gray-300">
                    <h3 className="text-xl font-bold text-pink-400 mb-3">Analysis Result</h3>
                <ul className="space-y-2">
                      {Object.entries(serverResponse.data.analysisResult).map(([key, value]) => (
                    <li key={key} className="flex justify-between">
                      <span className="font-medium">{key}:</span>
                      <span>{value !== null && value !== undefined ? String(value) : "N/A"}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
};

export default BetaECGUploader;
