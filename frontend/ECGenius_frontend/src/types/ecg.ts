export interface PatientInfo {
  name: string;
  age: number;
  gender: string;
}

export interface SignalMetrics {
  heartRate: number | null;
  prInterval?: number;
  qrsDuration: number | null;
  qtInterval: number | null;
}

export interface OntologyItem {
  displayName: string;
  confidenceTier: string;
  urgencyTier: string;
  isEmergency: boolean;
  severity: string;
  recommendedTests: string[];
}

export interface ExplanationData {
  heatmapUrl?: string;
  leadImportance?: Record<string, number>;
}

export interface AnalysisResult {
  rhythm: string;
  heartRate: number | null;
  qrsDuration: number | null;
  qtInterval: number | null;
  abnormalities: string[];
  confidence: number;
  aiModel?: string;
  modelVersion?: string;
  processingTime?: number;
  
  // Future/extended response schemas
  signalMetrics?: SignalMetrics;
  predictedLabels?: string[];
  labelProbabilities?: Record<string, number>;
  ontologyEnrichment?: OntologyItem[];
  explanation?: ExplanationData;
  isEmergency?: boolean;
}

export interface ECGAnalysis {
  _id: string;
  userId?: string;
  fileName?: string;
  originalName?: string;
  filePath?: string;
  fileSize?: number;
  patientInfo: PatientInfo;
  notes?: string;
  status: 'uploaded' | 'processing' | 'completed' | 'failed' | 'archived' | string;
  failureReason?: string;
  analysisResult: AnalysisResult | null;
  processedAt?: string;
  createdAt: string;
  updatedAt?: string;
}
