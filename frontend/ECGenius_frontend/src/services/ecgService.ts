import AxiosInstance from "../AxiosInstance";
import type { AxiosProgressEvent } from "axios";
import type { ECGAnalysis, AnalysisResult, OntologyItem, ExplanationData, SignalMetrics, TopPrediction } from "../types/ecg";

// Normalization function to convert API response into a consistent frontend shape
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeAnalysis(data: any): ECGAnalysis {
  if (!data) {
    throw new Error("No data received from API");
  }

  // Extract base analysis document
  const analysis = data.analysis || data;
  const analysisResult = analysis.analysisResult || null;

  let normalizedResult: AnalysisResult | null = null;

  if (analysisResult) {
    // 1. Build signal metrics from basic fields
    const signalMetrics: SignalMetrics = analysisResult.signalMetrics || {
      heartRate: analysisResult.heartRate ?? null,
      qrsDuration: analysisResult.qrsDuration ?? null,
      qtInterval: analysisResult.qtInterval ?? null,
    };

    // 2. Build abnormalities representation
    const abnormalities: string[] = Array.isArray(analysisResult.abnormalities)
      ? analysisResult.abnormalities
      : [];

    // 3. Build predicted labels and probabilities
    const predictedLabels: string[] = analysisResult.predictedLabels || [];
    const labelProbabilities: Record<string, number> = analysisResult.labelProbabilities || {};

    if (predictedLabels.length === 0 && analysisResult.rhythm) {
      predictedLabels.push(analysisResult.rhythm);
      labelProbabilities[analysisResult.rhythm] = (analysisResult.confidence ?? 0) / 100;
    }
    abnormalities.forEach((ab) => {
      if (!predictedLabels.includes(ab)) {
        predictedLabels.push(ab);
        labelProbabilities[ab] = (analysisResult.confidence ?? 0) / 100;
      }
    });

    // 3b. Build top predictions — use backend value if present, else derive from labelProbabilities
    const topPredictions: TopPrediction[] = Array.isArray(analysisResult.topPredictions)
      ? analysisResult.topPredictions
      : Object.entries(labelProbabilities)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([rhythm, prob]) => ({ rhythm, confidence: Math.round(prob * 100) }));

    // 4. Build ontologyEnrichment array (no fabrication)
    const ontologyEnrichment: OntologyItem[] = analysisResult.ontologyEnrichment || [];

    // 5. Build explanation lead importance (no fabrication)
    const explanation: ExplanationData = analysisResult.explanation || {
      leadImportance: analysisResult.leadImportance || {}
    };

    // TEMPORARY UNTIL BACKEND PROVIDES isEmergency
    const isEmergency = typeof analysisResult.isEmergency === 'boolean'
      ? analysisResult.isEmergency
      : (analysisResult.rhythm === "ventricular_tachycardia" ||
         abnormalities.includes("st_elevation"));

    normalizedResult = {
      ...analysisResult,
      signalMetrics,
      predictedLabels,
      labelProbabilities,
      topPredictions,
      ontologyEnrichment,
      explanation,
      isEmergency,
    };
  }

  return {
    _id: analysis._id,
    userId: analysis.userId,
    fileName: analysis.fileName,
    originalName: analysis.originalName,
    filePath: analysis.filePath,
    fileSize: analysis.fileSize,
    patientInfo: analysis.patientInfo || { name: "", age: 0, gender: "" },
    notes: analysis.notes,
    status: analysis.status,
    failureReason: analysis.failureReason,
    analysisResult: normalizedResult,
    processedAt: analysis.processedAt,
    createdAt: analysis.createdAt,
    updatedAt: analysis.updatedAt,
  };
}

export const ecgService = {
  // Upload ECG multipart form data
  async uploadECG(
    formData: FormData,
    onUploadProgress?: (progressEvent: AxiosProgressEvent) => void
  ): Promise<{ success: boolean; analysisId: string; fileName: string; analysisResult?: unknown; status?: string }> {
    const res = await AxiosInstance.post("/api/ecg/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress,
    });
    
    const responseData = res.data?.data || res.data;
    return {
      success: res.data?.success || false,
      analysisId: responseData?.analysisId || responseData?._id,
      fileName: responseData?.fileName || "",
      analysisResult: responseData?.analysisResult,
      status: responseData?.status || "completed",
    };
  },

  // Fetch individual analysis details
  async getAnalysis(id: string): Promise<ECGAnalysis> {
    const res = await AxiosInstance.get(`/api/ecg/analysis/${id}`);
    return normalizeAnalysis(res.data);
  },

  // Fetch list of user analyses
  async getMyAnalyses(): Promise<ECGAnalysis[]> {
    const res = await AxiosInstance.get("/api/ecg/my-analyses");
    const analyses = res.data?.analyses || [];
    return analyses.map((item: unknown) => normalizeAnalysis(item));
  },

  // Update notes of an analysis
  async updateAnalysisNotes(id: string, notes: string): Promise<ECGAnalysis> {
    const res = await AxiosInstance.patch(`/api/ecg/analysis/${id}/notes`, { notes });
    return normalizeAnalysis(res.data);
  }
};
