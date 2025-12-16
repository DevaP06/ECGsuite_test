import React, { useState, useRef } from "react";

// Rhythm label expansions and brief likelihood notes
const RHYTHM_LABELS: Record<string, string> = {
  AFIB: "Atrial Fibrillation",
  AF: "Atrial Flutter",
  SR: "Sinus Rhythm",
  ST: "Sinus Tachycardia",
};

const LIKELIHOOD: Record<string, string> = {
  AF: "Low likelihood",
  AFIB: "Most likely rhythm",
  SR: "Possible but less likely",
  ST: "Likely",
};

function parsePct(v: string | number | null | undefined): number | null {
  if (v == null) return null;
  if (typeof v === "number") return v * 100;
  const s = String(v).trim();
  if (s.endsWith("%")) {
    const num = parseFloat(s.slice(0, -1));
    return isNaN(num) ? null : num;
  }
  const num = parseFloat(s);
  return isNaN(num) ? null : num * 100;
}

function cleanLabel(s: any): string {
  if (s == null) return "";
  const str = String(s);
  const m = str.match(/[A-Z]+/g);
  return m ? m[0] : str;
}

// Format numbers with up to 3 decimal places
function fmtUpTo3(v: any): string {
  const n = Number(v);
  if (!isFinite(n)) return "—";
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 3 }).format(n);
}

interface ServerResponse {
  success: boolean;
  message: string;
  data?: {
    patient?: { name: string; age: string; gender: string };
    features?: Record<string, any>;
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
  const [rawResponse, setRawResponse] = useState<any | null>(null);
  const [showRaw, setShowRaw] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name || !age || !gender || !ecg) {
      setError("Please fill all fields and upload an ECG image.");
      setServerResponse(null);
      return;
    }
    setError(null);
    setLoading(true);

    const formData = new FormData();
    // Endpoint expects: ecgFile, patientAge, gender (MALE/FEMALE)
    formData.append("patientAge", age);
    formData.append("gender", gender.toUpperCase());
    formData.append("ecgFile", ecg);

    try {
      const response = await fetch("http://localhost:3000/api/ml/classify-ecg-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        // Try to extract server-provided error details for better UX
        let errText = `Server error: ${response.status}`;
        try {
          const errBody = await response.json();
          const details = errBody?.details || errBody?.error || errBody?.message;
          if (details) errText = `${errText} - ${typeof details === 'string' ? details : JSON.stringify(details)}`;
        } catch {}
        throw new Error(errText);
      }

      const data = await response.json();
      // Debug: surface the response for troubleshooting
      try { console.debug("ML classify-ecg-image response", data); } catch {}
      setServerResponse({
        success: data.success,
        message: data.message || (data.success ? "Analysis complete." : data.error) || "",
        data: data.data || { features: data?.image_analysis || data?.features },
      });
      setRawResponse(data);
    } catch (err: any) {
      setServerResponse(null);
      setRawResponse(null);
      setError(err.message || "Failed to send data. Please try again.");
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
            <option value="FEMALE">Female</option>
            <option value="MALE">Male</option>
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
            name="ecgFile"
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
          disabled={loading}
          className={`w-full py-4 font-bold rounded-lg
            text-white 
            ${loading ? "bg-pink-300 cursor-not-allowed" : "bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"} 
            shadow-lg 
            transition-all duration-300 ease-in-out
            transform 
            ${loading ? "" : "hover:scale-105 hover:shadow-[0_0_30px_8px_rgba(236,72,153,0.9)] active:scale-95"}
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
            {/* Medical Report */}
            {rawResponse && (
              <div className="mt-6 p-6 bg-gray-800 rounded-2xl text-left text-gray-200 border border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-2xl font-extrabold text-pink-400">ECG Medical Report</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${rawResponse.success ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"}`}>
                    {rawResponse.success ? "SUCCESS" : "FAILED"}
                  </span>
                </div>

                {/* Narrative summary */}
                {(() => {
                  const bestRaw = (rawResponse.prediction?.best_rhythm ?? rawResponse.diagnosis?.predictedClass?.best_rhythm) as any;
                  const bestKey = cleanLabel(bestRaw);
                  const bestFull = (RHYTHM_LABELS[bestKey] ?? bestKey) || "—";
                  const tops = Object.entries((rawResponse.prediction?.top_rhythms || rawResponse.diagnosis?.predictedClass?.top_rhythms) as Record<string, any>)
                    .map(([k, v]) => ({ k, pct: parsePct(v) }))
                    .sort((a, b) => (b.pct ?? 0) - (a.pct ?? 0));
                  const bestPct = tops.find(t => t.k === bestKey)?.pct;
                  if (!bestFull) return null;
                  return (
                    <p className="mb-4 text-sm text-gray-300">
                      Findings are most consistent with <span className="font-semibold text-gray-100">{bestFull}</span>
                      {bestKey ? ` (${bestKey})` : ''}
                      {bestPct != null ? ` — ${bestPct.toFixed(2)}%` : ''}.
                    </p>
                  );
                })()}

                {/* Patient Details */}
                <div className="mb-5">
                  <h4 className="text-lg font-bold text-gray-100 mb-2">Patient</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                    <div><span className="text-gray-400">Name:</span> <span className="font-medium">{name || "—"}</span></div>
                    <div><span className="text-gray-400">Age:</span> <span className="font-medium">{age || rawResponse?.patient?.age || rawResponse?.patientData?.PatientAge || "—"}</span></div>
                    <div><span className="text-gray-400">Gender:</span> <span className="font-medium">{gender || rawResponse?.patient?.gender || rawResponse?.patientData?.Gender || "—"}</span></div>
                  </div>
                </div>

                {/* Image Analysis */}
                {(rawResponse.image_analysis || rawResponse.ecg_analysis) && (
                  <div className="mb-5">
                    <h4 className="text-lg font-bold text-gray-100 mb-2">Image Analysis</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-400">Heart Rate:</span>{" "}
                        <span className="font-medium">
                          {(() => {
                            const hr = rawResponse.image_analysis?.heart_rate ?? rawResponse.ecg_analysis?.heartRate;
                            return hr != null ? `${fmtUpTo3(hr)} bpm` : "—";
                          })()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Rhythm Type:</span>{" "}
                        <span className="font-medium capitalize">{rawResponse.image_analysis?.rhythm_type ?? "—"}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Regularity Score:</span>{" "}
                        <span className="font-medium">
                          {rawResponse.image_analysis?.regularity_score != null
                            ? fmtUpTo3(rawResponse.image_analysis.regularity_score)
                            : "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Beats Detected:</span>{" "}
                        <span className="font-medium">{rawResponse.image_analysis?.num_beats_detected ?? "—"}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">P–R Interval:</span>{" "}
                        <span className="font-medium">
                          {(() => {
                            const v = rawResponse.ecg_analysis?.prInterval ?? rawResponse.intervals_ms?.pr ?? rawResponse.features?.pr_interval_ms;
                            return v != null ? `${fmtUpTo3(v)} ms` : "—";
                          })()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">QRS Duration:</span>{" "}
                        <span className="font-medium">
                          {(() => {
                            const v = rawResponse.ecg_analysis?.qrsDuration ?? rawResponse.intervals_ms?.qrs ?? rawResponse.features?.qrs_duration_ms;
                            return v != null ? `${fmtUpTo3(v)} ms` : "—";
                          })()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Q–T Interval:</span>{" "}
                        <span className="font-medium">
                          {(() => {
                            const v = rawResponse.ecg_analysis?.qtInterval ?? rawResponse.intervals_ms?.qt ?? rawResponse.features?.qt_interval_ms;
                            return v != null ? `${fmtUpTo3(v)} ms` : "—";
                          })()}
                        </span>
                      </div>
                    </div>

                    {/* Calibration summary (if available) */}
                    {rawResponse.calibration && (
                      <div className="mt-3 text-xs text-gray-400">
                        <span className="font-semibold text-gray-300">Calibration:</span>{" "}
                        {(() => {
                          const cal = rawResponse.calibration;
                          const pxmm = cal?.px_per_mm != null ? `${Number(cal.px_per_mm).toFixed(1)} px/mm` : null;
                          const mspp = cal?.ms_per_px != null ? `${Number(cal.ms_per_px).toFixed(1)} ms/px` : null;
                          const ang = cal?.deskew_angle_deg != null ? `angle ${Number(cal.deskew_angle_deg).toFixed(1)}°` : null;
                          const parts = [pxmm, mspp, ang].filter(Boolean);
                          return parts.length ? parts.join(" • ") : "Not detected";
                        })()}
                      </div>
                    )}
                  </div>
                )}

                {/* Prediction */}
                {(rawResponse.prediction || rawResponse.diagnosis?.predictedClass) && (
                  <div className="mb-5">
                    <h4 className="text-lg font-bold text-gray-100 mb-2">Model Prediction</h4>
                    {(() => {
                      const bestRaw = (rawResponse.prediction?.best_rhythm ?? rawResponse.diagnosis?.predictedClass?.best_rhythm) as any;
                      const bestKey = cleanLabel(bestRaw);
                      const bestFull = (RHYTHM_LABELS[bestKey] ?? bestKey) || "—";
                      const beatRaw = (rawResponse.prediction?.beat ?? rawResponse.diagnosis?.predictedClass?.beat) as any;
                      const beatKey = cleanLabel(beatRaw) || "—";
                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-3">
                          <div>
                            <span className="text-gray-400">Primary Rhythm:</span>{" "}
                            <span className="font-medium">{bestFull} {bestKey ? `(${bestKey})` : ""}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Beat Type:</span>{" "}
                            <span className="font-medium capitalize">{beatKey}</span>
                          </div>
                        </div>
                      );
                    })()}

                    {((rawResponse.prediction?.top_rhythms) || (rawResponse.diagnosis?.predictedClass?.top_rhythms)) && (
                      <div className="mt-3">
                        <h5 className="text-sm font-semibold text-gray-300 mb-1">Top Rhythms</h5>
                        <ul className="space-y-1 text-sm">
                          {Object.entries((rawResponse.prediction?.top_rhythms || rawResponse.diagnosis?.predictedClass?.top_rhythms) as Record<string, any>).map(([label, prob]: [string, any]) => {
                            let pct: number | null = null;
                            if (typeof prob === 'number') {
                              pct = prob * 100;
                            } else if (typeof prob === 'string') {
                              const cleaned = prob.trim().endsWith('%') ? prob.trim().slice(0, -1) : prob.trim();
                              const parsed = parseFloat(cleaned);
                              pct = isNaN(parsed) ? null : (prob.trim().endsWith('%') ? parsed : parsed * 100);
                            }
                            return (
                              <li key={label} className="flex justify-between">
                                <span className="capitalize">{RHYTHM_LABELS[label] ?? label}</span>
                                <span className="font-mono">
                                  {pct !== null ? pct.toFixed(2) + '%' : '—'}
                                  {LIKELIHOOD[label] ? ` • ${LIKELIHOOD[label]}` : ''}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Toggle Raw JSON */}
                <div className="flex items-center justify-between mt-6">
                  <button
                    type="button"
                    onClick={() => setShowRaw(!showRaw)}
                    className="px-4 py-2 text-sm rounded-lg border border-gray-600 text-gray-200 hover:bg-gray-700"
                  >
                    {showRaw ? "Hide Raw JSON" : "Show Raw JSON"}
                  </button>
                </div>

                {showRaw && (
                  <div className="mt-4">
                    <h4 className="text-sm font-bold text-gray-300 mb-2">Full Response (JSON)</h4>
                    <pre className="bg-gray-900 text-gray-200 p-4 rounded-lg overflow-auto text-xs max-h-96">{JSON.stringify(rawResponse, null, 2)}</pre>
                  </div>
                )}

                {/* Tiny technical details to verify interval sources */}
                <div className="mt-3 text-[11px] text-gray-500">
                  {(() => {
                    const srcPR = rawResponse.ecg_analysis?.prInterval ?? rawResponse.intervals_ms?.pr ?? rawResponse.features?.pr_interval_ms;
                    const srcQRS = rawResponse.ecg_analysis?.qrsDuration ?? rawResponse.intervals_ms?.qrs ?? rawResponse.features?.qrs_duration_ms;
                    const srcQT = rawResponse.ecg_analysis?.qtInterval ?? rawResponse.intervals_ms?.qt ?? rawResponse.features?.qt_interval_ms;
                    const hr = rawResponse.image_analysis?.heart_rate ?? rawResponse.ecg_analysis?.heartRate;
                    return (
                      <div>
                        <div>Debug • HR:{" "}{hr != null ? fmtUpTo3(hr) : "—"} • PR:{" "}{srcPR != null ? fmtUpTo3(srcPR) : "—"} ms • QRS:{" "}{srcQRS != null ? fmtUpTo3(srcQRS) : "—"} ms • QT:{" "}{srcQT != null ? fmtUpTo3(srcQT) : "—"} ms</div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
};

export default BetaECGUploader;
