import type { TopPrediction } from './ecg';
import type { ClinicalContext } from './clinicalContext';

export interface OntologyInputPayload {
  analysisId: string;
  topRhythms: TopPrediction[];
  clinicalContext: ClinicalContext;
}
