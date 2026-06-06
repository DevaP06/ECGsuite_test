// Ontology management types — Task 41

export type OntologySystem = 'snomed' | 'icd10' | 'custom';
export type OntologyUrgency = 'critical' | 'high' | 'moderate' | 'low';

// Managed ontology rule — stored configuration on the backend (pending endpoint)
export interface OntologyRule {
  _id: string;
  code: string;
  display: string;
  system: OntologySystem;
  urgencyTier: OntologyUrgency;
  confidenceThreshold: number;   // 0–100
  isEmergency: boolean;
  triageCategory?: string;
  triggerConditions?: string[];
  relatedCodes?: string[];
  version?: string;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface OntologyRuleFilter {
  system?: OntologySystem;
  urgencyTier?: OntologyUrgency;
  isEmergency?: boolean;
  q?: string;
}
