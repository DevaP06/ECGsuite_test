// Backend SpecialistReview model supports: pending | in_review | completed
// Frontend extends this with UI-side states for display purposes only.
export type ReviewStatus = 'pending' | 'assigned' | 'in_review' | 'completed' | 'escalated' | 'rejected';

export type ReviewPriority = 'normal' | 'urgent' | 'critical';

// Matches the backend SpecialistReview document
export interface SpecialistReview {
  _id: string;
  analysisId: string;
  cardiologistId?: string;
  cardiologistName?: string;
  reviewStatus: ReviewStatus;
  expertDiagnosis?: string;
  overrideReason?: string;
  reviewNotes?: string;
  reviewDate?: string;
  // Frontend-enriched optional fields
  priority?: ReviewPriority;
  requestedBy?: string;
  requestNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

// Lightweight item for queue list display
export interface ReviewQueueItem {
  _id: string;
  analysisId: string;
  patientName?: string;
  patientAge?: number;
  gender?: string;
  primaryDiagnosis?: string;
  priority: ReviewPriority;
  status: ReviewStatus;
  requestedBy?: string;
  createdAt: string;
}

// Doctor → request specialist review (POST /api/review/request — pending backend)
export interface RequestReviewPayload {
  analysisId: string;
  patientId?: string;
  priority: ReviewPriority;
  notes?: string;
}

// Cardiologist → submit decision (POST /api/ecg/analysis/:id/specialist-review — live)
// Backend enum only accepts: pending | in_review | completed
export interface SubmitDecisionPayload {
  reviewStatus: 'pending' | 'in_review' | 'completed';
  expertDiagnosis?: string;
  overrideReason?: string;
  reviewNotes?: string;
}
