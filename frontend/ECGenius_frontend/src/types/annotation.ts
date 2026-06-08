// Waveform annotation types for Task 36-37 (Cardiologist Annotation Workflow)

export type AnnotationLabel =
  | 'p_wave'
  | 'qrs_complex'
  | 't_wave'
  | 'u_wave'
  | 'artifact'
  | 'st_elevation'
  | 'st_depression'
  | 'ectopic_beat'
  | 'other';

export interface WaveformMark {
  label: AnnotationLabel;
  startSample: number;
  endSample: number;
  confidence?: number;
  comment?: string;
  /** ECG lead this mark belongs to, e.g. "II", "V1" — used to group marks into LeadAnnotation[] */
  lead?: string;
}

export interface LeadAnnotation {
  lead: string;            // e.g. "II", "V1", "aVR"
  marks: WaveformMark[];
  samplingRate?: number;   // Hz
}

// Full annotation document — maps to a future backend AnnotationRecord model
export interface AnnotationRecord {
  _id: string;
  analysisId: string;
  cardiologistId: string;
  cardiologistName?: string;
  leadAnnotations: LeadAnnotation[];
  // Cardiologist confirms or corrects the AI rhythm classification
  validatedRhythm?: string;
  rhythmIsCorrect?: boolean;
  overallQuality?: 'good' | 'acceptable' | 'poor' | 'unreadable';
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

// Payload for POST /api/ecg/analysis/:id/annotation (pending backend endpoint)
export interface CreateAnnotationPayload {
  leadAnnotations?: LeadAnnotation[];
  validatedRhythm?: string;
  rhythmIsCorrect?: boolean;
  overallQuality?: AnnotationRecord['overallQuality'];
  notes?: string;
}

// Lightweight validation record (Task 36 — explicit AI result validation)
export interface ValidationRecord {
  _id: string;
  analysisId: string;
  cardiologistId: string;
  aiRhythmCorrect: boolean;
  aiAbnormalitiesCorrect: boolean;
  correctedRhythm?: string;
  correctedAbnormalities?: string[];
  confidenceRating?: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  createdAt: string;
}

export interface CreateValidationPayload {
  aiRhythmCorrect: boolean;
  aiAbnormalitiesCorrect: boolean;
  correctedRhythm?: string;
  correctedAbnormalities?: string[];
  confidenceRating?: ValidationRecord['confidenceRating'];
  notes?: string;
}
