import mongoose from 'mongoose';

const ANNOTATION_LABELS = ['p_wave', 'qrs_complex', 't_wave', 'u_wave', 'artifact', 'st_elevation', 'st_depression', 'ectopic_beat', 'other'];
const QUALITY_LEVELS = ['good', 'acceptable', 'poor', 'unreadable'];

const waveformMarkSchema = new mongoose.Schema({
  label: { type: String, enum: ANNOTATION_LABELS, required: true },
  startSample: { type: Number, required: true, min: 0 },
  endSample: { type: Number, required: true, min: 0 },
  confidence: { type: Number, min: 0, max: 100 },
  comment: { type: String, trim: true, maxlength: 500 }
}, { _id: false });

const leadAnnotationSchema = new mongoose.Schema({
  lead: { type: String, required: true, trim: true },
  marks: { type: [waveformMarkSchema], default: [] },
  samplingRate: { type: Number, min: 0 }
}, { _id: false });

const annotationSchema = new mongoose.Schema({
  analysisId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ECGAnalysis',
    required: true,
    unique: true
  },
  cardiologistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  leadAnnotations: { type: [leadAnnotationSchema], default: [] },
  validatedRhythm: { type: String, trim: true },
  rhythmIsCorrect: { type: Boolean, default: null },
  overallQuality: { type: String, enum: QUALITY_LEVELS, default: null },
  notes: { type: String, trim: true, maxlength: 2000 }
}, { timestamps: true });

annotationSchema.index({ cardiologistId: 1, createdAt: -1 });

export const ANNOTATION_LABEL_VALUES = ANNOTATION_LABELS;
export const ANNOTATION_QUALITY_VALUES = QUALITY_LEVELS;
export default mongoose.model('Annotation', annotationSchema);
