import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, ArrowLeft, RefreshCw, AlertTriangle } from "lucide-react";
import DashboardLayout from "../components/layout/DashboardLayout";
import DiagnosisOverview from "../components/diagnosis/DiagnosisOverview";
import ExplainabilityChart from "../components/diagnosis/ExplainabilityChart";
import RecommendationsPanel from "../components/diagnosis/RecommendationsPanel";
import { ecgService } from "../services/ecgService";
import type { ECGAnalysis } from "../types/ecg";
import EmergencyOverlay from "../components/common/EmergencyOverlay";

export default function DiagnosisDetail() {
  const { id } = useParams<{ id: string }>();
  const [analysis, setAnalysis] = useState<ECGAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emergencyAcknowledged, setEmergencyAcknowledged] = useState(false);

  const fetchAnalysis = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await ecgService.getAnalysis(id);
      setAnalysis(data);
    } catch (err: unknown) {
      const errorMsg = err as { response?: { data?: { error?: string; message?: string } }; message?: string };
      setError(errorMsg.response?.data?.error || errorMsg.response?.data?.message || errorMsg.message || "Failed to fetch ECG analysis.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
          <p className="text-slate-600 font-semibold text-lg">Analyzing ECG and retrieving report...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !analysis) {
    return (
      <DashboardLayout>
        <div className="max-w-xl mx-auto mt-10 bg-white border border-red-200 shadow-sm rounded-lg p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-red-50 text-red-600 rounded-full p-3">
              <AlertTriangle className="w-10 h-10" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Failed to load report</h3>
          <p className="text-slate-600 mb-6">{error || "The requested analysis could not be found."}</p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded hover:bg-slate-50 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Link>
            <button
              onClick={fetchAnalysis}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry</span>
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const hasEmergency = !!analysis.analysisResult?.isEmergency;
  const showEmergency = hasEmergency && !emergencyAcknowledged;

  const emergencyItem = analysis.analysisResult?.ontologyEnrichment?.find(item => item.isEmergency);
  const emergencyConditionName = emergencyItem?.displayName || 
    (analysis.analysisResult?.rhythm === 'ventricular_tachycardia' ? 'Ventricular Tachycardia' : 'ST-Segment Elevation');
  const emergencyAction = emergencyItem?.recommendedTests?.join(", ") || 
    "Immediate hospitalization, oxygen support, and notification of the cardiology team.";

  const recommendedTests = analysis.analysisResult?.ontologyEnrichment?.flatMap(
    item => item.recommendedTests
  ) || [];

  return (
    <DashboardLayout>
      {showEmergency && (
        <EmergencyOverlay
          condition={emergencyConditionName}
          urgency="Tier 1 (Critical Emergency)"
          action={emergencyAction}
          isTrueEmergency={true}
          onAcknowledge={() => setEmergencyAcknowledged(true)}
        />
      )}

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
          <span className="text-xs text-slate-400">Analysis ID: {analysis._id}</span>
        </div>

        <div className="bg-white shadow rounded-lg p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-slate-800">AI Diagnosis Report</h2>
            <div className="text-sm text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
              <span>Patient: <span className="font-semibold">{analysis.patientInfo.name}</span></span>
              <span>•</span>
              <span>Age: <span className="font-semibold">{analysis.patientInfo.age}</span></span>
              <span>•</span>
              <span>Gender: <span className="font-semibold uppercase">{analysis.patientInfo.gender}</span></span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="px-3 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">
              Processed: {analysis.processedAt ? new Date(analysis.processedAt).toLocaleString() : new Date(analysis.createdAt).toLocaleString()}
            </span>
            {analysis.notes && (
              <p className="text-xs text-slate-500 max-w-xs text-right truncate">
                Notes: {analysis.notes}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <span className="text-xs text-slate-500 uppercase font-semibold">Heart Rate</span>
            <p className="text-2xl font-bold text-slate-800 mt-1">
              {analysis.analysisResult?.heartRate ? `${analysis.analysisResult.heartRate} bpm` : "N/A"}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <span className="text-xs text-slate-500 uppercase font-semibold">QRS Duration</span>
            <p className="text-2xl font-bold text-slate-800 mt-1">
              {analysis.analysisResult?.qrsDuration ? `${analysis.analysisResult.qrsDuration} ms` : "N/A"}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <span className="text-xs text-slate-500 uppercase font-semibold">QT Interval</span>
            <p className="text-2xl font-bold text-slate-800 mt-1">
              {analysis.analysisResult?.qtInterval ? `${analysis.analysisResult.qtInterval} ms` : "N/A"}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <span className="text-xs text-slate-500 uppercase font-semibold">Confidence</span>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {analysis.analysisResult?.confidence ? `${analysis.analysisResult.confidence}%` : "N/A"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <DiagnosisOverview
              ontologyEnrichment={analysis.analysisResult?.ontologyEnrichment}
              rhythm={analysis.analysisResult?.rhythm}
              abnormalities={analysis.analysisResult?.abnormalities}
            />

            <ExplainabilityChart
              leadImportance={analysis.analysisResult?.explanation?.leadImportance}
            />
          </div>

          <div>
            <RecommendationsPanel
              recommendedTests={recommendedTests}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
