import mongoose from 'mongoose';

const specialistReviewSchema = new mongoose.Schema({
  analysisId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ECGAnalysis',
    required: true
  },
  cardiologistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewStatus: {
    type: String,
    enum: ['pending', 'in_review', 'completed'],
    default: 'pending'
  },
  expertDiagnosis: {
    type: String,
    trim: true
  },
  overrideReason: {
    type: String,
    trim: true
  },
  reviewNotes: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  reviewDate: {
    type: Date,
    default: null
  }
}, { timestamps: true });

specialistReviewSchema.index({ analysisId: 1 });
specialistReviewSchema.index({ cardiologistId: 1, createdAt: -1 });

export default mongoose.model('SpecialistReview', specialistReviewSchema);
