import type { OntologyItem } from './ecg';
import type { ClinicalContext } from './clinicalContext';
import type { AnswersMap } from './questionnaire';

export type EvidenceSource = 'ecg' | 'symptom' | 'riskFactor' | 'vital';

export interface OntologyEvidence {
  source: EvidenceSource;
  label: string;
  detail?: string;
  relatedCodes?: string[];
}

export interface OntologyFinding {
  key: string;
  label: string;
  sources: EvidenceSource[];
  occurrences: number;
}

export interface OntologyDiagnosis {
  displayName: string;
  confidence?: number;
  confidenceTier?: string;
  urgencyTier?: string;
  isEmergency: boolean;
  severity?: string;
  snomedCode?: string;
  icd10Code?: string;
  evidence: OntologyEvidence[];
  symptoms: string[];
  riskFactors: string[];
  ecgFindings: string[];
  recommendedTests: string[];
}

export type OntologyScoreCategory = 'ecg' | 'clinical' | 'risk' | 'vitals' | 'overall';

export interface OntologyScore {
  category: OntologyScoreCategory;
  label: string;
  /** 0-100; only set when a real backend-provided value exists. Never computed locally. */
  value?: number;
  /** false → UI must show a "not provided" placeholder, never fabricate a value */
  available: boolean;
}

export interface OntologyFusionResult {
  analysisId: string;
  diagnoses: OntologyDiagnosis[];
  evidenceGroups: Record<EvidenceSource, OntologyEvidence[]>;
  findings: OntologyFinding[];
  scores: OntologyScore[];
  generatedAt: string;
}

export type OntologyProcessingStatus = 'pending' | 'completed' | 'unavailable';

export interface OntologyInput {
  analysisId: string;
  ecgFindings: string[];
  ontologyItems: OntologyItem[];
  clinicalContext?: ClinicalContext | null;
  riskFactorAnswers?: AnswersMap;
  /** Backend-reported overall analysis confidence (0-100), passed through verbatim */
  overallConfidence?: number;
}
