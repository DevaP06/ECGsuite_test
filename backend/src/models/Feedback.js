import mongoose from 'mongoose';

const FEEDBACK_TYPES = ['model_correct', 'model_incorrect', 'needs_more_data', 'false_positive', 'false_negative'];

const feedbackSchema = new mongoose.Schema({
  analysisId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ECGAnalysis',
    required: true
  },
  cardiologistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  feedbackType: { type: String, enum: FEEDBACK_TYPES, required: true },
  notes: { type: String, trim: true, maxlength: 2000 }
}, { timestamps: true });

feedbackSchema.index({ analysisId: 1, createdAt: -1 });
feedbackSchema.index({ cardiologistId: 1, createdAt: -1 });

export const FEEDBACK_TYPE_VALUES = FEEDBACK_TYPES;
export default mongoose.model('Feedback', feedbackSchema);
