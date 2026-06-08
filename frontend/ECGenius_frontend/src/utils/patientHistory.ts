// Pure derivation of a chronological patient activity timeline from
// already-fetched analyses, locally-stored clinical-context submissions, and
// specialist review records. Only real, occurred events are included — nothing
// is invented, and events without a real timestamp are simply omitted.

import type { ECGAnalysis } from '../types/ecg';
import type { SpecialistReview } from '../types/review';

export type PatientHistoryEventType =
  | 'upload'
  | 'diagnosis'
  | 'clinicalContext'
  | 'reviewRequested'
  | 'reviewCompleted';

export interface PatientHistoryEvent {
  type: PatientHistoryEventType;
  label: string;
  description: string;
  analysisId: string;
  timestamp: string;
}

const EVENT_META: Record<PatientHistoryEventType, { label: string; description: string }> = {
  upload:           { label: 'ECG Uploaded',                description: 'Recording was submitted for analysis.' },
  diagnosis:        { label: 'AI Diagnosis Completed',      description: 'Diagnostic engine generated a rhythm classification.' },
  clinicalContext:  { label: 'Clinical Context Completed',  description: 'Symptoms, risk factors, and vitals were recorded for this analysis.' },
  reviewRequested:  { label: 'Specialist Review Requested', description: 'Case was sent to a cardiologist for expert review.' },
  reviewCompleted:  { label: 'Specialist Review Completed', description: 'Cardiologist finalized their review decision.' },
};

function pushEvent(
  events: PatientHistoryEvent[],
  type: PatientHistoryEventType,
  analysisId: string,
  timestamp: string | null | undefined,
): void {
  if (!timestamp) return;
  const meta = EVENT_META[type];
  events.push({ type, label: meta.label, description: meta.description, analysisId, timestamp });
}

export function buildPatientHistory(
  analyses: ECGAnalysis[],
  contextSubmittedAt: Map<string, string | null>,
  reviews: Map<string, SpecialistReview | null>,
): PatientHistoryEvent[] {
  const events: PatientHistoryEvent[] = [];

  analyses.forEach((analysis) => {
    pushEvent(events, 'upload', analysis._id, analysis.createdAt);

    if (analysis.status === 'completed') {
      pushEvent(events, 'diagnosis', analysis._id, analysis.processedAt ?? analysis.createdAt);
    }

    pushEvent(events, 'clinicalContext', analysis._id, contextSubmittedAt.get(analysis._id));

    const review = reviews.get(analysis._id);
    if (review) {
      pushEvent(events, 'reviewRequested', analysis._id, review.createdAt);
      if (review.reviewStatus === 'completed') {
        pushEvent(events, 'reviewCompleted', analysis._id, review.reviewDate);
      }
    }
  });

  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
