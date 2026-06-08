// Pure derivation of an analysis's audit trail from timestamps that already exist
// across the analysis record, clinical-context submission, ontology status, and
// specialist-review record. No event is invented — steps with no real timestamp
// are rendered as "pending".

import type { ECGAnalysis } from '../types/ecg';
import type { OntologyProcessingStatus } from '../types/ontologyFusion';
import type { SpecialistReview } from '../types/review';
import type { AuditEvent } from '../types/audit';

export function buildAuditTimeline(
  analysis: ECGAnalysis,
  clinicalContextSubmittedAt: string | null,
  ontologyStatus: OntologyProcessingStatus,
  review: SpecialistReview | null,
): AuditEvent[] {
  const analysisCompleted = analysis.status === 'completed';

  const events: AuditEvent[] = [
    {
      type: 'uploaded',
      label: 'ECG Uploaded',
      timestamp: analysis.createdAt ?? null,
      status: analysis.createdAt ? 'completed' : 'pending',
      description: 'Recording received and queued for analysis.',
    },
    {
      type: 'analyzed',
      label: 'AI Analysis Completed',
      timestamp: analysisCompleted ? (analysis.processedAt ?? null) : null,
      status: analysisCompleted && analysis.processedAt ? 'completed' : 'pending',
      description: 'Diagnostic engine generated rhythm classification and findings.',
    },
    {
      type: 'clinicalContext',
      label: 'Clinical Context Completed',
      timestamp: clinicalContextSubmittedAt,
      status: clinicalContextSubmittedAt ? 'completed' : 'pending',
      description: 'Doctor submitted the clinical context questionnaire.',
    },
    {
      type: 'ontologyProcessed',
      label: 'Ontology Processed',
      timestamp: ontologyStatus === 'completed' ? (analysis.processedAt ?? null) : null,
      status: ontologyStatus === 'completed' ? 'completed' : 'pending',
      description: 'Evidence fused into ranked candidate diagnoses.',
    },
    {
      type: 'reviewRequested',
      label: 'Specialist Review Requested',
      timestamp: review?.createdAt ?? null,
      status: review?.createdAt ? 'completed' : 'pending',
      description: 'Case submitted to a cardiologist for specialist review.',
    },
    {
      type: 'reviewCompleted',
      label: 'Specialist Review Completed',
      timestamp: review?.reviewStatus === 'completed' ? (review?.reviewDate ?? null) : null,
      status: review?.reviewStatus === 'completed' && review?.reviewDate ? 'completed' : 'pending',
      description: 'Cardiologist finalized the specialist review decision.',
    },
  ];

  return events;
}
